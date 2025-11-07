import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Chain, WalletOption } from '@swapkit/core'
import { getAccounts, getSwapKit, supportedChains } from '@/lib/wallets'
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

            return {
              accounts,
              connectedWallets: Array.from(new Set([...state.connectedWallets, wallet]))
            }
          })
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

          return {
            accounts,
            connectedWallets: wallets
          }
        })
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
          state.accounts.map(w => {
            return getAccounts(w.provider, [w.network])
          })
        )
          .then(res => {
            const accounts = res.reduce(
              (a: WalletAccount[], v) => (v.status === 'fulfilled' ? [...v.value, ...a] : a),
              []
            )

            useWalletStore.setState({
              accounts,
              connectedWallets: Array.from(new Set(accounts.map(w => w.provider)))
            })
          })
          .finally(() => useWalletStore.setState({ hasHydrated: true }))
      }
    }
  )
)

useWalletStore.subscribe(state => {
  // todo
})

export const useAccounts = () => useWalletStore(state => state.accounts)
export const useConnectWallet = () => useWalletStore(state => state.connect)
export const useHasHydrated = () => useWalletStore(state => state.hasHydrated)
export const useDisconnect = () => useWalletStore(state => state.disconnect)
export const useConnectedWallets = () => useWalletStore(state => state.connectedWallets)
export const useSelectedAccount = () => useWalletStore(state => state.selected)
