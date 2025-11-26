import { Credenza, CredenzaContent } from '@/components/ui/credenza'
import { SwapRecipient } from '@/components/swap/swap-recipient'
import { useState } from 'react'
import { QuoteResponseRoute } from '@swapkit/helpers/api'
import { SwapConfirm } from '@/components/swap/swap-confirm'
import { ThemeButton } from '@/components/theme-button'
import { LoaderCircle } from 'lucide-react'
import { FeeOption, getChainConfig, SwapKitNumber } from '@swapkit/core'
import { toast } from 'sonner'
import { getSwapKit } from '@/lib/wallets'
import { useAssetFrom, useAssetTo, useSwap } from '@/hooks/use-swap'
import { useBalance } from '@/hooks/use-balance'
import { transactionStore } from '@/store/transaction-store'

interface SwapDialogProps {
  provider: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const SwapDialog = ({ provider, isOpen, onOpenChange }: SwapDialogProps) => {
  const swapKit = getSwapKit()
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const { valueFrom, setAmountFrom } = useSwap()
  const { refetch: refetchBalance } = useBalance()
  const [submitting, setSubmitting] = useState(false)
  const { setTransaction } = transactionStore()

  const [quote, setQuote] = useState<QuoteResponseRoute | undefined>(undefined)

  const onConfirm = () => {
    if (!quote || !assetFrom || !assetTo) return

    setSubmitting(true)

    const broadcast = swapKit
      .swap({
        route: quote as any,
        feeOptionKey: FeeOption.Fast
      })
      .then((hash: string) => {
        setTransaction({
          chainId: getChainConfig(assetFrom.chain).chainId,
          hash: hash,
          timestamp: new Date(),
          assetFrom: assetFrom,
          assetTo: assetTo,
          amountFrom: valueFrom.toSignificant(),
          amountTo: new SwapKitNumber(quote.expectedBuyAmount).toSignificant(),
          addressFrom: quote.sourceAddress,
          addressTo: quote.destinationAddress,
          addressDeposit: quote.inboundAddress,
          status: 'pending'
        })

        setAmountFrom('')
        refetchBalance()

        onOpenChange(false)
      })
      .catch((err: any) => {
        console.log(err)
        setSubmitting(false)
        throw err
      })

    toast.promise(broadcast, {
      loading: 'Submitting Transaction',
      success: () => 'Transaction submitted',
      error: (err: any) => {
        console.log(err)
        return 'Error Submitting Transaction'
      }
    })
  }

  return (
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent className="flex h-auto max-h-5/6 flex-col md:max-w-lg">
        {quote ? (
          <>
            <SwapConfirm quote={quote} />

            <div className="p-4 pt-2 md:p-8 md:pt-2">
              <ThemeButton
                variant="primaryMedium"
                className="w-full"
                onClick={() => onConfirm()}
                disabled={!quote || submitting}
              >
                {submitting ? <LoaderCircle size={20} className="animate-spin" /> : <span>Confirm</span>}
              </ThemeButton>
            </div>
          </>
        ) : (
          <SwapRecipient provider={provider} onFetchQuote={quote => setQuote(quote)} />
        )}
      </CredenzaContent>
    </Credenza>
  )
}
