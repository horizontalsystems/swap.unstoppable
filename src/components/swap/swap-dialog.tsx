import { useState } from 'react'
import { FeeOption, getChainConfig, USwapNumber } from '@uswap/core'
import { LoaderCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Credenza, CredenzaContent } from '@/components/ui/credenza'
import { SwapConfirm } from '@/components/swap/swap-confirm'
import { SwapRecipient } from '@/components/swap/swap-recipient'
import { ThemeButton } from '@/components/theme-button'
import { useAmlPrecheck } from '@/hooks/use-aml-precheck'
import { useBalance } from '@/hooks/use-balance'
import { useAssetFrom, useAssetTo, useSwap } from '@/hooks/use-swap'
import { getTrack } from '@/lib/api'
import { getRouteDepositAddress, getRouteMemo, P2P_FALLBACK_PROVIDERS } from '@/lib/swap-helpers'
import { generateId } from '@/lib/utils'
import { getUSwap } from '@/lib/wallets'
import { useIsLimitSwap } from '@/store/limit-swap-store'
import { useSetTransaction } from '@/store/transaction-store'
import { ProviderName, QuoteResponseRoute } from '@/types'

interface SwapDialogProps {
  provider: ProviderName
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const SwapDialog = ({ provider, isOpen, onOpenChange }: SwapDialogProps) => {
  const t = useTranslations('swap.toast')
  const t2 = useTranslations('swap.confirm')
  const uSwap = getUSwap()
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const { valueFrom, setAmountFrom } = useSwap()
  const { refetch: refetchBalance } = useBalance()
  const [submitting, setSubmitting] = useState(false)
  const setTransaction = useSetTransaction()
  const isLimitSwap = useIsLimitSwap()

  const [quote, setQuote] = useState<QuoteResponseRoute | undefined>(undefined)
  const aml = useAmlPrecheck(quote)

  const onConfirm = () => {
    if (!quote || !assetFrom || !assetTo || aml.blocked) return

    setSubmitting(true)

    const broadcast = uSwap
      .swap({
        route: quote,
        feeOptionKey: FeeOption.Fast,
        pluginName: P2P_FALLBACK_PROVIDERS.includes(provider) ? 'p2p' : undefined
      })
      .then((hash: string) => {
        setTransaction({
          uid: generateId(),
          provider: provider,
          uuid: quote.uuid,
          chainId: getChainConfig(assetFrom.chain).chainId,
          hash: hash,
          timestamp: new Date(),
          estimatedTime: quote.estimatedTime?.total,
          assetFrom: assetFrom,
          assetTo: assetTo,
          amountFrom: valueFrom.toSignificant(),
          amountTo: new USwapNumber(quote.expectedBuyAmount).toSignificant(),
          addressFrom: quote.sourceAddress,
          addressTo: quote.destinationAddress || '',
          addressDeposit: getRouteDepositAddress(quote),
          status: 'pending',
          limitSwapMemo: isLimitSwap ? getRouteMemo(quote) : undefined
        })

        // register the broadcast hash for tracking; the sync loop re-sends it on every poll
        if (quote.uuid) {
          getTrack({ uuid: quote.uuid, inboundTxHash: hash }).catch(() => {})
        }

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
      loading: t('submittingTransaction'),
      success: () => t('transactionSubmitted'),
      error: (err: any) => {
        console.log(err)
        return t('errorSubmitting')
      }
    })
  }

  return (
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent className="flex h-auto max-h-5/6 flex-col md:max-w-xl">
        {quote ? (
          <>
            <SwapConfirm quote={quote} />

            <div className="p-4 pt-2 md:p-8 md:pt-2">
              <ThemeButton
                variant="primaryMedium"
                className="w-full"
                onClick={() => onConfirm()}
                disabled={!quote || submitting || aml.blocked}
              >
                {submitting || aml.status === 'checking' ? (
                  <LoaderCircle size={20} className="animate-spin" />
                ) : (
                  <span>{t2('confirm')}</span>
                )}
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
