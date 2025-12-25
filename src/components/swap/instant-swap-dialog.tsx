import { Credenza, CredenzaContent } from '@/components/ui/credenza'
import { SwapRecipient } from '@/components/swap/swap-recipient'
import { useState } from 'react'
import { QuoteResponseRoute } from '@uswap/helpers/api'
import { SwapConfirm } from '@/components/swap/swap-confirm'
import { ThemeButton } from '@/components/theme-button'
import { LoaderCircle } from 'lucide-react'
import { preflightMemoless, registerMemoless } from '@/lib/api'
import { AxiosError } from 'axios'
import { useAssetFrom, useAssetTo, useSwap } from '@/hooks/use-swap'
import { InstantSwap } from '@/components/swap/instant-swap'
import { SwapError } from '@/components/swap/swap-error'
import { ProviderName } from '@uswap/helpers'
import { useSetTransaction } from '@/store/transaction-store'
import { generateId } from '@/components/swap/swap-helpers'
import { getChainConfig, USwapNumber } from '@uswap/core'

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

  const createChannel = (
    quote: QuoteResponseRoute,
    qrCodeData: string,
    address: string,
    value: string,
    expiration?: number
  ) => {
    setChannel({
      qrCodeData,
      address,
      value,
      expiration
    })

    setTransaction({
      uid: generateId(),
      provider,
      chainId: getChainConfig(assetFrom.chain).chainId,
      timestamp: new Date(),
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

    if (provider === 'NEAR') {
      if (!quote.inboundAddress || !quote.qrCodeDataURL) return

      createChannel(
        quote,
        quote.qrCodeDataURL,
        quote.inboundAddress,
        quote.sellAmount,
        quote.expiration ? Number(quote.expiration) : undefined
      )

      return
    }

    setCreatingChannel(true)
    setError(undefined)

    registerMemoless({
      asset: assetFrom.identifier,
      memo: quote.memo,
      requested_in_asset_amount: valueFrom.toSignificant()
    })
      .then(data => {
        return preflightMemoless({
          asset: assetFrom.identifier,
          reference: data.reference,
          amount: data.suggested_in_asset_amount
        }).then(preflightData => ({
          ...preflightData,
          suggested_in_asset_amount: data.suggested_in_asset_amount
        }))
      })
      .then(data => {
        createChannel(
          quote,
          data.data.qr_code_data_url,
          data.data.inbound_address,
          data.suggested_in_asset_amount,
          data.data.seconds_remaining ? new Date().getTime() / 1000 + data.data.seconds_remaining : undefined
        )
      })
      .catch(err => {
        if (err instanceof AxiosError) {
          setError(new Error(err.response?.data?.error.message || err.message))
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
      <CredenzaContent className="flex h-auto max-h-5/6 flex-col md:max-w-lg">
        {channel ? (
          <InstantSwap asset={assetFrom} channel={channel} />
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
