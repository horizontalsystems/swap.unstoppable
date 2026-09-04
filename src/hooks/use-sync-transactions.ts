import { useQueries } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { getTrack } from '@/lib/api'
import { trackStellarRoute } from '@/lib/stellar/execute'
import { logTracking } from '@/lib/stellar/log'
import {
  isStellarTrackingStalled,
  isTxPending,
  isTxTerminal,
  usePendingTransactions,
  useSetTransactionDetails,
  useSetTransactionStatus
} from '@/store/transaction-store'

export const useSyncTransactions = () => {
  const pendingTransactions = usePendingTransactions()
  const setTransactionDetails = useSetTransactionDetails()
  const setTransactionStatus = useSetTransactionStatus()

  const queries = pendingTransactions.map(tx => {
    return {
      queryKey: ['transaction', tx.uid],
      enabled: isTxPending(tx.status) || (!tx.details && !isTxTerminal(tx.status)),
      refetchInterval: 5_000,
      refetchIntervalInBackground: false,
      queryFn: () => {
        if (tx.qrCodeData && !tx.hash && tx.status === 'not_started' && (!tx.expiration || tx.expiration < new Date().getTime() / 1000)) {
          setTransactionStatus(tx.uid, 'expired')
          return null
        }

        // Stellar swaps never went through the aggregator, so /track knows nothing about them —
        // they are read from Horizon (or Axelarscan) via the persisted tracking handle.
        const stellarTracking = tx.stellarTracking
        if (stellarTracking) {
          return trackStellarRoute(stellarTracking, tx.hash)
            .then(data => {
              // A hash Horizon still cannot see after the stall window is not arriving, and
              // polling it forever leaves the row spinning on a swap that already resolved.
              if (isStellarTrackingStalled(data.status, tx.timestamp, stellarTracking.provider)) {
                // 'unknown', not 'failed'. A broker session's tracking hash is the LAST of up to
                // five it signed; earlier ones may have landed and filled part of the order, so
                // declaring the swap failed could hide value that actually moved. The explorer
                // link on the row is how the user settles it.
                setTransactionDetails(tx.uid, { ...data, status: 'unknown' })
                return data
              }

              // Only on a change. The loop polls every 5s and most ticks report the same status;
              // logging each one would bury the transitions that actually say what happened.
              if (data.status !== tx.status) {
                logTracking({
                  provider: stellarTracking.provider,
                  pair: `${tx.assetFrom.identifier}->${tx.assetTo.identifier}`,
                  status: data.status,
                  hash: tx.hash,
                  legs: data.legs?.map(leg => ({ type: leg.type, status: leg.status }))
                })
              }
              setTransactionDetails(tx.uid, data)
              return data
            })
            .catch(() => {
              // A swap is often not visible on-chain for a ledger or two after broadcast; keep
              // polling rather than marking it unknown on the first miss.
              return null
            })
        }

        // pre-v2 records have no uuid and can no longer be tracked
        if (!tx.uuid) {
          setTransactionDetails(tx.uid, { status: 'unknown' })
          return null
        }

        return getTrack({ uuid: tx.uuid, inboundTxHash: tx.hash })
          .then(data => {
            setTransactionDetails(tx.uid, data)
            return data
          })
          .catch(error => {
            if (error instanceof AxiosError) {
              // 409 — not trackable yet, keep polling
              if (error.response?.status === 409) return null

              if (error.response?.data?.error === 'txLogsParsingError') {
                setTransactionStatus(tx.uid, 'unknown')
                return null
              }
            }

            throw error
          })
      }
    }
  })

  useQueries({ queries })
}
