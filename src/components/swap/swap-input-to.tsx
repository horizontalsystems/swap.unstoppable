import { SwapSelectAsset } from '@/components/swap/swap-select-asset'
import { DecimalInput } from '@/components/decimal/decimal-input'
import { AssetIcon } from '@/components/asset-icon'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuote } from '@/hooks/use-quote'
import { useAssetTo, useSetAssetTo } from '@/hooks/use-swap'
import { useDialog } from '@/components/global-dialog'
import { useSwapRates } from '@/hooks/use-rates'
import { Icon } from '@/components/icons'
import { chainLabel } from '@/components/connect-wallet/config'
import { USwapNumber } from '@uswap/core'
import { Tooltip } from '@/components/tooltip'
import { PriceImpact } from '@/components/swap/price-impact'
import { useIsLimitSwap, useLimitSwapBuyAmount } from '@/store/limit-swap-store'

export const SwapInputTo = ({ priceImpact }: { priceImpact?: USwapNumber }) => {
  const assetTo = useAssetTo()
  const setAssetTo = useSetAssetTo()
  const { quote } = useQuote()
  const { openDialog } = useDialog()
  const { rateTo } = useSwapRates()
  const isLimitSwap = useIsLimitSwap()
  const limitSwapBuyAmount = useLimitSwapBuyAmount()

  const value =
    isLimitSwap && limitSwapBuyAmount
      ? USwapNumber.fromBigInt(BigInt(limitSwapBuyAmount), 8)
      : quote && new USwapNumber(quote.expectedBuyAmount)

  const fiatValueTo = (rateTo && value && value.mul(rateTo)) || new USwapNumber(0)

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
              <Tooltip content="Price Impact">
                <span>
                  (<PriceImpact priceImpact={priceImpact} />)
                </span>
              </Tooltip>
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
