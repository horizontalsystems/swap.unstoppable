import { useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ProviderName, USwapNumber } from '@uswap/core'
import { useQuote } from '@/hooks/use-quote'
import { useAssetFrom, useAssetTo } from '@/hooks/use-swap'
import { useAssets } from '@/hooks/use-assets'
import {
  getBlocksDecodedPrices,
  getDexScreenerTokens,
  getMayaMidgardCacaoPrice,
  getMayaMidgardPools,
  getMidgardPools,
  getMidgardRunePrice
} from '@/lib/api'

export type AssetRateMap = Record<string, USwapNumber>
export type AssetLogoMap = Record<string, string>

const RUNE_IDENTIFIER = 'THOR.RUNE'
const CACAO_IDENTIFIER = 'MAYA.CACAO'

type PriceSource = 'thor' | 'maya' | 'gecko'

const rateSource = (provider?: ProviderName): PriceSource => {
  if (provider === ProviderName.THORCHAIN) return 'thor'
  if (provider === ProviderName.MAYACHAIN) return 'maya'
  return 'gecko'
}

export const useRates = (identifiers: string[], provider?: ProviderName): { rates: AssetRateMap; logos: AssetLogoMap; isLoading: boolean } => {
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

  // SOL/ETH token addresses (mint or contract) for DexScreener lookups, split by chain
  const dexTokens = useMemo(() => {
    const sol: string[] = []
    const eth: string[] = []
    for (const id of identifiers) {
      if (!id.includes('-')) continue
      const addr = id.split('-').pop()!
      if (id.toUpperCase().startsWith('SOL.')) sol.push(addr)
      else if (id.toUpperCase().startsWith('ETH.')) eth.push(addr.toLowerCase())
    }
    return { sol, eth }
  }, [identifiers])

  const { data: dexScreenerData, isLoading: dexScreenerLoading } = useQuery({
    queryKey: ['dexscreener-tokens-sol', dexTokens.sol.slice().sort().join(',')],
    queryFn: () => getDexScreenerTokens(dexTokens.sol, 'solana'),
    enabled: dexTokens.sol.length > 0,
    staleTime: 3 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false
  })

  const { data: dexScreenerEthData, isLoading: dexScreenerEthLoading } = useQuery({
    queryKey: ['dexscreener-tokens-eth', dexTokens.eth.slice().sort().join(',')],
    queryFn: () => getDexScreenerTokens(dexTokens.eth, 'ethereum'),
    enabled: dexTokens.eth.length > 0,
    staleTime: 3 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false
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

  // DexScreener supplements prices/logos for SOL & ETH tokens not covered above
  const dexData = { ...dexScreenerData, ...dexScreenerEthData }
  for (const id of identifiers) {
    const upper = id.toUpperCase()
    const isEth = upper.startsWith('ETH.')
    if ((!isEth && !upper.startsWith('SOL.')) || !id.includes('-')) continue
    const addr = id.split('-').pop()!
    const info = dexData[isEth ? addr.toLowerCase() : addr]
    if (info?.price && !rates[id]) rates[id] = new USwapNumber(info.price)
    if (info?.logo) logos[id] = info.logo
  }

  return {
    rates,
    logos,
    isLoading: midgardLoading || dexScreenerLoading || dexScreenerEthLoading || geckoLoading || identifiers.length === 0
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
  const providerRef = useRef<{ pairKey: string; provider?: ProviderName }>({ pairKey })
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
