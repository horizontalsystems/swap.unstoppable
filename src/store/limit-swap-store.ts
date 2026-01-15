import { create } from 'zustand'

interface LimitSwapState {
  isLimitSwap: boolean
  limitSwapBuyAmount?: string
  limitSwapExpiry?: number

  setIsLimitSwap: (isLimit: boolean) => void
  setLimitSwapBuyAmount: (amount?: string) => void
  setLimitSwapExpiry: (expiry?: number) => void
}

export const useLimitSwapStore = create<LimitSwapState>()(set => ({
  isLimitSwap: false,
  limitSwapBuyAmount: undefined,
  limitSwapExpiry: undefined,

  setIsLimitSwap: isLimit => set({ isLimitSwap: isLimit }),
  setLimitSwapBuyAmount: amount => set({ limitSwapBuyAmount: amount }),
  setLimitSwapExpiry: expiry => set({ limitSwapExpiry: expiry })
}))

export const useIsLimitSwap = () => useLimitSwapStore(state => state.isLimitSwap)
export const useSetIsLimitSwap = () => useLimitSwapStore(state => state.setIsLimitSwap)

export const useLimitSwapBuyAmount = () => useLimitSwapStore(state => state.limitSwapBuyAmount)
export const useSetLimitSwapBuyAmount = () => useLimitSwapStore(state => state.setLimitSwapBuyAmount)

export const useLimitSwapExpiry = () => useLimitSwapStore(state => state.limitSwapExpiry)
export const useSetLimitSwapExpiry = () => useLimitSwapStore(state => state.setLimitSwapExpiry)
