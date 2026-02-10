import { RefetchOptions, useQuery } from '@tanstack/react-query'
import { USwapNumber } from '@uswap/core'
import { ProviderName, USwapError } from '@uswap/helpers'
import { QuoteResponseRoute } from '@uswap/helpers/api'
import { AppConfig } from '@/config'
import { useAssetFrom, useAssetTo, useSlippage, useSwap } from '@/hooks/use-swap'
import { getQuotes } from '@/lib/api'

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

  const queryKey = ['quote', valueFrom.toSignificant(), assetFrom?.identifier, assetTo?.identifier, assetFrom?.chain, assetTo?.chain, slippage]

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
          sellAsset: assetFrom.identifier,
          sellAmount: valueFrom.toSignificant(),
          slippage: slippage ?? 99,
          providers: AppConfig.providers
        },
        createAbortController(signal)
      ).then(quotes => {
        if (AppConfig.id === 'thorchain') {
          const thorchainQuote =
            quotes.find(q => q.providers[0] === ProviderName.THORCHAIN_STREAMING) || quotes.find(q => q.providers[0] === ProviderName.THORCHAIN)

          if (thorchainQuote) {
            return thorchainQuote
          }
        }

        return quotes.reduce((best, current) =>
          new USwapNumber(current.expectedBuyAmount).gt(new USwapNumber(best.expectedBuyAmount)) ? current : best
        )
      })
    },
    enabled: !!(!valueFrom.eqValue(0) && assetFrom?.identifier && assetTo?.identifier),
    retry: false,
    refetchOnMount: false
  })

  let newError = error
  if (error instanceof USwapError) {
    const cause = error.cause as any
    const errors = cause.errorData?.providerErrors
    if (errors && errors.length) {
      newError = new Error(errors[0]?.message || errors[0]?.error)
    } else if (cause.errorData?.error) {
      newError = new Error(cause.errorData?.error)
    }
  }

  return {
    isLoading: isLoading || isRefetching,
    refetch,
    quote: isLoading || isRefetching || error ? undefined : quote,
    error: newError
  }
}

function createAbortController(signal: AbortSignal) {
  const controller = new AbortController()
  if (signal.aborted) {
    controller.abort()
  } else {
    signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  return controller
}
