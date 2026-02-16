import { useQueries } from '@tanstack/react-query'
import { getChainConfig } from '@uswap/core'
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
        if (!tx.hash && tx.status === 'not_started' && (!tx.expiration || tx.expiration < new Date().getTime() / 1000)) {
          setTransactionStatus(tx.uid, 'expired')
          return null
        }

        return getTrack({
          provider: tx.provider,
          providerSwapId: tx.providerSwapId,
          hash: tx.hash,
          chainId: getChainConfig(tx.assetFrom.chain).chainId,
          fromAsset: tx.assetFrom.identifier,
          fromAddress: tx.addressFrom || '',
          fromAmount: tx.amountFrom,
          toAsset: tx.assetTo.identifier,
          toAddress: tx.addressTo,
          toAmount: tx.amountTo,
          depositAddress: tx.addressDeposit
        })
          .then(data => {
            setTransactionDetails(tx.uid, data)
            return data
          })
          .catch(error => {
            if (error instanceof AxiosError && error.response?.data?.error === 'txLogsParsingError') {
              setTransactionStatus(tx.uid, 'unknown')
              return null
            }

            throw error
          })
      }
    }
  })

  useQueries({ queries })
}
