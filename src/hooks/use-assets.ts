import { useQuery } from '@tanstack/react-query'
import { EVMChain, EVMChains, getChainConfig } from '@uswap/helpers'
import { Asset } from '@/components/swap/asset'
import { AppConfig } from '@/config'
import { getAllTokens, getProviders, getProviderTokens } from '@/lib/api'
import { fetchRobinhoodTokens } from '@/lib/robinhood/asset-list'
import { EXCLUDED_STELLAR_PROVIDERS, STELLAR_DEX_PROVIDERS, stellarTokens } from '@/lib/stellar/asset-list'
import { ProviderName } from '@/types'

// aggregators quote every token on the chains they support, so /tokens carries no list for them —
// they are attached to each token by chain instead
const MANUAL_PROVIDERS: ProviderName[] = [
  ProviderName.BARTER,
  ProviderName.ONEINCH,
  ProviderName.LIFI,
  ProviderName.JUPITER,
  ...STELLAR_DEX_PROVIDERS
]

// temporarily disabled — /tokens still tags them, so they are stripped off every asset here,
// which keeps them out of the providers list /rate is asked for
const DISABLED_PROVIDERS = new Set<string>(['NEAR_CONFIDENTIAL', 'NEAR_CONFIDENTIAL_ADVANCED', ...EXCLUDED_STELLAR_PROVIDERS])

// LI.FI also quotes Solana and Tron, but a committed signed_transaction route only carries a target
// address on EVM (see flattenSwapRoute), so the p2p plugin cannot execute the other chains
const EVM_ONLY_PROVIDERS = new Set<ProviderName>([ProviderName.LIFI])

export const useAssets = (): { assets?: Asset[]; geckoMap?: Map<string, string>; isLoading: boolean } => {
  const { data, isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const appProviders = AppConfig.providers
      // Robinhood Chain is quoted by the aggregator but absent from its catalog, so its tokens are
      // fetched separately and appended — they then go through the same loop as everything else,
      // which is what attaches ONEINCH and LIFI to them by chain id.
      const [aggregatorTokens, providers, robinhoodTokens] = await Promise.all([
        appProviders ? getProviderTokens(appProviders) : getAllTokens(),
        getProviders(),
        fetchRobinhoodTokens().catch(() => [])
      ])
      // curated Stellar assets go first so a catalog entry for the same asset wins
      const tokens = [...stellarTokens(), ...aggregatorTokens, ...robinhoodTokens]
      const assets = new Map<string, Asset>()
      const geckoMap = new Map<string, string>()

      const manualProviderChains = MANUAL_PROVIDERS.map(name => ({
        name,
        chainIds: new Set(providers.find(p => p.provider === name)?.supportedChainIds ?? [])
      }))

      for (const token of tokens) {
        if (!token.chain || !getChainConfig(token.chain).chain) {
          continue
        }

        const isEvm = EVMChains.includes(token.chain as EVMChain)

        let providerNames: ProviderName[] = (token.providers ?? []).filter((p: ProviderName) => !DISABLED_PROVIDERS.has(p))
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
