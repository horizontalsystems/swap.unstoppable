import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Asset } from '@/components/swap/asset'

const INITIAL_AMOUNT_FROM = 0.5

export const INITIAL_SLIPPAGE = 1
export const INITIAL_TWAP_MODE = 'bestPrice' as TwapMode
export const INITIAL_CUSTOM_INTERVAL = 10
export const INITIAL_CUSTOM_QUANTITY = 10

export type TwapMode = 'bestPrice' | 'bestTime' | 'custom'

interface SwapState {
  assetFrom?: Asset
  assetTo?: Asset
  amountFrom: string
  slippage?: number
  twapMode: TwapMode
  customInterval: number
  customQuantity: number
  feeWarning: string
  hasHydrated: boolean

  setSlippage: (limit?: number) => void
  setTwapMode: (mode: TwapMode) => void
  setCustomInterval: (interval: number) => void
  setCustomQuantity: (quantity: number) => void
  setAmountFrom: (amount: string) => void
  setAssetFrom: (asset: Asset) => void
  setAssetTo: (asset: Asset) => void
  swapAssets: (amount?: string) => void
  setHasHydrated: (state: boolean) => void
}

export const useSwapStore = create<SwapState>()(
  persist(
    (set, get) => ({
      slippage: INITIAL_SLIPPAGE,
      twapMode: INITIAL_TWAP_MODE,
      customInterval: INITIAL_CUSTOM_INTERVAL,
      customQuantity: INITIAL_CUSTOM_QUANTITY,
      amountFrom: INITIAL_AMOUNT_FROM.toString(),
      feeWarning: '500',
      hasHydrated: false,

      setSlippage: slippage => set({ slippage: slippage }),
      setTwapMode: twapMode => set({ twapMode }),
      setCustomInterval: customInterval => set({ customInterval }),
      setCustomQuantity: customQuantity => set({ customQuantity }),
      setAmountFrom: fromAmount => set({ amountFrom: fromAmount }),

      setAssetFrom: asset => {
        const { assetFrom, assetTo } = get()

        set({
          assetFrom: asset,
          assetTo: assetTo?.identifier === asset.identifier ? assetFrom : assetTo
        })
      },

      setAssetTo: asset => {
        const { assetFrom, assetTo } = get()

        set({
          assetFrom: assetFrom?.identifier === asset.identifier ? assetTo : assetFrom,
          assetTo: asset
        })
      },

      swapAssets: (amount?: string) => {
        const { assetFrom, assetTo } = get()

        set({
          assetFrom: assetTo,
          assetTo: assetFrom,
          amountFrom: amount || ''
        })
      },

      setHasHydrated: (state: boolean) => set({ hasHydrated: state })
    }),
    {
      name: 'swap-store',
      version: 6,
      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true)
      },
      partialize: state => ({
        slippage: state.slippage,
        amountFrom: state.amountFrom,
        feeWarning: state.feeWarning,
        assetFrom: state.assetFrom,
        assetTo: state.assetTo
      })
    }
  )
)
