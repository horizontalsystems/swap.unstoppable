import { Keplr, Window as KeplrWindow } from '@keplr-wallet/types'
import { Psbt } from 'bitcoinjs-lib'
import { Eip1193Provider, JsonRpcSigner } from 'ethers'
import { Account, InboundAddress, Msg, Network, Simulation, TxResult } from 'rujira.js'
import { CosmosAdapter, CosmosContext } from './cosmos'
import { Eip6963Adapter } from './eip6963'
import { Providers, WalletProvider } from './types'
import { UtxoContext } from './utxo'

interface BitcoinProvider {
  connect: () => Promise<{ address: string; publicKey: string }>
  signPsbt: (psbtHex: string, options?: { autofinalized?: boolean }) => Promise<string>
}

declare global {
  interface Window extends KeplrWindow {
    okxwallet?: Eip1193Provider & {
      bitcoin: BitcoinProvider
      keplr: Keplr & { isOkWallet: true }
    }
  }
}

export type OkxContext = JsonRpcSigner | CosmosContext | UtxoContext

class OkxAdapter implements WalletProvider<OkxContext> {
  onChange?: ((cb: () => void) => void) | undefined

  constructor(
    private e: Eip6963Adapter,
    private c: CosmosAdapter,
    private b?: BitcoinProvider
  ) {}

  getAccounts(): Promise<
    {
      context: OkxContext
      account: { address: string; network: Network }
    }[]
  > {
    if (!this.b) throw new Error('Okx extension not found')
    const accs = this.b.connect().then(res => {
      return [
        {
          context: new UtxoContext(res.address),
          account: {
            address: res.address,
            network: Network.Bitcoin
          }
        }
      ]
    })

    return Promise.all([this.e.getAccounts(), this.c.getAccounts(), accs]).then(x => x.flat())
  }

  async simulate(
    context: OkxContext,
    account: Account<keyof Providers>,
    msg: Msg,
    inboundAddress?: InboundAddress
  ): Promise<Simulation> {
    if (context instanceof JsonRpcSigner) return this.e.simulate(context, account, msg, inboundAddress)
    if (typeof context === 'object' && 'chain' in context) return this.c.simulate(context, account, msg, inboundAddress)

    const utxos = await context.fetchUtxos()
    const { fee } = await msg.toPsbt(account, utxos, inboundAddress)

    return {
      symbol: 'BTC',
      decimals: 8,
      amount: fee,
      gas: 0n
    }
  }

  async signAndBroadcast(
    context: OkxContext,
    account: Account<keyof Providers>,
    simulation: Simulation,
    msg: Msg,
    inboundAddress?: InboundAddress
  ): Promise<TxResult> {
    if (context instanceof JsonRpcSigner)
      return this.e.signAndBroadcast(context, account, simulation, msg, inboundAddress)
    if (typeof context === 'object' && 'chain' in context)
      return this.c.signAndBroadcast(context, account, simulation, msg, inboundAddress)
    if (!this.b) throw new Error('Okx extension not found')
    const utxos = await context.fetchUtxos()
    const { psbt } = await msg.toPsbt(account, utxos, inboundAddress)
    const res = await this.b.signPsbt(psbt.toHex(), { autofinalized: true })
    const signed = Psbt.fromHex(res)
    return context.broadcast(account.address, signed.extractTransaction(), msg.toDeposit?.())
  }

  isAvailable() {
    return this.e.isAvailable()
  }
}

const provider = () =>
  new OkxAdapter(
    new Eip6963Adapter('com.okex.wallet'),
    new CosmosAdapter(() => window.okxwallet?.keplr),
    window.okxwallet?.bitcoin
  )

export default provider
