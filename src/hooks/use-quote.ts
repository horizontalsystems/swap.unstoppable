import { AxiosError } from 'axios'
import { RefetchOptions, useQuery } from '@tanstack/react-query'
import { getSwapKitQuote } from '@/lib/api'
import { useAssetFrom, useAssetTo, useSwap } from '@/hooks/use-swap'
import { QuoteResponseRoute } from '@swapkit/api'

type UseQuote = {
  isLoading: boolean
  refetch: (options?: RefetchOptions) => void
  quote?: QuoteResponseRoute
  error: Error | null
}

export const useQuote = (): UseQuote => {
  const { valueFrom, slippage } = useSwap()
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()

  const queryKey = [
    'quote',
    valueFrom.toSignificant(),
    assetFrom?.asset,
    assetTo?.asset,
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
      if (!assetFrom?.asset || !assetTo?.asset) return

      return getSwapKitQuote(
        {
          buyAsset: assetTo.asset,
          sellAmount: valueFrom.toSignificant(),
          sellAsset: assetFrom.asset,
          affiliate: process.env.NEXT_PUBLIC_AFFILIATE,
          affiliateFee: Number(process.env.NEXT_PUBLIC_AFFILIATE_FEE),
          includeTx: false,
          slippage: slippage
        },
        signal
      )
    },
    enabled: !!(!valueFrom.eqValue(0) && assetFrom?.asset && assetTo?.asset),
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
