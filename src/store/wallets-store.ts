import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Chain, WalletOption } from '@swapkit/core'
import { getAccounts, getSwapKit, supportedChains } from '@/lib/wallets'
import { useSwapStore } from '@/store/swap-store'
import { toast } from 'sonner'

export interface WalletAccount {
  address: string
  network: Chain
  provider: WalletOption
}

interface WalletState {
  accounts: WalletAccount[]
  selected?: WalletAccount
  connectedWallets: WalletOption[]
  hasHydrated: boolean

  select: (account?: WalletAccount) => void
  connect: (wallet: WalletOption, chains: Chain[], config?: any) => Promise<void>
  disconnect: (wallet: WalletOption) => void
  resolveSource: () => void
}

const swapKit = getSwapKit()

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      accounts: [],
      connectedWallets: [],
      selected: undefined,
      hasHydrated: false,

      select: (account?: WalletAccount) => {
        set({ selected: account })
      },

      connect: async (wallet: WalletOption, chains: Chain[], config?: any) => {
        try {
          const newAccounts = await getAccounts(wallet, chains, config)
          if (!newAccounts.length) {
            throw new Error(`Failed to get addresses for ${wallet}`)
          }

          set(state => {
            const filtered = state.accounts.filter(acc => acc.provider !== wallet)
            const accounts = [...filtered, ...newAccounts]
            const toSelect = resolveSelectedWallet(accounts, state.selected)

            return {
              accounts,
              selected: toSelect,
              connectedWallets: Array.from(new Set([...state.connectedWallets, wallet]))
            }
          })

          useSwapStore.getState().resolveDestination()
        } catch (err: any) {
          toast.error(err.message)
        }
      },

      disconnect: (wallet: WalletOption) => {
        supportedChains[wallet].forEach(chain => {
          swapKit.disconnectChain(chain)
        })

        set(state => {
          const accounts = state.accounts.filter(acc => acc.provider !== wallet)
          const wallets = state.connectedWallets.filter(w => w !== wallet)
          const toSelect = resolveSelectedWallet(accounts, state.selected)

          return {
            accounts,
            selected: toSelect,
            connectedWallets: wallets
          }
        })

        useSwapStore.getState().resolveDestination()
      },

      resolveSource: async () => {
        const { accounts, selected } = get()
        set({ selected: resolveSelectedWallet(accounts, selected) })
      }
    }),
    {
      name: 'thorswap-wallet-store',
      partialize: state => ({
        accounts: state.accounts,
        selected: state.selected,
        connectedWallets: state.connectedWallets
      }),
      onRehydrateStorage: () => async (state, error) => {
        if (error || !state) {
          return console.log(error)
        }

        Promise.allSettled(
          state.connectedWallets.map(w => {
            return getAccounts(w, supportedChains[w])
          })
        )
          .then(res => {
            const accounts = res.reduce(
              (a: WalletAccount[], v) => (v.status === 'fulfilled' ? [...v.value, ...a] : a),
              []
            )

            const { selected } = state
            const wallet = accounts.find(
              a =>
                a.provider === selected?.provider &&
                a.network === selected?.network &&
                (!selected.address || a.address === selected.address)
            )

            useWalletStore.setState({
              accounts,
              selected: wallet,
              connectedWallets: Array.from(new Set(accounts.map(w => w.provider)))
            })
            useSwapStore.getState().resolveDestination()
          })
          .finally(() => useWalletStore.setState({ hasHydrated: true }))
      }
    }
  )
)

useWalletStore.subscribe(state => {
  // todo
})

function resolveSelectedWallet(accounts: WalletAccount[], previous?: WalletAccount) {
  const { assetFrom } = useSwapStore.getState()

  const fromPrevious = accounts?.find(
    w => w.provider === previous?.provider && w.address === previous?.address && w.network === assetFrom?.chain
  )

  return fromPrevious ?? accounts?.find(a => a.network === assetFrom?.chain)
}

export const useAccounts = () => useWalletStore(state => state.accounts)
export const useConnectWallet = () => useWalletStore(state => state.connect)
export const useHasHydrated = () => useWalletStore(state => state.hasHydrated)
export const useDisconnect = () => useWalletStore(state => state.disconnect)
export const useConnectedWallets = () => useWalletStore(state => state.connectedWallets)
export const useSelectedAccount = () => useWalletStore(state => state.selected)
