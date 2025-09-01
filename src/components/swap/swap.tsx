'use client'

import { useMemo } from 'react'
import { Msg, MsgSwap, Simulation } from 'rujira.js'
import { ArrowDown, LoaderCircle, SlidersHorizontal } from 'lucide-react'
import { SwapButton } from '@/components/swap/swap-button'
import { SwapAddressFrom } from '@/components/swap/swap-address-from'
import { SwapAddressTo } from '@/components/swap/swap-address-to'
import { Separator } from '@/components/ui/separator'
import { SwapInputFrom } from '@/components/swap/swap-input-from'
import { SwapInputTo } from '@/components/swap/swap-input-to'
import { SwapDetails } from '@/components/swap/swap-details'
import { useAccounts } from '@/context/accounts-provider'
import { useSwapContext } from '@/context/swap-provider'
import { useTransactions } from '@/hook/use-transactions'
import { useQuote } from '@/hook/use-quote'
import { wallets } from '@/wallets'

export const Swap = () => {
  const { selected, context } = useAccounts()
  const { fromAsset, fromAmount, destination, setSwap, toAsset, slippageLimit } = useSwapContext()
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
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-medium text-white">Swap</h1>
            {isLoading && <LoaderCircle className="animate-spin" />}
          </div>
          <button className="bg-bran rounded-full px-2 py-2">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className="bg-deep-black border-blade rounded-3xl border-1">
          <div className="border-b-1 p-4">
            <SwapAddressFrom asset={fromAsset} />
          </div>

          <SwapInputFrom />

          <div className="relative flex items-center justify-center overflow-hidden">
            <Separator />
            <div className="bg-blade rounded-full p-2">
              <ArrowDown className="text-gray h-4 w-4" onClick={() => setSwap(toAsset, fromAsset)} />
            </div>
            <Separator />
          </div>

          <SwapInputTo quote={quote} />

          <div className="border-t-1 p-4">
            <SwapAddressTo asset={toAsset} />
          </div>
        </div>
        {error && (
          <div className="mt-2 px-6">
            <div className="overflow-hidden text-red-500">{error}</div>
          </div>
        )}

        <SwapDetails quote={quote} />
        <SwapButton msg={msg} signer={{ simulate, signAndBroadcast }} />
      </div>
    </div>
  )
}
