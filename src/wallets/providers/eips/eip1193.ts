import { BrowserProvider, Contract, Eip1193Provider, ethers, JsonRpcSigner, parseUnits } from 'ethers'
import {
  Account,
  ERC20Allowance,
  gasToken,
  InboundAddress,
  InsufficientAllowanceError,
  Msg,
  Network,
  networkId,
  Simulation,
  TxResult
} from 'rujira.js'
import * as thor from '../../config/thor'
import { Eip712Adapter, Eip712Context } from './eip712'
import { Providers, WalletProvider } from '../../types'

const networks = [Network.Ethereum, Network.Avalanche, Network.Base, Network.Bsc]

interface Provider extends Eip1193Provider {
  on?: (event: string, cb: () => void) => void
  off?: (event: string, cb: () => void) => void
}

type Eip1193Context = JsonRpcSigner | Eip712Context

export class Eip1193Adapter implements WalletProvider<Eip1193Context> {
  private eip712?: Eip712Adapter
  private currentListener?: (...args: unknown[]) => void

  constructor(
    private e: () => Provider | undefined,
    eip712: boolean
  ) {
    const config = process.env.NEXT_PUBLIC_MODE === 'main' ? thor.main : thor.stage
    if (eip712) this.eip712 = new Eip712Adapter(e, config)
  }

  public async getAccounts(): Promise<
    {
      context: Eip1193Context
      account: { address: string; network: Network }
    }[]
  > {
    const e = this.e()
    if (!e) throw new Error(``)
    const provider = new BrowserProvider(e)

    const authorizedAccounts: string[] = await e.request({
      method: 'eth_accounts'
    })

    const accounts: string[] = authorizedAccounts.length
      ? authorizedAccounts
      : await e.request({ method: 'eth_requestAccounts' })
    return [
      ...(this.eip712 ? await this.eip712.getAccounts() : []),
      ...accounts.flatMap(address => {
        const jsonRpcSigner = new JsonRpcSigner(provider, address)
        return networks
          .map(network => ({ network, address }))
          .map(account => {
            const address = ethers.getAddress(account.address)

            return {
              account: { ...account, address },
              context: jsonRpcSigner
            }
          })
      })
    ]
  }

  public async simulate(
    context: Eip1193Context,
    account: Account<keyof Providers>,
    msg: Msg,
    inboundAddress?: InboundAddress
  ): Promise<Simulation> {
    if (!(context instanceof JsonRpcSigner)) {
      if (!this.eip712) throw new Error('No Eip712Adapter found')
      return this.eip712.simulate(context, account, msg, inboundAddress)
    }

    const { tx, erc20 } = await msg.toTransactionRequest(account, inboundAddress)
    // await context.provider.on("debug", console.debug);
    const chainId = networkId(account.network)

    const currentChainId = await context.provider.send('eth_chainId', [])
    if (currentChainId.toLowerCase() !== chainId.toLowerCase()) {
      await context.provider.send('wallet_switchEthereumChain', [{ chainId }])
    }
    if (erc20 && tx.to) await checkAllowance(context, erc20, tx.to.toString())
    try {
      const { maxFeePerGas, gasPrice } = await this.gasPrices(context)
      const gas = await context.estimateGas({
        ...tx,
        gasPrice,
        maxFeePerGas
      })
      const sim = {
        ...gasToken(account.network),
        amount: gasPrice ? gas * gasPrice : gas * (maxFeePerGas as bigint),
        gas
      }

      return sim
    } catch (error: any) {
      // We get pretty terrible error data back from Eip1193 providers eg Metamask and Keplr,
      // Log the error but throw a more friendly version
      if (error.message.includes('missing revert data') || error.message.includes('invalid BigNumberish value')) {
        console.error(error)
        throw new Error(`Insufficient funds for gas`)
      }
      throw error
    }
  }

  gasPrices = async (context: JsonRpcSigner) => {
    const provider = context.provider

    const latestBlock = await provider.getBlock('latest')
    const isEIP1559 = !!latestBlock?.baseFeePerGas

    if (!isEIP1559) {
      const gasPrice = await provider.send('eth_gasPrice', [])
      return { gasPrice: BigInt(gasPrice) }
    }

    const priorityFee = await provider.send('eth_maxPriorityFeePerGas', []).catch(() => parseUnits('2', 'gwei'))

    const baseFee = latestBlock.baseFeePerGas ?? 0n
    const maxPriorityFeePerGas = BigInt(priorityFee)
    const maxFeePerGas = baseFee + maxPriorityFeePerGas * 2n

    return {
      maxPriorityFeePerGas,
      maxFeePerGas
    }
  }

  public async signAndBroadcast(
    context: Eip1193Context,
    account: Account<keyof Providers>,
    simulation: Simulation,
    msg: Msg,
    inboundAddress?: InboundAddress
  ): Promise<TxResult> {
    if (!(context instanceof JsonRpcSigner)) {
      if (!this.eip712) throw new Error('No Eip712Adapter found')
      return this.eip712.signAndBroadcast(context, account, simulation, msg, inboundAddress)
    }
    const req = await msg.toTransactionRequest(account, inboundAddress)
    const gasPrices = await this.gasPrices(context)

    try {
      const res = await context.sendTransaction({
        ...req.tx,
        ...gasPrices,
        gasLimit: simulation.gas
      })

      await res.wait()

      return {
        network: account.network,
        address: account.address,
        txHash: res.hash,
        deposited: msg.toDeposit ? msg.toDeposit() : undefined
      }
    } catch (error: any) {
      throw new Error(error?.error?.message)
    }
  }
  onChange = (cb: () => void) => {
    const e = this.e()
    if (!e) return

    if (this.currentListener) {
      e.off?.('accountsChanged', this.currentListener)
      e.off?.('chainChanged', this.currentListener)
    }

    this.currentListener = () => cb()

    e.on?.('accountsChanged', this.currentListener)
    e.on?.('chainChanged', this.currentListener)
  }

  isAvailable() {
    return !!this.e()
  }
}

const checkAllowance = async (context: JsonRpcSigner, erc20: ERC20Allowance, spender: string) => {
  const contract = new Contract(
    erc20.asset.contract,
    ['function allowance(address owner, address spender) view returns (uint256)'],
    await context.provider.getSigner()
  )

  const allowance = await contract.allowance(context.address, spender)
  if (allowance < erc20.amount) {
    throw new InsufficientAllowanceError(spender, allowance, erc20.amount, erc20.asset)
  }
  return
}
