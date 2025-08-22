'use client'

import { ArrowUpDown, SlidersHorizontal } from 'lucide-react'
import { SwapAddress } from '@/components/swap/swap-address'
import { useAccounts } from '@/context/accounts-provider'
import { useSwapContext } from '@/context/swap-provider'
import { SwapInputFrom } from '@/components/swap/swap-input-from'
import { SwapInputTo } from '@/components/swap/swap-input-to'
import { useMemo } from 'react'
import { useQuote } from '@/hook/use-quote'

export const Swap = () => {
  const { selected, select } = useAccounts()
  const { fromAsset, fromAmount, destination, setDestination, setSwap, toAsset, slippageLimit } = useSwapContext()

  const params = useMemo(
    () => ({
      amount: fromAmount.toString(),
      fromAsset: fromAsset?.asset || '',
      toAsset: toAsset?.asset || '',
      affiliate: [],
      affiliateBps: [],
      destination: destination?.address,
      streamingInterval: 1,
      streamingQuantity: '0',
      liquidityToleranceBps: Number(slippageLimit)
    }),
    [fromAmount, fromAsset, toAsset, destination, slippageLimit]
  )

  const { quote } = useQuote(params)

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">Swap</h1>
          <button className="rounded-full bg-gray-800 px-2 py-2">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 rounded-2xl bg-gray-900 p-6">
          <div className="space-y-4">
            <SwapAddress asset={fromAsset} account={selected} onSelect={select} />
            <SwapInputFrom />
          </div>

          <div className="flex justify-center">
            <button
              className="group rounded-lg bg-gray-800 p-2 transition-colors hover:bg-gray-700"
              onClick={() => setSwap(toAsset, fromAsset)}
            >
              <ArrowUpDown className="h-5 w-5 text-gray-400 transition-colors group-hover:text-white" />
            </button>
          </div>

          <div className="space-y-4">
            <SwapInputTo quote={quote} />
            <SwapAddress asset={toAsset} account={destination} onSelect={setDestination} />
          </div>
        </div>

        <button className="mt-6 w-full rounded-2xl bg-gray-200 py-4 font-medium text-black transition-colors hover:bg-white">
          Swap
        </button>
      </div>
    </div>
  )
}
