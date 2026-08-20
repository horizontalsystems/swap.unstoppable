import { useQuery } from '@tanstack/react-query'
import { EVMChain, EVMChains, getChainConfig } from '@uswap/helpers'
import { Asset } from '@/components/swap/asset'
import { AppConfig } from '@/config'
import { getAllTokens, getProviders, getProviderTokens } from '@/lib/api'
import { ProviderName } from '@/types'

const EXTRA_CHAINS = new Set(['XMR', 'XLM'])

// aggregators quote every token on the chains they support, so /tokens carries no list for them —
// they are attached to each token by chain instead
const MANUAL_PROVIDERS: ProviderName[] = [ProviderName.BARTER, ProviderName.ONEINCH, ProviderName.LIFI]

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
