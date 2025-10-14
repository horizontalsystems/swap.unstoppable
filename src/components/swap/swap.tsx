'use client'

import { SwapAddressFrom } from '@/components/swap/swap-address-from'
import { SwapAddressTo } from '@/components/swap/swap-address-to'
import { SwapSettings } from '@/components/swap/swap-settings'
import { SwapInputFrom } from '@/components/swap/swap-input-from'
import { SwapInputTo } from '@/components/swap/swap-input-to'
import { SwapToggleAssets } from '@/components/swap/swap-toggle-assets'
import { SwapError } from '@/components/swap/swap-error'
import { SwapDetails } from '@/components/swap/swap-details'
import { SwapButton } from '@/components/swap/swap-button'
import { SwapBetaAlert } from '@/components/swap/swap-beta-alert'
import { getSelectedContext, useAccounts } from '@/hooks/use-accounts'
import { transactionStore } from '@/store/transaction-store'
import { useSimulation } from '@/hooks/use-simulation'
import { useQuote } from '@/hooks/use-quote'
import { useAssetFrom, useAssetTo, useSwap } from '@/hooks/use-swap'
import { signAndBroadcast } from '@/wallets'
import { toast } from 'sonner'
import { useBalance } from '@/hooks/use-balance'

export const Swap = () => {
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const { selected } = useAccounts()
  const { amountFrom, setAmountFrom } = useSwap()
  const { refetch: refetchBalance } = useBalance()
  const { quote, error: quoteError } = useQuote()
  const { simulationData, error: simulationError } = useSimulation()
  const { setTransaction } = transactionStore()

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
          fromAsset: assetFrom,
          fromAmount: amountFrom.toString(),
          toAmount: quote?.expected_amount_out,
          toAsset: assetTo,
          status: 'pending'
        })

        setAmountFrom(0n)
        refetchBalance()

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
    <div className="flex flex-col items-center justify-center px-4 pb-4 md:pb-20">
      <div className="w-full max-w-md">
        <SwapBetaAlert />

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-leah text-2xl font-medium">Swap</h1>
          </div>
          <SwapSettings />
        </div>

        <div className="bg-lawrence border-blade rounded-3xl border-1">
          <SwapAddressFrom />
          <SwapInputFrom />
          <SwapToggleAssets />
          <SwapInputTo quote={quote} />
          <SwapAddressTo />
        </div>

        <SwapError error={quoteError || simulationError} />
        <SwapButton onSwap={onSwap} />
        <SwapDetails />
      </div>
    </div>
  )
}
