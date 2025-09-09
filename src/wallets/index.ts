import { Account as BaseAccount, InboundAddress, Msg, Simulation, TxResult } from 'rujira.js'
import { Provider, Providers, WalletProvider } from './types'

import ctrl from './providers/ctrl'
import keplr from './providers/keplr'
import metamask from './providers/metamask'
import okx from './providers/okx'
import vulticonnect from './providers/vulticonnect'
import tronlink from './providers/tronlink'

export type * from './types'

const providers: Record<Provider, () => WalletProvider<any>> = {
  Keplr: keplr,
  Vultisig: vulticonnect,
  Ctrl: ctrl,
  Metamask: metamask,
  Okx: okx,
  Tronlink: tronlink
}

const isClient = () => typeof window !== 'undefined'
const walletProvidersCache = new Map<Provider, WalletProvider<any>>()

const getProviderInstance = <P extends Provider>(provider: P): WalletProvider<P> => {
  if (!isClient()) throw new Error('Wallet providers can only be accessed on the client side')
  const factory = providers[provider]
  if (!factory) throw new Error(`Unsupported provider: ${provider}`)
  return factory() as WalletProvider<P>
}

const getWalletProvider = <P extends Provider>(provider: P): WalletProvider<P> | null => {
  if (!isClient()) return null
  if (walletProvidersCache.has(provider)) return walletProvidersCache.get(provider) as WalletProvider<P>
  const walletProvider = getProviderInstance(provider)
  walletProvidersCache.set(provider, walletProvider)
  return walletProvider
}

export const getAccounts = async <T extends Provider>(
  provider: T
): Promise<{ context: Providers[T]; account: BaseAccount<T> }[]> => {
  const walletProvider = getWalletProvider(provider)
  if (!walletProvider) throw new Error(`Wallet provider ${provider} not available`)

  const accounts = await walletProvider.getAccounts()
  return accounts.map(({ context, account }) => ({
    context: context as unknown as Providers[T],
    account: { ...account, provider }
  }))
}

export const simulate =
  <T extends Provider>(context: Providers[T], account: BaseAccount<T>, inboundAddress?: InboundAddress) =>
  async (msg: Msg): Promise<Simulation> => {
    const walletProvider = getWalletProvider(account.provider)
    if (!walletProvider) {
      throw new Error(`Wallet provider ${account.provider} not available`)
    }
    return walletProvider.simulate(context as unknown as T, account, msg, inboundAddress)
  }

export const signAndBroadcast =
  <T extends Provider>(context: Providers[T], account: BaseAccount<T>, inboundAddress?: InboundAddress) =>
  async (simulation: Simulation, msg: Msg): Promise<TxResult> => {
    const walletProvider = getWalletProvider(account.provider)
    if (!walletProvider) throw new Error(`Wallet provider ${account.provider} not available`)
    return walletProvider.signAndBroadcast(context as unknown as T, account, simulation, msg, inboundAddress)
  }

export const onChange = <T extends Provider>(provider: T, cb: () => void) => {
  return getWalletProvider(provider)?.onChange?.(cb)
}

export const isAvaialable = <T extends Provider>(provider: T): boolean => {
  return getWalletProvider(provider)?.isAvailable?.() || false
}

export const disconnect = <T extends Provider>(provider: T) => {
  return getWalletProvider(provider)?.disconnect?.()
}
