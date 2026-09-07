import { useMemo, useRef } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { ProviderName, USwapNumber } from '@uswap/core'
import { AppProviderName } from '@/types'
import { useQuote } from '@/hooks/use-quote'
import { useAssetFrom, useAssetTo } from '@/hooks/use-swap'
import { useAssets } from '@/hooks/use-assets'
import {
  DexScreenerChain,
  getBlocksDecodedPrices,
  getDexScreenerTokens,
  getMayaMidgardCacaoPrice,
  getMayaMidgardPools,
  getMidgardPools,
  getMidgardRunePrice
} from '@/lib/api'

export type AssetRateMap = Record<string, USwapNumber>
export type AssetLogoMap = Record<string, string>

/** Chain handle -> DexScreener's own slug, for the chains it is asked about. */
const DEX_SCREENER_CHAINS: Record<string, DexScreenerChain | undefined> = {
  SOL: 'solana',
  ETH: 'ethereum',
  ROBINHOOD: 'robinhood'
}

/** Fixed order, so each chain keeps the same slot in the `useQueries` result across renders. */
const DEX_SCREENER_QUERY_CHAINS: DexScreenerChain[] = ['solana', 'ethereum', 'robinhood']

const RUNE_IDENTIFIER = 'THOR.RUNE'
const CACAO_IDENTIFIER = 'MAYA.CACAO'

type PriceSource = 'thor' | 'maya' | 'gecko'

const rateSource = (provider?: AppProviderName): PriceSource => {
  if (provider === ProviderName.THORCHAIN) return 'thor'
  if (provider === ProviderName.MAYACHAIN) return 'maya'
  return 'gecko'
}

