import { useQuery } from '@tanstack/react-query'
import { AssetValue, EVMChains } from '@uswap/core'
import { type EVMChain } from '@uswap/helpers'
import { useBalance } from '@/hooks/use-balance'
import { useQuote } from '@/hooks/use-quote'
import { useAssetFrom, useSwap } from '@/hooks/use-swap'
import { useWallets } from '@/hooks/use-wallets'
import { isNativeSentinel } from '@/lib/robinhood/asset-list'
import { getUSwap } from '@/lib/wallets'
import { uSwapWalletOption } from '@/types'

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

      const approvalSpender = quote.approvalSpender
      // `isGasAsset` is not enough on Robinhood Chain: the aggregator addresses its native coin by
      // the EIP-7528 sentinel and echoes the route back as `ROBINHOOD.UNKNOWN-0XEEEE…`, which parses
      // as a token with an address. Approving it would call `allowance` on an address that holds no
      // contract, and LI.FI returns an `approvalSpender` on native sells too, so this is reached.
      const isNative = assetValue.isGasAsset || isNativeSentinel(assetValue.address)
      if (!isNative && assetValue.address && approvalSpender) {
        const provider = uSwapWalletOption(selected.provider)
        const wallet = provider && uSwap.getWallet<EVMChain>(provider, selected.network as EVMChain)
        const approved = await wallet?.isApproved({
          assetAddress: assetValue.address,
          spenderAddress: approvalSpender,
          from: selected.address,
          amount: assetValue.getValue('bigint')
        })

        if (!approved) {
          return {
            spender: approvalSpender,
            contract: assetValue.address,
            amount: assetValue.getValue('bigint')
          }
        }
      }

      return null
    },
    enabled: !!(selected && quote && assetFrom && !valueFrom.eqValue(0) && balance?.spendable && balance.spendable.gte(valueFrom)),
    retry: false,
    refetchOnMount: false
  })

  return {
    isLoading,
    approveData,
    error
  }
}
