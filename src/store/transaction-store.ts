import type { RouteTracking } from 'stellar-web-sdk'
import { AppProviderName, TrackResponse, TxStatus } from '@/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { Asset } from '@/components/swap/asset'

export type { TxStatus }

export interface Transaction {
  uid: string
  provider: AppProviderName
  // the /swap route uuid used for tracking; absent on pre-v2 records
  uuid?: string
  /**
   * Stellar swaps are tracked client-side by stellar-web-sdk, not by the aggregator's /track. The
   * SDK's own uuid registry is in-memory and empty after a refresh, so the route's tracking handle
   * is persisted here instead — this field is what makes tracking survive a page reload.
   */
  stellarTracking?: RouteTracking
  /**
   * Every transaction a StellarBroker session signed, in order. `hash` is the LAST of these, which
   * is the one least likely to have landed — a session that dies mid-flight typically leaves its
   * final signature unsubmitted while earlier ones already moved funds. Without the full list those
   * transactions would be recorded nowhere and the explorer link would point at a 404.
   */
  stellarSignedHashes?: string[]
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

/** The larger of two decimal strings, keeping `current` when the other is absent or unparseable. */
const maxAmount = (current: string, settled?: string): string => {
  if (settled === undefined) return current
  const [a, b] = [Number(current), Number(settled)]
  if (!Number.isFinite(a) || !Number.isFinite(b)) return current
  return b > a ? settled : current
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
                // A StellarBroker session fills across several transactions, and the tracker sums
                // one hash — its own docs call that a lower bound, not the full fill. Overwriting
                // with it would understate what the user actually received, so the estimate stands
                // unless the settled figure is genuinely higher.
                const partialRead = item.provider === 'STELLARBROKER' && (item.stellarSignedHashes?.length ?? 0) > 1

                tx.amountFrom = data.fromAmount ?? tx.amountFrom
                tx.amountTo = partialRead ? maxAmount(tx.amountTo, data.toAmount) : (data.toAmount ?? tx.amountTo)
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
/**
 * How long a Stellar in-chain swap may sit un-findable on-chain before we stop waiting.
 *
 * Generous next to Stellar's ~5s ledger close. Stellar has no mempool — a transaction is included
 * in a ledger or it never will be, and StellarBroker's transactions carry a max-ledger bound — so
 * this is the point at which "not on-chain yet" stops being plausible, not the point at which
 * confirmation is expected.
 *
 * This reasoning is about a single Stellar ledger and does NOT extend to a bridge (see below).
 */
export const STELLAR_STALL_MS = 3 * 60_000

/**
 * The same for AXELAR_ITS, which is a different kind of wait entirely: funds leave Stellar and two
 * Axelar hub hops have to execute before they arrive. Routinely minutes, and legitimately longer
 * when the network is congested — so it gets hours, not minutes.
 */
export const AXELAR_STALL_MS = 6 * 60 * 60_000

/**
 * Statuses that mean "we cannot see this on-chain at all". Only these can stall out.
 *
 * `swapping` and `action_required` must never stall: both mean the provider has acknowledged the
 * swap and it is in flight. `action_required` on an Axelar transfer specifically means the funds
 * have left the source chain with no refund path and are awaiting manual recovery — giving up on
 * polling there would hide a stuck transfer that still needs the user's attention.
 */
const STALLABLE_STATUSES = new Set(['pending', 'not_started'])

/** True when a Stellar swap has gone unfindable for long enough that it is not coming. */
export const isStellarTrackingStalled = (status: string, timestamp: Date | string | number, provider?: string, now = Date.now()): boolean => {
  if (!STALLABLE_STATUSES.has(status)) return false
  const budget = provider === 'AXELAR_ITS' ? AXELAR_STALL_MS : STELLAR_STALL_MS
  return now - new Date(timestamp).getTime() > budget
}

export const isTxTerminal = (status: string) => status === 'completed' || status === 'failed' || status === 'expired' || status === 'refunded'

export const usePendingTransactions = () =>
  transactionStore(useShallow(state => state.transactions.filter(t => isTxPending(t.status) || (!t.details && !isTxTerminal(t.status)))))
