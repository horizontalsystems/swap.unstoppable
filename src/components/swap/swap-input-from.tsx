import { SwapSelectCoin } from '@/components/swap/swap-select-coin'
import { useState } from 'react'
import { ChevronDown, Wallet } from 'lucide-react'
import { useSwapContext } from '@/context/swap-provider'
import { DecimalInput } from '@/components/decimal-input'

export const SwapInputFrom = () => {
  const [open, setOpen] = useState(false)
  const { fromAsset, setSwap, fromAmount, setFromAmount } = useSwapContext()

  return (
    <div className="rounded-xl bg-gray-800 p-4">
      <div className="mb-2 flex items-start justify-between">
        <div className="flex-1">
          <DecimalInput
            className="w-full bg-transparent text-2xl font-medium text-white outline-none"
            amount={fromAmount}
            onAmountChange={e => setFromAmount(e)}
            autoComplete="off"
          />
          <div className="mt-1 text-sm text-gray-400">$0.00</div>
        </div>
        <div className="flex items-center gap-3" onClick={() => setOpen(true)}>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400">
            <Wallet className="h-6 w-6 text-black" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-lg font-semibold text-white">{fromAsset?.metadata.symbol}</span>
            <span className="text-sm text-neutral-400">{fromAsset?.type}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-white" />
        </div>
      </div>

      {/* Percentage Buttons */}
      <div className="mt-4 flex gap-2">
        <button className="rounded bg-gray-700 px-3 py-1 text-sm text-gray-300 transition-colors hover:bg-gray-600">
          Clear
        </button>
        <button className="rounded bg-gray-600 px-3 py-1 text-sm text-white transition-colors hover:bg-gray-500">
          50%
        </button>
        <button className="rounded bg-gray-700 px-3 py-1 text-sm text-gray-300 transition-colors hover:bg-gray-600">
          100%
        </button>
      </div>

      <SwapSelectCoin
        key="select-from"
        isOpen={open}
        selected={fromAsset}
        isInput={true}
        onClose={() => setOpen(false)}
        onSelectAsset={v => {
          setSwap(v)
        }}
      />
    </div>
  )
}
