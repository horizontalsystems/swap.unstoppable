import Decimal from 'decimal.js'
import { ReactNode, useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { useQuote } from '@/hooks/use-quote'
import { useAssetFrom, useAssetTo, useSwap } from '@/hooks/use-swap'
import { Icon } from '@/components/icons'
import { DecimalFiat } from '@/components/decimal/decimal-fiat'
import { formatDuration, intervalToDuration } from 'date-fns'

interface FeeData {
  amount: Decimal
  usd: Decimal
  symbol: string
}

export function SwapDetails() {
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const [showMore, setShowMore] = useState(false)
  const { amountFrom } = useSwap()
  const { quote } = useQuote()

  if (!quote) return null

  const price = new Decimal(quote.expectedBuyAmount)
    .div(new Decimal(amountFrom.toString()).div(10 ** 8))
    .toDecimalPlaces(8)

  const feeData = (type: string): FeeData | undefined => {
    const fee = quote.fees.find(f => f.type === type)

    if (!fee) return undefined

    const amount = new Decimal(fee.amount)
    const meta = quote.meta.assets?.find(f => f.asset === fee.asset)

    const [, symbol] = fee.asset.split('.')
    const [code] = symbol.split('-')

    return {
      amount: amount.toDecimalPlaces(8),
      usd: meta ? amount.mul(new Decimal(meta.price)).toDecimalPlaces(8) : new Decimal(0),
      symbol: code
    }
  }

  const inbound = feeData('inbound')
  const outbound = feeData('outbound')
  const liquidity = feeData('liquidity')
  const affiliate = feeData('affiliate')

  const total = (inbound?.usd || new Decimal(0))
    .add(outbound?.usd || new Decimal(0))
    .add(liquidity?.usd || new Decimal(0))
    .add(affiliate?.usd || new Decimal(0))

  const feeSection = (title: string, info: string, fee?: FeeData) => {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {title} <InfoTooltip>{info}</InfoTooltip>
        </div>
        <div className="text-leah flex items-center gap-2">
          {fee ? (
            <>
              {fee.amount.gt(0) && (
                <span className="text-thor-gray">
                  {fee.amount.toString()} {fee.symbol}
                </span>
              )}

              {fee.usd.gt(0) ? (
                <DecimalFiat className="text-leah" amount={fee.usd.toString()} symbol="$" decimals={2} />
              ) : (
                0
              )}
            </>
          ) : (
            0
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="cursor-pointer p-4" onClick={() => setShowMore(!showMore)}>
        <div className="flex justify-between">
          <div className="text-thor-gray flex items-center gap-1 text-sm font-semibold">
            <span>Total Fee</span>
          </div>

          <div className="text-leah flex items-center gap-2 text-sm font-semibold">
            <DecimalFiat className="text-leah" amount={total.toString()} symbol="$" decimals={2} />
            <Icon name={showMore ? 'arrow-s-up' : 'arrow-s-down'} className="size-5" />
          </div>
        </div>
      </div>

      {showMore && quote && <Separator className="bg-blade" />}

      {showMore && quote && (
        <div className="text-thor-gray space-y-4 px-4 pt-2 pb-5 text-sm font-semibold">
          <div className="flex items-center justify-between">
            <div className="flex items-center">Price</div>
            <div className="text-leah flex items-center gap-1">
              {price ? (
                <>
                  <span>1 {assetFrom?.metadata.symbol} =</span>
                  {price.toString()} {assetTo?.metadata.symbol}
                </>
              ) : null}
            </div>
          </div>

          {feeSection('Inbound Fee', 'Fee for sending inbound transaction', inbound)}
          {feeSection('Outbound Fee', 'Fee for sending outbound transaction', outbound)}
          {feeSection('Liquidity Fee', 'Fee for liquidity providers on the route', liquidity)}
          {feeSection('Exchange Fee', 'Fee charged by THORChain Swap', affiliate)}

          <div className="flex items-center justify-between">
            Estimated Time
            <div className="flex items-center gap-2">
              {quote.estimatedTime ? (
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
      )}
    </>
  )
}

function InfoTooltip({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Icon name="info" className="text-thor-gray ml-1 size-4" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
