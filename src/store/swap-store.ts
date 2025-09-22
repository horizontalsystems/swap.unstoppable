import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Asset } from '@/components/swap/asset'
import { Network, validateAddress } from 'rujira.js'
import { Provider } from '@/wallets'
import { useAccountStore } from '@/store/account-store'

const INITIAL_ASSET_FROM = 'BTC.BTC'
const INITIAL_ASSET_TO = 'THOR.RUNE'
const INITIAL_AMOUNT_FROM = 50_000_000n
export const INITIAL_SLIPPAGE_LIMIT = 3

interface Destination<P> {
  address: string
  network: Network
  provider?: P
}

interface SwapState {
  assetFrom?: Asset
  assetTo?: Asset
  amountFrom: string
  destination?: Destination<Provider>
  slippageLimit?: number
  feeWarning: string
  hasHydrated: boolean

  setSlippageLimit: (limit?: number) => void
  setDestination: (destination?: Destination<Provider>) => void
  setAmountFrom: (amount: bigint) => void
  resolveDestination: () => void
  setAssetFrom: (asset: Asset) => void
  setAssetTo: (asset: Asset) => void
  swapAssets: () => void
  setInitialAssets: (pools: Asset[]) => void
  setHasHydrated: (state: boolean) => void
}

export const useSwapStore = create<SwapState>()(
  persist(
    (set, get) => ({
      slippageLimit: INITIAL_SLIPPAGE_LIMIT,
      amountFrom: INITIAL_AMOUNT_FROM.toString(),
      feeWarning: '500',
      hasHydrated: false,

      setSlippageLimit: slippageLimit => set({ slippageLimit: slippageLimit }),
      setDestination: destination => set({ destination }),
      setAmountFrom: fromAmount => set({ amountFrom: fromAmount.toString() }),

      resolveDestination: async () => {
        const { assetTo, destination: previous, setDestination } = get()

        // Check if there is a custom address and it is suitable for a new assetTo
        if (assetTo && previous && !previous.provider && validateAddress(assetTo.chain, previous.address)) {
          setDestination({ address: previous.address, network: assetTo.chain })
          return
        }

        const accounts = useAccountStore.getState().accounts

        const fromPrevious = accounts?.find(
          a => a.provider === previous?.provider && a.address === previous?.address && a.network === assetTo?.chain
        )

        setDestination(fromPrevious ?? accounts?.find(a => a.network === assetTo?.chain))
      },

      setAssetFrom: asset => {
        const { assetFrom, assetTo, resolveDestination } = get()

        set({
          assetFrom: asset,
          assetTo: assetTo?.asset === asset.asset ? assetFrom : assetTo
        })

        useAccountStore.getState().resolveSource()
        resolveDestination()
      },

      setAssetTo: asset => {
        const { assetFrom, assetTo, resolveDestination } = get()

        set({
          assetFrom: assetFrom?.asset === asset.asset ? assetTo : assetFrom,
          assetTo: asset
        })

        useAccountStore.getState().resolveSource()
        resolveDestination()
      },

      swapAssets: () => {
        const { assetFrom, assetTo, resolveDestination } = get()

        set({
          assetFrom: assetTo,
          assetTo: assetFrom,
          amountFrom: ''
        })

        useAccountStore.getState().resolveSource()
        resolveDestination()
      },

      setInitialAssets: (pools: Asset[]) => {
        const state = get()
        if (state.assetFrom && state.assetTo) {
          return
        }

        set({
          assetFrom: pools.find(v => v.asset === INITIAL_ASSET_FROM),
          assetTo: pools.find(v => v.asset === INITIAL_ASSET_TO)
        })
      },

      setHasHydrated: (state: boolean) => set({ hasHydrated: state })
    }),
    {
      name: 'swap-store',
      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true)
      },
      partialize: state => ({
        slippageLimit: state.slippageLimit,
        amountFrom: state.amountFrom,
        feeWarning: state.feeWarning,
        assetFrom: state.assetFrom,
        assetTo: state.assetTo
      })
    }
  )
)
