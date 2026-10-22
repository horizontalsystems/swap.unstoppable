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
import { CommitError, commitRoute, reportSigned, StaleQuoteError } from '@/lib/api'
import { getRouteDepositAddress, getRouteMemo } from '@/lib/swap-helpers'
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
  const [refreshQuote, setRefreshQuote] = useState<(() => Promise<QuoteResponseRoute>) | undefined>(undefined)
  const aml = useAmlPrecheck(quote)

  const onConfirm = () => {
    if (!quote || !assetFrom || !assetTo || aml.blocked) return

    setSubmitting(true)

    // commit creates the order (and, for transfer providers, the deposit address), then the wallet signs and broadcasts
    const broadcast = commitRoute(quote)
      .then(route => uSwap.swap({ route, feeOptionKey: FeeOption.Fast }).then((hash: string) => ({ route, hash })))
      .then(({ route, hash }) => {
        setTransaction({
          uid: generateId(),
          provider: provider,
          uuid: route.uuid,
          chainId: getChainConfig(assetFrom.chain).chainId,
          hash: hash,
          timestamp: new Date(),
          estimatedTime: route.estimatedTime?.total,
          assetFrom: assetFrom,
          assetTo: assetTo,
          amountFrom: new USwapNumber(route.sellAmount).toSignificant(),
          amountTo: new USwapNumber(route.expectedBuyAmount).toSignificant(),
          addressFrom: route.sourceAddress,
          addressTo: route.destinationAddress || '',
          addressDeposit: getRouteDepositAddress(route),
          status: 'pending',
          limitSwapMemo: isLimitSwap ? getRouteMemo(route) : undefined
        })

        // register the broadcast hash for tracking; the sync loop re-sends it on every poll
        if (route.uuid) {
          reportSigned({ uuid: route.uuid, inboundTxHash: hash }).catch(() => {})
        }

        setAmountFrom('')
        refetchBalance()

        onOpenChange(false)
      })
      .catch((err: any) => {
        console.log(err)
        // the preview can't be committed any more: show a fresh one and let the user confirm again.
        // Confirm stays disabled until it arrives, so the dead token isn't committed again meanwhile.
        if (err instanceof StaleQuoteError && refreshQuote) {
          refreshQuote()
            .then(setQuote)
            .catch(() => setQuote(undefined))
            .finally(() => setSubmitting(false))
        } else {
          setSubmitting(false)
        }
        throw err
      })

    toast.promise(broadcast, {
      loading: t('submittingTransaction'),
      success: () => t('transactionSubmitted'),
      error: (err: any) => {
        if (err instanceof StaleQuoteError) return err.reason === 'rate_changed' ? t('priceChanged') : t('quoteExpired')
        if (err instanceof CommitError) return err.message
        console.log(err)
        // show USwap's readable message, but not a raw library Error
        const cause = err?.cause
        const readable = cause && !(cause instanceof Error) && typeof cause.message === 'string' ? cause.message : undefined
        return readable || t('errorSubmitting')
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
              <ThemeButton variant="primaryMedium" className="w-full" onClick={() => onConfirm()} disabled={!quote || submitting || aml.blocked}>
                {submitting || aml.status === 'checking' ? <LoaderCircle size={20} className="animate-spin" /> : <span>{t2('confirm')}</span>}
              </ThemeButton>
            </div>
          </>
        ) : (
          <SwapRecipient
            provider={provider}
            onFetchQuote={(quote, refresh) => {
              setQuote(quote)
              setRefreshQuote(() => refresh)
            }}
          />
        )}
      </CredenzaContent>
    </Credenza>
  )
}
