import { useQuery } from '@tanstack/react-query'
import { getQuote } from '@/lib/api'
import { AxiosError } from 'axios'

interface UseQuoteParams {
  amount?: string
  fromAsset?: string
  toAsset?: string
  affiliate: never[]
  affiliateBps: never[]
  destination: string | undefined
  streamingInterval: number
  streamingQuantity: string
  liquidityToleranceBps: number
}

export interface UseQuote {
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

export const useQuote = (params: UseQuoteParams): { quote?: UseQuote; isLoading: boolean; error?: string } => {
  const { data, isLoading, error } = useQuery({
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
        liquidity_tolerance_bps: params.liquidityToleranceBps
      }),
    enabled: !!(params.amount && params.fromAsset && params.toAsset)
  })

  let errorMessage = null
  if (error instanceof AxiosError) {
    errorMessage = error.response?.data?.message || error.message
  }

  return {
    isLoading,
    quote: data,
    error: errorMessage
  }
}
