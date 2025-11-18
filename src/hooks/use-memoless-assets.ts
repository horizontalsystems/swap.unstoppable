import { useQuery } from '@tanstack/react-query'
import { getMemolessAssets } from '@/lib/api'

export interface MemolessAsset {
  asset: string
  decimals: number
  status: string
}

export const useMemolessAssets = (): { assets: MemolessAsset[] | undefined; isLoading: boolean } => {
  const { data, isLoading } = useQuery({
    queryKey: ['memoless-assets'],
    queryFn: async () => {
      return getMemolessAssets()
        .then(data => data.assets)
        .then(assets => assets.filter((asset: any) => asset.status === 'Available'))
        .then(assets => assets.map((asset: any) => asset as MemolessAsset))
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false
  })

  return { assets: data, isLoading }
}
