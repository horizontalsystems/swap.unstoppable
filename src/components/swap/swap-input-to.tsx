import { SwapSelectAsset } from '@/components/swap/swap-select-asset'
import { DecimalInput } from '@/components/decimal/decimal-input'
import { AssetIcon } from '@/components/asset-icon'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuote } from '@/hooks/use-quote'
import { useAssetTo, useSetAssetTo } from '@/hooks/use-swap'
import { useDialog } from '@/components/global-dialog'
import { useRate } from '@/hooks/use-rates'
import { Icon } from '@/components/icons'
import { chainLabel } from '@/components/connect-wallet/config'
import { SwapKitNumber } from '@swapkit/core'

export const SwapInputTo = () => {
  const assetTo = useAssetTo()
  const setAssetTo = useSetAssetTo()
  const { quote } = useQuote()
  const { openDialog } = useDialog()
  const { rate } = useRate(assetTo?.identifier)

  const value = quote && new SwapKitNumber(quote.expectedBuyAmount)

  const rateTo = rate || new SwapKitNumber(0)
  const fiatValueTo = (rateTo && value && value.mul(rateTo)) || new SwapKitNumber(0)

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
          <DecimalInput
            className="text-leah w-full bg-transparent text-2xl font-medium outline-none"
            amount={value ? value.toSignificant() : ''}
            onAmountChange={() => null}
            autoComplete="off"
            disabled
          />
          <div className="text-thor-gray mt-1 text-sm">{fiatValueTo.toCurrency()}</div>
        </div>
        <div className="flex cursor-pointer items-center gap-2" onClick={onClick}>
          <AssetIcon asset={assetTo} />
          <div className="flex w-16 flex-col items-start">
            <span className="text-leah inline-block w-full truncate text-lg font-semibold">
              {assetTo ? assetTo.ticker : <Skeleton className="mb-0.5 h-6 w-12" />}
            </span>
            <span className="text-thor-gray inline-block w-full truncate text-xs">
              {assetTo?.chain ? chainLabel(assetTo.chain) : <Skeleton className="mt-0.5 h-3 w-16" />}
            </span>
          </div>
          <Icon name="arrow-s-down" className="text-thor-gray size-5" />
        </div>
      </div>
    </div>
  )
}
