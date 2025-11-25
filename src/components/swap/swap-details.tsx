import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Separator } from '@/components/ui/separator'
import { useQuote } from '@/hooks/use-quote'
import { useAssetFrom, useAssetTo, useSwap } from '@/hooks/use-swap'
import { Icon } from '@/components/icons'
import { formatDuration, intervalToDuration } from 'date-fns'
import { SwapKitNumber } from '@swapkit/core'
import { FeeData, resolveFees } from '@/components/swap/swap-helpers'
import { useRates } from '@/hooks/use-rates'
import { InfoTooltip } from '@/components/info-tooltip'
import { animated, useSpring } from '@react-spring/web'
import { AppConfig } from '@/config'

export function SwapDetails() {
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const [showMore, setShowMore] = useState(false)
  const { valueFrom } = useSwap()
  const { quote } = useQuote()
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(0)

  const identifiers = useMemo(() => quote?.fees.map(t => t.asset).sort() || [], [quote?.fees])
  const { rates } = useRates(identifiers)

  useLayoutEffect(() => {
    if (contentRef.current && quote) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [quote])

  const arrowSpring = useSpring({
    transform: showMore ? 'rotate(180deg)' : 'rotate(0deg)',
    config: { tension: 250, friction: 20 }
  })

  const contentSpring = useSpring({
    height: showMore ? contentHeight : 0,
    opacity: showMore ? 1 : 0,
    config: { tension: 400, friction: 30 }
  })

  if (!quote) return null

  const price = new SwapKitNumber(quote.expectedBuyAmount).div(valueFrom)

  const { inbound, outbound, liquidity, affiliate, service, total } = resolveFees(quote, rates)

  const feeSection = (title: string, info: string, fee?: FeeData) => {
    if (!fee) return null

    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {title} <InfoTooltip>{info}</InfoTooltip>
        </div>
        <div className="text-leah flex items-center gap-2">
          {fee ? (
            <>
              {fee.amount.gt(0) && (
                <span className="text-thor-gray">
                  {fee.amount.toSignificant()} {fee.ticker}
                </span>
              )}

              {fee.usd.gt(0) ? <span className="text-leah">{fee.usd.toCurrency()}</span> : 0}
            </>
          ) : (
            0
          )}
        </div>
      </div>
    )
  }

  const exchange: FeeData | undefined = (affiliate || service) && {
    amount: (affiliate?.amount || new SwapKitNumber(0)).add(service?.amount || new SwapKitNumber(0)),
    usd: (affiliate?.usd || new SwapKitNumber(0)).add(service?.usd || new SwapKitNumber(0)),
    ticker: affiliate?.ticker || service?.ticker || ''
  }

  return (
    <>
      <div className="cursor-pointer p-4" onClick={() => setShowMore(!showMore)}>
        <div className="flex justify-between">
          <div className="text-thor-gray flex items-center gap-1 text-sm font-semibold">
            <span>Total Fee</span>
          </div>

          <div className="text-leah flex items-center gap-2 text-sm font-semibold">
            <span className="text-leah">{total.toCurrency()}</span>
            <animated.div style={arrowSpring}>
              <Icon name="arrow-s-down" className="size-5" />
            </animated.div>
          </div>
        </div>
      </div>

      <animated.div style={contentSpring} className="overflow-hidden">
        <Separator className="bg-blade" />

        <div ref={contentRef} className="text-thor-gray space-y-4 px-4 pt-2 pb-5 text-sm font-semibold">
          <div className="flex items-center justify-between">
            <div className="flex items-center">Price</div>
            <div className="text-leah flex items-center gap-1">
              <span>1 {assetFrom?.ticker} =</span>
              {price.toSignificant()} {assetTo?.ticker}
            </div>
          </div>

          {feeSection('Inbound Fee', 'Fee for sending inbound transaction', inbound)}
          {feeSection('Outbound Fee', 'Fee for sending outbound transaction', outbound)}
          {feeSection('Liquidity Fee', 'Fee for liquidity providers on the route', liquidity)}
          {feeSection('Exchange Fee', `Fee charged by ${AppConfig.title}`, exchange)}

          <div className="flex items-center justify-between">
            Estimated Time
            <div className="flex items-center gap-2">
              {quote.estimatedTime && quote.estimatedTime.total > 0 ? (
                <span className="text-leah">
                  {formatDuration(
                    intervalToDuration({
                      start: 0,
                      end: (quote.estimatedTime.total || 0) * 1000
                    }),
                    { format: ['hours', 'minutes', 'seconds'], zero: false }
                  )}
                </span>
              ) : (
                <span className="text-thor-gray">n/a</span>
              )}
            </div>
          </div>
        </div>
      </animated.div>
    </>
  )
}
