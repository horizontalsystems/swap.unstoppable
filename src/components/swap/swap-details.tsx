import { useEffect, useMemo, useState } from 'react'
import { USwapNumber } from '@uswap/core'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { useDialog } from '@/components/global-dialog'
import { Icon } from '@/components/icons'
import { PriceImpact } from '@/components/swap/price-impact'
import { SwapFeeDialog } from '@/components/swap/swap-fee-dialog'
import { SwapProvider } from '@/components/swap/swap-provider'
import { InfoTooltip } from '@/components/tooltip'
import { useQuote } from '@/hooks/use-quote'
import { useRates } from '@/hooks/use-rates'
import { useAssetFrom, useAssetTo, useCustomInterval, useCustomQuantity, useSwap, useTwapMode } from '@/hooks/use-swap'
import { recalculateEstimatedTime, THORCHAIN_BLOCK_TIME_SECONDS } from '@/lib/memo-helpers'
import { formatExpiration, resolveFees } from '@/lib/swap-helpers'
import { cn } from '@/lib/utils'
import { ProviderName } from '@/types'

export function SwapDetails({ priceImpact }: { priceImpact?: USwapNumber }) {
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const [showMore, setShowMore] = useState(false)
  const { valueFrom } = useSwap()
  const { quote, quotes, selectedIndex, setSelectedIndex } = useQuote()
  const [priceInverted, setPriceInverted] = useState(false)
  const { openDialog } = useDialog()
  const twapMode = useTwapMode()
  const customInterval = useCustomInterval()
  const customQuantity = useCustomQuantity()

  const identifiers = useMemo(() => quote?.fees.map(t => t.asset).sort() || [], [quote?.fees])
  const { rates } = useRates(identifiers)

  useEffect(() => {
    setPriceInverted(false)
  }, [assetTo, assetFrom])

  const isThorchain = quote?.providers[0] === ProviderName.THORCHAIN || quote?.providers[0] === ProviderName.THORCHAIN_STREAMING
  const estimatedTime = useMemo(() => {
    if (!quote?.estimatedTime || !isThorchain || twapMode === 'bestPrice') return quote?.estimatedTime
    if (twapMode === 'bestTime') {
      return recalculateEstimatedTime(quote.estimatedTime, 0)
    }

    const swapSeconds = customInterval * customQuantity * THORCHAIN_BLOCK_TIME_SECONDS
    return recalculateEstimatedTime(quote.estimatedTime, swapSeconds)
  }, [quote?.estimatedTime, isThorchain, twapMode, customInterval, customQuantity])

  if (!assetFrom || !assetTo || !quote) return null

  const valueTo = new USwapNumber(quote.expectedBuyAmount)
  const priceDirect = priceInverted ? valueTo.lt(valueFrom) : valueTo.gt(valueFrom)
  const price = priceDirect ? valueTo.div(valueFrom) : valueFrom.div(valueTo)

  const { inbound, outbound, liquidity, platform, included } = resolveFees(quote, rates)

  return (
    <div className="border-blade rounded-3xl border text-[13px] font-semibold">
      <div className="flex items-center justify-between px-4 py-3">
        {quotes.length > 1 ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex cursor-pointer items-center gap-1 outline-none">
              <SwapProvider provider={quote.providers[0]} />
              <Icon name="arrow-s-down" className="text-thor-gray size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="space-y-1 p-2">
              {quotes.map((route, index) => (
                <DropdownMenuItem
                  key={route.providers[0]}
                  className={cn('flex cursor-pointer items-center justify-between gap-4 rounded-xl px-4 py-2.5', {
                    'bg-accent': index === selectedIndex
                  })}
                  onClick={() => setSelectedIndex(index)}
                >
                  <SwapProvider provider={route.providers[0]} />
                  <span className="text-leah text-xs">
                    {new USwapNumber(route.expectedBuyAmount).toSignificant()} {assetTo.ticker}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <SwapProvider provider={quote.providers[0]} />
        )}
        {selectedIndex === 0 && <span className="text-remus border-remus rounded-3xl border px-1.5 text-[10px]">BEST PRICE</span>}
      </div>

      <Separator className="bg-blade" />

      <div className="cursor-pointer" onClick={() => setShowMore(!showMore)}>
        <div className="text-leah flex items-center justify-between px-4 py-3">
          <span
            onClick={e => {
              e.stopPropagation()
              setPriceInverted(!priceInverted)
            }}
          >
            1 {priceDirect ? assetFrom.ticker : assetTo.ticker} = {price.toSignificant()} {priceDirect ? assetTo.ticker : assetFrom.ticker}
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
