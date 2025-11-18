import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getAssetRates } from '@/lib/api'
import { SwapKitNumber } from '@swapkit/core'
import { useAssets } from '@/hooks/use-assets'
import { useAssetFrom, useAssetTo } from '@/hooks/use-swap'

export type AssetRateMap = Record<string, SwapKitNumber>

export const useRates = (identifiers: string[]): { rates: AssetRateMap; isLoading: boolean } => {
  const queryClient = useQueryClient()
  const { geckoMap } = useAssets()

  queryClient.setQueryDefaults(['asset-rate'], { staleTime: 3 * 60_000 })

  const { data, isLoading } = useQuery({
    queryKey: ['asset-rates', ...identifiers],
    enabled: !!geckoMap && identifiers.length > 0,
    retry: false,
    staleTime: 3 * 60_000,
    refetchOnMount: false,
    queryFn: async () => {
      if (!geckoMap || identifiers.length === 0) return {}

      const cached: AssetRateMap = {}
      const missing: string[] = []

      for (const identifier of identifiers) {
        const value = queryClient.getQueryData<SwapKitNumber>(['asset-rate', identifier])
        if (value) cached[identifier] = value
        else missing.push(identifier)
      }

      if (missing.length === 0) return cached

      const idMap = new Map<string, string>()
      for (const identifier of missing) {
        const gid = geckoMap.get(identifier)
        if (gid) idMap.set(identifier, gid)
      }

      if (!idMap.size) return cached

      const fetched = await fetchRates(Array.from(idMap.values()), Array.from(idMap.keys()))

      Object.entries(fetched).forEach(([id, rate]) => {
        queryClient.setQueryData(['asset-rate', id], rate)
      })

      return { ...cached, ...fetched }
    }
  })

  return {
    rates: data || {},
    isLoading: isLoading || !geckoMap || identifiers.length === 0
  }
}

export const useRate = (identifiers?: string | string[]) => {
  const ids = Array.isArray(identifiers) ? identifiers : identifiers ? [identifiers] : []
  const { rates, isLoading } = useRates(ids)

  return {
    rates,
    rate: ids.length === 1 ? rates[ids[0]] : undefined,
    isLoading
  }
}

export const useSwapRates = (identifier?: string) => {
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const identifiers = [assetFrom?.identifier, assetTo?.identifier].filter(Boolean).sort() as string[]
  console.log({ identifiers })
  const { rates } = useRates(identifiers)
  console.log({ rates })

  return { rate: identifier ? rates[identifier] : undefined }
}

async function fetchRates(geckoIds: string[], identifiers: string[]): Promise<AssetRateMap> {
  const data = await getAssetRates(geckoIds.join(','))
  const result: AssetRateMap = {}

  identifiers.forEach((id, i) => {
    const price = data[geckoIds[i]]?.usd
    if (price) result[id] = new SwapKitNumber(price)
  })

  return result
}
