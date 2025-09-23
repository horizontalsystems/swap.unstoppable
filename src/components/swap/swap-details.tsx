import Decimal from 'decimal.js'
import { ReactNode, useState } from 'react'
import { formatDuration, intervalToDuration } from 'date-fns'
import { LoaderCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { DecimalText } from '@/components/decimal/decimal-text'
import { DecimalFiat } from '@/components/decimal/decimal-fiat'
import { useQuote } from '@/hooks/use-quote'
import { useAssetFrom, useAssetTo, useSwap } from '@/hooks/use-swap'
import { useRates } from '@/hooks/use-rates'
import { useSimulation } from '@/hooks/use-simulation'
import { gasToken } from 'rujira.js'
import { Icon } from '@/components/icons'

export function SwapDetails() {
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const [showMore, setShowMore] = useState(false)
  const { amountFrom } = useSwap()
  const { quote } = useQuote()
  const { simulationData, isLoading: isSimulating } = useSimulation()
  const { rates } = useRates()

  if (!quote) return null

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
          <div className="text-thor-gray flex items-center gap-1 text-sm font-semibold">
            {price ? (
              <>
                <span>1 {assetFrom?.metadata.symbol} = </span>
                <DecimalText amount={price} symbol={assetTo?.metadata.symbol} decimals={12} />
              </>
            ) : (
              <span>Price</span>
            )}
          </div>

          <div className="text-thor-gray flex items-center gap-2 text-sm font-semibold">
            <span>Fees:</span>
            {isSimulating ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <>
                {simulationData ? (
                  <>
                    {feeInUsd ? (
                      <DecimalFiat className="text-leah" amount={feeInUsd.toString()} symbol="$" decimals={2} />
                    ) : (
                      <DecimalFiat amount="0" symbol="$" decimals={0} />
                    )}
                  </>
                ) : (
                  <span>n/a</span>
                )}
              </>
            )}

            <Icon name={showMore ? 'arrow-s-up' : 'arrow-s-down'} className="size-5" />
          </div>
        </div>
      </div>

      {showMore && quote && <Separator className="bg-blade" />}

      {showMore && quote && (
        <div className="text-thor-gray space-y-4 px-4 pt-2 pb-5 text-sm font-semibold">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              Inbound Fee
              <InfoTooltip>Fee for sending inbound transaction</InfoTooltip>
            </div>
            <div className="flex items-center gap-2">
              {isSimulating ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <>
                  {simulationData ? (
                    <>
                      <DecimalText
                        amount={simulationData?.simulation.amount || 0n}
                        symbol={assetFrom && gasToken(assetFrom.chain).symbol}
                        decimals={simulationData?.simulation.decimals}
                      />

                      {gasFeeInUsd && (
                        <DecimalFiat className="text-leah" amount={gasFeeInUsd.toString()} symbol="$" decimals={2} />
                      )}
                    </>
                  ) : (
                    <span className="text-thor-gray">n/a</span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              Liquidity Fee
              <InfoTooltip>Fee for liquidity providers on the route</InfoTooltip>
            </div>
            <div className="flex items-center gap-2">
              {quote && <DecimalText amount={BigInt(quote.fees.liquidity || 0)} symbol={assetTo?.metadata.symbol} />}

              {quote && rateTo && (
                <DecimalFiat
                  className="text-leah"
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
              Outbound Fee
              <InfoTooltip>Fee for sending outbound transaction</InfoTooltip>
            </div>
            <div className="flex items-center gap-2">
              {quote && <DecimalText amount={BigInt(quote.fees.outbound || 0)} symbol={assetTo?.metadata.symbol} />}

              {quote && rateTo && (
                <DecimalFiat
                  className="text-leah"
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
            Estimated Time
            <div className="flex items-center gap-2">
              {quote && quote.total_swap_seconds ? (
                <span className="text-leah">
                  {formatDuration(
                    intervalToDuration({
                      start: 0,
                      end: (quote.total_swap_seconds || 0) * 1000
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
