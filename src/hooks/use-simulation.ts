import { useQuery } from '@tanstack/react-query'
import { useSwap } from '@/hooks/use-swap'
import { InboundAddress, MsgSwap, Simulation } from 'rujira.js'
import { useQuote } from '@/hooks/use-quote'
import { getSelectedContext, useAccounts } from '@/context/accounts-provider'
import { wallets } from '@/wallets'

type SimulationData = {
  simulation: Simulation
  inboundAddress: InboundAddress
  msg: MsgSwap
}

type UseSimulation = {
  simulationData?: SimulationData
  isLoading: boolean
  error: Error | null
}

export const useSimulation = (): UseSimulation => {
  const { selected } = useAccounts()
  const { fromAsset, fromAmount } = useSwap()
  const { quote } = useQuote()

  const {
    data: simulationData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['simulation', quote],
    queryFn: async () => {
      if (!quote || !selected || !fromAsset || fromAmount == 0n) {
        return
      }

      const inboundAddress = {
        address: quote.inbound_address,
        dustThreshold: BigInt(quote.dust_threshold || '0'),
        gasRate: BigInt(quote.recommended_gas_rate || '0'),
        router: quote.router || undefined
      }

      const msg = new MsgSwap(fromAsset, fromAmount, quote.memo)

      const simulateFunc = wallets.simulate(getSelectedContext(), selected, inboundAddress)
      const simulation = await simulateFunc(msg)

      return { simulation: simulation, inboundAddress, msg }
    },
    enabled: !!(selected && quote && fromAsset && fromAmount > 0n),
    retry: false
  })

  return {
    isLoading,
    simulationData,
    error
  }
}
