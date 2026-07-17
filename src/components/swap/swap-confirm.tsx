import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { USwapNumber } from '@uswap/core'
import { formatDuration, intervalToDuration } from 'date-fns'
import { CredenzaHeader, CredenzaTitle } from '@/components/ui/credenza'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AssetIcon } from '@/components/asset-icon'
import { CopyButton } from '@/components/button-copy'
import { chainLabel } from '@/components/connect-wallet/config'
import { DecimalText } from '@/components/decimal/decimal-text'
import { Icon } from '@/components/icons'
import { PriceImpact } from '@/components/swap/price-impact'
import { SwapProvider } from '@/components/swap/swap-provider'
import { InfoTooltip } from '@/components/tooltip'
import { useRates, useSwapRates } from '@/hooks/use-rates'
import { useAssetFrom, useAssetTo, useSlippage } from '@/hooks/use-swap'
import { getRouteMemo, resolveFees, resolvePriceImpact } from '@/lib/swap-helpers'
import { cn, truncate } from '@/lib/utils'
import { useIsLimitSwap, useLimitSwapBuyAmount } from '@/store/limit-swap-store'
import { QuoteResponseRoute } from '@/types'

interface SwapConfirmProps {
  quote: QuoteResponseRoute & {
    refundAddress?: string
  }
}

