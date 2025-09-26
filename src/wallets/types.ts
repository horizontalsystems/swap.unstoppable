import { JsonRpcSigner } from 'ethers'
import {
  Account as BaseAccount,
  AccountProvider as BaseAccountProvider,
  WalletProvider as BaseWalletProvider
} from 'rujira.js'

import { CtrlContext } from './providers/ctrl'
import { KeplrContext } from './providers/keplr'
import { OkxContext } from './providers/okx'
import { VulticonnectContext } from './providers/vulticonnect'
import { TronlinkContext } from './providers/tronlink'
import { LedgerContext } from '@/wallets/providers/ledger'

export type Provider = keyof Providers
export type Account = BaseAccount<Provider>
export type AccountProvider = BaseAccountProvider<Provider>
export type WalletProvider<C> = BaseWalletProvider<C, Provider>

export type Providers = {
  Keplr: KeplrContext
  Vultisig: VulticonnectContext
  Ctrl: CtrlContext
  Metamask: JsonRpcSigner
  Okx: OkxContext
  Tronlink: TronlinkContext
  Phantom: JsonRpcSigner
  Ledger: LedgerContext
}
