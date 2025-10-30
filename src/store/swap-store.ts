import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Asset } from '@/components/swap/asset'
import { getAddressValidator } from '@swapkit/toolboxes'
import { Chain, WalletOption } from '@swapkit/core'
import { useWalletStore } from '@/store/wallets-store'

const INITIAL_ASSET_FROM = 'BTC.BTC'
const INITIAL_ASSET_TO = 'THOR.RUNE'
const INITIAL_AMOUNT_FROM = 0.5
export const INITIAL_SLIPPAGE = 1

interface Destination<P> {
  address: string
  network: Chain
  provider?: P
}

interface SwapState {
  assetFrom?: Asset
  assetTo?: Asset
  amountFrom: string
  destination?: Destination<WalletOption>
  slippage?: number
  feeWarning: string
  hasHydrated: boolean

  setSlippage: (limit?: number) => void
  setDestination: (destination?: Destination<WalletOption>) => void
  setAmountFrom: (amount: string) => void
  resolveDestination: () => void
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
      setDestination: destination => set({ destination }),
      setAmountFrom: fromAmount => set({ amountFrom: fromAmount }),

      resolveDestination: async () => {
        const { assetTo, destination: previous, setDestination } = get()
        const validateAddress = await getAddressValidator()

        // Check if there is a custom address and it is suitable for a new assetTo
        if (
          assetTo &&
          previous &&
          !previous.provider &&
          validateAddress({ address: previous.address, chain: assetTo.chain })
        ) {
          setDestination({ address: previous.address, network: assetTo.chain })
          return
        }

        const accounts = useWalletStore.getState().accounts

        const fromPrevious = accounts?.find(
          a => a.provider === previous?.provider && a.address === previous?.address && a.network === assetTo?.chain
        )

        setDestination(fromPrevious ?? accounts?.find(a => a.network === assetTo?.chain))
      },

      setAssetFrom: asset => {
        const { assetFrom, assetTo, resolveDestination } = get()

        set({
          assetFrom: asset,
          assetTo: assetTo?.identifier === asset.identifier ? assetFrom : assetTo
        })

        useWalletStore.getState().resolveSource()
        resolveDestination()
      },

      setAssetTo: asset => {
        const { assetFrom, assetTo, resolveDestination } = get()

        set({
          assetFrom: assetFrom?.identifier === asset.identifier ? assetTo : assetFrom,
          assetTo: asset
        })

        useWalletStore.getState().resolveSource()
        resolveDestination()
      },

      swapAssets: (amount?: string) => {
        const { assetFrom, assetTo, resolveDestination } = get()

        set({
          assetFrom: assetTo,
          assetTo: assetFrom,
          amountFrom: amount || ''
        })

        useWalletStore.getState().resolveSource()
        resolveDestination()
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
