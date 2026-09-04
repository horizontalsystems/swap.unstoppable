import { useMemo } from 'react'
import { RefetchOptions, useQuery } from '@tanstack/react-query'
import { USwapNumber } from '@uswap/core'
import { AppConfig } from '@/config'
import { useAssetFrom, useAssetTo, useSlippage, useSwap } from '@/hooks/use-swap'
import { getRate, parseApiError } from '@/lib/api'
import { aggregatorExcludedProviders } from '@/lib/stellar/asset-list'
import { useStellarQuote } from '@/hooks/use-stellar-quote'
import { useIsLimitSwap } from '@/store/limit-swap-store'
import { useQuoteStore } from '@/store/quote-store'
import { ProviderName, QuoteResponseRoute } from '@/types'

const NO_ROUTES: QuoteResponseRoute[] = []

const byExpectedBuyAmount = (a: QuoteResponseRoute, b: QuoteResponseRoute) => {
  const bAmount = new USwapNumber(b.expectedBuyAmount)
  const aAmount = new USwapNumber(a.expectedBuyAmount)
  return bAmount.gt(aAmount) ? 1 : bAmount.lt(aAmount) ? -1 : 0
}

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
  const { valueFrom, exactAmountFrom } = useSwap()
  const { selectedIndex, setSelectedIndex, resetSelectedIndex } = useQuoteStore()
  const slippage = useSlippage()
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const isLimitSwap = useIsLimitSwap()
  const stellar = useStellarQuote()

  const appProviders = AppConfig.providers
  let supportedProviders = assetFrom?.providers?.filter(p => assetTo?.providers?.includes(p)) ?? []
  if (appProviders) {
    supportedProviders = supportedProviders.filter(p => appProviders.includes(p))
  }
  // The Stellar venues are quoted client-side by stellar-web-sdk (useStellarQuote below). The
  // aggregator also carries them, so asking it too would list the same venue twice.
  const excluded = aggregatorExcludedProviders(assetFrom?.chain, assetFrom?.ticker)
  const aggregatorProviders = supportedProviders.filter((p): p is ProviderName => !excluded.has(p))
  const providers = isLimitSwap ? [ProviderName.THORCHAIN] : aggregatorProviders

  const queryKey = [
    'quote',
    exactAmountFrom,
    assetFrom?.identifier,
    assetTo?.identifier,
    assetFrom?.chain,
    assetTo?.chain,
    slippage,
    isLimitSwap,
    providers.join(',')
  ]

  const {
    data: rate,
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
          sellAmount: exactAmountFrom,
          slippage: slippage ?? 99,
          providers
        },
        signal
      ).then(result => {
        resetSelectedIndex()
        return { ...result, routes: [...result.routes].sort(byExpectedBuyAmount) }
      })
    },
    enabled: !!(!valueFrom.eqValue(0) && assetFrom?.identifier && assetTo?.identifier && providers.length),
    retry: false,
    refetchOnMount: false
  })

  const aggregatorError = error && parseApiError(error)
  const stellarError = stellar.error && parseApiError(stellar.error)

  const aggregatorQuotes = !(isLoading || isRefetching || error) && rate ? rate.routes : NO_ROUTES
  const stellarQuotes = !(stellar.isLoading || stellar.error) ? stellar.routes : NO_ROUTES

  // Both sources rank by the same rule — most received wins — so they merge into one list and
  // re-sort together rather than being shown as separate groups.
  //
  // Deduplicated by venue on the way in. The aggregator carries the Stellar venues too, and while
  // they are withheld from its request per pair, that is a filter on the way out and this is the
  // invariant on the way back: a venue is one route. The route list already relies on it — it keys
  // rows by `providers[0]` — so a duplicate would collide there rather than render honestly.
  const allQuotes = useMemo(() => {
    if (!stellarQuotes.length) return aggregatorQuotes

    const bestByVenue = new Map<string, QuoteResponseRoute>()
    for (const route of [...aggregatorQuotes, ...stellarQuotes]) {
      // Keyed on providers[0] to match how the route list renders rows — deduping on the joined
      // array would let two multi-provider routes sharing a lead venue collide there instead.
      const venue = route.providers[0]
      const existing = bestByVenue.get(venue)
      // Keep whichever quote pays more, so deduplication never costs the user the better price.
      if (!existing || byExpectedBuyAmount(existing, route) > 0) bestByVenue.set(venue, route)
    }

    return Array.from(bestByVenue.values()).sort(byExpectedBuyAmount)
  }, [aggregatorQuotes, stellarQuotes])

  // A stale index from a previous pair would leave the badge and the card disagreeing.
  const index = selectedIndex < allQuotes.length ? selectedIndex : 0
  const isLoadingAny = isLoading || isRefetching || stellar.isLoading

  // One source failing is not a failed quote: if the other answered, there are routes to pick from.
  // Surface an error only when nothing came back at all.
  const noRoutes = !isLoadingAny && !allQuotes.length

  // With no routes anywhere, the provider's own reason is the useful message — "Pair not
  // supported" says more than a generic failure. It is only surfaced here, never when some other
  // venue did answer.
  const declined = rate?.providerErrors?.find(e => e.message || e.error)
  const declinedError = declined && new Error(declined.message || declined.error)

  return {
    isLoading: isLoadingAny,
    refetch,
    quote: isLoadingAny ? undefined : allQuotes[index],
    quotes: allQuotes,
    selectedIndex: index,
    setSelectedIndex,
    error: noRoutes ? (aggregatorError ?? declinedError ?? stellarError ?? null) : null
  }
}
