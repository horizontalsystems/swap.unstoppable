import { useQuery } from '@tanstack/react-query'
import { useAssetFrom } from '@/hooks/use-swap'
import { useWallets } from '@/hooks/use-wallets'
import {
  AssetValue,
  Chain,
  CosmosChain,
  CosmosChains,
  EVMChain,
  EVMChains,
  FeeOption,
  isGasAsset,
  SwapKitNumber,
  UTXOChain,
  UTXOChains
} from '@uswap/core'
import { getBalance } from '@/lib/api'
import { getUSwap } from '@/lib/wallets'
import { estimateTransactionFee } from '@uswap/toolboxes/cosmos'

type UseBalance = {
  balance?: {
    total: SwapKitNumber
    spendable: SwapKitNumber
  } | null
  refetch: () => void
  isLoading: boolean
  error: Error | null
}

export const useBalance = (): UseBalance => {
  const uSwap = getUSwap()
  const assetFrom = useAssetFrom()
  const { selected } = useWallets()

  const {
    data: balance,
    refetch,
    isLoading,
    error
  } = useQuery({
    queryKey: ['balance', assetFrom?.identifier, selected?.provider],
    queryFn: async () => {
      if (!selected || !assetFrom) {
        return null
      }

      const wallet = uSwap.getWallet(selected.provider, assetFrom.chain)

      if (!wallet) {
        return null
      }

      let value = AssetValue.from({ chain: assetFrom.chain, value: 0 })

      const finder = (b: AssetValue) =>
        `${b.chain}.${b.isSynthetic || b.isTradeAsset ? b.ticker : b.symbol}`.toLowerCase() ===
        assetFrom.identifier.toLowerCase()

      if (assetFrom.chain === Chain.Near) {
        const balances = await getBalance(assetFrom.chain, wallet.address, assetFrom.identifier)
        const balance = balances.find(finder)

        if (balance) value = balance
      } else if ('getBalance' in wallet) {
        const balances = await wallet.getBalance(wallet.address, true)
        const balance = balances.find(finder)

        if (balance) value = balance
      }

      const estimateFee = async () => {
        try {
          if (EVMChains.includes(assetFrom.chain as EVMChain)) {
            const gasLimit = 300_000n
            const evmWallet = uSwap.getWallet<EVMChain>(selected.provider, selected.network as EVMChain)

            const estimateFn = evmWallet.estimateGasPrices
            const gasPrices = await (typeof estimateFn === 'function' ? estimateFn() : estimateFn)
            const { gasPrice, maxFeePerGas, maxPriorityFeePerGas } = gasPrices[FeeOption.Fast]

            if (gasPrice) {
              return SwapKitNumber.fromBigInt(gasPrice * gasLimit, assetFrom.decimals)
            }

            if (maxFeePerGas && maxPriorityFeePerGas) {
              const fee = (maxFeePerGas + maxPriorityFeePerGas) * gasLimit
              return SwapKitNumber.fromBigInt(fee, assetFrom.decimals)
            }

            return new SwapKitNumber(0)
          } else if (UTXOChains.includes(assetFrom.chain as UTXOChain)) {
            const utxoWallet = uSwap.getWallet<UTXOChain>(selected.provider, selected.network as UTXOChain)
            return await utxoWallet.estimateTransactionFee({
              recipient: selected.address,
              sender: selected.address,
              assetValue: value,
              memo: '00000000000000000000000000000000000000000000000000000000000000000000000000000000', // 80 chars
              feeOptionKey: FeeOption.Fast
            })
          } else if (CosmosChains.includes(assetFrom.chain as CosmosChain)) {
            return estimateTransactionFee({ assetValue: value })
          } else if (assetFrom.chain === Chain.Tron) {
            return new SwapKitNumber(1)
          }
        } catch (e) {
          console.log({ e })
        }

        return new SwapKitNumber(0)
      }

      const fee =
        isGasAsset({ chain: assetFrom.chain, symbol: assetFrom.ticker }) && value.gt(0)
          ? await estimateFee()
          : new SwapKitNumber(0)

      return {
        total: value,
        spendable: value.gt(fee) ? value.sub(fee) : new SwapKitNumber(0)
      }
    },
    enabled: !!(selected && assetFrom),
    retry: false,
    refetchOnMount: false
  })

  return {
    balance,
    refetch,
    isLoading,
    error
  }
}
