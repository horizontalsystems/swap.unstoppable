import { Msg } from './msgs'
import { Network } from './network'

export interface AccountProvider<P> {
  /** undefined until loaded. null if loaded and not present */
  accounts: Account<P>[] | undefined | null
  selected?: Account<P>
  select: (
    account: {
      provider: P
      network: Network
      address?: string
    } | null
  ) => void
  connect: (provider: P, config?: any) => ConnectionResponse
  disconnect: (provider: P) => void
  disconnectAll: () => void
  isAvailable: (provider: P) => boolean
  isLoading?: boolean
}

export interface Signer {
  simulate?: (msg: Msg) => Promise<Simulation>
  signAndBroadcast?: (simulation: Simulation, msg: Msg) => Promise<TxResult>
}

export interface Account<P> {
  address: string
  provider: P
  network: Network
  config?: any
}

export type ConnectionResponse = Promise<void>

export type TxResult = {
  network: Network
  address: string
  txHash: string
  deposited?: {
    amount: bigint
    symbol: string
  }
  label?: string
}

export interface Simulation {
  symbol: string
  decimals: number
  amount: bigint
  gas: bigint
}

export interface InboundAddress {
  address: string
  dustThreshold: bigint
  router?: string
  gasRate: bigint
}

export interface WalletProvider<C, P> {
  /**
   * Retrieves the connected account(s) from the current provider
   */
  getAccounts(config?: any): Promise<{ context: C; account: { address: string; network: Network } }[]>
  /**
   * Simulates a Rujira Network Tx for displaying gas fees etc
   * @param account The currently selected account
   * @param tx The Tx to be signed & broadcast
   * @returns Simulated gas amount
   */
  simulate(context: C, account: Account<P>, tx: Msg, inboundAddress?: InboundAddress): Promise<Simulation>
  /**
   * Signs and broadcasts the tx over the currently selected network.
   * The Rujira Network Tx is converted to a tx suitble for the currently selected network, signed and broacast
   * @param account The currently selected account
   * @param simulation The simulation returned by `simulate`
   * @param tx The Tx to be signed & broadcast
   */
  signAndBroadcast(
    context: C,
    account: Account<P>,
    simulation: Simulation,
    tx: Msg,
    inboundAddress?: InboundAddress
  ): Promise<TxResult>

  /**
   *
   * @param cb Provide a function to be called when an account change is detected in the provider
   */
  onChange?: (cb: () => void) => void

  isAvailable: () => boolean

  disconnect?: () => void
}
