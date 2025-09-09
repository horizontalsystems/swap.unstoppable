import { useQuery } from '@tanstack/react-query'
import { useSwap } from '@/hooks/use-swap'
import { getSelectedContext, useAccounts } from '@/hooks/use-accounts'
import { BalanceFetcher } from '@/wallets/balances'
import { gasToken, MsgSwap } from 'rujira.js'
import { simulate } from '@/wallets'
import { JsonRpcSigner } from 'ethers'
import { useInboundAddresses } from '@/hooks/use-inbound-addresses'

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
  const { selected } = useAccounts()
  const { fromAsset } = useSwap()
  const { data: inboundAddresses } = useInboundAddresses()

  const {
    data: balance,
    refetch,
    isLoading,
    error
  } = useQuery({
    queryKey: ['balance', fromAsset?.asset, fromAsset?.chain, selected?.address],
    queryFn: async () => {
      if (!selected || !fromAsset || !inboundAddresses) {
        return null
      }

      const amount = await BalanceFetcher.fetch({
        network: fromAsset.chain,
        address: selected.address,
        asset: fromAsset.asset
      })

      let fee = 0n

      const [, assetId] = fromAsset.asset.split('.')

      if (assetId.toUpperCase() === gasToken(fromAsset.chain).symbol && amount > 0n) {
        const address = inboundAddresses.find((a: any) => a.chain === fromAsset.chain)

        if (!address) {
          return null
        }

        const inboundAddress = {
          address: address.address,
          dustThreshold: BigInt(address.dust_threshold || '0'),
          gasRate: BigInt(address.gas_rate || '0'),
          router: address.router || undefined
        }

        const context = getSelectedContext()

        let estimateAmount = amount

        if (context instanceof JsonRpcSigner) {
          estimateAmount = 1n
        } else if (typeof context === 'object' && 'chain' in context) {
          // todo
        }

        const msg = new MsgSwap(
          fromAsset,
          estimateAmount,
          '================================================================================'
        ) // todo

        const simulateFunc = simulate(context, selected, inboundAddress)
        const simulation = await simulateFunc(msg)

        const simulationFee = (simulation.amount * BigInt(1e8)) / BigInt(10 ** simulation.decimals)
        fee = (simulationFee * 11n) / 10n // surcharge by 10%
      }

      const spendable = amount - fee > 0 ? amount - fee : 0n

      return { amount, spendable }
    },
    enabled: !!(selected && fromAsset && inboundAddresses),
    retry: false
  })

  return {
    balance,
    refetch,
    isLoading,
    error
  }
}
