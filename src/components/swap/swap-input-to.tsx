import Decimal from 'decimal.js'
import { ChevronDown } from 'lucide-react'
import { SwapSelectAsset } from '@/components/swap/swap-select-asset'
import { DecimalInput } from '@/components/decimal/decimal-input'
import { AssetIcon } from '@/components/asset-icon'
import { Skeleton } from '@/components/ui/skeleton'
import { networkLabel } from 'rujira.js'
import { DecimalFiat } from '@/components/decimal/decimal-fiat'
import { Quote } from '@/hooks/use-quote'
import { useAssetTo, useSetAssetTo } from '@/hooks/use-swap'
import { useDialog } from '@/components/global-dialog'
import { useRate } from '@/hooks/use-rates'

interface SwapInputProps {
  quote?: Quote
}

export const SwapInputTo = ({ quote }: SwapInputProps) => {
  const assetTo = useAssetTo()
  const setAssetTo = useSetAssetTo()
  const { openDialog } = useDialog()
  const { rate: toAssetRate } = useRate(assetTo?.asset)

  const amount = assetTo ? BigInt(quote?.expected_amount_out || 0) : 0n
  const valueTo = new Decimal(amount)
    .div(10 ** 8)
    .mul(toAssetRate || 1)
    .toString()

  const onClick = () =>
    openDialog(SwapSelectAsset, {
      selected: assetTo,
      onSelectAsset: asset => {
        setAssetTo(asset)
      }
    })

  return (
    <div className="px-6 py-8">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-2xl font-medium text-white">
            <DecimalInput
              className="text-leah w-full bg-transparent text-2xl font-medium outline-none"
              amount={amount}
              onAmountChange={() => null}
              autoComplete="off"
              disabled
            />
          </div>
          <div className="text-gray mt-1 text-sm">
            <DecimalFiat amount={valueTo} />
          </div>
        </div>
        <div className="flex cursor-pointer items-center gap-3" onClick={onClick}>
          <AssetIcon url={assetTo ? `/coins/${assetTo.metadata.symbol.toLowerCase()}.svg` : null} />
          <div className="flex w-15 flex-col items-start">
            <span className="text-leah inline-block w-full truncate text-lg font-semibold">
              {assetTo ? assetTo.metadata.symbol : <Skeleton className="mb-0.5 h-6 w-12" />}
            </span>
            <span className="text-gray inline-block w-full truncate text-sm">
              {assetTo?.chain ? networkLabel(assetTo.chain) : <Skeleton className="mt-0.5 h-3 w-16" />}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-white" />
        </div>
      </div>
    </div>
  )
}
