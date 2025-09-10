'use client'

import { SwapAddressFrom } from '@/components/swap/swap-address-from'
import { SwapAddressTo } from '@/components/swap/swap-address-to'
import { SwapSlippage } from '@/components/swap/swap-slippage'
import { SwapInputFrom } from '@/components/swap/swap-input-from'
import { SwapInputTo } from '@/components/swap/swap-input-to'
import { SwapToggleAssets } from '@/components/swap/swap-toggle-assets'
import { SwapWarning } from '@/components/swap/swap-warning'
import { SwapDetails } from '@/components/swap/swap-details'
import { SwapButton } from '@/components/swap/swap-button'
import { getSelectedContext, useAccounts } from '@/hooks/use-accounts'
import { useTransactions } from '@/hooks/use-transactions'
import { useSimulation } from '@/hooks/use-simulation'
import { useQuote } from '@/hooks/use-quote'
import { useSwap } from '@/hooks/use-swap'
import { signAndBroadcast } from '@/wallets'
import { toast } from 'sonner'

export const Swap = () => {
  const { selected } = useAccounts()
  const { fromAsset, fromAmount, toAsset } = useSwap()
  const { quote, error: quoteError } = useQuote()
  const { simulationData, error: simulationError } = useSimulation()
  const { setTransaction } = useTransactions()

  const onSwap = async () => {
    if (!simulationData || !selected) {
      return
    }

    const func = signAndBroadcast(getSelectedContext(), selected, simulationData.inboundAddress)
    const broadcast = func(simulationData.simulation, simulationData.msg)
      .then(res => {
        setTransaction({
          hash: res.txHash,
          timestamp: new Date(),
          fromAsset: fromAsset,
          fromAmount: fromAmount.toString(),
          toAmount: quote?.expected_amount_out,
          toAsset: toAsset,
          status: 'pending'
        })

        return res
      })
      .catch(err => {
        console.error(err)
        throw err
      })

    toast.promise(broadcast, {
      loading: 'Submitting Transaction',
      success: () => 'Transaction submitted',
      error: (err: any) => {
        console.error(err)
        return 'Error Submitting Transaction'
      }
    })
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-medium text-white">Swap</h1>
          </div>
          <SwapSlippage />
        </div>

        <div className="bg-lawrence border-blade rounded-3xl border-1">
          <SwapAddressFrom />
          <SwapInputFrom />
          <SwapToggleAssets />
          <SwapInputTo quote={quote} />
          <SwapAddressTo />
        </div>

        <SwapDetails quote={quote} />
        <SwapButton onSwap={onSwap} />
        <SwapWarning error={quoteError || simulationError} />
      </div>
    </div>
  )
}
