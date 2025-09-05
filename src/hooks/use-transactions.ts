import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getTxStatus } from '@/lib/api'
import { Asset } from '@/components/swap/asset'

export interface Transaction {
  hash: string
  timestamp: Date
  fromAsset?: Asset & {
    price?: string | null | undefined
  }
  toAsset?: Asset & {
    price?: string | null | undefined
  }
  fromAmount?: string
  toAmount?: string
  status?: 'pending' | 'succeeded' | 'failed' | 'refunded'
  details?: any
}

interface TransactionStore {
  transactions: Transaction[]
  setTransaction: (tx: Transaction) => void
  clearTransaction: (hash: string) => void
  clearTransactions: () => void
  syncTransaction: (hash: string) => Promise<void>
  syncPending: () => Promise<void>
  showPendingAlert: boolean
  setPendingAlert: (show: boolean) => void
}

export const useTransactions = create<TransactionStore>()(
  persist(
    (set, get) => ({
      transactions: [],

      setTransaction: transaction => {
        set(state => {
          const exists = state.transactions.find(d => d.hash === transaction.hash)
          if (exists) return state

          return {
            transactions: [...state.transactions, transaction],
            showPendingAlert: true
          }
        })
      },

      clearTransaction: hash =>
        set(state => ({
          transactions: state.transactions.filter(d => d.hash !== hash)
        })),

      clearTransactions: () => set({ transactions: [] }),

      syncTransaction: async (hash: string) => {
        await getTxStatus(hash).then(data => {
          set(state => ({
            transactions: state.transactions.map(d => {
              if (d.hash !== hash) {
                return d
              }

              const stages = data?.stages

              let status = 'pending'
              if (stages?.swap_finalised?.completed) {
                status = 'succeeded'
              }

              return {
                ...d,
                status: status,
                details: data
              } as Transaction
            })
          }))
        })
      },

      syncPending: async () => {
        const { transactions, syncTransaction } = get()
        const pending = transactions.filter(d => d.status === 'pending')
        await Promise.all(pending.map(d => syncTransaction(d.hash)))
      },

      showPendingAlert: false,

      setPendingAlert: (show: boolean) =>
        set(state => ({
          ...state,
          showPendingAlert: show
        }))
    }),
    {
      name: 'thorswap-transactions'
    }
  )
)
