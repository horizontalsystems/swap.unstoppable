import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Asset } from '@/components/swap/asset'
import { Account } from '@/wallets'
import { AssetRate, usePoolsRates } from '@/hook/use-pools-rates'

interface SwapState {
  slippageLimit: string
  destination?: Account
  fromAmount: string
  feeWarning: string
  from?: string
  to?: string

  setSlippageLimit: (limit: bigint) => void
  setDestination: (destination?: Account) => void
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
      setDestination: destination => set({ destination }),
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
          to: from,
          fromAmount: '0'
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

export const useDestination = () => useSwapStore(state => state.destination)
export const useSetDestination = () => useSwapStore(state => state.setDestination)

export const useSwap = () => {
  const { pools } = usePoolsRates()
  const {
    slippageLimit,
    destination,
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
    destination,
    fromAsset,
    toAsset,
    fromAmount: BigInt(fromAmount),
    setFromAmount,
    setSwap,
    feeWarning: BigInt(feeWarning),
    swapAssets,
    reset
  }
}
