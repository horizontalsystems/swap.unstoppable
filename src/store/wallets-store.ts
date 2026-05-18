import { Chain, WalletOption } from '@uswap/core'
import { toast } from 'sonner'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getAccounts, getUSwap, supportedChains } from '@/lib/wallets'

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
  externalWalletMode: boolean

  select: (account?: WalletAccount) => void
  connect: (wallet: WalletOption, chains: Chain[], config?: any) => Promise<void>
  disconnect: (wallet: WalletOption) => void
  setExternalWalletMode: (enabled: boolean) => void
}

export const useWalletStore = create<WalletState>()(
  persist(
    set => ({
      accounts: [],
      connectedWallets: [],
      selected: undefined,
      hasHydrated: false,
      externalWalletMode: false,

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
            const replacedChains = new Set(newAccounts.map(a => a.network))
            const filtered = state.accounts.filter(acc => acc.provider !== wallet || !replacedChains.has(acc.network))
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

      setExternalWalletMode: (enabled: boolean) => {
        set({ externalWalletMode: enabled })
      },

      disconnect: (wallet: WalletOption) => {
        const uSwap = getUSwap()
        supportedChains[wallet].forEach(chain => {
          uSwap.disconnectChain(chain)
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
      name: 'uw-wallet-store',
      version: 1,
      partialize: state => ({
        accounts: state.accounts,
        selected: state.selected,
        connectedWallets: state.connectedWallets,
        externalWalletMode: state.externalWalletMode
      }),
      onRehydrateStorage: () => async (state, error) => {
        if (error || !state) {
          console.log(error)
          useWalletStore.setState({ hasHydrated: true })
          return
        }

        Promise.allSettled(
          (state.accounts ?? []).map(w => {
            return getAccounts(w.provider, [w.network])
          })
        )
          .then(res => {
            const accounts = res.reduce((a: WalletAccount[], v) => (v.status === 'fulfilled' ? [...v.value, ...a] : a), [])

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
