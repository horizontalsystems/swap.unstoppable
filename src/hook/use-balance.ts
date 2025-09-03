import { create } from 'zustand'
import { Network } from 'rujira.js'
import { BalanceFetcher } from '@/wallets/balances'

interface BalancesState {
  balances: Record<string, bigint | undefined>
  syncing: Record<string, boolean | undefined>
  syncBalance: (network: Network, address: string, asset: string, force?: boolean) => void
  reset: () => void
}

export const balanceKey = (network?: Network, address?: string, asset?: string) => {
  return `${network}:${address}:${asset}`
}

export const useBalancesStore = create<BalancesState>()((set, get) => ({
  balances: {},
  syncing: {},

  syncBalance: async (network, address, asset, force = false) => {
    const key = balanceKey(network, address, asset)
    const { balances, syncing } = get()

    if (syncing[key]) return
    if (!force && balances[key] !== undefined) return

    set(state => ({
      syncing: { ...state.syncing, [key]: true }
    }))

    try {
      const result = await BalanceFetcher.fetch({ network, address, asset })
      set(state => ({
        balances: { ...state.balances, [key]: result }
      }))
    } catch (e) {
      console.log(`Failed to fetch balance for ${key}`, e)
    } finally {
      set(state => ({
        syncing: { ...state.syncing, [key]: false }
      }))
    }
  },

  reset: () => set({ balances: {}, syncing: {} })
}))

export const useBalance = (key: string) => useBalancesStore(state => state.balances[key])
export const useSyncing = (key: string) => useBalancesStore(state => state.syncing[key])
export const useSyncBalance = () => useBalancesStore(state => state.syncBalance)
