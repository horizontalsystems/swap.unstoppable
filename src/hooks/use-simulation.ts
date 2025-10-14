import { useQuery } from '@tanstack/react-query'
import { useAssetFrom, useSwap } from '@/hooks/use-swap'
import { AssetValue, EVMChains } from '@swapkit/core'
import { type EVMChain } from '@swapkit/helpers'
import { useQuote } from '@/hooks/use-quote'
import { useAccounts } from '@/hooks/use-wallets'
import { useBalance } from '@/hooks/use-balance'
import { getSwapKit } from '@/lib/wallets'

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
  const swapkit = getSwapKit()
  const assetFrom = useAssetFrom()
  const { selected } = useAccounts()
  const { amountFrom } = useSwap()
  const { quote } = useQuote()
  const { balance } = useBalance()

  const {
    data: approveData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['simulation', quote],
    queryFn: async () => {
      if (!quote || !quote.targetAddress || !selected || !assetFrom) {
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

      if (!assetValue.isGasAsset && assetValue.address) {
        const wallet = swapkit.getWallet<EVMChain>(selected.provider)
        const approved = await wallet?.isApproved({
          assetAddress: assetValue.address,
          spenderAddress: quote.targetAddress,
          from: selected.address,
          amount: assetValue.getValue('bigint')
        })

        if (!approved) {
          return {
            spender: quote.targetAddress,
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
      amountFrom > 0n &&
      balance?.spendable &&
      balance.spendable >= amountFrom
    ),
    retry: false
  })

  return {
    isLoading,
    approveData,
    error
  }
}
