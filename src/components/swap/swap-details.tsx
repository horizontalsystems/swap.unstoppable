import Decimal from 'decimal.js'
import { ReactNode, useState } from 'react'
import { formatDuration, intervalToDuration } from 'date-fns'
import { ArrowRightLeft, ChevronDown, ChevronUp, Clock, Info, LoaderCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { DecimalText } from '@/components/decimal/decimal-text'
import { DecimalFiat } from '@/components/decimal/decimal-fiat'
import { useQuote } from '@/hooks/use-quote'
import { useAssetFrom, useAssetTo, useSwap } from '@/hooks/use-swap'
import { useRates } from '@/hooks/use-rates'
import { useSimulation } from '@/hooks/use-simulation'
import { gasToken } from 'rujira.js'

export function SwapDetails() {
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const [showMore, setShowMore] = useState(false)
  const { amountFrom } = useSwap()
  const { quote } = useQuote()
  const { simulationData, isLoading: isSimulating } = useSimulation()
  const { rates } = useRates()

  const _rateTo = assetTo && rates[assetTo.asset]
  const rateTo = _rateTo && new Decimal(_rateTo)

  // const _rateGas = simulationData && rates[simulationData.simulation.symbol]
  const _rateGas = assetFrom && rates[assetFrom.asset]
  const rateGas = _rateGas && new Decimal(_rateGas)

  const price = quote && (BigInt(quote.expected_amount_out) * 10n ** 12n) / amountFrom

  const gasFee =
    simulationData &&
    new Decimal(simulationData.simulation.amount.toString()).div(10 ** simulationData.simulation.decimals)
  const swapFee = quote && new Decimal(quote.fees.total).div(10n ** 8n)

  const gasFeeInUsd = gasFee && rateGas && gasFee.mul(rateGas)
  const swapFeeInUsd = swapFee && rateTo && swapFee.mul(rateTo)
  const feeInUsd = gasFeeInUsd && swapFeeInUsd && gasFeeInUsd.add(swapFeeInUsd)

  return (
    <>
      <div className="cursor-pointer p-4" onClick={() => setShowMore(!showMore)}>
        <div className="flex justify-between">
          <div className="text-gray">
            <div className="flex items-center gap-1">
              {price ? (
                <>
                  <span className="text-sm">1 {assetFrom?.metadata.symbol}</span>
                  <ArrowRightLeft className="h-3 w-3" />
                  <div className="text-sm">
                    <DecimalText amount={price} symbol={assetTo?.metadata.symbol} decimals={12} />
                  </div>
                </>
              ) : (
                <span className="text-sm">Price</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray">Fees:</span>
            {isSimulating ? (
              <LoaderCircle size={16} className="text-gray animate-spin" />
            ) : (
              <>
                {simulationData ? (
                  <>
                    {feeInUsd ? (
                      <div className="text-leah">
                        <DecimalFiat className="text-sm" amount={feeInUsd.toString()} symbol="$" decimals={2} />
                      </div>
                    ) : (
                      <div className="text-gray">
                        <DecimalFiat className="text-sm" amount="0" symbol="$" decimals={0} />
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-gray">n/a</span>
                )}
              </>
            )}
            {showMore ? <ChevronUp className="text-gray h-4 w-4" /> : <ChevronDown className="text-gray h-4 w-4" />}
          </div>
        </div>
      </div>

      {showMore && <Separator className="bg-blade" />}

      {showMore && (
        <div className="space-y-4 px-4 pt-2 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-gray text-sm">Gas Fee</span>
              <InfoTooltip>Fee for sending inbound transaction</InfoTooltip>
            </div>
            <div className="flex items-center gap-1">
              {isSimulating ? (
                <LoaderCircle size={16} className="text-gray animate-spin" />
              ) : (
                <>
                  {simulationData ? (
                    <>
                      <DecimalText
                        className="text-gray text-sm"
                        amount={simulationData?.simulation.amount || 0n}
                        symbol={assetFrom && gasToken(assetFrom.chain).symbol}
                        decimals={simulationData?.simulation.decimals}
                        subscript
                      />

                      {gasFeeInUsd && (
                        <DecimalFiat
                          className="text-leah text-sm"
                          amount={gasFeeInUsd.toString()}
                          symbol="$"
                          decimals={2}
                        />
                      )}
                    </>
                  ) : (
                    <span className="text-gray text-sm">n/a</span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-gray text-sm">Liquidity Fee</span>
              <InfoTooltip>Fee for liquidity providers on the route</InfoTooltip>
            </div>
            <div className="flex items-center gap-1">
              <DecimalText
                className="text-gray text-sm"
                amount={BigInt(quote?.fees.liquidity || 0)}
                symbol={assetTo?.metadata.symbol}
                subscript
              />

              {quote && rateTo && (
                <DecimalFiat
                  className="text-leah text-sm"
                  amount={rateTo
                    .mul(quote.fees.liquidity)
                    .div(10 ** 8)
                    .toString()}
                  symbol="$"
                  decimals={2}
                />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-gray text-sm">Outbound Fee</span>
              <InfoTooltip>Outbound Fee</InfoTooltip>
            </div>
            <div className="flex items-center gap-1">
              <DecimalText
                className="text-gray text-sm"
                amount={BigInt(quote?.fees.outbound || 0)}
                symbol={assetTo?.metadata.symbol}
                subscript
              />

              {quote && rateTo && (
                <DecimalFiat
                  className="text-leah text-sm"
                  amount={rateTo
                    .mul(quote.fees.outbound)
                    .div(10 ** 8)
                    .toString()}
                  symbol="$"
                  decimals={2}
                />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-gray text-sm">Est. Time</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
              <Clock className="text-gray h-4 w-4" />

              {quote && (
                <span className="text-leah">
                  {formatDuration(
                    intervalToDuration({
                      start: 0,
                      end: (quote?.total_swap_seconds || 0) * 1000
                    }),
                    { format: ['hours', 'minutes', 'seconds'], zero: false }
                  )}
                </span>
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
          <Info className="text-gray ml-2 h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
