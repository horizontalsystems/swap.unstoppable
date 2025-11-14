import { AxiosError } from 'axios'
import { RefetchOptions, useQuery } from '@tanstack/react-query'
import { getQuotes } from '@/lib/api'
import { useAssetFrom, useAssetTo, useSlippage, useSwap } from '@/hooks/use-swap'
import { QuoteResponseRoute } from '@swapkit/helpers/api'

type UseQuote = {
  isLoading: boolean
  refetch: (options?: RefetchOptions) => void
  quote?: QuoteResponseRoute
  error: Error | null
}

export const useQuote = (): UseQuote => {
  const { valueFrom } = useSwap()
  const slippage = useSlippage()
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()

  const queryKey = [
    'quote',
    valueFrom.toSignificant(),
    assetFrom?.identifier,
    assetTo?.identifier,
    assetFrom?.chain,
    assetTo?.chain,
    slippage
  ]

  const {
    data: quote,
    refetch,
    isLoading,
    isRefetching,
    error
  } = useQuery({
    queryKey: queryKey,
    queryFn: ({ signal }) => {
      if (valueFrom.eqValue(0)) return
      if (!assetFrom?.identifier || !assetTo?.identifier) return

      return getQuotes(
        {
          buyAsset: assetTo.identifier,
          sellAmount: valueFrom.toSignificant(),
          sellAsset: assetFrom.identifier,
          affiliate: process.env.NEXT_PUBLIC_AFFILIATE,
          affiliateFee: Number(process.env.NEXT_PUBLIC_AFFILIATE_FEE),
          includeTx: false,
          slippage: slippage ?? 99
        },
        signal
      ).then(quotes => {
        return (
          quotes.find((q: any) => q.providers[0] === 'THORCHAIN_STREAMING') ||
          quotes.find((q: any) => q.providers[0] === 'THORCHAIN') ||
          quotes[0]
        )
      })
    },
    enabled: !!(!valueFrom.eqValue(0) && assetFrom?.identifier && assetTo?.identifier),
    retry: false,
    refetchOnMount: false
  })

  let newError = error
  if (error instanceof AxiosError) {
    const errors = error.response?.data?.providerErrors
    if (errors && errors[0]?.message) {
      newError = new Error(errors[0]?.message)
    } else {
      newError = new Error(error.response?.data?.message || error.message)
    }
  }

  return {
    isLoading: isLoading || isRefetching,
    refetch,
    quote: isLoading || isRefetching || error ? undefined : quote,
    error: newError
  }
}
