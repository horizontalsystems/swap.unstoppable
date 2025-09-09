import { Keplr, Window as KeplrWindow } from '@keplr-wallet/types'
import { Eip1193Provider, JsonRpcSigner } from 'ethers'
import { Account, gasToken, InboundAddress, Msg, Network, Simulation, TxResult } from 'rujira.js'
import { CosmosAdapter, CosmosContext } from './cosmos'
import { Eip6963Adapter } from './eips/eip6963'
import { Providers, WalletProvider } from '../types'
import { utxoNetworkTochain, UtxoQueryClient } from './utxo'

export type Callback = (
  error: Error | null,
  result?: any // https://github.com/vultisig/vultisig-windows/blob/baeb3e8099a0003404f9664c43b0183c26029041/clients/extension/src/utils/interfaces.ts#L11
) => void

export type VultisigProvider = {
  request(request: { method: string; params?: Array<any> | Record<string, any> }, callback?: Callback): Promise<any>
}

declare global {
  export type VultisigWindow = {
    ethereum: Eip1193Provider
    bitcoin: VultisigProvider
    bitcoincash: VultisigProvider
    dogecoin: VultisigProvider
    litecoin: VultisigProvider
    ripple: VultisigProvider
    cosmos: VultisigProvider
    thorchain: VultisigProvider
    keplr: Keplr
  }
  interface Window extends KeplrWindow {
    vultisig?: VultisigWindow
  }
}

export type VulticonnectContext = JsonRpcSigner | CosmosContext | UtxoQueryClient

class VulticonnectAdapter implements WalletProvider<VulticonnectContext> {
  constructor(
    private e: Eip6963Adapter,
    private c: CosmosAdapter
  ) {}
  async getAccounts(): Promise<
    {
      context: VulticonnectContext
      account: { address: string; network: Network }
    }[]
  > {
    const vs = await this.vultisig()
    const accounts = await Promise.all([
      this.c.getAccounts(),
      // this.getVultisigAccounts(Network.Xrp, window.vultisig.ripple),
      this.getVultisigAccounts(Network.Bitcoin, vs.bitcoin),
      this.getVultisigAccounts(Network.BitcoinCash, vs.bitcoincash),
      this.getVultisigAccounts(Network.Dogecoin, vs.dogecoin),
      this.getVultisigAccounts(Network.Litecoin, vs.litecoin),
      this.e.getAccounts()
    ])
    return accounts.flat()
  }

  async getVultisigAccounts(
    network: Network,
    provider: VultisigProvider
  ): Promise<
    {
      context: VulticonnectContext
      account: { address: string; network: Network }
    }[]
  > {
    const accounts: string[] = await provider.request({
      method: 'request_accounts'
    })

    return accounts.map(x => {
      return {
        context: new UtxoQueryClient(network, x),
        account: {
          address: x,
          network
        }
      }
    })
  }

  async simulate(
    context: VulticonnectContext,
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
    context: VulticonnectContext,
    account: Account<keyof Providers>,
    simulation: Simulation,
    msg: Msg,
    inboundAddress?: InboundAddress
  ): Promise<TxResult> {
    if (context instanceof JsonRpcSigner)
      return this.e.signAndBroadcast(context, account, simulation, msg, inboundAddress)
    if (typeof context === 'object' && 'chain' in context)
      return this.c.signAndBroadcast(context as CosmosContext, account, simulation, msg, inboundAddress)
    if (context instanceof UtxoQueryClient) {
      const key = utxoNetworkTochain(account.network)
      const utxos = await context.fetch()
      const token = gasToken(account.network)
      const { amount, memo, recipient } = await msg.toPsbt(account, utxos, inboundAddress)
      const params = [
        {
          asset: {
            chain: account.network,
            ticker: token.symbol
          },
          from: account.address,
          to: recipient,
          amount: { amount: Number(amount), decimals: token.decimals },
          data: memo
        }
      ]
      const hash = await window?.vultisig?.[key].request({
        method: 'send_transaction',
        params
      })
      return {
        network: account.network,
        address: account.address,
        txHash: hash
      }
    }
    throw new Error('Not context available')
  }
  onChange?(cb: () => void) {
    this.e.onChange(cb)
  }
  isAvailable() {
    return this.e.isAvailable()
  }
  async vultisig(attempt = 0): Promise<VultisigWindow> {
    if (attempt >= 5) throw new Error(`Vulticonnect Extension not detected`)
    return (
      window.vultisig ||
      new Promise(resolve => {
        setTimeout(() => {
          this.vultisig(attempt + 1)
            .then(resolve)
            .catch(resolve)
        }, 100)
      })
    )
  }
}

const provider = () =>
  new VulticonnectAdapter(new Eip6963Adapter('me.vultisig'), new CosmosAdapter(() => window.vultisig?.keplr))

export default provider
