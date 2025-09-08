import { JsonRpcSigner } from 'ethers'
import {
  Account as BaseAccount,
  AccountProvider as BaseAccountProvider,
  WalletProvider as BaseWalletProvider
} from 'rujira.js'

import { CtrlContext } from './ctrl'
import { KeplrContext } from './keplr'
import { OkxContext } from './okx'
import { VulticonnectContext } from './vulticonnect'
import { TronlinkContext } from './tronlink'

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
}
