import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { Asset } from '@/components/swap/asset'

interface Transaction {
  chainId: string
  hash: string
  timestamp: Date
  assetFrom: Asset
  assetTo: Asset
  amountFrom: string
  amountTo: string
  addressFrom: string
  addressTo: string
  addressDeposit: string
  status: 'not_started' | 'pending' | 'swapping' | 'completed' | 'failed' | 'refunded' | 'unknown'
  details?: any
}

interface TransactionStore {
  transactions: Transaction[]
  setTransaction: (tx: Transaction) => void
  setTransactions: (txs: Transaction[]) => void
  setTransactionDetails: (hash: string, data: any) => void
  setTransactionUnknown: (hash: string) => void
  showPendingAlert: boolean
  setPendingAlert: (show: boolean) => void
}

export const transactionStore = create<TransactionStore>()(
  persist(
    set => ({
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

      setTransactions: transactions => {
        set(state => {
          const newTransactions = transactions.filter(tx => !state.transactions.find(d => d.hash === tx.hash))
          if (!newTransactions.length) return state

          return {
            ...state,
            transactions: [...state.transactions, ...newTransactions]
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

              const tx = {
                ...item,
                status: data.status,
                details: data
              }

              if (data.status === 'completed') {
                tx.amountFrom = data.fromAmount
                tx.amountTo = data.toAmount
              }

              return tx
            })
          }
        })
      },

      setTransactionUnknown: hash => {
        set(state => {
          return {
            transactions: state.transactions.map(item => {
              if (item.hash !== hash) {
                return item
              }

              return {
                ...item,
                status: 'unknown'
              }
            })
          }
        })
      },

      showPendingAlert: false,

      setPendingAlert: (show: boolean) => set(state => ({ ...state, showPendingAlert: show }))
    }),
    {
      name: 'transactions',
      version: 2
    }
  )
)

const sortedTransactions = (state: TransactionStore) =>
  state.transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

export const useShowPendingAlert = () => transactionStore(state => state.showPendingAlert)
export const useSetPendingAlert = () => transactionStore(state => state.setPendingAlert)
export const useSetTxDetails = () => transactionStore(state => state.setTransactionDetails)
export const useSetTxUnknown = () => transactionStore(state => state.setTransactionUnknown)
export const usePendingTxs = () =>
  transactionStore(useShallow(state => state.transactions.filter(t => !t.details || t.status === 'pending')))

export const useTransactions = () => transactionStore(sortedTransactions)
export const useLastPendingTx = () =>
  transactionStore(state => sortedTransactions(state).find(t => t.status === 'pending'))
