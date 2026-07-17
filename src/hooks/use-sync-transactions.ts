import { useQueries } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { getTrack } from '@/lib/api'
import { isTxPending, isTxTerminal, usePendingTransactions, useSetTransactionDetails, useSetTransactionStatus } from '@/store/transaction-store'

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
