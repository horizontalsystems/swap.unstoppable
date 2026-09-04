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
    /**
     * The sell amount for quoting and committing, at full precision.
     *
     * NOT `toSignificant()`, which rounds to 6 significant digits — `1234.5678901` becomes
     * `1234.56` and `123456789.1234567` becomes `123456000`. That is fine for display but wrong to
     * send: it swaps a different amount than the user typed. Stellar is 7 dp natively and the
     * aggregator takes a decimal string, so both are given the exact value.
     */
    exactAmountFrom: useMemo(() => new USwapNumber(amount).getValue('string'), [amount]),
    setValueFrom: (value: USwapNumber | NumberPrimitives) => {
      setAmountFrom(new USwapNumber(value).toSignificant())
    },
    setAssetTo,
    feeWarning: BigInt(feeWarning)
  }
}
