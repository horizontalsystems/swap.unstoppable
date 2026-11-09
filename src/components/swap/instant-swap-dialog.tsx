import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { getChainConfig, USwapNumber } from '@uswap/core'
import { USwapError } from '@uswap/helpers'
import { USwapApi } from '@uswap/helpers/api'
import { LoaderCircle } from 'lucide-react'
import { Credenza, CredenzaContent } from '@/components/ui/credenza'
import { InstantSwap } from '@/components/swap/instant-swap'
import { SwapConfirm } from '@/components/swap/swap-confirm'
import { SwapError } from '@/components/swap/swap-error'
import { SwapRecipient } from '@/components/swap/swap-recipient'
import { ThemeButton } from '@/components/theme-button'
import { useAmlPrecheck } from '@/hooks/use-aml-precheck'
import { commitRoute, StaleQuoteError } from '@/lib/api'
import { useAssetFrom, useAssetTo, useSwap } from '@/hooks/use-swap'
import { attachmentToTxExtra, getRouteMemo, QR_PROVIDERS } from '@/lib/swap-helpers'
import { generateId } from '@/lib/utils'
import { useSetTransaction } from '@/store/transaction-store'
import { ProviderName, QuoteResponseRoute } from '@/types'

interface InstantSwapDialogProps {
  provider: ProviderName
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export interface DepositChannel {
  qrCodeData: string
  address: string
  value: string
  expiration?: number
  txExtraAttribute?: any
}

export const InstantSwapDialog = ({ provider, isOpen, onOpenChange }: InstantSwapDialogProps) => {
  const t = useTranslations('swap.instant')
  const tt = useTranslations('swap.toast')
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const { valueFrom } = useSwap()
  const setTransaction = useSetTransaction()

  const [quote, setQuote] = useState<QuoteResponseRoute | undefined>(undefined)
  const [refreshQuote, setRefreshQuote] = useState<(() => Promise<QuoteResponseRoute>) | undefined>(undefined)
  const [channel, setChannel] = useState<DepositChannel | undefined>(undefined)
  const [creatingChannel, setCreatingChannel] = useState(false)
  const [error, setError] = useState<Error | undefined>()
  const aml = useAmlPrecheck(quote)

  if (!assetFrom || !assetTo) return null

  const createChannel = (
    quote: QuoteResponseRoute,
    qrCodeData: string,
    address: string,
    value: string,
    expiration?: number,
    txExtraAttribute?: any
  ) => {
    setChannel({
      qrCodeData,
      address,
      value,
      expiration,
      txExtraAttribute
    })

    setTransaction({
      uid: generateId(),
      provider,
      uuid: quote.uuid,
      chainId: getChainConfig(assetFrom.chain).chainId,
      timestamp: new Date(),
      estimatedTime: quote.estimatedTime?.total,
      assetFrom,
      assetTo,
      amountFrom: value,
      amountTo: new USwapNumber(quote.expectedBuyAmount).toSignificant(),
      addressTo: quote.destinationAddress || '',
      addressDeposit: address,
      status: 'not_started',
      qrCodeData,
      expiration,
      txExtraAttribute
    })
  }

  const onConfirm = () => {
    if (!quote || !assetFrom || aml.blocked) return

    setCreatingChannel(true)
    setError(undefined)

    // commit creates the order; for transfer providers it carries the deposit address the preview didn't have
    commitRoute(quote)
      .then(route => (QR_PROVIDERS.includes(provider) ? openDepositChannel(route) : openMemolessChannel(route)))
      .catch(err => {
        if (err instanceof StaleQuoteError) {
          setError(new Error(err.reason === 'rate_changed' ? tt('priceChanged') : tt('quoteExpired')))
          // the preview can't be committed any more: show a fresh one and let the user confirm again
          return refreshQuote?.()
            .then(setQuote)
            .catch(() => setQuote(undefined))
        }

        if (err instanceof USwapError) {
          const error = err.cause as any
          setError(new Error(error?.errorData?.error?.message || err.message))
        } else {
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      })
      .finally(() => {
        setCreatingChannel(false)
      })
  }

  const openDepositChannel = (route: QuoteResponseRoute) => {
    const execution = route.execution
    if (execution?.method !== 'transfer' || !execution.qr) {
      throw new Error(t('errDepositUnavailable'))
    }

    createChannel(
      route,
      execution.qr.dataURL,
      execution.depositAddress,
      execution.amount,
      route.expiresAt ? route.expiresAt / 1000 : undefined,
      attachmentToTxExtra(execution.attachment)
    )
  }

  const openMemolessChannel = (route: QuoteResponseRoute) => {
    const memo = getRouteMemo(route)
    if (!memo) {
      throw new Error(t('errMemoMissing'))
    }

    return USwapApi.registerMemoless(
      {
        asset: assetFrom.identifier,
        memo,
        requested_in_asset_amount: valueFrom.toSignificant()
      },
      {
        retry: {
          maxRetries: 0
        }
      }
    )
      .then(data => {
        const suggestedInAssetAmount = data.suggested_in_asset_amount
        if (!suggestedInAssetAmount) {
          throw new Error(t('errCalcAmount'))
        }

        return USwapApi.preflightMemoless({
          asset: assetFrom.identifier,
          reference: data.reference,
          amount: suggestedInAssetAmount
        }).then(preflight => ({
          ...preflight,
          suggested_in_asset_amount: suggestedInAssetAmount
        }))
      })
      .then(preflight => {
        if (!preflight.data.qr_code_data_url || !preflight.data.inbound_address) {
          console.log('Failed to preflight request', { preflight })
          throw new Error(t('errPreflight'))
        }

        createChannel(
          route,
          preflight.data.qr_code_data_url,
          preflight.data.inbound_address,
          preflight.suggested_in_asset_amount,
          preflight.data.seconds_remaining ? new Date().getTime() / 1000 + preflight.data.seconds_remaining : undefined
        )
      })
  }

  return (
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent className="flex h-auto max-h-5/6 flex-col md:max-w-xl">
        {channel ? (
          <InstantSwap assetFrom={assetFrom} assetTo={assetTo} channel={channel} />
        ) : quote ? (
          <>
            <SwapConfirm quote={quote} />

            {error && (
              <div className="px-8 pt-2 pb-4">
                <SwapError error={error} />
              </div>
            )}

            <div className="p-4 pt-2 md:p-8 md:pt-2">
              <ThemeButton
                variant={channel ? 'secondaryMedium' : 'primaryMedium'}
                className="w-full"
                onClick={() => onConfirm()}
                disabled={creatingChannel || aml.blocked}
              >
                {(creatingChannel || aml.status === 'checking') && <LoaderCircle size={20} className="animate-spin" />}
                <span>{creatingChannel ? t('confirming') : t('confirm')}</span>
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
