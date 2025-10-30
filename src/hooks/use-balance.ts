import { useQuery } from '@tanstack/react-query'
import { useAssetFrom } from '@/hooks/use-swap'
import { useWallets } from '@/hooks/use-wallets'
import { useInboundAddresses } from '@/hooks/use-inbound-addresses'
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
} from '@swapkit/core'
import { getSwapKit } from '@/lib/wallets'
import { estimateTransactionFee } from '@swapkit/toolboxes/cosmos'

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
  const swapKit = getSwapKit()
  const assetFrom = useAssetFrom()
  const { selected } = useWallets()
  const { data: inboundAddresses } = useInboundAddresses()

  const {
    data: balance,
    refetch,
    isLoading,
    error
  } = useQuery({
    queryKey: ['balance', assetFrom?.identifier, selected?.address],
    queryFn: async () => {
      if (!selected || !assetFrom || !inboundAddresses) {
        return null
      }

      const wallet = swapKit.getWallet(selected.provider, selected.network)

      if (!wallet) {
        return null
      }

      let value = AssetValue.from({ chain: assetFrom.chain, value: 0 })

      if ('getBalance' in wallet) {
        const balances = await wallet.getBalance(wallet.address, true)
        const balance = balances.find(
          b => `${b.chain}.${b.symbol}`.toLowerCase() === assetFrom.identifier.toLowerCase()
        )

        if (balance) {
          value = balance
        }
      }

      let fee = new SwapKitNumber(0)

      try {
        if (isGasAsset({ chain: assetFrom.chain, symbol: assetFrom.ticker }) && value.gt(0)) {
          const inbound = inboundAddresses.find((a: any) => a.chain === assetFrom.chain)

          if (!inbound) {
            return null
          }

          if (EVMChains.includes(assetFrom.chain as EVMChain)) {
            const evmWallet = swapKit.getWallet<EVMChain>(selected.provider, selected.network as EVMChain)
            fee = await evmWallet.estimateTransactionFee({
              to: inbound.address,
              from: selected.address,
              value: value.getBaseValue('bigint'),
              data: '0x',
              chain: assetFrom.chain as EVMChain,
              feeOption: FeeOption.Fast
            })
          } else if (UTXOChains.includes(assetFrom.chain as UTXOChain)) {
            const utxoWallet = swapKit.getWallet<UTXOChain>(selected.provider, selected.network as UTXOChain)
            fee = await utxoWallet.estimateTransactionFee({
              recipient: inbound.address,
              sender: selected.address,
              assetValue: value,
              feeOptionKey: FeeOption.Fast
            })
          } else if (CosmosChains.includes(assetFrom.chain as CosmosChain)) {
            fee = estimateTransactionFee({ assetValue: value })
          } else if (assetFrom.chain === Chain.Tron) {
            const tronWallet = swapKit.getWallet<Chain.Tron>(selected.provider, selected.network as Chain.Tron)
            fee = await tronWallet.estimateTransactionFee({
              sender: selected.address,
              recipient: inbound.address,
              assetValue: value,
              feeOptionKey: FeeOption.Fast
            })
          }
        }
      } catch (e) {
        console.log({ e })
      }

      return {
        total: value,
        spendable: value.gt(fee) ? value.sub(fee) : new SwapKitNumber(0)
      }
    },
    enabled: !!(selected && assetFrom && inboundAddresses),
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
