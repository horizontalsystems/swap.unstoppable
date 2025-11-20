import { useQueries } from '@tanstack/react-query'
import { isTxPending, usePendingTxs, useSetTxDetails, useSetTxUnknown } from '@/store/transaction-store'
import { getSwapKitTrack } from '@/lib/api'
import { getChainConfig } from '@swapkit/core'
import { AxiosError } from 'axios'

export const useSyncTransactions = () => {
  const pendingTxs = usePendingTxs()
  const setTransactionDetails = useSetTxDetails()
  const setTransactionUnknown = useSetTxUnknown()

  const queries = pendingTxs.map(item => {
    return {
      queryKey: ['transaction', item.hash],
      enabled: item.status != 'unknown' && (!item.details || isTxPending(item.status)),
      retry: true,
      retryDelay: 5_000,
      queryFn: () =>
        getSwapKitTrack({
          hash: item.hash,
          chainId: getChainConfig(item.assetFrom.chain).chainId,
          fromAsset: item.assetFrom.identifier,
          fromAddress: item.addressFrom,
          fromAmount: item.amountFrom,
          toAsset: item.assetTo.identifier,
          toAddress: item.addressTo,
          toAmount: item.amountTo,
          depositAddress: item.addressDeposit
        })
          .then(data => {
            setTransactionDetails(item.hash, data)
            return data
          })
          .catch(error => {
            if (error instanceof AxiosError && error.response?.data?.error === 'txLogsParsingError') {
              setTransactionUnknown(item.hash)
              return null
            }

            throw error
          })
    }
  })

  useQueries({ queries })
}
