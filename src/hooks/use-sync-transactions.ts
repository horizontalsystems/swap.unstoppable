import { useQueries } from '@tanstack/react-query'
import { usePendingTxs, useSetTxDetails } from '@/store/transaction-store'
import { getTransaction } from '@/lib/api'

export const useSyncTransactions = () => {
  const pendingTxs = usePendingTxs()
  const setTransactionDetails = useSetTxDetails()

  const queries = pendingTxs.map(item => {
    return {
      queryKey: ['transaction', item.hash],
      enabled: item.status === 'pending',
      refetchInterval: 5_000, // every 5s
      queryFn: () =>
        getTransaction(item.hash).then(data => {
          setTransactionDetails(item.hash, data)
          return data
        })
    }
  })

  useQueries({ queries })
}
