import { useQuery } from '@tanstack/react-query'
import { useAssetFrom, useSwap } from '@/hooks/use-swap'
import { useWallets } from '@/hooks/use-wallets'
import { BalanceFetcher } from '@/wallets/balances'
import { useInboundAddresses } from '@/hooks/use-inbound-addresses'
import {
  AssetValue,
  Chain,
  type CosmosChain,
  CosmosChains,
  type EVMChain,
  EVMChains,
  FeeOption,
  type UTXOChain,
  UTXOChains
} from '@swapkit/core'
import { getSwapKit } from '@/lib/wallets'
import { estimateTransactionFee } from '@swapkit/toolboxes/cosmos'

type UseBalance = {
  balance?: {
    amount: bigint
    spendable: bigint
  } | null
  refetch: () => void
  isLoading: boolean
  error: Error | null
}

export const useBalance = (): UseBalance => {
  const swapkit = getSwapKit()
  const assetFrom = useAssetFrom()
  const { amountFrom } = useSwap()
  const { selected } = useWallets()
  const { data: inboundAddresses } = useInboundAddresses()

  const {
    data: balance,
    refetch,
    isLoading,
    error
  } = useQuery({
    queryKey: ['balance', assetFrom?.asset, assetFrom?.chain, selected?.address],
    queryFn: async () => {
      if (!selected || !assetFrom || !inboundAddresses) {
        return null
      }

      const amount = await BalanceFetcher.fetch(assetFrom.asset, selected.address)
      const baseAsset = AssetValue.from({ asset: assetFrom.asset })

      let fee = 0n
      if (baseAsset.isGasAsset && amount > 0n) {
        const inbound = inboundAddresses.find((a: any) => a.chain === assetFrom.chain)
        if (!inbound) {
          return null
        }

        let estimation: AssetValue | undefined

        if (CosmosChains.includes(assetFrom.chain as CosmosChain)) {
          const estimate = estimateTransactionFee({ assetValue: baseAsset as any })
          fee = estimate.bigIntValue * BigInt(10 ** (baseAsset.decimal || 0))
        }

        if (EVMChains.includes(assetFrom.chain as EVMChain)) {
          const wallet = swapkit.getWallet<EVMChain>(selected.provider, selected.network as EVMChain)
          estimation = await wallet?.estimateTransactionFee({
            to: inbound.address,
            from: selected.address,
            value: amountFrom,
            data: '0x',
            chain: assetFrom.chain as EVMChain,
            feeOption: FeeOption.Fast
          })
        }

        if (UTXOChains.includes(assetFrom.chain as UTXOChain)) {
          const wallet = swapkit.getWallet<UTXOChain>(selected.provider, selected.network as UTXOChain)
          estimation = await wallet?.estimateTransactionFee({
            recipient: inbound.address,
            sender: selected.address,
            assetValue: AssetValue.from({ chain: assetFrom.chain, value: amountFrom }),
            feeOptionKey: FeeOption.Fast
          })
        }

        if (assetFrom.chain === Chain.Tron) {
          const wallet = swapkit.getWallet<Chain.Tron>(selected.provider, selected.network as Chain.Tron)
          estimation = await wallet?.estimateTransactionFee({
            sender: selected.address,
            recipient: inbound.address,
            assetValue: AssetValue.from({ chain: assetFrom.chain, value: amountFrom }),
            feeOptionKey: FeeOption.Fast
          })
        }

        if (estimation) {
          const simulationFee = (estimation.bigIntValue * BigInt(1e8)) / BigInt(10 ** (estimation.decimal || 0))
          fee = (simulationFee * 11n) / 10n // surcharge by 10%
        }
      }

      return {
        amount,
        spendable: amount - fee > 0n ? amount - fee : 0n
      }
    },
    enabled: !!(selected && assetFrom && inboundAddresses),
    retry: false
  })

  return {
    balance,
    refetch,
    isLoading,
    error
  }
}
