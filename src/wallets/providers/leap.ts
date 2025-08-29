import { Keplr, Window as KeplrWindow } from '@keplr-wallet/types'
import { JsonRpcSigner } from 'ethers'
import { InboundAddress, Msg, Network, Simulation, TxResult } from 'rujira.js'
import { CosmosAdapter, CosmosContext } from './cosmos'
import { Eip6963Adapter } from './eip6963'
import { Account, WalletProvider } from './types'

declare global {
  interface Window extends KeplrWindow {
    leap: Keplr
    keplr: Keplr & { aptos: { name: 'Leap Wallet' } }
  }
}

export type LeapContext = JsonRpcSigner | CosmosContext

export class LeapAdapter implements WalletProvider<LeapContext> {
  onChange?: ((cb: () => void) => void) | undefined
  private c: CosmosAdapter

  constructor(
    private e: Eip6963Adapter,
    k: () => Keplr | undefined
  ) {
    this.c = new CosmosAdapter(k)
  }

  isAvailable(): boolean {
    return this.c.isAvailable()
  }

  public async getAccounts(): Promise<
    {
      context: LeapContext
      account: { address: string; network: Network }
    }[]
  > {
    return Promise.allSettled([this.c.getAccounts(), this.e.getAccounts()]).then(x =>
      x.reduce(
        (
          a: {
            context: LeapContext
            account: { address: string; network: Network }
          }[],
          v
        ) => (v.status === 'fulfilled' ? [...v.value, ...a] : a),
        []
      )
    )
  }

  public async simulate(
    context: LeapContext,
    account: Account,
    msg: Msg,
    inboundAddress?: InboundAddress
  ): Promise<Simulation> {
    if (context instanceof JsonRpcSigner) return this.e.simulate(context, account, msg, inboundAddress)

    return this.c.simulate(context, account, msg, inboundAddress)
  }

  public async signAndBroadcast(
    context: LeapContext,
    account: Account,
    simulation: Simulation,
    msg: Msg,
    inboundAddress?: InboundAddress
  ): Promise<TxResult> {
    if (context instanceof JsonRpcSigner)
      return this.e.signAndBroadcast(context, account, simulation, msg, inboundAddress)
    return this.c.signAndBroadcast(context, account, simulation, msg, inboundAddress)
  }
}

const init = () => {
  const provider: WalletProvider<CosmosContext | JsonRpcSigner> = new LeapAdapter(
    new Eip6963Adapter('io.leapwallet.LeapWallet'),
    () => window.leap
  )

  return provider
}

export default init
