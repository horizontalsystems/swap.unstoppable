'use client'

import { createContext, FC, PropsWithChildren, useContext, useEffect, useState } from 'react'
import { Account, AccountProvider, Provider, wallets } from '@/wallets'
import { useSwap } from '@/hooks/use-swap'
import { Network } from 'rujira.js'
import { toast } from 'sonner'
import * as storage from '@/wallets/storage'

const ERROR = () => {
  throw new Error('AccountProvider Context not defined')
}

interface WalletContext {
  account: Account
  context: any
}

interface AccountContext extends AccountProvider {
  context?: any
}

const Context = createContext<AccountContext>({
  accounts: undefined,
  select: ERROR,
  connect: ERROR,
  disconnect: ERROR,
  disconnectAll: ERROR,
  isAvaialable: ERROR
})

const storedSelected = storage.loadSelected()
const connectedProviders: Provider[] = storage.loadProviders()

export const AccountsProvider: FC<PropsWithChildren> = ({ children }) => {
  const { fromAsset, destination, setDestination } = useSwap()
  const [provider, setProvider] = useState<Provider | undefined>(storedSelected?.provider)
  const [network, setNetwork] = useState<Network | undefined>(storedSelected?.network)
  const [address, setAddress] = useState<string | undefined>(storedSelected?.address)

  const [accounts, setAccounts] = useState<WalletContext[]>()

  useEffect(() => {
    Promise.allSettled(
      connectedProviders.map(x =>
        wallets.getAccounts(x).catch(err => {
          // Don't keep trying
          storage.removeProvider(x)
          throw err
        })
      )
    ).then(x =>
      setAccounts(x.reduce((a: WalletContext[], v) => (v.status === 'fulfilled' ? [...v.value, ...a] : a), []))
    )
  }, [])

  const selected = accounts?.find(
    a =>
      a.account.network === network &&
      a.account.provider === provider &&
      (address ? a.account.address === address : true)
  )

  useEffect(() => {
    if (!selected) return
    wallets.onChange(selected?.account.provider, () => {
      wallets.getAccounts(selected?.account.provider).then(x => {
        if (!x.length) return
        setAccounts((prev = []) => [...prev.filter(x => x.account.provider !== provider), ...x])
      })
    })
  }, [provider, selected])

  const connect = async (provider: Provider) => {
    try {
      const acc = await wallets.getAccounts(provider)
      if (!acc.length) throw new Error(`No accounts found on ${provider}`)
      const toSelect = acc.find(x => x.account.network === fromAsset?.chain)
      storage.addProvider(provider)
      if (toSelect) {
        storage.saveSelected(provider, toSelect.account.network)
        setNetwork(toSelect.account.network)
      }
      setProvider(provider)
      setAccounts((prev = []) => [...prev.filter(x => x.account.provider !== provider), ...acc])
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const select = (
    account: {
      provider: Provider
      network: Network
      address?: string
    } | null
  ) => {
    if (!account) {
      storage.clearSelected()
      setProvider(undefined)
      setNetwork(undefined)
      setAddress(undefined)
      return
    }

    // Some wallets will return multiple addresses for a single Network, eg
    // Metamask with multiple accounts. We need to be able to select a specific address
    // Other wallets, eg Keplr, will only return the currently selected wallet,
    // so we need to only use the address as a "preference" rather than a required match

    switch (account.provider) {
      case 'Metamask':
        storage.saveSelected(account.provider, account.network, account.address)
        setProvider(account.provider)
        setNetwork(account.network)
        setAddress(account.address)
        break
      default:
        storage.saveSelected(account.provider, account.network)
        setProvider(account.provider)
        setNetwork(account.network)
        setAddress(undefined)
    }
  }

  const disconnect = (p: Provider) => {
    wallets.disconnect(p)
    storage.removeProvider(p)
    setAccounts((prev = []) => {
      const filtered = prev.filter(x => x.account.provider !== p)
      const selected = filtered[0]
      if (selected) {
        storage.saveSelected(selected.account.provider, selected.account.network, selected.account.address)
      }
      return filtered
    })
    if (destination?.provider === p) {
      setDestination(undefined)
    }
  }

  const disconnectAll = () => {
    accounts?.map(a => wallets.disconnect(a.account.provider))
    storage.clearProviders()
    storage.clearSelected()
    setAccounts([])
    setDestination(undefined)
  }

  return (
    <Context.Provider
      value={{
        accounts: accounts?.map(a => a.account),
        selected: selected?.account,
        context: selected?.context,
        select,
        connect,
        disconnect,
        disconnectAll,
        isAvaialable: wallets.isAvaialable
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useAccounts = (): AccountContext => useContext(Context)
