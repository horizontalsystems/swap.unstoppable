import Decimal from 'decimal.js'
import { networkLabel } from 'rujira.js'
import { ChevronDown } from 'lucide-react'
import { DecimalInput } from '@/components/decimal/decimal-input'
import { DecimalFiat } from '@/components/decimal/decimal-fiat'
import { SwapSelectAsset } from '@/components/swap/swap-select-asset'
import { Button } from '@/components/ui/button'
import { useAssetFrom, useSetAssetFrom, useSwap } from '@/hooks/use-swap'
import { AssetIcon } from '@/components/asset-icon'
import { Skeleton } from '@/components/ui/skeleton'
import { useDialog } from '@/components/global-dialog'
import { useBalance } from '@/hooks/use-balance'
import { useRate } from '@/hooks/use-rates'
import { SwapBalance } from '@/components/swap/swap-balance'

export const SwapInputFrom = () => {
  const assetFrom = useAssetFrom()
  const setAssetFrom = useSetAssetFrom()
  const { openDialog } = useDialog()
  const { amountFrom, setAmountFrom } = useSwap()
  const { rate } = useRate(assetFrom?.asset)
  const { balance } = useBalance()

  const handleSetPercent = (percent: bigint) => {
    if (!balance) return
    setAmountFrom((balance.spendable * percent) / 100n)
  }

  const valueFrom = new Decimal(amountFrom || 0)
    .div(10 ** 8)
    .mul(rate || 1)
    .toString()

  const onClick = () => {
    openDialog(SwapSelectAsset, {
      selected: assetFrom,
      onSelectAsset: asset => {
        setAssetFrom(asset)
      }
    })
  }

  return (
    <div className="px-6 py-8">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <DecimalInput
            className="text-leah w-full bg-transparent text-2xl font-medium outline-none"
            amount={amountFrom}
            onAmountChange={e => setAmountFrom(e)}
            autoComplete="off"
          />
          <div className="text-gray mt-1 text-sm">
            <DecimalFiat amount={valueFrom} />
          </div>
        </div>
        <div className="flex cursor-pointer items-center gap-3" onClick={onClick}>
          <AssetIcon url={assetFrom ? `/coins/${assetFrom.metadata.symbol.toLowerCase()}.svg` : null} />
          <div className="flex w-15 flex-col items-start">
            <span className="text-leah inline-block w-full truncate text-lg font-semibold">
              {assetFrom ? assetFrom.metadata.symbol : <Skeleton className="mb-0.5 h-6 w-12" />}
            </span>
            <span className="text-gray inline-block w-full truncate text-sm">
              {assetFrom?.chain ? networkLabel(assetFrom.chain) : <Skeleton className="mt-0.5 h-3 w-16" />}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-white" />
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div className="flex gap-2">
          <Button
            className="text-leah bg-blade rounded-full px-3 py-1 text-sm hover:bg-zinc-800"
            onClick={() => setAmountFrom(0n)}
            disabled={amountFrom === 0n}
          >
            Clear
          </Button>
          <Button
            className="text-leah bg-blade rounded-full px-3 py-1 text-sm hover:bg-zinc-800"
            onClick={() => handleSetPercent(50n)}
            disabled={!balance || balance.spendable === 0n}
          >
            50%
          </Button>
          <Button
            className="text-leah bg-blade rounded-full px-3 py-1 text-sm hover:bg-zinc-800"
            onClick={() => handleSetPercent(100n)}
            disabled={!balance || balance.spendable === 0n}
          >
            100%
          </Button>
        </div>

        <SwapBalance />
      </div>
    </div>
  )
}
