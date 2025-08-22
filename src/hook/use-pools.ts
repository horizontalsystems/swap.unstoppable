import { useQuery } from '@tanstack/react-query'
import { getPools } from '@/lib/api'
import { Asset, RUNE } from '@/components/swap/asset'

export const usePools = (): { pools: Asset[] | undefined; isLoading: boolean } => {
  const { data, isLoading } = useQuery({
    queryKey: ['pools'],
    queryFn: () => getPools()
  })

  let pools = data
  if (pools && pools.length > 0 && !isLoading) {
    pools = [...pools, RUNE]
  }

  return { pools, isLoading }
}
