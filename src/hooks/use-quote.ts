import Decimal from 'decimal.js'
import { useMemo } from 'react'
import { AxiosError } from 'axios'
import { RefetchOptions, useQuery } from '@tanstack/react-query'
import { getSwapkitQuote } from '@/lib/api'
import { useAssetFrom, useAssetTo, useSwap } from '@/hooks/use-swap'
import { useWallets } from '@/hooks/use-wallets'
import { QuoteResponseRoute } from '@swapkit/api'

type UseQote = {
  isLoading: boolean
  refetch: (options?: RefetchOptions) => void
  quote?: QuoteResponseRoute
  error: Error | null
}

export const useQuote = (): UseQote => {
  const { amountFrom, destination, slippage } = useSwap()
  const { selected } = useWallets()
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()

  const params = useMemo(
    () => ({
      amount: amountFrom > 0n ? amountFrom.toString() : undefined,
      fromAsset: assetFrom?.asset,
      toAsset: assetTo?.asset,
      affiliate: ['sto'],
      affiliateBps: [0],
      sourceAddress: selected?.address,
      destination: destination?.address,
      streamingInterval: 1,
      streamingQuantity: 0,
      liquidity_tolerance_bps: slippage ? slippage * 100 : undefined
    }),
    [amountFrom, assetFrom?.asset, assetTo?.asset, destination?.address, selected?.address, slippage]
  )

  const {
    data: quote,
    refetch,
    isLoading,
    isRefetching,
    error
  } = useQuery({
    queryKey: ['quote', params],
    queryFn: () => {
      return getSwapkitQuote({
        buyAsset: params.toAsset,
        destinationAddress: params.destination,
        sellAmount: new Decimal(params.amount || '0').div(10 ** 8).toString(),
        sellAsset: params.fromAsset,
        affiliate: 'sto',
        affiliateFee: 0,
        sourceAddress: params.sourceAddress,
        includeTx: !!(params.destination && selected?.address),
        slippage: slippage
      })
    },
    enabled: !!(params.amount && params.fromAsset && params.toAsset),
    retry: false
  })

  let newError = error
  if (error instanceof AxiosError) {
    const errors = error.response?.data?.providerErrors
    if (errors && errors[0]?.message) {
      newError = new Error(errors[0]?.message)
    } else {
      newError = new Error(error.response?.data?.message || error.message)
    }
  }

  return {
    isLoading: isLoading || isRefetching,
    refetch,
    quote: isLoading || isRefetching || error ? undefined : quote,
    error: newError
  }
}
