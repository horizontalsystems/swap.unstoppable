import { useMemo } from 'react'
import { useSwapStore } from '@/store/swap-store'
import { NumberPrimitives, USwapNumber } from '@uswap/core'

// Selectors

export const useAssetFrom = () => useSwapStore(state => state.assetFrom)
export const useSetAssetFrom = () => useSwapStore(state => state.setAssetFrom)

export const useAssetTo = () => useSwapStore(state => state.assetTo)
export const useSetAssetTo = () => useSwapStore(state => state.setAssetTo)

export const useSlippage = () => useSwapStore(state => state.slippage)
export const useSetSlippage = () => useSwapStore(state => state.setSlippage)

export const useStreamingInterval = () => useSwapStore(state => state.streamingInterval)
export const useSetStreamingInterval = () => useSwapStore(state => state.setStreamingInterval)

export const useSwapAssets = () => useSwapStore(state => state.swapAssets)

// Hooks

export const useSwap = () => {
  const { amountFrom, hasHydrated, setAmountFrom, setAssetTo, feeWarning } = useSwapStore()

  const amount = hasHydrated ? amountFrom : ''

  return {
    amountFrom: amount,
    setAmountFrom,
    valueFrom: useMemo(() => new USwapNumber(amount), [amount]),
    setValueFrom: (value: USwapNumber | NumberPrimitives) => {
      setAmountFrom(new USwapNumber(value).toSignificant())
    },
    setAssetTo,
    feeWarning: BigInt(feeWarning)
  }
}