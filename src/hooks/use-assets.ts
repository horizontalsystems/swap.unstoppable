import { useQuery } from '@tanstack/react-query'
import { getTokenList } from '@/lib/api'
import { Asset } from '@/components/swap/asset'

const PROVIDERS = ['THORCHAIN', 'NEAR', 'ONEINCH']

export const useAssets = (): { assets: Asset[] | undefined; isLoading: boolean } => {
  const { data, isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const lists = await Promise.all(PROVIDERS.map(provider => getTokenList(provider)))

      const map = lists
        .map(l => l.tokens)
        .flat()
        .filter(t => t.chain)
        .map(t => ({
          address: t.address,
          chain: t.chain,
          chainId: t.chainId,
          coingeckoId: t.coingeckoId,
          decimals: t.decimals,
          identifier: t.identifier,
          logoURI: t.logoURI,
          name: t.name,
          shortCode: t.shortCode,
          ticker: t.ticker
        }))
        .reduce((acc: Map<string, Asset>, cur: Asset) => {
          return {
            ...acc,
            [`${cur.chain}-${cur.identifier}`]: cur
          }
        }, new Map<string, Asset>())

      return Object.values(map)
    },
    refetchOnMount: false
  })

  return { assets: data, isLoading }
}
