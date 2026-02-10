import { Credenza, CredenzaContent, CredenzaHeader, CredenzaTitle } from '@/components/ui/credenza'
import { FeeData } from '@/lib/swap-helpers'
import { InfoTooltip } from '@/components/tooltip'
import { AppConfig } from '@/config'
import { DecimalText } from '@/components/decimal/decimal-text'

interface SwapFeeDialogProps {
  outbound?: FeeData
  liquidity?: FeeData
  platform?: FeeData
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const SwapFeeDialog = ({ outbound, liquidity, platform, isOpen, onOpenChange }: SwapFeeDialogProps) => {
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
                  <DecimalText amount={fee.amount.toSignificant()} symbol={fee.ticker} />
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

  return (
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent className="flex h-auto max-h-5/6 flex-col md:max-w-md">
        <CredenzaHeader className="pb-4">
          <CredenzaTitle className="text-base">Fees Included in the Rate</CredenzaTitle>
        </CredenzaHeader>

        <div className="flex flex-col gap-6 p-8 pt-0">
          <div className="text-thor-gray text-xs">
            These fees are already included in the rate — you don’t pay them separately.
          </div>

          <div className="flex flex-col space-y-4 text-xs font-semibold">
            {feeSection('Liquidity Fee', 'Fee for liquidity providers on the route', liquidity)}
            {feeSection('Outbound Fee', 'Fee for sending outbound transaction', outbound)}
            {feeSection('Platform Fee', `Fee charged by ${AppConfig.title}`, platform)}
          </div>
        </div>
      </CredenzaContent>
    </Credenza>
  )
}
