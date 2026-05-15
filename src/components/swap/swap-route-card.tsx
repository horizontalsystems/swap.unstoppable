import { ReactNode, useState } from 'react'
import { USwapNumber } from '@uswap/core'
import { Separator } from '@/components/ui/separator'
import { useDialog } from '@/components/global-dialog'
import { Icon } from '@/components/icons'
import { AmlPolicyBadge } from '@/components/aml-policy/aml-policy-badge'
import { AmlPolicyInfo } from '@/components/aml-policy/aml-policy-info'
import { SwapProvider } from '@/components/swap/swap-provider'
import { useProviders } from '@/hooks/use-providers'
import { useSwapRates } from '@/hooks/use-rates'
import { formatExpiration } from '@/lib/swap-helpers'
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
  showAmlBadge?: boolean
  showAmount?: boolean
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
  showAmlBadge,
  showAmount,
  className,
  onClick
}: SwapRouteCardProps) {
  const [priceInverted, setPriceInverted] = useState(false)
  const { openDialog } = useDialog()
  const { rateTo } = useSwapRates()
  const { getAmlPolicy } = useProviders()

  const amlPolicy = showAmlBadge ? getAmlPolicy(route.providers[0]) : undefined
  const valueTo = new USwapNumber(route.expectedBuyAmount)
  const fiatValueTo = (rateTo && valueTo.mul(rateTo)) || new USwapNumber(0)
  const priceDirect = priceInverted ? valueTo.lt(valueFrom) : valueTo.gt(valueFrom)
  const price = priceDirect ? valueTo.div(valueFrom) : valueFrom.div(valueTo)

  return (
    <div className={cn('border-blade rounded-2xl border text-xs font-semibold', className)} onClick={onClick}>
      <div className="flex items-center justify-between gap-2 p-4">
        <div className="flex min-w-0 items-center gap-2">
          {providerAction || <SwapProvider provider={route.providers[0]} />}
          {badge}
        </div>
        {amlPolicy && (
          <AmlPolicyBadge
            amlPolicy={amlPolicy}
            onClick={e => {
              e.stopPropagation()
              openDialog(AmlPolicyInfo, {})
            }}
          />
        )}
      </div>

      <Separator className="bg-blade" />

      <div className="text-leah flex items-center justify-between p-4">
        {showAmount ? (
          <div className="flex flex-col">
            <span className="text-leah text-sm font-semibold">
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
            1 {priceDirect ? assetFromTicker : assetToTicker} = {price.toSignificant()} ${priceDirect ? assetToTicker : assetFromTicker}
          </span>
        )}

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
        </div>
      </div>
    </div>
  )
}