export const useRates = (identifiers: string[], provider?: AppProviderName): { rates: AssetRateMap; logos: AssetLogoMap; isLoading: boolean } => {
  const { geckoMap } = useAssets()

  const { data: midgardData, isLoading: midgardLoading } = useQuery({
    queryKey: ['thorchain-pool-prices'],
    queryFn: async () => {
      const [pools, runePrice, mayaPools, cacaoPrice] = await Promise.all([
        getMidgardPools(),
        getMidgardRunePrice(),
        getMayaMidgardPools().catch(() => []),
        getMayaMidgardCacaoPrice().catch(() => NaN)
      ])

      const thor: AssetRateMap = {}
      const maya: AssetRateMap = {}

      for (const pool of mayaPools) {
        const price = parseFloat(pool.assetPriceUSD)
        if (pool.asset && !isNaN(price) && price > 0) {
          maya[pool.asset.toLowerCase()] = new USwapNumber(price)
        }
      }

      for (const pool of pools) {
        const price = parseFloat(pool.assetPriceUSD)
        if (pool.asset && !isNaN(price) && price > 0) {
          thor[pool.asset.toLowerCase()] = new USwapNumber(price)

          // Mirror the L1 pool price onto the corresponding Secured Asset identifier
          // (e.g. BTC.BTC -> BTC-BTC, ETH.USDC-0x… -> ETH-USDC-0x…). Secured assets track
          // 1:1 with the underlying L1 asset, so the L1 pool price is a close proxy.
          const dotIndex = pool.asset.indexOf('.')
          if (dotIndex > 0) {
            const chainPart = pool.asset.slice(0, dotIndex)
            const tickerPart = pool.asset.slice(dotIndex + 1)
            const securedKey = `${chainPart}-${tickerPart}`.toLowerCase()
            thor[securedKey] = new USwapNumber(price)
          }
        }
      }

      if (!isNaN(runePrice) && runePrice > 0) {
        thor[RUNE_IDENTIFIER.toLowerCase()] = new USwapNumber(runePrice)
      }

      if (!isNaN(cacaoPrice) && cacaoPrice > 0) {
        maya[CACAO_IDENTIFIER.toLowerCase()] = new USwapNumber(cacaoPrice)
      }

      return { thor, maya }
    },
    staleTime: 3 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false
  })

  // Token addresses (mint or contract) for DexScreener lookups, split by chain. Robinhood Chain is
  // here for a different reason than the other two: it supplements them, but it is the ONLY price
  // source for 4663 — the aggregator publishes no catalog for it, so its assets carry no
  // coingeckoId and never reach the BlocksDecoded lookup below.
  const dexTokens = useMemo(() => {
    const byChain: Record<DexScreenerChain, string[]> = { solana: [], ethereum: [], robinhood: [] }
    for (const id of identifiers) {
      if (!id.includes('-')) continue
      const addr = id.split('-').pop()!
      const chain = DEX_SCREENER_CHAINS[id.slice(0, id.indexOf('.')).toUpperCase()]
      if (chain) byChain[chain].push(chain === 'solana' ? addr : addr.toLowerCase())
    }
    return byChain
  }, [identifiers])

  const dexQueries = useQueries({
    queries: DEX_SCREENER_QUERY_CHAINS.map(chain => ({
      queryKey: ['dexscreener-tokens', chain, dexTokens[chain].slice().sort().join(',')],
      queryFn: () => getDexScreenerTokens(dexTokens[chain], chain),
      enabled: dexTokens[chain].length > 0,
      staleTime: 3 * 60_000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      retry: false
    }))
  })

  const geckoTargets = useMemo(() => {
    if (!geckoMap || rateSource(provider) !== 'gecko') return [] as { id: string; geckoId: string }[]
    const targets: { id: string; geckoId: string }[] = []
    for (const id of identifiers) {
      const geckoId = geckoMap.get(id.toLowerCase())
      if (geckoId) targets.push({ id, geckoId })
    }
    return targets
  }, [identifiers, geckoMap, provider])

  const geckoIds = useMemo(() => Array.from(new Set(geckoTargets.map(t => t.geckoId))), [geckoTargets])

  const { data: geckoData, isLoading: geckoLoading } = useQuery({
    queryKey: ['blocksdecoded-prices', geckoIds.slice().sort().join(',')],
    queryFn: () => getBlocksDecodedPrices(geckoIds),
    enabled: geckoIds.length > 0,
    staleTime: 3 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false
  })

  const rates: AssetRateMap = {}
  const logos: AssetLogoMap = {}
  const gecko: AssetRateMap = {}

  for (const { id, geckoId } of geckoTargets) {
    const price = geckoData?.[geckoId]
    if (price) gecko[id.toLowerCase()] = new USwapNumber(price)
  }

  const source = rateSource(provider)
  for (const id of identifiers) {
    const key = id.toLowerCase()
    let price: USwapNumber | undefined
    if (source === 'thor') price = midgardData?.thor?.[key]
    else if (source === 'maya') price = midgardData?.maya?.[key]
    else price = gecko[key] ?? midgardData?.thor?.[key] ?? midgardData?.maya?.[key]
    if (price) rates[id] = price
  }

  // DexScreener fills in prices and logos the sources above did not cover. Kept per-chain rather
  // than merged into one map, because two chains can host the same contract address.
  for (const id of identifiers) {
    if (!id.includes('-')) continue
    const chain = DEX_SCREENER_CHAINS[id.slice(0, id.indexOf('.')).toUpperCase()]
    if (!chain) continue

    const addr = id.split('-').pop()!
    const data = dexQueries[DEX_SCREENER_QUERY_CHAINS.indexOf(chain)]?.data
    const info = data?.[chain === 'solana' ? addr : addr.toLowerCase()]
    if (info?.price && !rates[id]) rates[id] = new USwapNumber(info.price)
    if (info?.logo) logos[id] = info.logo
  }

  return {
    rates,
    logos,
    isLoading: midgardLoading || dexQueries.some(q => q.isLoading) || geckoLoading || identifiers.length === 0
  }
}

export const useSwapRates = () => {
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const { quote, isLoading } = useQuote()
  const identifiers = [assetFrom?.identifier, assetTo?.identifier].filter(Boolean).sort() as string[]

  // Keep the resolved provider for the current pair so the rate source stays put while a new
  // quote loads, instead of switching source each time the quote resolves.
  const pairKey = identifiers.join(',')
  const providerRef = useRef<{ pairKey: string; provider?: AppProviderName }>({ pairKey })
  if (providerRef.current.pairKey !== pairKey) providerRef.current = { pairKey }
  if (quote?.providers[0]) providerRef.current.provider = quote.providers[0]
  const provider = providerRef.current.provider

  // The first quote for a pair hasn't resolved a provider yet; wait for it rather than showing
  // a price from the default source that would switch once the provider is known.
  const { rates } = useRates(identifiers, provider)
  const pending = isLoading && !provider

  return {
    rateFrom: pending || !assetFrom ? undefined : rates[assetFrom.identifier],
    rateTo: pending || !assetTo ? undefined : rates[assetTo.identifier]
  }
}
