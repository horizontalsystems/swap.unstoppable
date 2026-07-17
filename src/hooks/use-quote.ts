import { RefetchOptions, useQuery } from '@tanstack/react-query'
import { USwapNumber } from '@uswap/core'
import { AppConfig } from '@/config'
import { useAssetFrom, useAssetTo, useSlippage, useSwap } from '@/hooks/use-swap'
import { getRate, parseApiError } from '@/lib/api'
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

  const appProviders = AppConfig.providers
  let supportedProviders = assetFrom?.providers?.filter(p => assetTo?.providers?.includes(p)) ?? []
  if (appProviders) {
    supportedProviders = supportedProviders.filter(p => appProviders.includes(p))
  }
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

      return getRate(
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
    enabled: !!(!valueFrom.eqValue(0) && assetFrom?.identifier && assetTo?.identifier && providers.length),
    retry: false,
    refetchOnMount: false
  })

  const newError = error && parseApiError(error)

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
