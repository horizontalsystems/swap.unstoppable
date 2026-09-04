import { ReactNode, useState } from 'react'
import { useTranslations } from 'next-intl'
import { USwapNumber } from '@uswap/core'
import { Separator } from '@/components/ui/separator'
import { Tooltip } from '@/components/tooltip'
import { Icon } from '@/components/icons'
import { SwapProvider } from '@/components/swap/swap-provider'
import { BarterPointsBadge } from '@/components/promotion/barter-points-badge'
import { useSwapRates } from '@/hooks/use-rates'
import { formatEtaRange } from '@/lib/swap-helpers'
import { cn } from '@/lib/utils'
import { QuoteResponseRoute } from '@/types'

interface SwapRouteCardProps {
  route: QuoteResponseRoute
  valueFrom: USwapNumber
  assetFromTicker: string
  assetToTicker: string
  badge?: ReactNode
  showAmount?: boolean
  selected?: boolean
  onOpenList?: () => void
  onSelect?: () => void
  className?: string
}

export function SwapRouteCard({
  route,
  valueFrom,
  assetFromTicker,
  assetToTicker,
  badge,
  showAmount,
  selected,
  onOpenList,
  onSelect,
  className
}: SwapRouteCardProps) {
  const t = useTranslations('swap.route')
  const [priceInverted, setPriceInverted] = useState(false)
  const { rateTo } = useSwapRates()

  const etaRange = route.estimatedTime && formatEtaRange(route.estimatedTime.total)
  const valueTo = new USwapNumber(route.expectedBuyAmount)
  const fiatValueTo = (rateTo && valueTo.mul(rateTo)) || new USwapNumber(0)
  const priceDirect = priceInverted ? valueTo.lt(valueFrom) : valueTo.gt(valueFrom)
  const price = priceDirect ? valueTo.div(valueFrom) : valueFrom.div(valueTo)

  return (
    <div className={cn('rounded-2xl border text-xs font-semibold', selected ? 'border-brand-first' : 'border-blade', className)} onClick={onSelect}>
      <div
        className={cn('flex items-center gap-3 p-4', onOpenList && 'cursor-pointer')}
        onClick={
          onOpenList &&
          (e => {
            e.stopPropagation()
            onOpenList()
          })
        }
      >
        <SwapProvider provider={route.providers[0]} />
        <BarterPointsBadge provider={route.providers[0]} />
        {/* An explicit null means the amount is an estimate with no on-chain floor — the venue
            re-quotes live. It can top the list by a hair while being the only route that can
            under-deliver, so the list has to say so, not just the confirm screen. */}
        {route.minBuyAmount === null && (
          <Tooltip content={t('noFloorTooltip')}>
            <span className="text-jacob border-jacob rounded-lg border px-1.5 text-[10px] font-semibold">{t('noFloor')}</span>
          </Tooltip>
        )}
        <div className="flex-1" />
        <div className="text-leah flex items-center gap-3">
          {badge}
          {etaRange && (
            <div className="flex items-center gap-1">
              <Icon name="clock-filled" width={14} height={14} viewBox="0 0 16 16" />
              <span>{etaRange}</span>
            </div>
          )}
          {onOpenList && <Icon name="arrow-s-down" className="text-thor-gray size-4" />}
        </div>
      </div>

      <Separator className="bg-blade" />

      <div className="text-leah flex items-center justify-between p-4">
        {showAmount ? (
          <div className="flex flex-col">
            <span className="text-leah text-base font-semibold">
              {valueTo.toSignificant()} {assetToTicker}
            </span>
            <span className="text-thor-gray text-xs font-normal">{fiatValueTo.toCurrency()}</span>
          </div>
        ) : (
          <span
            className="cursor-pointer"
            onClick={e => {
              e.stopPropagation()
              setPriceInverted(!priceInverted)
            }}
          >
            {t('price', {
              from: priceDirect ? assetFromTicker : assetToTicker,
              price: price.toSignificant(),
              to: priceDirect ? assetToTicker : assetFromTicker
            })}
          </span>
        )}
      </div>
    </div>
  )
}
