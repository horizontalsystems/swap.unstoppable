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
import type { BrokerSessionPhase, CommittedRoute, RouteTracking } from 'stellar-web-sdk'
import { executeStellarRoute } from '@/lib/stellar/execute'
import { logExecution } from '@/lib/stellar/log'
import { AppProviderName, QuoteResponseRoute } from '@/types'

interface SwapDialogProps {
  provider: AppProviderName
  /** True when stellar-web-sdk produced this route and must be the one to execute it. */
  stellarSdk: boolean
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const SwapDialog = ({ provider, stellarSdk, isOpen, onOpenChange }: SwapDialogProps) => {
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
  const [committed, setCommitted] = useState<CommittedRoute | undefined>(undefined)
  // StellarBroker re-quotes live inside the session and signs several transactions, so the confirm
  // screen has to show what the session is doing rather than a frozen snapshot.
  const [brokerPhase, setBrokerPhase] = useState<BrokerSessionPhase | undefined>(undefined)
  // Set once anything has been signed against this committed route. Signing is not idempotent —
  // a StellarBroker session fills across up to five transactions and may fail having landed some —
  // so re-running the same route would sell the full amount a second time on top of what filled.
  const [routeSpent, setRouteSpent] = useState(false)
  const aml = useAmlPrecheck(quote)

  const recordTransaction = (hash: string, route: QuoteResponseRoute, stellarTracking?: RouteTracking, stellarSignedHashes?: string[]) => {
    setTransaction({
      uid: generateId(),
      provider: provider,
      uuid: route.uuid,
      stellarTracking,
      stellarSignedHashes: stellarSignedHashes?.length ? stellarSignedHashes : undefined,
      chainId: getChainConfig(assetFrom!.chain).chainId,
      hash: hash,
      timestamp: new Date(),
      estimatedTime: route.estimatedTime?.total,
      assetFrom: assetFrom!,
      assetTo: assetTo!,
      amountFrom: valueFrom.toSignificant(),
      amountTo: new USwapNumber(route.expectedBuyAmount).toSignificant(),
      addressFrom: route.sourceAddress,
      addressTo: route.destinationAddress || '',
      addressDeposit: getRouteDepositAddress(route),
      status: 'pending',
      limitSwapMemo: isLimitSwap ? getRouteMemo(route) : undefined
    })
  }

  const onConfirmStellar = () => {
    if (!quote || !committed || !quote.sourceAddress) return

    setSubmitting(true)

    const pair = `${quote.sellAsset}->${quote.buyAsset}`
    // The outcome is reported from inside .then() when execute() returned one. This says so, to
    // keep the catch below from reporting the same failure a second time.
    let reported = false

    // NOT retried, deliberately. Signing is not idempotent: a StellarBroker session may already
    // have filled partially, and a signed_transaction route may have landed even when the submit
    // response was lost. Re-running either could spend the balance twice. Recovery here is the
    // user re-quoting from a balance that now reflects whatever did settle.
    const broadcast = executeStellarRoute(committed, quote.sourceAddress, {
      callbacks: { onPhase: setBrokerPhase }
    }).then(execution => {
      const signedHashes = execution.result.brokerSession?.signedHashes ?? []

      // Record first, and whatever the outcome: a StellarBroker session that failed may still have
      // filled partially across the transactions it did sign, and dropping the hash would leave a
      // swap that moved real value untracked. Every signed hash is kept, not just the tracked one —
      // the tracked hash is the LAST signed, which is precisely the one least likely to have landed.
      if (execution.hash) recordTransaction(execution.hash, quote, committed.tracking, signedHashes)

      // Anything signed spends the route, success or not.
      if (execution.hash || signedHashes.length) setRouteSpent(true)

      reported = true
      logExecution({
        provider,
        pair,
        outcome: execution.succeeded ? 'submitted' : 'failed',
        hash: execution.hash,
        error: execution.error && { code: (execution.error as { code?: string }).code, message: execution.error.message },
        signedCount: execution.result.brokerSession?.signedHashes.length
      })

      if (!execution.succeeded) {
        throw execution.error ?? new Error('Stellar swap failed')
      }

      setAmountFrom('')
      refetchBalance()
      onOpenChange(false)
    })

    broadcast.catch((err: any) => {
      // Covers the failures that never produced an ExecutionResult at all — a declined signature,
      // a Horizon rejection — which the .then() above never saw.
      if (!reported) logExecution({ provider, pair, outcome: 'failed', error: { code: err?.code, message: err?.message } })
      setSubmitting(false)
      setBrokerPhase(undefined)
    })

    toast.promise(broadcast, {
      loading: t('submittingTransaction'),
      success: () => t('transactionSubmitted'),
      error: (err: any) => err?.message || t('errorSubmitting')
    })
  }

  const onConfirm = () => {
    if (!quote || !assetFrom || !assetTo || aml.blocked) return

    if (stellarSdk) return onConfirmStellar()

    setSubmitting(true)

    const broadcast = uSwap
      .swap({
        // Stellar routes never reach here — swap-dialog branches on the provider before this
        // point (Phase 4). The cast covers the provider names the aggregator's own type predates.
        route: quote as Parameters<typeof uSwap.swap>[0]['route'],
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

            {routeSpent && <div className="text-thor-gray px-4 text-sm md:px-8">{t2('routeSpentHint')}</div>}

            <div className="p-4 pt-2 md:p-8 md:pt-2">
              <ThemeButton
                variant="primaryMedium"
                className="w-full"
                onClick={() => onConfirm()}
                disabled={!quote || submitting || aml.blocked || routeSpent}
              >
                {submitting || aml.status === 'checking' ? (
                  <>
                    <LoaderCircle size={20} className="animate-spin" />
                    {brokerPhase && <span>{t2(`brokerPhase.${brokerPhase}`)}</span>}
                  </>
                ) : (
                  <span>{routeSpent ? t2('routeSpent') : t2('confirm')}</span>
                )}
              </ThemeButton>
            </div>
          </>
        ) : (
          <SwapRecipient
            provider={provider}
            stellarSdk={stellarSdk}
            onFetchQuote={(quote, committed) => {
              setQuote(quote)
              setCommitted(committed)
            }}
          />
        )}
      </CredenzaContent>
    </Credenza>
  )
}
