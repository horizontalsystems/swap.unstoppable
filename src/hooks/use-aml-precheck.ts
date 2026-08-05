import { useMemo } from 'react'
import { QueryClient, useQuery } from '@tanstack/react-query'
import { checkAddresses } from '@/lib/api'
import { QuoteResponseRoute } from '@/types'

// QUICKEX is the only provider that exposes the AML address precheck
const AML_PRECHECK_PROVIDERS: string[] = ['QUICKEX']

// 'checking'     — request in flight
// 'passed'       — every address cleared the AML check
// 'failed'       — at least one address failed (blocks the swap)
// 'inconclusive' — the AML service returned null or was unavailable
export type AmlPrecheckStatus = 'checking' | 'passed' | 'failed' | 'inconclusive'

interface AmlAddressInput {
  sourceAddress?: string
  refundAddress?: string
  destinationAddress?: string
}

export const isAmlPrecheckProvider = (provider?: string): boolean => !!provider && AML_PRECHECK_PROVIDERS.includes(provider)

// the sender is the wallet source; fall back to the refund address when there is no connected wallet
const resolveAmlAddresses = ({ sourceAddress, refundAddress, destinationAddress }: AmlAddressInput): string[] => {
  const senderAddress = sourceAddress && sourceAddress !== '{sourceAddress}' ? sourceAddress : refundAddress
  return [senderAddress, destinationAddress].filter((a): a is string => !!a)
}

// single source of truth so the recipient-page prefetch and the confirm-page hook share one cache entry
const amlQueryOptions = (addresses: string[]) => ({
  queryKey: ['aml-precheck', addresses],
  queryFn: () => checkAddresses(addresses),
  staleTime: 30_000,
  gcTime: 60_000,
  retry: 1
})

// run the check and resolve once it settles, caching the result under the key the confirm screen reads;
// called after createSwap resolves so navigation waits for the AML verdict. A service error is swallowed
// (treated as inconclusive) so it never blocks navigation.
export const ensureAmlPrecheck = async (queryClient: QueryClient, provider: string | undefined, addresses: AmlAddressInput): Promise<void> => {
  if (!isAmlPrecheckProvider(provider)) return
  const resolved = resolveAmlAddresses(addresses)
  if (resolved.length === 0) return
  try {
    await queryClient.fetchQuery(amlQueryOptions(resolved))
  } catch {
    // AML service unavailable → inconclusive; the confirm screen surfaces it without blocking
  }
}

export const useAmlPrecheck = (quote?: QuoteResponseRoute & { refundAddress?: string }) => {
  const enabled = isAmlPrecheckProvider(quote?.providers[0])

  const addresses = useMemo(
    () => resolveAmlAddresses({ sourceAddress: quote?.sourceAddress, refundAddress: quote?.refundAddress, destinationAddress: quote?.destinationAddress }),
    [quote?.sourceAddress, quote?.refundAddress, quote?.destinationAddress]
  )

  const isActive = enabled && addresses.length > 0

  const query = useQuery({ ...amlQueryOptions(addresses), enabled: isActive })

  let status: AmlPrecheckStatus | undefined
  if (isActive) {
    if (query.isPending || query.isFetching) status = 'checking'
    else if (query.isError) status = 'inconclusive'
    else if (query.data?.passedAmlCheck === true) status = 'passed'
    else if (query.data?.passedAmlCheck === false) status = 'failed'
    else status = 'inconclusive'
  }

  const flagged = useMemo(() => {
    const set = new Set<string>()
    for (const result of query.data?.results ?? []) {
      if (!result.passed) set.add(result.address.toLowerCase())
    }
    return set
  }, [query.data])

  // hard-block confirm while checking or on an outright failure; 'inconclusive' only warns
  const blocked = status === 'checking' || status === 'failed'

  // whether a specific address failed the check (drives the red styling + banner);
  // only surfaced on a definitive failure so it always coincides with the block
  const isFlagged = (address?: string | null) => status === 'failed' && !!address && flagged.has(address.toLowerCase())

  return { status, blocked, isFlagged }
}
