import { useQuery } from '@tanstack/react-query'
import { getMimir } from '@/lib/api'

export const useMimir = () => {
  const { data: mimir, isLoading } = useQuery({
    queryKey: ['mimir'],
    queryFn: getMimir,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 60 * 60 * 1000 // 1 hour
  })

  return {
    mimir: mimir ?? ({} as Record<string, number>),
    isLoading
  }
}