export const SwapConfirm = ({ quote }: SwapConfirmProps) => {
  const t = useTranslations('swap.confirm')
  const tc = useTranslations('common')
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const slippage = useSlippage()
  const isLimitSwap = useIsLimitSwap()
  const limitSwapBuyAmount = useLimitSwapBuyAmount()

  if (!assetFrom || !assetTo) return null

  const identifiers = useMemo(() => quote.fees.map(f => f.asset).sort(), [quote.fees])
  const { rates } = useRates(identifiers)
  const { rateFrom, rateTo } = useSwapRates()

  const sellAmount = new USwapNumber(quote.sellAmount)
  const expectedBuyAmount = new USwapNumber(quote.expectedBuyAmount)
  // null = floating-rate estimate, shown as "not guaranteed"
  const minBuyAmount = quote.minBuyAmount ? new USwapNumber(quote.minBuyAmount) : undefined
  const memo = getRouteMemo(quote)

  const { inbound } = resolveFees(quote, rates)

  const limitBuyAmount = useMemo(() => {
    if (!limitSwapBuyAmount) return null
    return USwapNumber.fromBigInt(BigInt(limitSwapBuyAmount), 8)
  }, [limitSwapBuyAmount])

  const limitPricePerUnit = useMemo(() => {
    if (!limitBuyAmount || sellAmount.eq(0)) return null
    return limitBuyAmount.div(sellAmount)
  }, [limitBuyAmount, sellAmount])

  const limitPriceDifferencePercent = useMemo(() => {
    if (!limitBuyAmount || expectedBuyAmount.eq(0)) return null
    return limitBuyAmount.sub(expectedBuyAmount).div(expectedBuyAmount).mul(100)
  }, [limitBuyAmount, expectedBuyAmount])

  const priceImpact = resolvePriceImpact(quote, rateFrom, rateTo)
  const displayBuyAmount = isLimitSwap && limitBuyAmount ? limitBuyAmount : expectedBuyAmount

  return (
    <>
      <CredenzaHeader>
        <CredenzaTitle>{isLimitSwap ? t('titleLimit') : t('titleSwap')}</CredenzaTitle>
      </CredenzaHeader>

      <ScrollArea className="relative flex min-h-0 flex-1 px-4 md:px-8" classNameViewport="flex-1 h-auto">
        <div className="mb-4 rounded-xl border">
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
                <span className="text-leah text-base font-semibold">
                  <DecimalText amount={sellAmount.toSignificant()} />
                </span>
                <span className="text-thor-gray text-sm">{rateFrom ? sellAmount.mul(rateFrom).toCurrency() : 'n/a'}</span>
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
                <span className="text-leah text-base font-semibold">
                  <DecimalText amount={displayBuyAmount.toSignificant()} />
                </span>
                <span className="text-thor-gray text-sm">{rateTo ? displayBuyAmount.mul(rateTo).toCurrency() : 'n/a'}</span>
              </div>
            </div>

            <div className="bg-lawrence absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2">
              <Icon name="arrow-m-down" className="text-thor-gray size-5" />
            </div>
          </div>

          <div className="space-y-4 border-t p-4">
            {isLimitSwap && limitPricePerUnit ? (
              <>
                <div className="text-thor-gray flex justify-between text-sm">
                  <div className="flex items-center gap-1">
                    {t('limitPrice')}
                    <InfoTooltip>{t('limitPriceTooltip')}</InfoTooltip>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-leah font-semibold">
                      <DecimalText amount={limitPricePerUnit.toSignificant()} /> {assetTo.ticker}/{assetFrom.ticker}
                    </span>
                    {limitPriceDifferencePercent && (
                      <span
                        className={cn('font-medium', {
                          'text-remus': limitPriceDifferencePercent.gt(0),
                          'text-lucian': limitPriceDifferencePercent.lt(0)
                        })}
                      >
                        ({limitPriceDifferencePercent.gte(0) ? '+' : ''}
                        {limitPriceDifferencePercent.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-thor-gray flex justify-between text-sm">
                  <div className="flex items-center gap-1">
                    {t('targetAmount')}
                    <InfoTooltip>{t('targetAmountTooltip')}</InfoTooltip>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-leah font-semibold">
                      <DecimalText amount={displayBuyAmount.toSignificant()} symbol={assetTo.ticker} />
                    </span>
                    {rateTo && <span className="font-medium">({displayBuyAmount.mul(rateTo).toCurrency()})</span>}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-thor-gray flex justify-between text-sm">
                <div className="flex items-center gap-1">
                  <span>{t('minimumPayout')}</span>
                  {slippage && (
                    <span
                      className={cn({
                        'text-jacob': slippage > 3
                      })}
                    >
                      ({slippage}%)
                    </span>
                  )}
                  <InfoTooltip>{t('minimumPayoutTooltip', { slippage: slippage ?? 0 })}</InfoTooltip>
                </div>
                {slippage && minBuyAmount ? (
                  <div className="flex gap-2">
                    <span className="text-leah font-semibold">
                      <DecimalText amount={minBuyAmount.toSignificant()} symbol={assetTo.ticker} />
                    </span>
                    {rateTo && <span className="font-medium">({minBuyAmount.mul(rateTo).toCurrency()})</span>}
                  </div>
                ) : (
                  <span className="text-lucian font-semibold">{t('notGuaranteed')}</span>
                )}
              </div>
            )}

            {quote.sourceAddress && quote.sourceAddress !== '{sourceAddress}' && (
              <div className="text-thor-gray flex justify-between text-sm">
                <span>{tc('address.source')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-leah font-semibold">{truncate(quote.sourceAddress)}</span>
                  <CopyButton text={quote.sourceAddress} />
                </div>
              </div>
            )}

            {quote.destinationAddress && (
              <div className="text-thor-gray flex justify-between text-sm">
                <span>{tc('address.destination')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-leah font-semibold">{truncate(quote.destinationAddress)}</span>
                  <CopyButton text={quote.destinationAddress} />
                </div>
              </div>
            )}

            {quote.refundAddress && quote.sourceAddress != quote.refundAddress && (
              <div className="text-thor-gray flex justify-between text-sm">
                <span>{tc('address.refund')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-leah font-semibold">{truncate(quote.refundAddress)}</span>
                  <CopyButton text={quote.refundAddress} />
                </div>
              </div>
            )}

            {!isLimitSwap && priceImpact && (
              <div className="text-thor-gray flex justify-between text-sm">
                <div className="flex items-center gap-1">
                  {t('priceImpact')}
                  <InfoTooltip>{t('priceImpactTooltip')}</InfoTooltip>
                </div>
                <PriceImpact priceImpact={priceImpact} className="font-semibold" />
              </div>
            )}

            {inbound && (
              <div className="text-thor-gray flex justify-between text-sm">
                <span>{t('txFee')}</span>
                <span className="text-leah font-semibold">
                  {inbound.usd.lt(0.01) ? `< ${new USwapNumber(0.01).toCurrency()}` : inbound.usd.toCurrency()}
                </span>
              </div>
            )}

            {quote.estimatedTime && quote.estimatedTime.total > 0 && (
              <div className="text-thor-gray flex justify-between text-sm">
                <span>{t('estimatedTime')}</span>
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
              <span className="font-normal">{t('provider')}</span>
              <SwapProvider provider={quote.providers[0]} />
            </div>
          </div>

          {memo && (
            <div className="text-thor-gray flex items-center justify-between gap-6 border-t p-4 text-sm">
              <span>{t('memo')}</span>
              <p className="text-leah text-right font-semibold text-balance break-all">{memo}</p>
            </div>
          )}
        </div>

        <div className="from-lawrence pointer-events-none absolute inset-x-0 -bottom-[1px] h-4 bg-linear-to-t to-transparent" />
      </ScrollArea>
    </>
  )
}
