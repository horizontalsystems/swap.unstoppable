'use client'

import { createContext, FC, PropsWithChildren, useContext, useEffect, useState } from 'react'
import { Network } from 'rujira.js'
import { BalanceFetcher } from '@/wallets/balances'
import { usePools } from '@/hook/use-pools'
import { useAccounts } from '@/context/accounts-provider'
import { sleep } from '@/lib/utils'

interface BalancesContext {
  balances: Record<string, bigint | undefined>
}

const Context = createContext<BalancesContext>({
  balances: {}
})

export const BalancesProvider: FC<PropsWithChildren> = ({ children }) => {
  const { pools } = usePools()
  const { wallets } = useAccounts()
  const [balances, setBalances] = useState<Record<string, bigint | undefined>>({})

  const syncBalance = (network: Network, address: string, asset: string) => {
    const key = `${network}:${address}:${asset}`

    if (balances[key]) {
      return
    }

    BalanceFetcher.fetch({ network, address, asset }).then(result => {
      setBalances(prev => ({ ...prev, [key]: result }))
    })
  }

  useEffect(() => {
    if (!pools?.length || !wallets?.length) return

    const sync = async () => {
      for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i]
        const assets = pools.filter(p => p.chain === wallet.account.network).map(p => p.asset)

        for (let i = 0; i < assets.length; i++) {
          syncBalance(wallet.account.network, wallet.account.address, assets[i])

          await sleep(1000)
        }
      }
    }

    sync().then()
  }, [pools?.length, wallets?.length])

  return <Context.Provider value={{ balances }}>{children}</Context.Provider>
}

export const useBalances = (): BalancesContext => useContext(Context)
