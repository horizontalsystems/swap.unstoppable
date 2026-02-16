import { useState } from 'react'
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
import { useAssetFrom, useAssetTo, useSwap } from '@/hooks/use-swap'
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
}

export const InstantSwapDialog = ({ provider, isOpen, onOpenChange }: InstantSwapDialogProps) => {
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const { valueFrom } = useSwap()
  const setTransaction = useSetTransaction()

  const [quote, setQuote] = useState<(QuoteResponseRoute & { qrCodeDataURL?: string }) | undefined>(undefined)
  const [channel, setChannel] = useState<DepositChannel | undefined>(undefined)
  const [creatingChannel, setCreatingChannel] = useState(false)
  const [error, setError] = useState<Error | undefined>()

  if (!assetFrom || !assetTo) return null

  const createChannel = (quote: QuoteResponseRoute, qrCodeData: string, address: string, value: string, expiration?: number) => {
    setChannel({
      qrCodeData,
      address,
      value,
      expiration
    })

    setTransaction({
      uid: generateId(),
      provider,
      providerSwapId: quote.providerSwapId,
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
      expiration
    })
  }

  const onConfirm = () => {
    if (!quote || !assetFrom) return

    const qrProviders = ['NEAR', 'LETSEXCHANGE', 'QUICKEX', 'STEALTHEX', 'SWAPUZ']
    if (qrProviders.includes(provider)) {
      if (!quote.inboundAddress || !quote.qrCodeDataURL) return

      createChannel(quote, quote.qrCodeDataURL, quote.inboundAddress, quote.sellAmount, quote.expiration ? Number(quote.expiration) : undefined)

      return
    }

    if (!quote.memo) {
      setError(new Error('Memo is missing'))
      return
    }

    setCreatingChannel(true)
    setError(undefined)

    USwapApi.registerMemoless(
      {
        asset: assetFrom.identifier,
        memo: quote.memo,
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
          throw new Error('Failed to calculate suggested amount')
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
          throw new Error('Failed to preflight request')
        }

        createChannel(
          quote,
          preflight.data.qr_code_data_url,
          preflight.data.inbound_address,
          preflight.suggested_in_asset_amount,
          preflight.data.seconds_remaining ? new Date().getTime() / 1000 + preflight.data.seconds_remaining : undefined
        )
      })
      .catch(err => {
        if (err instanceof USwapError) {
          const error = err.cause as any
          setError(new Error(error?.errorData?.error?.message || err.message))
        } else {
          setError(err)
        }
      })
      .finally(() => {
        setCreatingChannel(false)
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
                disabled={creatingChannel}
              >
                {creatingChannel && <LoaderCircle size={20} className="animate-spin" />}
                <span>{creatingChannel ? 'Confirming' : 'Confirm'}</span>
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
