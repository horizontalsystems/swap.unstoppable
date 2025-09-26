import { Account, gasToken, InboundAddress, InsufficientAllowanceError, Msg, Network, Simulation, TxResult } from 'rujira.js'
import { Providers, WalletProvider } from '../types'
import { AssetValue, Chain, FeeOption, SwapKit } from '@swapkit/core'
import { ledgerWallet } from '@swapkit/wallets/ledger'

const swapKit = SwapKit({
  config: {
    apiKeys: {
      blockchair: process.env.NEXT_PUBLIC_BLOCKCHAIR_API_KEY
    }
  },
  wallets: { ...ledgerWallet }
})

export type LedgerContext = Chain

class LedgerAdapter implements WalletProvider<LedgerContext> {
  async getAccounts(config?: any): Promise<
    {
      context: LedgerContext
      account: { address: string; network: Network }
    }[]
  > {
    const networks: Network[] = config?.networks || []
    const derivationPath = config?.derivationPath
    const chains = networks.map(this.networkToChain)

    for (let i = 0; i < chains.length; i++) {
      const chain = chains[i]
      await swapKit
        .connectLedger([chain], derivationPath)
        .then(connected => {
          console.log({ connected, chain })
        })
        .catch(err => console.error(err))
    }

    return networks
      .map((network, index) => {
        const chain = chains[index]
        const address = swapKit.getAddress(chain)
        if (!address.length) return null

        return {
          context: chain,
          account: {
            address,
            network,
            config: {
              networks,
              derivationPath
            }
          }
        }
      })
      .filter(i => i !== null)
  }

  async simulate(
    context: LedgerContext,
    account: Account<keyof Providers>,
    msg: Msg,
    inboundAddress?: InboundAddress
  ): Promise<Simulation> {
    const wallet = swapKit.getWallet(context)

    if (context === Chain.Bitcoin || context === Chain.BitcoinCash || context === Chain.Litecoin) {
      try {
        const txFee = await (wallet as any).estimateTransactionFee({
          recipient: inboundAddress?.address || '',
          sender: account.address,
          memo: (msg as any).memo,
          feeOptionKey: FeeOption.Fast,
          assetValue: AssetValue.from({
            chain: Chain.Bitcoin,
            value: (msg as any).amount
          })
        })

        return {
          ...gasToken(account.network),
          amount: txFee.bigIntValue,
          gas: 0n
        }
      } catch (e) {
        console.log(e)
        throw e
      }
    }

    const { tx, erc20 } = await msg.toTransactionRequest(account, inboundAddress)

    if (erc20 && tx.to) {
      const approveTx = {
        from: account.address,
        assetAddress: erc20.asset.contract,
        spenderAddress: tx.to.toString(),
        amount: erc20.amount
      }

      const allowance = await (wallet as any).approvedAmount(approveTx)
      if (allowance < erc20.amount) {
        throw new InsufficientAllowanceError(approveTx.spenderAddress, allowance, erc20.amount, erc20.asset)
      }
    }

    const params = {
      type: 'swap',
      params: {
        assetValue: AssetValue.from({
          chain: context,
          value: BigInt(erc20 || !tx.value ? '0' : tx.value)
        }),
        route: {
          providers: [],
          tx: {
            data: tx.data?.toString() || '',
            from: tx.from?.toString() || '',
            to: tx.to?.toString() || '',
            value: String(tx.value)
          }
        }
      },
      chain: context,
      feeOption: FeeOption.Fast
    }

    const txFee = await swapKit.estimateTransactionFee(params as any)
    return {
      ...gasToken(account.network),
      amount: txFee?.bigIntValue || 0n,
      gas: 0n
    }
  }

  async signAndBroadcast(
    context: LedgerContext,
    account: Account<keyof Providers>,
    simulation: Simulation,
    msg: Msg,
    inboundAddress?: InboundAddress
  ): Promise<TxResult> {
    const wallet = swapKit.getWallet(context)

    if (context === Chain.Bitcoin || context === Chain.BitcoinCash || context === Chain.Litecoin) {
      const hash = await (wallet as any).transfer({
        assetValue: AssetValue.from({
          chain: context,
          value: BigInt((msg as any).amount)
        }),
        recipient: inboundAddress?.address || '',
        memo: (msg as any).memo
      })

      return {
        network: account.network,
        address: account.address,
        txHash: hash,
        deposited: msg.toDeposit ? msg.toDeposit() : undefined
      }
    }

    if (context === Chain.THORChain) {
      const hash = await (wallet as any).transfer({
        assetValue: AssetValue.from({
          chain: context,
          value: BigInt((msg as any).amount)
        }),
        recipient: inboundAddress?.address || '',
        memo: (msg as any).memo
      })

      return {
        network: account.network,
        address: account.address,
        txHash: hash,
        deposited: msg.toDeposit ? msg.toDeposit() : undefined
      }
    }

    const { tx } = await msg.toTransactionRequest(account, inboundAddress)

    const txHash = await (wallet as any).sendTransaction({
      from: account.address,
      to: tx.to?.toString() || '',
      data: tx.data || '0x',
      value: BigInt(tx.value?.toString() || '0'),
      gasLimit: simulation.gas
    })

    return {
      network: account.network,
      address: account.address,
      txHash: txHash,
      deposited: msg.toDeposit ? msg.toDeposit() : undefined
    }
  }

  onChange?: ((cb: () => void) => void) | undefined

  isAvailable(): boolean {
    return true
  }

  disconnect(): void {
    swapKit.disconnectAll()
  }

  networkToChain = (network: Network): Chain => {
    switch (network) {
      case Network.Bitcoin:
        return Chain.Bitcoin
      case Network.Litecoin:
        return Chain.Litecoin
      case Network.BitcoinCash:
        return Chain.BitcoinCash
      case Network.Thorchain:
        return Chain.THORChain
      case Network.Ethereum:
        return Chain.Ethereum
      case Network.Avalanche:
        return Chain.Avalanche
      case Network.Base:
        return Chain.Base
      case Network.Bsc:
        return Chain.BinanceSmartChain
      default:
        throw new Error(`Unsupported network: ${network}`)
    }
  }
}

const provider = () => new LedgerAdapter()
export default provider
