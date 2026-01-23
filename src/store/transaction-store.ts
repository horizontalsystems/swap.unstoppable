import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { Asset } from '@/components/swap/asset'
import { ProviderName } from '@uswap/helpers'

export type TxStatus =
  | 'not_started'
  | 'pending'
  | 'swapping'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'refunded'
  | 'unknown'

interface Transaction {
  uid: string
  provider: ProviderName
  chainId: string
  hash?: string
  timestamp: Date
  estimatedTime?: number
  assetFrom: Asset
  assetTo: Asset
  amountFrom: string
  amountTo: string
  addressFrom?: string
  addressTo: string
  addressDeposit?: string
  status: TxStatus
  details?: any
  qrCodeData?: string
  expiration?: number
}

interface TransactionStore {
  transactions: Transaction[]
  setTransaction: (tx: Transaction) => void
  setTransactionDetails: (uid: string, data: any) => void
  setTransactionStatus: (uid: string, status: TxStatus) => void
}

export const transactionStore = create<TransactionStore>()(
  persist(
    set => ({
      transactions: [],

      setTransaction: transaction => {
        set(state => {
          const exists = state.transactions.find(d => d.uid === transaction.uid)
          if (exists) return state

          return {
            transactions: [...state.transactions, transaction],
            showPendingAlert: true
          }
        })
      },

      setTransactionDetails: (uid, data: any) => {
        set(state => {
          return {
            transactions: state.transactions.map(item => {
              if (item.uid !== uid) {
                return item
              }

              const tx = {
                ...item,
                status: data.status,
                hash: data.hash,
                addressFrom: data.fromAddress,
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

      setTransactionStatus: (uid, status) => {
        set(state => {
          return {
            transactions: state.transactions.map(item => {
              if (item.uid !== uid) {
                return item
              }

              return {
                ...item,
                status: status
              }
            })
          }
        })
      }
    }),
    {
      name: 'transactions',
      version: 3
    }
  )
)

const sortedTransactions = (state: TransactionStore) =>
  state.transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

export const useSetTransaction = () => transactionStore(state => state.setTransaction)
export const useSetTransactionDetails = () => transactionStore(state => state.setTransactionDetails)
export const useSetTransactionStatus = () => transactionStore(state => state.setTransactionStatus)
export const useTransactions = () => transactionStore(sortedTransactions)
export const useHasTransactions = () => transactionStore(state => state.transactions.length > 0)

export const isTxPending = (status: string) => status === 'not_started' || status === 'swapping' || status === 'pending'
export const usePendingTransactions = () =>
  transactionStore(useShallow(state => state.transactions.filter(t => !t.details || isTxPending(t.status))))
