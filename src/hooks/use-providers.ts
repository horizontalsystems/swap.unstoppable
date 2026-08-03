import { useQuery } from '@tanstack/react-query'
import { getProviders } from '@/lib/api'
import { Provider, ProviderName } from '@/types'

const STREAMING_TO_BASE: Record<string, string> = {
  THORCHAIN_STREAMING: 'THORCHAIN',
  MAYACHAIN_STREAMING: 'MAYACHAIN',
  CHAINFLIP_STREAMING: 'CHAINFLIP'
}

export const useProviders = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: getProviders,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  })

  const providers = data ?? []
  const byProvider = new Map<string, Provider>(providers.map(p => [p.provider, p]))

  const getProvider = (name: ProviderName | string): Provider | undefined => {
    const base = STREAMING_TO_BASE[name] ?? name
    return byProvider.get(base)
  }

  return { providers, getProvider, isLoading }
}
