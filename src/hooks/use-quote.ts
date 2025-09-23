import { useMemo } from 'react'
import { AxiosError } from 'axios'
import { RefetchOptions, useQuery } from '@tanstack/react-query'
import { getQuote } from '@/lib/api'
import { useAssetFrom, useAssetTo, useSwap } from '@/hooks/use-swap'

export interface Quote {
  dust_threshold: string
  expected_amount_out: string
  expiry: number
  fees: {
    asset: string
    affiliate: string
    outbound: string
    liquidity: string
    total: string
    slippage_bps: number
    total_bps: number
  }
  gas_rate_units: string
  inbound_address: string
  inbound_confirmation_blocks: number
  inbound_confirmation_seconds: number
  max_streaming_quantity: number
  memo: string
  notes: string
  outbound_delay_blocks: number
  outbound_delay_seconds: number
  recommended_gas_rate: string
  recommended_min_amount_in: string
  router?: string
  streaming_swap_blocks: number
  streaming_swap_seconds: number
  total_swap_seconds: number
  warning: string
}

type UseQote = {
  isLoading: boolean
  refetch: (options?: RefetchOptions) => void
  quote?: Quote
  error: Error | null
}

export const useQuote = (): UseQote => {
  const { amountFrom, destination, slippage } = useSwap()
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()

  const params = useMemo(
    () => ({
      amount: amountFrom > 0n ? amountFrom.toString() : undefined,
      fromAsset: assetFrom?.asset,
      toAsset: assetTo?.asset,
      affiliate: [],
      affiliateBps: [],
      destination: destination?.address,
      streamingInterval: 1,
      streamingQuantity: 0,
      liquidity_tolerance_bps: slippage ? slippage * 100 : undefined
    }),
    [amountFrom, assetFrom, assetTo, destination, slippage]
  )

  const {
    data: quote,
    refetch,
    isLoading,
    isRefetching,
    error
  } = useQuery({
    queryKey: ['quote', params],
    queryFn: () =>
      getQuote({
        amount: params.amount,
        from_asset: params.fromAsset,
        to_asset: params.toAsset,
        affiliate: params.affiliate,
        affiliate_bps: params.affiliateBps,
        destination: params.destination,
        streaming_interval: params.streamingInterval,
        streaming_quantity: params.streamingQuantity,
        liquidity_tolerance_bps: params.liquidity_tolerance_bps
      }),
    enabled: !!(params.amount && params.fromAsset && params.toAsset),
    retry: false
  })

  let newError = error
  if (error instanceof AxiosError) {
    newError = new Error(error.response?.data?.message || error.message)
  }

  return {
    isLoading: isLoading || isRefetching,
    refetch,
    quote: isLoading || isRefetching || error ? undefined : quote,
    error: newError
  }
}
