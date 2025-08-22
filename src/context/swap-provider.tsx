'use client'

import { createContext, Dispatch, FC, PropsWithChildren, SetStateAction, useContext, useState } from 'react'
import { useAccounts } from '@/context/accounts-provider'
import { usePools } from '@/hook/use-pools'
import { Asset } from '@/components/swap/asset'
import { Account } from '@/wallets'
import { Network } from 'rujira.js'

interface SwapContext {
  slippageLimit: bigint
  setSlippageLimit: Dispatch<SetStateAction<bigint>>
  /** Selected from Asset */
  fromAsset?: Asset & {
    price?: { current?: string | null | undefined }
  }
  /** Selected to Asset */
  toAsset?: Asset & {
    price?: { current?: string | null | undefined }
  }
  /** The amount of asset that needs to be deposited to inboundAddress, 8dp */
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

const findAsset = (pools?: Asset[], account?: Account | undefined, id?: string): Asset | undefined => {
  if (!id || !pools) {
    return undefined
  }

  const asset = pools.find(v => v.asset === id)
  if (!asset) {
    return undefined
  }

  // Return secured variant if account network doesn't match
  if (account && asset.chain !== account.network) {
    // return pool.asset.variants.secured as Asset
  }

  return asset
}

export const SwapProvider: FC<PropsWithChildren> = ({ children }) => {
  const { selected, accounts } = useAccounts()
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

  const { pools } = usePools()
  const fromAsset = findAsset(pools, selected, from)
  const toAsset = findAsset(pools, destination, to)

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

export const useSwapContext = () => useContext(Context)
