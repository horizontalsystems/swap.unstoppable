import { useEffect } from 'react'
import { usePools } from '@/hooks/use-pools'
import { useSwapStore } from '@/store/swap-store'
import { useAccounts } from '@/hooks/use-accounts'

// Selectors

export const useAssetFrom = () => useSwapStore(state => state.assetFrom)
export const useSetAssetFrom = () => useSwapStore(state => state.setAssetFrom)

export const useAssetTo = () => useSwapStore(state => state.assetTo)
export const useSetAssetTo = () => useSwapStore(state => state.setAssetTo)

export const useSlippage = () => useSwapStore(state => state.slippage)
export const useSetSlippage = () => useSwapStore(state => state.setSlippage)

export const useDestination = () => useSwapStore(state => state.destination)
export const useSetDestination = () => useSwapStore(state => state.setDestination)

export const useSwapAssets = () => useSwapStore(state => state.swapAssets)

// Hooks

export const useSourceWallet = () => {
  const { accounts } = useAccounts()
  const assetFrom = useAssetFrom()
  const setDestination = useSetDestination()

  useEffect(() => {
    const toAssetAccount = accounts?.find(a => a.network === assetFrom?.chain)
    setDestination(toAssetAccount)
  }, [accounts, assetFrom, setDestination])
}

export const useSwap = () => {
  const { pools } = usePools()
  const {
    slippage,
    destination,
    setDestination,
    setSlippage,
    amountFrom,
    hasHydrated,
    setAmountFrom,
    setAssetTo,
    feeWarning,
    setInitialAssets
  } = useSwapStore()

  useEffect(() => {
    if (!pools?.length) return
    setInitialAssets(pools)
  }, [pools, setInitialAssets])

  return {
    slippage,
    setSlippage,
    destination,
    setDestination,
    amountFrom: hasHydrated ? BigInt(amountFrom) : 0n,
    setAmountFrom,
    setAssetTo,
    feeWarning: BigInt(feeWarning)
  }
}
