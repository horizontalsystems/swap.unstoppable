'use client'

import { useMemo, useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Asset } from '@/components/swap/asset'
import { Account } from '@/wallets'
import { AssetRate, usePoolsRates } from '@/hook/use-pools-rates'

interface SwapState {
  slippageLimit: string
  fromAmount: string
  feeWarning: string
  from?: string
  to?: string

  setSlippageLimit: (limit: bigint) => void
  setFromAmount: (amount: bigint) => void
  setSwap: (fromAsset?: Asset, toAsset?: Asset) => void
  swapAssets: () => void
  reset: () => void
}

const findAsset = (pools?: AssetRate[], id?: string): AssetRate | undefined => {
  if (!id || !pools) {
    return undefined
  }
  return pools.find(v => v.asset === id)
}

const initialState = {
  slippageLimit: '100',
  fromAmount: '100000000',
  feeWarning: '500',
  from: 'BTC.BTC',
  to: 'THOR.RUNE',
  destination: undefined
}

export const useSwapStore = create<SwapState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSlippageLimit: slippageLimit => set({ slippageLimit: slippageLimit.toString() }),
      setFromAmount: fromAmount => set({ fromAmount: fromAmount.toString() }),

      setSwap: (fromAsset, toAsset) => {
        const state = get()
        set({
          from: fromAsset?.asset || state.from,
          to: toAsset?.asset || state.to
        })
      },

      swapAssets: () => {
        const { from, to } = get()
        set({
          from: to,
          to: from
        })
      },

      reset: () => set(initialState)
    }),
    {
      name: 'swap-store'
    }
  )
)

// Selectors
export const useSlippageLimit = () => useSwapStore(state => state.slippageLimit)
export const useSetSlippageLimit = () => useSwapStore(state => state.setSlippageLimit)

export const useSwap = () => {
  const [destination, setDestination] = useState<Account | undefined>()
  const { pools } = usePoolsRates()
  const {
    slippageLimit,
    setSlippageLimit,
    fromAmount,
    setFromAmount,
    setSwap,
    feeWarning,
    from,
    to,
    swapAssets,
    reset
  } = useSwapStore()

  const fromAsset = useMemo(() => findAsset(pools, from), [pools, from])
  const toAsset = useMemo(() => findAsset(pools, to), [pools, to])

  return {
    slippageLimit: BigInt(slippageLimit),
    setSlippageLimit,
    fromAsset,
    toAsset,
    fromAmount: BigInt(fromAmount),
    setFromAmount,
    setSwap,
    feeWarning: BigInt(feeWarning),
    destination,
    setDestination,
    swapAssets,
    reset
  }
}
