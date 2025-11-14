import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Asset } from '@/components/swap/asset'

const INITIAL_ASSET_FROM = 'BTC.BTC'
const INITIAL_ASSET_TO = 'THOR.RUNE'
const INITIAL_AMOUNT_FROM = 0.5
export const INITIAL_SLIPPAGE = 3

interface SwapState {
  assetFrom?: Asset
  assetTo?: Asset
  amountFrom: string
  slippage?: number
  feeWarning: string
  hasHydrated: boolean

  setSlippage: (limit?: number) => void
  setAmountFrom: (amount: string) => void
  setAssetFrom: (asset: Asset) => void
  setAssetTo: (asset: Asset) => void
  swapAssets: (amount?: string) => void
  setInitialAssets: (assets: Asset[]) => void
  setHasHydrated: (state: boolean) => void
}

export const useSwapStore = create<SwapState>()(
  persist(
    (set, get) => ({
      slippage: INITIAL_SLIPPAGE,
      amountFrom: INITIAL_AMOUNT_FROM.toString(),
      feeWarning: '500',
      hasHydrated: false,

      setSlippage: slippage => set({ slippage: slippage }),
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

      setInitialAssets: (assets: Asset[]) => {
        const state = get()
        if (state.assetFrom && state.assetTo) {
          return
        }

        set({
          assetFrom: assets.find(a => a.identifier === INITIAL_ASSET_FROM),
          assetTo: assets.find(a => a.identifier === INITIAL_ASSET_TO)
        })
      },

      setHasHydrated: (state: boolean) => set({ hasHydrated: state })
    }),
    {
      name: 'swap-store',
      version: 2,
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
