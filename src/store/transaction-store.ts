import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { Asset } from '@/components/swap/asset'

interface Transaction {
  hash: string
  timestamp: Date
  fromAsset?: Asset
  toAsset?: Asset
  fromAmount?: string
  toAmount?: string
  status?: 'pending' | 'completed' | 'failed' | 'refunded'
  details?: any
}

interface TransactionStore {
  transactions: Transaction[]
  setTransaction: (tx: Transaction) => void
  setTransactionDetails: (hash: string, data: any) => void
  showPendingAlert: boolean
  setPendingAlert: (show: boolean) => void
}

export const transactionStore = create<TransactionStore>()(
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

      setTransactionDetails: (hash, data: any) => {
        set(state => {
          return {
            transactions: state.transactions.map(item => {
              if (item.hash !== hash) {
                return item
              }

              const stages = data?.stages
              const outboundSigned = stages?.outbound_signed

              let status = item.status
              if (outboundSigned?.completed) {
                status = 'completed'
              }

              return {
                ...item,
                status,
                details: data
              }
            })
          }
        })
      },

      showPendingAlert: false,

      setPendingAlert: (show: boolean) => set(state => ({ ...state, showPendingAlert: show }))
    }),
    {
      name: 'thorswap-transactions'
    }
  )
)

const sortedTransactions = (state: TransactionStore) =>
  state.transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

export const useShowPendingAlert = () => transactionStore(state => state.showPendingAlert)
export const useSetPendingAlert = () => transactionStore(state => state.setPendingAlert)
export const useSetTxDetails = () => transactionStore(state => state.setTransactionDetails)
export const usePendingTxs = () =>
  transactionStore(useShallow(state => state.transactions.filter(t => t.status === 'pending')))

export const useTransactions = () => transactionStore(sortedTransactions)
export const useLastPendingTx = () =>
  transactionStore(state => sortedTransactions(state).find(t => t.status === 'pending'))
