import { useQuery } from '@tanstack/react-query'
import { useAssetFrom, useAssetTo } from '@/hooks/use-swap'
import { getAssetRates } from '@/lib/api'
import { SwapKitNumber } from '@swapkit/core'

export const useRates = (): { rates: Record<string, SwapKitNumber>; isLoading: boolean } => {
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()

  const { data, isLoading: isRatesLoading } = useQuery({
    queryKey: ['asset-rates', assetFrom?.identifier, assetTo?.identifier],
    queryFn: (): Record<string, any> => {
      if (!assetFrom || !assetTo) return {}

      const assets = [assetFrom, assetTo]
      const geckoIds = assets.map(a => a.coingeckoId).filter(Boolean) as string[]

      return getAssetRates(geckoIds.join(',')).then(data =>
        assets.reduce((acc, cur) => {
          const geckoId = cur.coingeckoId

          if (!geckoId) return acc

          const price = data[geckoId]?.usd
          const value = price && new SwapKitNumber(price)

          if (!value) return acc

          return { ...acc, [cur.identifier]: value }
        }, {})
      )
    },
    enabled: !!(assetFrom || assetTo),
    refetchOnMount: false
  })

  return {
    rates: data || {},
    isLoading: isRatesLoading || !assetFrom || !assetTo
  }
}

export const useRate = (identifier?: string) => {
  const { rates } = useRates()

  return {
    rate: rates && identifier ? rates[identifier] : null
  }
}
