import { useQuery } from '@tanstack/react-query'
import type { ProviderError as SdkProviderError } from 'stellar-web-sdk'
import { providersForPairKind, adaptStellarRoute, stellarPairKind, StellarPairKind } from '@/lib/stellar/adapt'
import { logRouting } from '@/lib/stellar/log'
import { getStellarSdk } from '@/lib/stellar/sdk'
import { STELLAR_WALLET_SIGNS_AUTH_ENTRIES } from '@/lib/stellar/wallet'
import { useAssetFrom, useAssetTo, useSlippage, useSwap } from '@/hooks/use-swap'
import { useSelectedAccount } from '@/hooks/use-wallets'
import { useQuoteStore } from '@/store/quote-store'
import { isStellarWallet, QuoteResponseRoute } from '@/types'

type UseStellarQuote = {
  routes: QuoteResponseRoute[]
  providerErrors: SdkProviderError[]
  isLoading: boolean
  error: Error | null
  /** Which SDK fan-out this pair qualifies for — `'none'` means the SDK was never asked. */
  kind: StellarPairKind
}

/**
 * Stellar routes, quoted client-side by stellar-web-sdk rather than through the aggregator.
 *
 * The fan-out is deliberately narrow — `stellarPairKind` only claims Stellar-native pairs and the
 * Axelar bridge pairs. Anything else with a Stellar leg is a cross-chain route the aggregator
 * already serves, and quoting it here as well would show the same venue twice.
 */
export const useStellarQuote = (): UseStellarQuote => {
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const slippage = useSlippage()
  const selectedAccount = useSelectedAccount()
  const { valueFrom, exactAmountFrom } = useSwap()
  const resetSelectedIndex = useQuoteStore(state => state.resetSelectedIndex)

  // isAxelarPair lives in the SDK bundle, so the pair kind can only be settled once it has loaded.
  // Before then we optimistically treat a Stellar-native pair as in_chain (which needs no SDK code
  // to decide) and let the query itself resolve the bridge case.
  const bothStellar = assetFrom?.chain === 'XLM' && assetTo?.chain === 'XLM'
  const crossesStellar = assetFrom?.chain === 'XLM' && assetTo?.chain !== 'XLM'

  // Only the Stellar-origin cases can produce a route: both legs on Stellar, or Stellar → the
  // Axelar bridge. Gating on "either leg is Stellar" would load the SDK's ~1MB dependency for
  // XLM → BTC purely to have `stellarPairKind` return 'none'. `isAxelarPair` still decides the
  // bridge case, but only once a Stellar-origin pair has made it worth asking.
  const mayHaveStellarRoute = bothStellar || crossesStellar

  const stellarAccount = selectedAccount?.network === 'XLM' ? selectedAccount : undefined
  const sourceAddress = stellarAccount?.address

  // STELLARBROKER is dropped here, at quote time, for a wallet that cannot sign Soroban auth
  // entries — the broker picks Soroban vs classic mid-session, so an incapable wallet would only
  // find out after signing, with a partial fill already on-chain. With no wallet connected yet we
  // quote it: the user has not committed to a wallet, and every Stellar wallet we ship can sign.
  const canSignAuthEntries =
    !stellarAccount || !isStellarWallet(stellarAccount.provider) || STELLAR_WALLET_SIGNS_AUTH_ENTRIES[stellarAccount.provider]

  const { data, isLoading, isRefetching, error } = useQuery({
    queryKey: ['stellar-quote', exactAmountFrom, assetFrom?.identifier, assetTo?.identifier, slippage, sourceAddress, canSignAuthEntries],
    queryFn: async () => {
      const sdk = await getStellarSdk()
      const { isAxelarPair } = await import('stellar-web-sdk')

      const kind = stellarPairKind(assetFrom, assetTo, isAxelarPair)
      if (kind === 'none' || !assetFrom || !assetTo) {
        return { kind, routes: [] as QuoteResponseRoute[], providerErrors: [] as SdkProviderError[] }
      }

      const result = await sdk.quote({
        sellAsset: assetFrom.identifier,
        buyAsset: assetTo.identifier,
        sellAmount: exactAmountFrom,
        // The SDK takes a PERCENT here, same as the aggregator's /rate.
        slippage: slippage ?? 99,
        sourceAddress,
        // The recipient is not known until the confirm dialog, so the fan-out cannot narrow on it
        // here — swap-recipient blocks an unserviceable venue before it commits instead.
        providers: providersForPairKind(kind, canSignAuthEntries)
      })

      logRouting({
        pair: `${assetFrom.identifier}->${assetTo.identifier}`,
        sellAmount: exactAmountFrom,
        timings: result.timings,
        routes: result.allRoutes,
        providerErrors: result.providerErrors,
        selected: result.provider
      })

      // The aggregator's own query resets this when it resolves, but a Stellar-native pair leaves
      // it with no providers to ask — so without this a selection would carry over from the
      // previous pair.
      resetSelectedIndex()

      return {
        kind,
        routes: result.allRoutes.map(route => adaptStellarRoute(route, { sourceAddress })),
        // A provider that declines is NOT an error and is simply absent from allRoutes — this is
        // the only place that says why, so it is carried up rather than dropped.
        providerErrors: result.providerErrors
      }
    },
    enabled: !!(mayHaveStellarRoute && !valueFrom.eqValue(0) && assetFrom?.identifier && assetTo?.identifier),
    // Quoting reads only — no funds move — so one retry on a transient upstream failure is free,
    // and beats dropping every Stellar venue out of the merged list.
    retry: 1,
    retryDelay: 750,
    refetchOnMount: false
  })

  return {
    routes: data?.routes ?? [],
    providerErrors: data?.providerErrors ?? [],
    isLoading: isLoading || isRefetching,
    error: error as Error | null,
    kind: data?.kind ?? (bothStellar ? 'in_chain' : 'none')
  }
}
