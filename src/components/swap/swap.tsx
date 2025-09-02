'use client'

import { useMemo } from 'react'
import { Msg, MsgSwap, Simulation } from 'rujira.js'
import { LoaderCircle } from 'lucide-react'
import { SwapButton } from '@/components/swap/swap-button'
import { SwapAddressFrom } from '@/components/swap/swap-address-from'
import { SwapAddressTo } from '@/components/swap/swap-address-to'
import { SwapSlippage } from '@/components/swap/swap-slippage'
import { SwapInputFrom } from '@/components/swap/swap-input-from'
import { SwapToggleAssets } from '@/components/swap/swap-toggle-assets'
import { SwapInputTo } from '@/components/swap/swap-input-to'
import { SwapDetails } from '@/components/swap/swap-details'
import { useAccounts } from '@/context/accounts-provider'
import { useTransactions } from '@/hook/use-transactions'
import { useQuote } from '@/hook/use-quote'
import { wallets } from '@/wallets'
import { useSwap } from '@/hook/use-swap'

export const Swap = () => {
  const { selected, context } = useAccounts()
  const { fromAsset, fromAmount, destination, toAsset, slippageLimit } = useSwap()
  const { setTransaction } = useTransactions()

  const params = useMemo(
    () => ({
      amount: fromAmount > 0n ? fromAmount.toString() : undefined,
      fromAsset: fromAsset?.asset,
      toAsset: toAsset?.asset,
      affiliate: [],
      affiliateBps: [],
      destination: destination?.address,
      streamingInterval: 1,
      streamingQuantity: '0',
      liquidityToleranceBps: Number(slippageLimit)
    }),
    [fromAmount, fromAsset, toAsset, destination, slippageLimit]
  )

  const { quote, isLoading, error } = useQuote(params)

  const inboundAddress = quote
    ? {
        address: quote.inbound_address,
        dustThreshold: BigInt(quote.dust_threshold || '0'),
        gasRate: BigInt(quote.recommended_gas_rate || '0'),
        router: quote.router || undefined
      }
    : undefined

  const simulate = selected && wallets.simulate(context, selected, inboundAddress)
  const signAndBroadcast = selected
    ? async (simulation: Simulation, msg: Msg) => {
        const func = wallets.signAndBroadcast(context, selected, inboundAddress)
        const res = await func(simulation, msg)

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
      }
    : undefined

  const msg = useMemo(() => {
    return quote?.memo && fromAsset && fromAmount > 0n ? new MsgSwap(fromAsset, fromAmount, quote.memo) : null
  }, [fromAmount, fromAsset, quote?.memo])

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-medium text-white">Swap</h1>
            {isLoading && <LoaderCircle className="animate-spin" />}
          </div>
          <SwapSlippage />
        </div>

        <div className="bg-deep-black border-blade rounded-3xl border-1">
          <div className="border-b-1 p-4">
            <SwapAddressFrom asset={fromAsset} />
          </div>

          <SwapInputFrom />
          <SwapToggleAssets />
          <SwapInputTo quote={quote} />

          <div className="border-t-1 p-4">
            <SwapAddressTo asset={toAsset} />
          </div>
        </div>

        <SwapDetails quote={quote} isLoading={isLoading} error={error} />
        <SwapButton msg={msg} signer={{ simulate, signAndBroadcast }} />
      </div>
    </div>
  )
}
