import { RefetchOptions, useQuery } from '@tanstack/react-query'
import { USwapNumber } from '@uswap/core'
import { USwapError } from '@uswap/helpers'
import { useAssetFrom, useAssetTo, useSlippage, useSwap } from '@/hooks/use-swap'
import { getQuotes } from '@/lib/api'
import { useIsLimitSwap } from '@/store/limit-swap-store'
import { useQuoteStore } from '@/store/quote-store'
import { ProviderName, QuoteResponseRoute } from '@/types'

type UseQuote = {
  isLoading: boolean
  refetch: (options?: RefetchOptions) => void
  quote?: QuoteResponseRoute
  quotes: QuoteResponseRoute[]
  selectedIndex: number
  setSelectedIndex: (index: number) => void
  error: Error | null
}

export const useQuote = (): UseQuote => {
  const { valueFrom } = useSwap()
  const { selectedIndex, setSelectedIndex, resetSelectedIndex } = useQuoteStore()
  const slippage = useSlippage()
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const isLimitSwap = useIsLimitSwap()

  const supportedProviders = assetFrom?.providers.filter(p => assetTo?.providers.includes(p)) ?? []
  const providers = isLimitSwap ? [ProviderName.THORCHAIN] : supportedProviders

  const queryKey = [
    'quote',
    valueFrom.toSignificant(),
    assetFrom?.identifier,
    assetTo?.identifier,
    assetFrom?.chain,
    assetTo?.chain,
    slippage,
    isLimitSwap,
    providers.join(',')
  ]

  const {
    data: quotes,
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
          providers
        },
        signal
      ).then(routes => {
        resetSelectedIndex()
        return [...routes].sort((a, b) => {
          const bAmount = new USwapNumber(b.expectedBuyAmount)
          const aAmount = new USwapNumber(a.expectedBuyAmount)
          return bAmount.gt(aAmount) ? 1 : bAmount.lt(aAmount) ? -1 : 0
        })
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

  const ready = !(isLoading || isRefetching || error)
  const allQuotes = ready && quotes ? quotes : []
  const quote = allQuotes[selectedIndex] ?? allQuotes[0]

  return {
    isLoading: isLoading || isRefetching,
    refetch,
    quote: ready ? quote : undefined,
    quotes: allQuotes,
    selectedIndex,
    setSelectedIndex,
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
