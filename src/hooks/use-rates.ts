import { useQuery } from '@tanstack/react-query'
import { poolsInfoMap, usePools } from '@/hooks/use-pools'
import { getPoolsRates } from '@/lib/api'

export const useRates = (): { rates: Record<string, string | null>; isLoading: boolean } => {
  const { pools, isLoading: isPoolsLoading } = usePools()
  const { data, isLoading: isRatesLoading } = useQuery({
    queryKey: ['pools-rates', pools?.length],
    queryFn: (): Record<string, any> => {
      if (!pools?.length) {
        return {}
      }

      const ids = pools.map(i => poolsInfoMap[i.asset]?.geckoId)

      return getPoolsRates(ids.join(',')).then(data =>
        pools.reduce((acc, cur) => {
          const geckoId = poolsInfoMap[cur.asset]?.geckoId
          if (!geckoId) return acc
          const price = data[geckoId]?.usd

          return { ...acc, [cur.asset]: price ? String(price) : null }
        }, {})
      )
    },
    enabled: !!pools
  })

  return {
    rates: data || {},
    isLoading: isRatesLoading || isPoolsLoading
  }
}

export const useRate = (asset?: string) => {
  const { rates } = useRates()

  return {
    rate: rates && asset ? rates[asset] : null
  }
}
