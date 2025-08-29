import { Keplr, Window as KeplrWindow } from '@keplr-wallet/types'
import { Eip1193Provider, JsonRpcSigner } from 'ethers'
import { Account, gasToken, InboundAddress, Msg, Network, Simulation, TxResult } from 'rujira.js'
import { CosmosAdapter, CosmosContext } from './cosmos'
import { Eip1193Adapter } from './eip1193'
import { Eip6963Adapter } from './eip6963'
import { Providers, WalletProvider } from './types'
import { BitcoinProvider, UtxoNetworks, utxoNetworkTochain, UtxoQueryClient } from './utxo'

interface XfiWindow extends UtxoNetworks {
  binance: unknown
  ethereum: Eip1193Provider & { isXDEFI: true }
  keplr: Keplr & { isXDEFI: true }
}

declare global {
  interface Window extends KeplrWindow {
    xfi?: XfiWindow
  }
}

export type CtrlContext = JsonRpcSigner | CosmosContext | UtxoQueryClient

class CtrlAdapter implements WalletProvider<CtrlContext> {
  onChange?: ((cb: () => void) => void) | undefined

  constructor(
    private e: Eip1193Adapter,
    private c: CosmosAdapter,
    private b?: XfiWindow
  ) {}

  async getAccounts(): Promise<
    {
      context: CtrlContext
      account: { address: string; network: Network }
    }[]
  > {
    if (!this.b) throw new Error('Ctrl extension not found')
    const x = await Promise.all([
      this.e.getAccounts(),
      this.c.getAccounts(),
      this.getBitcoinAccounts(Network.Bitcoin, this.b.bitcoin),
      this.getBitcoinAccounts(Network.BitcoinCash, this.b.bitcoincash),
      this.getBitcoinAccounts(Network.Dogecoin, this.b.dogecoin),
      this.getBitcoinAccounts(Network.Litecoin, this.b.litecoin)
    ])
    return x.flat()
  }

  async simulate(
    context: CtrlContext,
    account: Account<keyof Providers>,
    msg: Msg,
    inboundAddress?: InboundAddress
  ): Promise<Simulation> {
    if (context instanceof JsonRpcSigner) return this.e.simulate(context, account, msg, inboundAddress)
    if (typeof context === 'object' && 'chain' in context) return this.c.simulate(context, account, msg, inboundAddress)

    const utxos = await context.fetch()
    const psbt = await msg.toPsbt(account, utxos, inboundAddress)
    return {
      ...gasToken(account.network),
      amount: psbt.fee,
      gas: 0n
    }
  }

  async signAndBroadcast(
    context: CtrlContext,
    account: Account<keyof Providers>,
    simulation: Simulation,
    msg: Msg,
    inboundAddress?: InboundAddress
  ): Promise<TxResult> {
    if (context instanceof JsonRpcSigner)
      return this.e.signAndBroadcast(context, account, simulation, msg, inboundAddress)
    if (typeof context === 'object' && 'chain' in context)
      return this.c.signAndBroadcast(context, account, simulation, msg, inboundAddress)
    if (!this.b) throw new Error('Ctrl extension not found')
    const key = utxoNetworkTochain(account.network)
    const utxos = await context.fetch()
    const psbt = await msg.toPsbt(account, utxos, inboundAddress)
    const { amount, memo, recipient } = psbt
    return new Promise((resolve, reject) => {
      if (!this.b) {
        reject(new Error('Ctrl extension not found'))
        return
      }

      const params = [
        {
          from: account.address,
          feeRate: Number(inboundAddress?.gasRate),
          recipient,
          amount: { amount: Number(amount), decimals: 0 },
          memo
        }
      ]

      this.b[key].request(
        {
          method: 'transfer',
          params
        },
        (error, result) => {
          if (error) reject(error)
          resolve({
            network: account.network,
            address: account.address,
            txHash: result
          })
        }
      )
    })
  }

  isAvailable() {
    return this.e.isAvailable()
  }

  getBitcoinAccounts(
    network: Network,
    provider: BitcoinProvider
  ): Promise<
    {
      context: UtxoQueryClient
      account: { address: string; network: Network }
    }[]
  > {
    return new Promise<string[]>((resolve, reject) =>
      provider.request({ method: 'request_accounts', params: [] }, (error: any, accounts: string[]) => {
        if (error) reject(error)
        resolve(accounts)
      })
    ).then(accounts =>
      accounts.map(x => ({
        context: new UtxoQueryClient(network, x),
        account: {
          address: x,
          network
        }
      }))
    )
  }
}

const provider = () =>
  new CtrlAdapter(new Eip6963Adapter('io.xdefi'), new CosmosAdapter(() => window.xfi?.keplr), window.xfi)

export default provider
