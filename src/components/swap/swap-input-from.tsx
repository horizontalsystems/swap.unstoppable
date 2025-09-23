import Decimal from 'decimal.js'
import { networkLabel } from 'rujira.js'
import { DecimalInput } from '@/components/decimal/decimal-input'
import { DecimalFiat } from '@/components/decimal/decimal-fiat'
import { SwapSelectAsset } from '@/components/swap/swap-select-asset'
import { useAssetFrom, useSetAssetFrom, useSwap } from '@/hooks/use-swap'
import { AssetIcon } from '@/components/asset-icon'
import { Skeleton } from '@/components/ui/skeleton'
import { useDialog } from '@/components/global-dialog'
import { useBalance } from '@/hooks/use-balance'
import { useRate } from '@/hooks/use-rates'
import { SwapBalance } from '@/components/swap/swap-balance'
import { ThemeButton } from '@/components/theme-button'
import { Icon } from '@/components/icons'

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
          <div className="text-thor-gray mt-1 text-sm">
            <DecimalFiat amount={valueFrom} />
          </div>
        </div>
        <div className="flex cursor-pointer items-center gap-2" onClick={onClick}>
          <AssetIcon asset={assetFrom} />
          <div className="flex w-16 flex-col items-start">
            <span className="text-leah inline-block w-full truncate text-lg font-semibold">
              {assetFrom ? assetFrom.metadata.symbol : <Skeleton className="mb-0.5 h-6 w-12" />}
            </span>
            <span className="text-thor-gray inline-block w-full truncate text-xs">
              {assetFrom?.chain ? networkLabel(assetFrom.chain) : <Skeleton className="mt-0.5 h-3 w-16" />}
            </span>
          </div>
          <Icon name="arrow-s-down" className="text-thor-gray size-5" />
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div className="flex gap-2">
          <ThemeButton variant="secondarySmall" onClick={() => setAmountFrom(0n)} disabled={amountFrom === 0n}>
            Clear
          </ThemeButton>
          <ThemeButton
            variant="secondarySmall"
            onClick={() => handleSetPercent(50n)}
            disabled={!balance || balance.spendable === 0n}
          >
            50%
          </ThemeButton>
          <ThemeButton
            variant="secondarySmall"
            onClick={() => handleSetPercent(100n)}
            disabled={!balance || balance.spendable === 0n}
          >
            100%
          </ThemeButton>
        </div>

        <SwapBalance />
      </div>
    </div>
  )
}
