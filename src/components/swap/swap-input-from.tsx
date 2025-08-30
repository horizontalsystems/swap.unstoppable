import Decimal from 'decimal.js'
import { useState } from 'react'
import { networkLabel } from 'rujira.js'
import { ChevronDown, Wallet } from 'lucide-react'
import { DecimalInput, parseFixed } from '@/components/decimal-input'
import { DecimalFiat } from '@/components/decimal-fiat'
import { SwapSelectCoin } from '@/components/swap/swap-select-coin'
import { Button } from '@/components/ui/button'
import { useSwapContext } from '@/context/swap-provider'
import { useBalances } from '@/context/balances-provider'

export const SwapInputFrom = () => {
  const [open, setOpen] = useState(false)
  const { fromAsset, setSwap, fromAmount, setFromAmount } = useSwapContext()
  const { balances } = useBalances()

  const handleSetPercent = (percent: number) => {
    const balance = new Decimal(balances[fromAsset?.asset || ''] || 0)
    if (balance.isZero()) return
    const value = percent > 0 ? balance.mul(percent).toString() : ''
    const intValue = parseFixed(value, 8)
    setFromAmount(intValue)
  }

  const valueFrom = new Decimal(fromAmount || 0)
    .div(10 ** 8)
    .mul(fromAsset?.price || 1)
    .toString()

  return (
    <div className="px-6 py-8">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <DecimalInput
            className="text-leah w-full bg-transparent text-2xl font-medium outline-none"
            amount={fromAmount}
            onAmountChange={e => setFromAmount(e)}
            autoComplete="off"
          />
          <div className="text-gray mt-1 text-sm">
            <DecimalFiat amount={valueFrom} />
          </div>
        </div>
        <div className="flex items-center gap-3" onClick={() => setOpen(true)}>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400">
            <Wallet className="h-6 w-6 text-black" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-leah text-lg font-semibold">{fromAsset?.metadata.symbol}</span>
            <span className="text-gray text-sm">{fromAsset?.chain ? networkLabel(fromAsset.chain) : ''}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-white" />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          className="text-leah bg-blade rounded-full px-3 py-1 text-sm hover:bg-zinc-800"
          onClick={() => handleSetPercent(0)}
        >
          Clear
        </Button>
        <Button
          className="text-leah bg-blade rounded-full px-3 py-1 text-sm hover:bg-zinc-800"
          onClick={() => handleSetPercent(0.5)}
        >
          50%
        </Button>
        <Button
          className="text-leah bg-blade rounded-full px-3 py-1 text-sm hover:bg-zinc-800"
          onClick={() => handleSetPercent(1)}
        >
          100%
        </Button>
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
