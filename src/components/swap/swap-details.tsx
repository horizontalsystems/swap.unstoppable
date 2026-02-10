import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { animated, useSpring } from '@react-spring/web'
import { USwapNumber } from '@uswap/core'
import { Separator } from '@/components/ui/separator'
import { useDialog } from '@/components/global-dialog'
import { Icon } from '@/components/icons'
import { PriceImpact } from '@/components/swap/price-impact'
import { SwapFeeDialog } from '@/components/swap/swap-fee-dialog'
import { SwapProvider } from '@/components/swap/swap-provider'
import { InfoTooltip } from '@/components/tooltip'
import { useQuote } from '@/hooks/use-quote'
import { useRates } from '@/hooks/use-rates'
import { useAssetFrom, useAssetTo, useSwap } from '@/hooks/use-swap'
import { formatExpiration, resolveFees } from '@/lib/swap-helpers'
import { cn } from '@/lib/utils'

export function SwapDetails({ priceImpact }: { priceImpact?: USwapNumber }) {
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

  const valueTo = new USwapNumber(quote.expectedBuyAmount)
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
            1 {priceDirect ? assetFrom.ticker : assetTo.ticker} = {price.toSignificant()} {priceDirect ? assetTo.ticker : assetFrom.ticker}
          </span>

          <div className="flex items-center">
            {quote.estimatedTime && quote.estimatedTime.total > 0 && (
              <div
                className={cn('text-leah flex h-8 items-center', {
                  'bg-jacob/10 text-jacob rounded-full p-2': quote.estimatedTime.total > 3600
                })}
              >
                <Icon width={16} height={16} viewBox="0 0 16 16" name="clock-filled" />
                <span className="ms-1 text-xs">{formatExpiration(quote.estimatedTime.total)}</span>
              </div>
            )}

            {inbound && (
              <div className="text-thor-gray flex items-center p-4 ps-2">
                <Icon width={16} height={16} viewBox="0 0 16 16" name="list" />
                <span className="text-leah ms-1 me-2">
                  {inbound.usd.lt(0.01) ? `< ${new USwapNumber(0.01).toCurrency()}` : inbound.usd.toCurrency()}
                </span>
                <animated.div style={arrowSpring}>
                  <Icon name="arrow-s-down" className="size-5" />
                </animated.div>
              </div>
            )}
          </div>
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
                <span>Included Fees</span> <InfoTooltip>These fees are already included in the rate — you don’t pay them separately.</InfoTooltip>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-leah">{included.toCurrency()}</span>
                <Icon name="eye" className="size-5" />
              </div>
            </div>
          )}
        </div>
      </animated.div>
    </>
  )
}
