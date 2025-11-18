import { useQuery } from '@tanstack/react-query'
import { getTokenList } from '@/lib/api'
import { Asset } from '@/components/swap/asset'

const PROVIDERS = ['THORCHAIN', 'NEAR', 'ONEINCH']

export const useAssets = (): { assets?: Asset[]; geckoMap?: Map<string, string>; isLoading: boolean } => {
  const { data, isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const lists = await Promise.all(PROVIDERS.map(getTokenList))
      const tokens = lists.flatMap(l => l.tokens).filter(t => t.chain)

      const assets = new Map<string, Asset>()
      const geckoMap = new Map<string, string>()

      for (const token of tokens) {
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
          ticker: token.ticker
        })

        if (token.coingeckoId) {
          geckoMap.set(token.identifier, token.coingeckoId)
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
