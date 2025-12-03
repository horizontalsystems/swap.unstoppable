import { useQuery } from '@tanstack/react-query'
import { useAssetFrom, useSwap } from '@/hooks/use-swap'
import { AssetValue, EVMChains } from '@uswap/core'
import { type EVMChain } from '@uswap/helpers'
import { useQuote } from '@/hooks/use-quote'
import { useWallets } from '@/hooks/use-wallets'
import { useBalance } from '@/hooks/use-balance'
import { getUSwap } from '@/lib/wallets'

type UseSimulation = {
  approveData?: {
    spender: string
    contract: string
    amount: bigint
  } | null
  isLoading: boolean
  error: Error | null
}

export const useSimulation = (): UseSimulation => {
  const uSwap = getUSwap()
  const assetFrom = useAssetFrom()
  const { selected } = useWallets()
  const { valueFrom } = useSwap()
  const { quote } = useQuote()
  const { balance } = useBalance()

  const {
    data: approveData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['simulation', quote],
    queryFn: async () => {
      if (!quote || !selected || !assetFrom) {
        return null
      }

      if (!EVMChains.includes(assetFrom.chain as EVMChain)) {
        return null
      }

      const assetValue = await AssetValue.from({
        asset: quote.sellAsset,
        value: quote.sellAmount,
        asyncTokenLookup: true
      })

      if (!assetValue.isGasAsset && assetValue.address && quote.meta.approvalAddress) {
        const wallet = uSwap.getWallet<EVMChain>(selected.provider, selected.network as EVMChain)
        const approved = await wallet?.isApproved({
          assetAddress: assetValue.address,
          spenderAddress: quote.meta.approvalAddress,
          from: selected.address,
          amount: assetValue.getValue('bigint')
        })

        if (!approved) {
          return {
            spender: quote.meta.approvalAddress,
            contract: assetValue.address,
            amount: assetValue.getValue('bigint')
          }
        }
      }

      return null
    },
    enabled: !!(
      selected &&
      quote &&
      assetFrom &&
      !valueFrom.eqValue(0) &&
      balance?.spendable &&
      balance.spendable.gte(valueFrom)
    ),
    retry: false,
    refetchOnMount: false
  })

  return {
    isLoading,
    approveData,
    error
  }
}
