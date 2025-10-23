import { AxiosError } from 'axios'
import { RefetchOptions, useQuery } from '@tanstack/react-query'
import { getSwapkitQuote } from '@/lib/api'
import { useAssetFrom, useAssetTo, useSwap } from '@/hooks/use-swap'
import { useWallets } from '@/hooks/use-wallets'
import { QuoteResponseRoute } from '@swapkit/api'

type UseQuote = {
  isLoading: boolean
  refetch: (options?: RefetchOptions) => void
  quote?: QuoteResponseRoute
  error: Error | null
}

export const useQuote = (): UseQuote => {
  const { valueFrom, destination, slippage } = useSwap()
  const { selected } = useWallets()
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()

  const queryKey = [
    'quote',
    valueFrom.toSignificant(),
    assetFrom?.asset,
    assetTo?.asset,
    destination?.address,
    selected?.address,
    assetFrom?.chain,
    selected?.network,
    assetTo?.chain,
    destination?.network,
    slippage
  ]
  const {
    data: quote,
    refetch,
    isLoading,
    isRefetching,
    error
  } = useQuery({
    queryKey: queryKey,
    queryFn: () => {
      if (valueFrom.eqValue(0)) return
      if (!assetFrom?.asset || !assetTo?.asset || !selected?.address || !destination?.address) return
      if (assetFrom?.chain !== selected?.network) return
      if (assetTo?.chain !== destination?.network) return

      return getSwapkitQuote({
        buyAsset: assetTo.asset,
        destinationAddress: destination.address,
        sellAmount: valueFrom.toSignificant(),
        sellAsset: assetFrom.asset,
        affiliate: process.env.NEXT_PUBLIC_AFFILIATE,
        affiliateFee: Number(process.env.NEXT_PUBLIC_AFFILIATE_FEE),
        sourceAddress: selected.address,
        includeTx: false,
        slippage: slippage
      })
    },
    enabled: !!(
      !valueFrom.eqValue(0) &&
      assetFrom?.asset &&
      assetTo?.asset &&
      selected?.address &&
      destination?.address &&
      assetFrom?.chain === selected?.network &&
      assetTo?.chain === destination?.network
    ),
    retry: false,
    refetchOnMount: false
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
