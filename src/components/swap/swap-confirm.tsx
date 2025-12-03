import { CredenzaHeader, CredenzaTitle } from '@/components/ui/credenza'
import { useAssetFrom, useAssetTo, useSlippage } from '@/hooks/use-swap'
import { QuoteResponseRoute } from '@uswap/helpers/api'
import { cn, truncate } from '@/lib/utils'
import { AssetIcon } from '@/components/asset-icon'
import { CopyButton } from '@/components/button-copy'
import { resolveFees, resolvePriceImpact } from '@/components/swap/swap-helpers'
import { formatDuration, intervalToDuration } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Icon } from '@/components/icons'
import { SwapKitNumber } from '@uswap/core'
import { chainLabel } from '@/components/connect-wallet/config'
import { useRates, useSwapRates } from '@/hooks/use-rates'
import { useMemo } from 'react'
import { InfoTooltip } from '@/components/tooltip'
import { SwapProvider } from '@/components/swap/swap-provider'
import { PriceImpact } from '@/components/swap/price-impact'

interface SwapConfirmProps {
  quote: QuoteResponseRoute & {
    refundAddress?: string
  }
}

export const SwapConfirm = ({ quote }: SwapConfirmProps) => {
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const slippage = useSlippage()

  if (!assetFrom || !assetTo) return null

  const identifiers = useMemo(() => quote.fees.map(f => f.asset).sort(), [quote.fees])
  const { rates } = useRates(identifiers)
  const { rateFrom, rateTo } = useSwapRates()

  const sellAmount = new SwapKitNumber(quote.sellAmount)
  const expectedBuyAmount = new SwapKitNumber(quote.expectedBuyAmount)
  const expectedBuyAmountMaxSlippage = new SwapKitNumber(quote.expectedBuyAmountMaxSlippage)

  const { inbound } = resolveFees(quote, rates)

  const priceImpact = resolvePriceImpact(quote, rateFrom, rateTo)

  return (
    <>
      <CredenzaHeader>
        <CredenzaTitle>Confirm Swap</CredenzaTitle>
      </CredenzaHeader>

      <ScrollArea className="relative flex min-h-0 flex-1 px-4 md:px-8" classNameViewport="flex-1 h-auto">
        <div className="border-blade mb-4 rounded-xl border-1">
          <div className="relative flex flex-col">
            <div className="text-thor-gray flex justify-between p-4 text-sm">
              <div className="flex items-center gap-4">
                <AssetIcon asset={assetFrom} />
                <div className="flex flex-col">
                  <span className="text-leah text-base font-semibold">{assetFrom.ticker}</span>
                  <span className="text-thor-gray text-sm">{chainLabel(assetFrom.chain)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-leah text-base font-semibold">{sellAmount.toSignificant()}</span>
                <span className="text-thor-gray text-sm">
                  {rateFrom ? sellAmount.mul(rateFrom).toCurrency() : 'n/a'}
                </span>
              </div>
            </div>

            <div className="text-thor-gray flex justify-between border-t p-4 text-sm">
              <div className="flex items-center gap-4">
                <AssetIcon asset={assetTo} />
                <div className="flex flex-col">
                  <span className="text-leah text-base font-semibold">{assetTo.ticker}</span>
                  <span className="text-thor-gray text-sm">{chainLabel(assetTo.chain)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-leah text-base font-semibold">{expectedBuyAmount.toSignificant()}</span>
                <span className="text-thor-gray text-sm">
                  {rateTo ? expectedBuyAmount.mul(rateTo).toCurrency() : 'n/a'}
                </span>
              </div>
            </div>

            <div className="bg-lawrence absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2">
              <Icon name="arrow-m-down" className="text-thor-gray size-5" />
            </div>
          </div>

          <div className="space-y-4 border-t p-4">
            <div className="text-thor-gray flex justify-between text-sm">
              <div className="flex items-center gap-1">
                Min. Payout{' '}
                {slippage && (
                  <span
                    className={cn({
                      'text-jacob': slippage > 3
                    })}
                  >
                    ({slippage}%)
                  </span>
                )}
                <InfoTooltip>
                  Minimum guaranteed amount based on your slippage tolerance. If market conditions would give you less,
                  the transaction will be canceled automatically.
                </InfoTooltip>
              </div>
              {slippage ? (
                <div className="flex gap-2">
                  <span className="text-leah font-semibold">
                    {expectedBuyAmountMaxSlippage.toSignificant()} {assetTo.ticker}
                  </span>
                  {rateTo && (
                    <span className="font-medium">({expectedBuyAmountMaxSlippage.mul(rateTo).toCurrency()})</span>
                  )}
                </div>
              ) : (
                <span className="text-lucian font-semibold">Not Protected</span>
              )}
            </div>

            {quote.sourceAddress && quote.sourceAddress !== '{sourceAddress}' && (
              <div className="text-thor-gray flex justify-between text-sm">
                <span>Source Address</span>
                <div className="flex items-center gap-2">
                  <span className="text-leah font-semibold">{truncate(quote.sourceAddress)}</span>
                  <CopyButton text={quote.sourceAddress} />
                </div>
              </div>
            )}

            <div className="text-thor-gray flex justify-between text-sm">
              <span>Destination Address</span>
              <div className="flex items-center gap-2">
                <span className="text-leah font-semibold">{truncate(quote.destinationAddress)}</span>
                <CopyButton text={quote.destinationAddress} />
              </div>
            </div>

            {quote.refundAddress && quote.sourceAddress != quote.refundAddress && (
              <div className="text-thor-gray flex justify-between text-sm">
                <span>Refund Address</span>
                <div className="flex items-center gap-2">
                  <span className="text-leah font-semibold">{truncate(quote.refundAddress)}</span>
                  <CopyButton text={quote.refundAddress} />
                </div>
              </div>
            )}

            {priceImpact && (
              <div className="text-thor-gray flex justify-between text-sm">
                <div className="flex items-center gap-1">
                  Price Impact
                  <InfoTooltip>
                    The difference between the market price and your actual swap rate due to trade size. Larger trades
                    typically have higher price impact.
                  </InfoTooltip>
                </div>
                <PriceImpact priceImpact={priceImpact} className="font-semibold" />
              </div>
            )}

            {inbound && (
              <div className="text-thor-gray flex justify-between text-sm">
                <span>Tx Fee</span>
                <span className="text-leah font-semibold">
                  {inbound.usd.lt(0.01) ? `< ${new SwapKitNumber(0.01).toCurrency()}` : inbound.usd.toCurrency()}
                </span>
              </div>
            )}

            {quote.estimatedTime && quote.estimatedTime.total > 0 && (
              <div className="text-thor-gray flex justify-between text-sm">
                <span>Estimated Time</span>
                <span className="text-leah font-semibold">
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

            <div className="text-thor-gray flex justify-between text-sm font-semibold">
              <span className="font-normal">Provider</span>
              <SwapProvider provider={quote.providers[0]} />
            </div>
          </div>

          {quote.memo && (
            <div className="text-thor-gray flex items-center justify-between gap-6 border-t p-4 text-sm">
              <span>Memo</span>
              <p className="text-leah text-right font-semibold text-balance break-all">{quote.memo}</p>
            </div>
          )}
        </div>

        <div className="from-lawrence pointer-events-none absolute inset-x-0 -bottom-[1px] h-4 bg-linear-to-t to-transparent" />
      </ScrollArea>
    </>
  )
}
