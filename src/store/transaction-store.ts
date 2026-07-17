import { ProviderName, TrackResponse, TxStatus } from '@/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { Asset } from '@/components/swap/asset'

export type { TxStatus }

export interface Transaction {
  uid: string
  provider: ProviderName
  // the /swap route uuid used for tracking; absent on pre-v2 records
  uuid?: string
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
  limitSwapMemo?: string
  txExtraAttribute?: any
}

interface TransactionStore {
  transactions: Transaction[]
  setTransaction: (tx: Transaction) => void
  setTransactionDetails: (uid: string, data: TrackResponse) => void
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

      setTransactionDetails: (uid, data: TrackResponse) => {
        set(state => {
          return {
            transactions: state.transactions.map(item => {
              if (item.uid !== uid) {
                return item
              }

              const tx = {
                ...item,
                status: data.status,
                hash: data.hash ?? item.hash,
                addressFrom: data.fromAddress ?? item.addressFrom,
                details: data
              }

              if (data.status === 'completed') {
                tx.amountFrom = data.fromAmount ?? tx.amountFrom
                tx.amountTo = data.toAmount ?? tx.amountTo
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
      name: 'uw-transaction-store',
      version: 1
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

// action_required is non-terminal — the provider may still resolve it, keep polling
export const isTxPending = (status: string) =>
  status === 'not_started' || status === 'swapping' || status === 'pending' || status === 'action_required'
export const isTxTerminal = (status: string) => status === 'completed' || status === 'failed' || status === 'expired' || status === 'refunded'

export const usePendingTransactions = () =>
  transactionStore(useShallow(state => state.transactions.filter(t => isTxPending(t.status) || (!t.details && !isTxTerminal(t.status)))))
