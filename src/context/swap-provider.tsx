'use client'

import { createContext, Dispatch, FC, PropsWithChildren, SetStateAction, useContext, useState } from 'react'
import { useAccounts } from '@/context/accounts-provider'
import { usePoolsRates } from '@/hook/use-pools-rates'
import { Asset } from '@/components/swap/asset'
import { Account } from '@/wallets'
import { Network } from 'rujira.js'

interface SwapContext {
  slippageLimit: bigint
  setSlippageLimit: Dispatch<SetStateAction<bigint>>
  fromAsset?: Asset & {
    price?: string | null | undefined
  }
  toAsset?: Asset & {
    price?: string | null | undefined
  }
  fromAmount: bigint
  setFromAmount: Dispatch<SetStateAction<bigint>>
  setSwap: (from?: Asset, to?: Asset) => void
  feeWarning: bigint
  destination?: Account
  setDestination: (d?: Account) => void
}

const ERROR = () => {
  throw new Error('No SwapContext')
}

const Context = createContext<SwapContext>({
  slippageLimit: 100n,
  setSlippageLimit: ERROR,
  fromAmount: 0n,
  setFromAmount: ERROR,
  setSwap: ERROR,
  feeWarning: 500n,
  setDestination: ERROR
})

const findAsset = (pools?: Asset[], id?: string): Asset | undefined => {
  if (!id || !pools) {
    return undefined
  }

  return pools.find(v => v.asset === id)
}

export const SwapProvider: FC<PropsWithChildren> = ({ children }) => {
  const { accounts } = useAccounts()
  const [slippageLimit, setSlippageLimit] = useState(100n)
  const [fromAmount, setFromAmount] = useState(100000000n)
  const [destination, setDestination] = useState<Account | undefined>(
    accounts?.find(a => a.network === Network.Thorchain)
  )

  const [{ from, to }, setParams] = useState<{ from?: string; to?: string }>({
    from: 'BTC.BTC',
    to: 'THOR.RUNE'
  })

  const setSwap = (a?: Asset, b?: Asset) =>
    setParams({
      from: a?.asset || from,
      to: b?.asset || to
    })

  const { pools } = usePoolsRates()
  const fromAsset = findAsset(pools, from)
  const toAsset = findAsset(pools, to)

  return (
    <Context.Provider
      value={{
        slippageLimit,
        setSlippageLimit,
        fromAsset,
        toAsset,
        fromAmount,
        setFromAmount,
        setSwap,
        feeWarning: 500n,
        destination,
        setDestination
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useSwapContext = (): SwapContext => useContext(Context)
