import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Separator } from '@/components/ui/separator'
import { useQuote } from '@/hooks/use-quote'
import { useAssetFrom, useAssetTo, useSwap } from '@/hooks/use-swap'
import { Icon } from '@/components/icons'
import { formatDuration, intervalToDuration } from 'date-fns'
import { SwapKitNumber } from '@uswap/core'
import { resolveFees } from '@/components/swap/swap-helpers'
import { useRates } from '@/hooks/use-rates'
import { InfoTooltip } from '@/components/tooltip'
import { animated, useSpring } from '@react-spring/web'
import { SwapProvider } from '@/components/swap/swap-provider'
import { PriceImpact } from '@/components/swap/price-impact'
import { useDialog } from '@/components/global-dialog'
import { SwapFeeDialog } from '@/components/swap/swap-fee-dialog'

export function SwapDetails({ priceImpact }: { priceImpact?: SwapKitNumber }) {
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const [showMore, setShowMore] = useState(false)
  const { valueFrom } = useSwap()
  const { quote } = useQuote()
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(0)
  const [priceInverted, setPriceInverted] = useState(false)
  const { openDialog } = useDialog()

  const identifiers = useMemo(() => quote?.fees.map(t => t.asset).sort() || [], [quote?.fees])
  const { rates } = useRates(identifiers)

  useLayoutEffect(() => {
    if (contentRef.current && quote) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [quote, rates])

  const arrowSpring = useSpring({
    transform: showMore ? 'rotate(180deg)' : 'rotate(0deg)',
    config: { tension: 250, friction: 20 }
  })

  const contentSpring = useSpring({
    height: showMore ? contentHeight : 0,
    opacity: showMore ? 1 : 0,
    config: { tension: 400, friction: 30 }
  })

  useEffect(() => {
    setPriceInverted(false)
  }, [assetTo, assetFrom])

  if (!assetFrom || !assetTo || !quote) return null

  const valueTo = new SwapKitNumber(quote.expectedBuyAmount)
  const priceDirect = priceInverted ? valueTo.lt(valueFrom) : valueTo.gt(valueFrom)
  const price = priceDirect ? valueTo.div(valueFrom) : valueFrom.div(valueTo)

  const { inbound, outbound, liquidity, platform, included } = resolveFees(quote, rates)

  return (
    <>
      <div className="cursor-pointer" onClick={() => setShowMore(!showMore)}>
        <div className="text-leah flex justify-between text-[13px] font-semibold">
          <span
            className="p-4"
            onClick={e => {
              e.stopPropagation()
              setPriceInverted(!priceInverted)
            }}
          >
            1 {priceDirect ? assetFrom.ticker : assetTo.ticker} = {price.toSignificant()}{' '}
            {priceDirect ? assetTo.ticker : assetFrom.ticker}
          </span>

          {inbound && (
            <div className="text-thor-gray flex items-center gap-2 p-4">
              <span>Tx Fee:</span>
              <span className="text-leah">
                {inbound.usd.lt(0.01) ? `< ${new SwapKitNumber(0.01).toCurrency()}` : inbound.usd.toCurrency()}
              </span>
              <animated.div style={arrowSpring}>
                <Icon name="arrow-s-down" className="size-5" />
              </animated.div>
            </div>
          )}
        </div>
      </div>

      <animated.div style={contentSpring} className="overflow-hidden">
        <Separator className="bg-blade" />

        <div ref={contentRef} className="text-thor-gray px-4 pb-5 text-[13px] font-semibold">
          <div className="flex items-center justify-between py-2">
            <span>Provider</span>
            <SwapProvider provider={quote.providers[0]} />
          </div>

          {priceImpact && (
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-1">
                <span>Price Impact</span>{' '}
                <InfoTooltip>
                  The difference between the market price and your actual swap rate due to trade size. Larger trades
                  typically have higher price impact.
                </InfoTooltip>
              </div>
              <PriceImpact priceImpact={priceImpact} />
            </div>
          )}

          {included.gt(0) && (
            <div
              className="flex cursor-pointer items-center justify-between py-2"
              onClick={() =>
                openDialog(SwapFeeDialog, { outbound: outbound, liquidity: liquidity, platform: platform })
              }
            >
              <div className="flex items-center gap-1">
                <span>Included Fees</span>{' '}
                <InfoTooltip>These fees are already included in the rate — you don’t pay them separately.</InfoTooltip>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-leah">{included.toCurrency()}</span>
                <Icon name="eye" className="size-5" />
              </div>
            </div>
          )}

          {quote.estimatedTime && quote.estimatedTime.total > 0 && (
            <div className="flex items-center justify-between py-2">
              <span>Estimated Time</span>
              <span className="text-leah">
                {formatDuration(
                  intervalToDuration({
                    start: 0,
                    end: (quote.estimatedTime.total || 0) * 1000
                  }),
                  { format: ['hours', 'minutes', 'seconds'], zero: false }
                )}
              </span>
            </div>
          )}
        </div>
      </animated.div>
    </>
  )
}
