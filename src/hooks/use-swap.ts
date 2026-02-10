import { useMemo } from 'react'
import { NumberPrimitives, USwapNumber } from '@uswap/core'
import { useSwapStore } from '@/store/swap-store'

// Selectors

export const useAssetFrom = () => useSwapStore(state => state.assetFrom)
export const useSetAssetFrom = () => useSwapStore(state => state.setAssetFrom)

export const useAssetTo = () => useSwapStore(state => state.assetTo)
export const useSetAssetTo = () => useSwapStore(state => state.setAssetTo)

export const useSlippage = () => useSwapStore(state => state.slippage)
export const useSetSlippage = () => useSwapStore(state => state.setSlippage)

export const useTwapMode = () => useSwapStore(state => state.twapMode)
export const useSetTwapMode = () => useSwapStore(state => state.setTwapMode)
export const useCustomInterval = () => useSwapStore(state => state.customInterval)
export const useSetCustomInterval = () => useSwapStore(state => state.setCustomInterval)
export const useCustomQuantity = () => useSwapStore(state => state.customQuantity)
export const useSetCustomQuantity = () => useSwapStore(state => state.setCustomQuantity)

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
