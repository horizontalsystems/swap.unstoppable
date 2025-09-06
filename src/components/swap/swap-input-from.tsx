import Decimal from 'decimal.js'
import { useEffect } from 'react'
import { networkLabel } from 'rujira.js'
import { ChevronDown, Loader } from 'lucide-react'
import { DecimalInput } from '@/components/decimal-input'
import { balanceKey, useBalance, useSyncBalance, useSyncing } from '@/hooks/use-balance'
import { DecimalFiat } from '@/components/decimal-fiat'
import { SwapSelectAsset } from '@/components/swap/swap-select-asset'
import { Button } from '@/components/ui/button'
import { useAccounts } from '@/context/accounts-provider'
import { DecimalText } from '@/components/decimal-text'
import { useSwap } from '@/hooks/use-swap'
import { AssetIcon } from '@/components/asset-icon'
import { Skeleton } from '@/components/ui/skeleton'
import { useDialog } from '@/components/global-dialog'

export const SwapInputFrom = () => {
  const { openDialog } = useDialog()
  const { accounts, selected, select } = useAccounts()
  const { fromAsset, setSwap, fromAmount, setFromAmount } = useSwap()

  const key = balanceKey(fromAsset?.chain, selected?.address, fromAsset?.asset)
  const syncBalance = useSyncBalance()
  const balanceSyncing = useSyncing(key)
  const balance = useBalance(key)

  useEffect(() => {
    if (fromAsset?.chain && selected?.address && fromAsset?.asset) {
      syncBalance(fromAsset?.chain, selected?.address, fromAsset?.asset, true)
    }
  }, [fromAsset?.asset, fromAsset?.chain, key, selected?.address, syncBalance])

  const handleSetPercent = (percent: bigint) => {
    if (!balance) return
    setFromAmount((balance * percent) / 100n)
  }

  const valueFrom = new Decimal(fromAmount || 0)
    .div(10 ** 8)
    .mul(fromAsset?.price || 1)
    .toString()

  const onClick = () => {
    openDialog(SwapSelectAsset, {
      selected: fromAsset,
      onSelectAsset: asset => {
        setSwap(asset)
        const toSelect = accounts?.find(a => a.network === asset?.chain)
        select(toSelect || null)
      }
    })
  }

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
        <div className="flex cursor-pointer items-center gap-3" onClick={onClick}>
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
            onClick={() => handleSetPercent(0n)}
            disabled={!balance}
          >
            Clear
          </Button>
          <Button
            className="text-leah bg-blade rounded-full px-3 py-1 text-sm hover:bg-zinc-800"
            onClick={() => handleSetPercent(50n)}
            disabled={!balance}
          >
            50%
          </Button>
          <Button
            className="text-leah bg-blade rounded-full px-3 py-1 text-sm hover:bg-zinc-800"
            onClick={() => handleSetPercent(100n)}
            disabled={!balance}
          >
            100%
          </Button>
        </div>
        <div className="text-gray flex gap-1 text-xs">
          {balanceSyncing && <Loader className="animate-spin" size="18" />}
          <span>Balance:</span>
          <DecimalText amount={balance || 0n} />
        </div>
      </div>
    </div>
  )
}
