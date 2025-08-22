import { useQuery } from '@tanstack/react-query'
import { getQuote } from '@/lib/api'

export interface UseQuoteParams {
  amount: string
  fromAsset: string
  toAsset: string
  affiliate: never[]
  affiliateBps: never[]
  destination: string | undefined
  streamingInterval: number
  streamingQuantity: string
  liquidityToleranceBps: number
}

export const useQuote = (params: UseQuoteParams) => {
  const { data: quote, isLoading } = useQuery({
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
      })
  })

  return { quote, isLoading }
}
