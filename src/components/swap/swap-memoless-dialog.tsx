import { Credenza, CredenzaContent } from '@/components/ui/credenza'
import { SwapRecipient } from '@/components/swap/swap-recipient'
import { useState } from 'react'
import { QuoteResponseRoute } from '@swapkit/helpers/api'
import { SwapConfirm } from '@/components/swap/swap-confirm'
import { ThemeButton } from '@/components/theme-button'
import { LoaderCircle } from 'lucide-react'
import { preflightMemoless, registerMemoless } from '@/lib/api'
import { AxiosError } from 'axios'
import { useAssetFrom, useSwap } from '@/hooks/use-swap'
import { SwapMemolessChannel } from '@/components/swap/swap-memoless-channel'
import { SwapError } from '@/components/swap/swap-error'

interface SwapMemolessDialogProps {
  provider: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export type Channel = {
  qrCodeData: string
  address: string
  value: string
  secondsRemaining: number
}

export const SwapMemolessDialog = ({ provider, isOpen, onOpenChange }: SwapMemolessDialogProps) => {
  const assetFrom = useAssetFrom()
  const { valueFrom } = useSwap()
  const [quote, setQuote] = useState<QuoteResponseRoute | undefined>(undefined)
  const [channel, setChannel] = useState<Channel | undefined>(undefined)
  const [creatingChannel, setCreatingChannel] = useState(false)
  const [error, setError] = useState<Error | undefined>()

  if (!assetFrom) return null

  const onConfirm = () => {
    if (!quote || !assetFrom) {
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
        setChannel({
          qrCodeData: data.data.qr_code_data_url,
          address: data.data.inbound_address,
          value: data.suggested_in_asset_amount,
          secondsRemaining: data.data.seconds_remaining
        })
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
          <SwapMemolessChannel channel={channel} asset={assetFrom} />
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
                <span>{creatingChannel ? 'Creating Address' : 'Create Deposit Address'}</span>
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
