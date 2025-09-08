import { Keplr, Window as KeplrWindow } from '@keplr-wallet/types'
import { Psbt } from 'bitcoinjs-lib'
import { JsonRpcSigner } from 'ethers'
import { Account, InboundAddress, Msg, Network, Simulation, TxResult } from 'rujira.js'
import { CosmosAdapter, CosmosContext } from './cosmos'
import { Eip6963Adapter } from './eip6963'
import { Providers, WalletProvider } from './types'
import { UtxoContext } from './utxo'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Window extends KeplrWindow {}
}

export type KeplrContext = JsonRpcSigner | CosmosContext | UtxoContext

export class KeplrAdapter implements WalletProvider<KeplrContext> {
  private c: CosmosAdapter
  constructor(
    private e: Eip6963Adapter,
    private k: () => Keplr | undefined
  ) {
    this.c = new CosmosAdapter(k)
  }
  onChange = (cb: () => void) => {
    window.addEventListener('keplr_keystorechange', cb)
    this.e.onChange(cb)
  }

  isAvailable(): boolean {
    return !!this.k()
  }

  public async getAccounts(): Promise<
    {
      context: KeplrContext
      account: { address: string; network: Network }
    }[]
  > {
    return Promise.allSettled([this.c.getAccounts(), this.e.getAccounts(), this.getBitcoinAccounts()]).then(x =>
      x.reduce(
        (
          a: {
            context: KeplrContext
            account: { address: string; network: Network }
          }[],
          v
        ) => (v.status === 'fulfilled' ? [...v.value, ...a] : a),
        []
      )
    )
  }

  async getBitcoinAccounts(): Promise<
    {
      context: UtxoContext
      account: { address: string; network: Network }
    }[]
  > {
    const k = window.keplr?.bitcoin
    if (!k) throw new Error('No Keplr Bitcoin provider')
    return k.connectWallet().then(accounts =>
      accounts.map(address => ({
        context: new UtxoContext(address),
        account: { address, network: Network.Bitcoin }
      }))
    )
  }

  public async simulate(
    context: KeplrContext,
    account: Account<keyof Providers>,
    msg: Msg,
    inboundAddress?: InboundAddress
  ): Promise<Simulation> {
    if (context instanceof JsonRpcSigner) return this.e.simulate(context, account, msg, inboundAddress)

    if (context instanceof UtxoContext) {
      const utxos = await context.fetchUtxos()
      const { fee } = await msg.toPsbt(account, utxos, inboundAddress)

      return {
        symbol: 'BTC',
        decimals: 8,
        amount: fee,
        gas: 0n
      }
    }

    return this.c.simulate(context, account, msg, inboundAddress)
  }

  public async signAndBroadcast(
    context: KeplrContext,
    account: Account<keyof Providers>,
    simulation: Simulation,
    msg: Msg,
    inboundAddress?: InboundAddress
  ): Promise<TxResult> {
    if (context instanceof JsonRpcSigner)
      return this.e.signAndBroadcast(context, account, simulation, msg, inboundAddress)
    if (context instanceof UtxoContext) {
      const utxos = await context.fetchUtxos()
      const { psbt } = await msg.toPsbt(account, utxos, inboundAddress)
      const res = await window.keplr.bitcoin.signPsbt(psbt.toHex(), {
        autoFinalized: true
      })
      const signed = Psbt.fromHex(res)
      return context.broadcast(account.address, signed.extractTransaction(), msg.toDeposit?.())
    }
    return this.c.signAndBroadcast(context, account, simulation, msg, inboundAddress)
  }
}

const provider = () => new KeplrAdapter(new Eip6963Adapter('app.keplr'), () => window.keplr)

export default provider
