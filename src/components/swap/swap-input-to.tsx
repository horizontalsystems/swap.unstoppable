import { SwapSelectAsset } from '@/components/swap/swap-select-asset'
import { DecimalInput } from '@/components/decimal/decimal-input'
import { AssetIcon } from '@/components/asset-icon'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuote } from '@/hooks/use-quote'
import { useAssetFrom, useAssetTo, useSetAssetTo } from '@/hooks/use-swap'
import { useDialog } from '@/components/global-dialog'
import { useSwapRates } from '@/hooks/use-rates'
import { Icon } from '@/components/icons'
import { chainLabel } from '@/components/connect-wallet/config'
import { SwapKitNumber } from '@swapkit/core'
import { cn } from '@/lib/utils'

export const SwapInputTo = () => {
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const setAssetTo = useSetAssetTo()
  const { quote } = useQuote()
  const { openDialog } = useDialog()
  const { rate: rateFrom } = useSwapRates(assetFrom?.identifier)
  const { rate: rateTo } = useSwapRates(assetTo?.identifier)

  const value = quote && new SwapKitNumber(quote.expectedBuyAmount)
  const fiatValueTo = (rateTo && value && value.mul(rateTo)) || new SwapKitNumber(0)

  const sellAmountInUsd = quote && rateFrom && new SwapKitNumber(quote.sellAmount).mul(rateFrom)
  const buyAmountInUsd = quote && rateTo && new SwapKitNumber(quote.expectedBuyAmount).mul(rateTo)

  const hundredPercent = new SwapKitNumber(100)
  const toPriceRatio = buyAmountInUsd && sellAmountInUsd && buyAmountInUsd.mul(hundredPercent).div(sellAmountInUsd)
  const priceImpact = toPriceRatio && toPriceRatio.lte(hundredPercent) && hundredPercent.sub(toPriceRatio)

  const onClick = () =>
    openDialog(SwapSelectAsset, {
      selected: assetTo,
      onSelectAsset: asset => {
        setAssetTo(asset)
      }
    })

  return (
    <div className="px-6 pt-2 pb-6">
      <div className="text-thor-gray mb-3 font-semibold">Buy</div>

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <DecimalInput
            className="text-leah w-full bg-transparent text-2xl font-medium outline-none"
            amount={value ? value.toSignificant() : ''}
            onAmountChange={() => null}
            autoComplete="off"
            disabled
          />
          <div className="flex gap-2 text-sm font-medium">
            <span className="text-thor-gray">{fiatValueTo.toCurrency()}</span>

            {priceImpact && (
              <span
                className={cn({
                  'text-leah': priceImpact.lte(10),
                  'text-jacob': priceImpact.gt(10) && priceImpact.lte(20),
                  'text-lucian': priceImpact.gt(20)
                })}
              >
                (-{priceImpact.toSignificant(2)}%)
              </span>
            )}
          </div>
        </div>
        <div className="flex cursor-pointer items-center gap-2" onClick={onClick}>
          <AssetIcon asset={assetTo} />
          <div className="flex w-16 flex-col items-start">
            <span className="text-leah inline-block w-full truncate text-base font-semibold">
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
