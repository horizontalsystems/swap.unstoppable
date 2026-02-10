import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { assetFromString, getCommonAssetInfo, USwapNumber } from '@uswap/core'
import { useAssets } from '@/hooks/use-assets'
import { useAssetFrom, useAssetTo } from '@/hooks/use-swap'
import { getAssetRates } from '@/lib/api'

export type AssetRateMap = Record<string, USwapNumber>

class RateIdentifierCache {
  private maxSize: number
  private cache: Map<string, number>

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize
    this.cache = new Map()
  }

  add(identifiers: string[]): boolean {
    let hasNew = false
    const now = Date.now()

    for (const id of identifiers) {
      const _id = id.toLowerCase()
      if (!this.cache.has(_id)) {
        hasNew = true
      }
      this.cache.delete(_id)
      this.cache.set(_id, now)
    }

    while (this.cache.size > this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    return hasNew
  }

  getAll(): string[] {
    return Array.from(this.cache.keys())
  }

  size(): number {
    return this.cache.size
  }
}

const identifierCache = new RateIdentifierCache(100)

export const useRates = (identifiers: string[]): { rates: AssetRateMap; isLoading: boolean } => {
  const { geckoMap } = useAssets()
  const queryClient = useQueryClient()

  useEffect(() => {
    const gasIdentifiers = identifiers.map(id => getCommonAssetInfo(assetFromString(id).chain).identifier)
    const hasNew = identifierCache.add([...identifiers, ...gasIdentifiers])

    if (hasNew) {
      queryClient.invalidateQueries({ queryKey: ['asset-rates-accumulated'] })
    }
  }, [identifiers, queryClient])

  const { data, isLoading } = useQuery({
    queryKey: ['asset-rates-accumulated'],
    enabled: !!geckoMap && identifierCache.size() > 0,
    retry: false,
    staleTime: 3 * 60_000,
    refetchOnMount: false,
    queryFn: async () => {
      if (!geckoMap || identifierCache.size() === 0) return {}

      const allIdentifiers = identifierCache.getAll()
      const idMap = new Map<string, string>()

      for (const identifier of allIdentifiers) {
        const gid = geckoMap.get(identifier)
        if (gid) idMap.set(identifier, gid)
      }

      if (!idMap.size) return {}

      return await fetchRates(Array.from(idMap.values()), Array.from(idMap.keys()))
    }
  })

  const rates: AssetRateMap = {}
  if (data) {
    for (const id of identifiers) {
      const _id = id.toLowerCase()
      if (data[_id]) {
        rates[id] = data[_id]
      }
    }
  }

  return {
    rates,
    isLoading: isLoading || !geckoMap || identifiers.length === 0
  }
}

export const useSwapRates = () => {
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const identifiers = [assetFrom?.identifier, assetTo?.identifier].filter(Boolean).sort() as string[]
  const { rates } = useRates(identifiers)

  return {
    rateFrom: assetFrom && rates[assetFrom.identifier],
    rateTo: assetTo && rates[assetTo.identifier]
  }
}

async function fetchRates(geckoIds: string[], identifiers: string[]): Promise<AssetRateMap> {
  const data = await getAssetRates(geckoIds.join(','))
  const result: AssetRateMap = {}

  identifiers.forEach((id, i) => {
    const price = data[geckoIds[i]]?.usd
    if (price) result[id] = new USwapNumber(price)
  })

  return result
}
