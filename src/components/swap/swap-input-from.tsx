import Decimal from 'decimal.js'
import { useState } from 'react'
import { networkLabel } from 'rujira.js'
import { ChevronDown } from 'lucide-react'
import { DecimalInput, parseFixed } from '@/components/decimal-input'
import { DecimalFiat } from '@/components/decimal-fiat'
import { SwapSelectCoin } from '@/components/swap/swap-select-coin'
import { Button } from '@/components/ui/button'
import { useBalances } from '@/context/balances-provider'
import { useAccounts } from '@/context/accounts-provider'
import { DecimalText } from '@/components/decimal-text'
import { useSwap } from '@/hook/use-swap'
import { AssetIcon } from '@/components/asset-icon'
import { Skeleton } from '@/components/ui/skeleton'

export const SwapInputFrom = () => {
  const [open, setOpen] = useState(false)
  const { accounts, selected, select } = useAccounts()
  const { fromAsset, setSwap, fromAmount, setFromAmount } = useSwap()
  const { balances } = useBalances()

  const balance = Number(balances[`${fromAsset?.chain}:${selected?.address}:${fromAsset?.asset}`] || 0n) / 1e8

  const handleSetPercent = (percent: number) => {
    if (balance == 0) return
    const value = percent > 0 ? (balance * percent).toString() : ''
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
          <AssetIcon url={fromAsset ? `/coins/${fromAsset.metadata.symbol.toLowerCase()}.svg` : null} />
          <div className="flex flex-col items-start">
            <span className="text-leah text-lg font-semibold">
              {fromAsset ? fromAsset.metadata.symbol : <Skeleton className="mb-0.5 h-6 w-12" />}
            </span>
            <span className="text-gray text-sm">
              {fromAsset?.chain ? networkLabel(fromAsset.chain) : <Skeleton className="mt-0.5 h-3 w-16" />}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-white" />
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div className="flex gap-2">
          <Button
            className="text-leah bg-blade rounded-full px-3 py-1 text-sm hover:bg-zinc-800"
            onClick={() => handleSetPercent(0)}
            disabled={balance == 0}
          >
            Clear
          </Button>
          <Button
            className="text-leah bg-blade rounded-full px-3 py-1 text-sm hover:bg-zinc-800"
            onClick={() => handleSetPercent(0.5)}
            disabled={balance == 0}
          >
            50%
          </Button>
          <Button
            className="text-leah bg-blade rounded-full px-3 py-1 text-sm hover:bg-zinc-800"
            onClick={() => handleSetPercent(1)}
            disabled={balance == 0}
          >
            100%
          </Button>
        </div>
        <div className="text-gray text-xs">
          Balance: <DecimalText amount={parseFixed(balance.toString(), 8)} />
        </div>
      </div>

      <SwapSelectCoin
        key="select-from"
        isOpen={open}
        selected={fromAsset}
        isInput={true}
        onClose={() => setOpen(false)}
        onSelectAsset={asset => {
          setSwap(asset)
          const toSelect = accounts?.find(a => a.network === asset?.chain)
          select(toSelect || null)
        }}
      />
    </div>
  )
}
