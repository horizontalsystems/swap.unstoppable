import { useQuery } from '@tanstack/react-query'
import { Chain } from '@uswap/core'
import { EVMChain, EVMChains, getChainConfig } from '@uswap/helpers'
import { Asset } from '@/components/swap/asset'
import { AppConfig } from '@/config'
import { getAllTokens, getProviders, getProviderTokens } from '@/lib/api'
import { fetchRobinhoodTokens } from '@/lib/robinhood/asset-list'
import {
  SDK_QUOTED_PROVIDERS,
  STELLAR_ASSETS,
  STELLAR_CHAIN_ID,
  STELLAR_DECIMALS,
  stellarIdentifier,
  stellarProvidersFor
} from '@/lib/stellar/asset-list'
import { AppProviderName, ProviderName } from '@/types'

const EXTRA_CHAINS = new Set(['XMR', 'XLM'])

// aggregators quote every token on the chains they support, so /tokens carries no list for them —
// they are attached to each token by chain instead
const MANUAL_PROVIDERS: ProviderName[] = [ProviderName.BARTER, ProviderName.ONEINCH, ProviderName.LIFI, ProviderName.JUPITER]

// temporarily disabled — /tokens still tags them, so they are stripped off every asset here,
// which keeps them out of the providers list /rate is asked for
const DISABLED_PROVIDERS = new Set<string>(['NEAR_CONFIDENTIAL', 'NEAR_CONFIDENTIAL_ADVANCED'])

// LI.FI also quotes Solana and Tron, but a committed signed_transaction route only carries a target
// address on EVM (see flattenSwapRoute), so the p2p plugin cannot execute the other chains
const EVM_ONLY_PROVIDERS = new Set<ProviderName>([ProviderName.LIFI])

export const useAssets = (): { assets?: Asset[]; geckoMap?: Map<string, string>; isLoading: boolean } => {
  const { data, isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const appProviders = AppConfig.providers
      // /tokens only knows the aggregator's own providers; the Stellar venues are added below from
      // the curated list instead.
      const aggregatorProviders = appProviders?.filter((p): p is ProviderName => !SDK_QUOTED_PROVIDERS.has(p))
      // Robinhood Chain is quoted by the aggregator but absent from its catalog, so its tokens are
      // fetched separately and appended — they then go through the same loop as everything else,
      // which is what attaches ONEINCH and LIFI to them by chain id.
      const [aggregatorTokens, providers, robinhoodTokens] = await Promise.all([
        aggregatorProviders?.length ? getProviderTokens(aggregatorProviders) : getAllTokens(),
        getProviders(),
        fetchRobinhoodTokens().catch(() => [])
      ])
      const tokens = [...aggregatorTokens, ...robinhoodTokens]
      const assets = new Map<string, Asset>()
      const geckoMap = new Map<string, string>()

      const manualProviderChains = MANUAL_PROVIDERS.map(name => ({
        name,
        chainIds: new Set(providers.find(p => p.provider === name)?.supportedChainIds ?? [])
      }))

      for (const token of tokens) {
        if (!token.chain || (!getChainConfig(token.chain).chain && !EXTRA_CHAINS.has(token.chain))) {
          continue
        }

        const isEvm = EVMChains.includes(token.chain as EVMChain)

        let providerNames: AppProviderName[] = (token.providers ?? []).filter((p: ProviderName) => !DISABLED_PROVIDERS.has(p))
        for (const { name, chainIds } of manualProviderChains) {
          if (!chainIds.has(token.chainId) || providerNames.includes(name)) continue
          if (!isEvm && EVM_ONLY_PROVIDERS.has(name)) continue
          providerNames.push(name)
        }

        if (appProviders) {
          providerNames = providerNames.filter(p => appProviders.includes(p))
          if (!providerNames.length) continue
        }

        const key = `${token.chain}-${token.identifier}`.toLowerCase()
        assets.set(key, {
          address: token.address,
          chain: token.chain,
          chainId: token.chainId,
          coingeckoId: token.coingeckoId,
          decimals: token.decimals,
          identifier: token.identifier,
          logoURI: token.logoURI,
          name: token.name,
          shortCode: token.shortCode,
          ticker: token.ticker,
          providers: providerNames
        })

        if (token.coingeckoId) {
          geckoMap.set(token.identifier.toLowerCase(), token.coingeckoId)
        }
      }

      // The Stellar venues are quoted client-side by stellar-web-sdk, so they are absent from
      // /tokens. Union them onto the aggregator's own XLM entries (XLM.XLM and SHX) rather than
      // overwriting — those already carry a logo, a coingeckoId, and the instant-exchange
      // providers that also serve Stellar.
      for (const entry of STELLAR_ASSETS) {
        const identifier = stellarIdentifier(entry)
        const providerNames = stellarProvidersFor(entry)
        const key = `XLM-${identifier}`.toLowerCase()
        const existing = assets.get(key)

        if (existing) {
          existing.providers = Array.from(new Set([...existing.providers, ...providerNames]))
          continue
        }

        if (appProviders && !providerNames.some(p => appProviders.includes(p))) continue

        assets.set(key, {
          chain: Chain.Stellar,
          chainId: STELLAR_CHAIN_ID,
          coingeckoId: entry.coingeckoId,
          decimals: STELLAR_DECIMALS,
          identifier,
          logoURI: entry.logoURI,
          name: entry.name,
          ticker: entry.code,
          providers: providerNames
        })

        if (entry.coingeckoId) {
          geckoMap.set(identifier.toLowerCase(), entry.coingeckoId)
        }
      }

      return {
        assets: Array.from(assets.values()),
        geckoMap
      }
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false
  })

  return {
    assets: data?.assets,
    geckoMap: data?.geckoMap,
    isLoading
  }
}
