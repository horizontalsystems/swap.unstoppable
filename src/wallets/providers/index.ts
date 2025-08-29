import { Account as BaseAccount, InboundAddress, Msg, Simulation, TxResult } from 'rujira.js'
import { Provider, Providers, WalletProvider } from './types'
import { default as brave } from './brave'
import { default as coinbase } from './coinbase'
import { default as ctrl } from './ctrl'
import { default as keplr } from './keplr'
import { default as leap } from './leap'
import { default as metamask } from './metamask'
import { default as okx } from './okx'
import { default as rabby } from './rabby'
import { default as station } from './station'
import { default as trust } from './trust'
import { default as vulticonnect } from './vulticonnect'
import { default as tronlink } from './tronlink'

const isClient = () => typeof window !== 'undefined'
const walletProvidersCache = new Map<Provider, WalletProvider<any>>()

const getProviderInstance = <P extends Provider>(provider: P): WalletProvider<P> => {
  if (!isClient()) {
    throw new Error('Wallet providers can only be accessed on the client side')
  }

  switch (provider) {
    case 'Keplr':
      return keplr() as unknown as WalletProvider<P>
    case 'Station':
      return station() as unknown as WalletProvider<P>
    case 'Leap':
      return leap() as unknown as WalletProvider<P>
    case 'Vultisig':
      return vulticonnect() as unknown as WalletProvider<P>
    case 'Ctrl':
      return ctrl() as unknown as WalletProvider<P>
    case 'Metamask':
      return metamask() as unknown as WalletProvider<P>
    case 'Okx':
      return okx() as unknown as WalletProvider<P>
    case 'Trust':
      return trust() as unknown as WalletProvider<P>
    case 'Rabby':
      return rabby() as unknown as WalletProvider<P>
    case 'Brave':
      return brave() as unknown as WalletProvider<P>
    case 'Coinbase':
      return coinbase() as unknown as WalletProvider<P>
    case 'Tronlink':
      return tronlink() as unknown as WalletProvider<P>
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}

const getWalletProvider = <P extends Provider>(provider: P): WalletProvider<P> | null => {
  if (!isClient()) {
    return null
  }

  if (walletProvidersCache.has(provider)) {
    return walletProvidersCache.get(provider) as WalletProvider<P>
  }

  const walletProvider = getProviderInstance(provider)
  walletProvidersCache.set(provider, walletProvider)
  return walletProvider
}

export const getAccounts = async <T extends Provider>(
  provider: T
): Promise<{ context: Providers[T]; account: BaseAccount<T> }[]> => {
  const walletProvider = getWalletProvider(provider)
  if (!walletProvider) {
    throw new Error(`Wallet provider ${provider} not available`)
  }

  const accounts = await walletProvider.getAccounts()

  return accounts.map(({ context, account }) => ({
    context: context as unknown as Providers[T],
    account: {
      ...account,
      provider
    }
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
    if (!walletProvider) {
      throw new Error(`Wallet provider ${account.provider} not available`)
    }
    return walletProvider?.signAndBroadcast(context as unknown as T, account, simulation, msg, inboundAddress)
  }

export const onChange = <T extends Provider>(provider: T, cb: () => void) => {
  const walletProvider = getWalletProvider(provider)
  return walletProvider?.onChange?.(cb)
}

export const isAvaialable = <T extends Provider>(provider: T): boolean => {
  const walletProvider = getWalletProvider(provider)
  return walletProvider?.isAvailable?.() || false
}

export const disconnect = <T extends Provider>(provider: T) => {
  const walletProvider = getWalletProvider(provider)
  return walletProvider?.disconnect?.()
}
