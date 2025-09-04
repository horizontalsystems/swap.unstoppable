import Decimal from 'decimal.js'
import { ReactNode, useState } from 'react'
import { formatDuration, intervalToDuration } from 'date-fns'
import { ArrowRightLeft, ChevronDown, ChevronUp, Clock, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { DecimalText } from '@/components/decimal-text'
import { DecimalFiat } from '@/components/decimal-fiat'
import { Quote } from '@/hooks/use-quote'
import { useSwap } from '@/hooks/use-swap'

interface SwapDetailsProps {
  quote?: Quote
}

export function SwapDetails({ quote }: SwapDetailsProps) {
  const [showMore, setShowMore] = useState(false)
  const { fromAmount, fromAsset, toAsset } = useSwap()

  if (!quote) {
    return null
  }

  const rate = (quote && (BigInt(quote.expected_amount_out) * 10n ** 12n) / fromAmount) || 0n
  const totalFee = BigInt(
    Number(quote?.fees.liquidity || 0) + Number(quote?.fees.outbound || 0) + Number(quote?.fees.affiliate || 0)
  )

  const feeInUsd = new Decimal(toAsset?.price || 0)
    .mul(totalFee)
    .div(10n ** 8n)
    .toString()

  return (
    <div className="p-5 pb-0">
      <div className="flex justify-between">
        <div className="text-gray">
          <div className="flex items-center gap-1">
            <span className="text-sm">1 {fromAsset?.metadata.symbol}</span>
            <ArrowRightLeft className="h-3 w-3" />
            <div className="text-sm">
              <DecimalText amount={rate} symbol={toAsset?.metadata.symbol} decimals={12} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray">Fee</span>
          <div className="text-leah">
            <DecimalFiat className="text-sm" amount={feeInUsd} symbol="$" decimals={2} />
          </div>
          {showMore ? (
            <ChevronUp className="text-gray h-4 w-4" onClick={() => setShowMore(false)} />
          ) : (
            <ChevronDown className="text-gray h-4 w-4" onClick={() => setShowMore(true)} />
          )}
        </div>
      </div>

      {showMore && <Separator className="my-4 bg-white/5" />}

      {showMore && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-gray text-sm">Total Fee</span>
            </div>
            <DecimalText className="text-leah text-xs" amount={totalFee} round={6} symbol={toAsset?.metadata.symbol} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-gray text-sm">Liquidity Fee</span>
              <InfoTooltip>Fee for liquidity providers on the route.</InfoTooltip>
            </div>
            <DecimalText
              className="text-leah text-xs"
              amount={BigInt(quote?.fees.liquidity || 0)}
              symbol={toAsset?.metadata.symbol}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-gray text-sm">Outbound Fee</span>
              <InfoTooltip>Outbound Fee</InfoTooltip>
            </div>
            <DecimalText
              className="text-leah text-xs"
              amount={BigInt(quote?.fees.outbound || 0)}
              symbol={toAsset?.metadata.symbol}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-gray text-sm">Affiliate Fee</span>
              <InfoTooltip>Percentage returned to the referrer.</InfoTooltip>
            </div>
            <DecimalText
              className="text-leah text-xs"
              amount={BigInt(quote?.fees.affiliate || 0)}
              symbol={toAsset?.metadata.symbol}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-gray text-sm">Est. Time</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
              <Clock className="text-gray h-4 w-4" />
              <span className="text-leah">
                {formatDuration(
                  intervalToDuration({
                    start: 0,
                    end: (quote.total_swap_seconds || 0) * 1000
                  }),
                  { format: ['hours', 'minutes', 'seconds'], zero: false }
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoTooltip({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="text-gray ml-2 h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
