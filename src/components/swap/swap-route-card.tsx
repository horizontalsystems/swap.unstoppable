import { ReactNode, useMemo, useState } from 'react'
import { USwapNumber } from '@uswap/core'
import { Separator } from '@/components/ui/separator'
import { useDialog } from '@/components/global-dialog'
import { Icon } from '@/components/icons'
import { PriceImpact } from '@/components/swap/price-impact'
import { SwapFeeDialog } from '@/components/swap/swap-fee-dialog'
import { SwapProvider } from '@/components/swap/swap-provider'
import { InfoTooltip } from '@/components/tooltip'
import { useRates, useSwapRates } from '@/hooks/use-rates'
import { formatExpiration, resolveFees, resolvePriceImpact } from '@/lib/swap-helpers'
import { cn } from '@/lib/utils'
import { QuoteResponseRoute } from '@/types'

interface SwapRouteCardProps {
  route: QuoteResponseRoute
  valueFrom: USwapNumber
  assetFromTicker: string
  assetToTicker: string
  estimatedTime?: { total: number }
  providerAction?: ReactNode
  badge?: ReactNode
  className?: string
  onClick?: () => void
}

export function SwapRouteCard({
  route,
  valueFrom,
  assetFromTicker,
  assetToTicker,
  estimatedTime,
  providerAction,
  badge,
  className,
  onClick
}: SwapRouteCardProps) {
  const [showMore, setShowMore] = useState(false)
  const [priceInverted, setPriceInverted] = useState(false)
  const { openDialog } = useDialog()
  const { rateFrom, rateTo } = useSwapRates()

  const identifiers = useMemo(() => route.fees.map(t => t.asset).sort(), [route.fees])
  const { rates } = useRates(identifiers)

  const valueTo = new USwapNumber(route.expectedBuyAmount)
  const priceDirect = priceInverted ? valueTo.lt(valueFrom) : valueTo.gt(valueFrom)
  const price = priceDirect ? valueTo.div(valueFrom) : valueFrom.div(valueTo)

  const { inbound, outbound, liquidity, platform, included } = resolveFees(route, rates)
  const priceImpact = resolvePriceImpact(route, rateFrom, rateTo)

  const priceText = `1 ${priceDirect ? assetFromTicker : assetToTicker} = ${price.toSignificant()} ${priceDirect ? assetToTicker : assetFromTicker}`

  return (
    <div className={cn('border-blade rounded-3xl border text-[13px] font-semibold', className)} onClick={onClick}>
      <div className="flex items-center justify-between px-4 py-3">
        {providerAction || <SwapProvider provider={route.providers[0]} />}
        {badge}
      </div>

      <Separator className="bg-blade" />

      <div
        className="cursor-pointer"
        onClick={e => {
          e.stopPropagation()
          setShowMore(!showMore)
        }}
      >
        <div className="text-leah flex items-center justify-between px-4 py-3">
          <span
            onClick={e => {
              e.stopPropagation()
              setPriceInverted(!priceInverted)
            }}
          >
            {priceText}
          </span>

          <div className="flex items-center">
            {estimatedTime && estimatedTime.total > 0 && (
              <div
                className={cn('text-leah flex items-center', {
                  'bg-jacob/10 text-jacob -my-2 rounded-full p-2': estimatedTime.total > 3600
                })}
              >
                <Icon width={16} height={16} viewBox="0 0 16 16" name="clock-filled" />
                <span className="ms-1 text-xs">{formatExpiration(estimatedTime.total)}</span>
              </div>
            )}

            {inbound && (
              <div className="text-thor-gray flex items-center ps-2">
                <Icon width={16} height={16} viewBox="0 0 16 16" name="list" />
                <span className="text-leah ms-1 me-2">
                  {inbound.usd.lt(0.01) ? `< ${new USwapNumber(0.01).toCurrency()}` : inbound.usd.toCurrency()}
                </span>
                <div className={cn('transition-transform duration-300', showMore && 'rotate-180')}>
                  <Icon name="arrow-s-down" className="size-5" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={cn('transition-all duration-300', showMore ? '' : 'hidden')}>
        <Separator className="bg-blade" />

        <div className="text-thor-gray px-4 py-2">
          {priceImpact && (
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-1">
                <span>Price Impact</span>{' '}
                <InfoTooltip>
                  The difference between the market price and your actual swap rate due to trade size. Larger trades typically have higher price
                  impact.
                </InfoTooltip>
              </div>
              <PriceImpact priceImpact={priceImpact} />
            </div>
          )}

          {included.gt(0) && (
            <div
              className="flex cursor-pointer items-center justify-between py-2"
              onClick={() => openDialog(SwapFeeDialog, { outbound: outbound, liquidity: liquidity, platform: platform })}
            >
              <div className="flex items-center gap-1">
                <span>Included Fees</span> <InfoTooltip>These fees are already included in the rate — you don't pay them separately.</InfoTooltip>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-leah">{included.toCurrency()}</span>
                <Icon name="eye" className="size-5" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
