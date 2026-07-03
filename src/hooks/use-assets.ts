import { useQuery } from '@tanstack/react-query'
import { getChainConfig } from '@uswap/helpers'
import { Asset } from '@/components/swap/asset'
import { AppConfig } from '@/config'
import { getAllTokens, getProviders, getProviderTokens } from '@/lib/api'
import { ProviderName } from '@/types'

const EXTRA_CHAINS = new Set(['XMR', 'XLM'])
const MANUAL_PROVIDERS: ProviderName[] = [ProviderName.BARTER, ProviderName.ONEINCH]

export const useAssets = (): { assets?: Asset[]; geckoMap?: Map<string, string>; isLoading: boolean } => {
  const { data, isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const appProviders = AppConfig.providers
      const [tokens, providers] = await Promise.all([appProviders ? getProviderTokens(appProviders) : getAllTokens(), getProviders()])
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

        let providerNames: ProviderName[] = [...(token.providers ?? [])]
        for (const { name, chainIds } of manualProviderChains) {
          if (chainIds.has(token.chainId) && !providerNames.includes(name)) {
            providerNames.push(name)
          }
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
