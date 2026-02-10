import { USwapNumber } from '@uswap/core'
import { Skeleton } from '@/components/ui/skeleton'
import { AssetIcon } from '@/components/asset-icon'
import { chainLabel } from '@/components/connect-wallet/config'
import { DecimalInput } from '@/components/decimal/decimal-input'
import { useDialog } from '@/components/global-dialog'
import { Icon } from '@/components/icons'
import { SwapBalance } from '@/components/swap/swap-balance'
import { SwapSelectAsset } from '@/components/swap/swap-select-asset'
import { ThemeButton } from '@/components/theme-button'
import { useBalance } from '@/hooks/use-balance'
import { useSwapRates } from '@/hooks/use-rates'
import { useAssetFrom, useSetAssetFrom, useSwap } from '@/hooks/use-swap'

export const SwapInputFrom = () => {
  const assetFrom = useAssetFrom()
  const setAssetFrom = useSetAssetFrom()
  const { openDialog } = useDialog()
  const { amountFrom, setAmountFrom, valueFrom, setValueFrom } = useSwap()
  const { balance } = useBalance()
  const { rateFrom: rate } = useSwapRates()

  const handleSetPercent = (percent: number) => {
    if (!balance) return
    setValueFrom(balance.spendable.mul(percent / 100))
  }

  const rateFrom = rate || new USwapNumber(0)
  const fiatValueFrom = valueFrom.mul(rateFrom)

  const onClick = () => {
    openDialog(SwapSelectAsset, {
      selected: assetFrom,
      onSelectAsset: asset => {
        setAssetFrom(asset)
      }
    })
  }

  return (
    <div className="px-6 pt-6 pb-2">
      <div className="text-thor-gray mb-3 font-semibold">Sell</div>

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <DecimalInput
            className="text-leah w-full bg-transparent text-2xl font-medium outline-none"
            amount={amountFrom}
            onAmountChange={e => setAmountFrom(e)}
            autoComplete="off"
          />
          <div className="text-thor-gray text-sm font-medium">{fiatValueFrom.toCurrency()}</div>
        </div>
        <div className="flex cursor-pointer items-center gap-2" onClick={onClick}>
          <AssetIcon asset={assetFrom} />
          <div className="flex w-16 flex-col items-start">
            <span className="text-leah inline-block w-full truncate text-base font-semibold">
              {assetFrom ? assetFrom.ticker : <Skeleton className="mb-0.5 h-6 w-12" />}
            </span>
            <span className="text-thor-gray inline-block w-full truncate text-xs">
              {assetFrom?.chain ? chainLabel(assetFrom.chain) : <Skeleton className="mt-0.5 h-3 w-16" />}
            </span>
          </div>
          <Icon name="arrow-s-down" className="text-thor-gray size-5" />
        </div>
      </div>

      <div className="mt-2 flex items-end justify-between">
        <div className="flex gap-2">
          <ThemeButton variant="secondarySmall" onClick={() => setAmountFrom('')} disabled={amountFrom === ''}>
            Clear
          </ThemeButton>
          <ThemeButton variant="secondarySmall" onClick={() => handleSetPercent(50)} disabled={!balance || balance.spendable.eqValue(0)}>
            50%
          </ThemeButton>
          <ThemeButton variant="secondarySmall" onClick={() => handleSetPercent(100)} disabled={!balance || balance.spendable.eqValue(0)}>
            100%
          </ThemeButton>
        </div>

        <SwapBalance />
      </div>
    </div>
  )
}
