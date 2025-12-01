import { ThemeButton } from '@/components/theme-button'
import { CredenzaHeader, CredenzaTitle } from '@/components/ui/credenza'
import { useEffect, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Icon } from '@/components/icons'
import { LoaderCircle } from 'lucide-react'
import { QuoteResponseRoute } from '@swapkit/helpers/api'
import { chainLabel } from '@/components/connect-wallet/config'
import { cn, truncate } from '@/lib/utils'
import { useAssetFrom, useAssetTo, useSlippage, useSwap } from '@/hooks/use-swap'
import { getAddressValidator } from '@swapkit/toolboxes'
import { useAccounts, useSelectedAccount } from '@/hooks/use-wallets'
import Image from 'next/image'
import { getQuotes } from '@/lib/api'
import { AxiosError } from 'axios'
import { SwapError } from '@/components/swap/swap-error'
import { useIsMobile } from '@/hooks/use-mobile'
import { ProviderName } from '@swapkit/helpers'
import { Asset } from '@/components/swap/asset'
import { Textarea } from '@/components/ui/textarea'
import { WalletAccount } from '@/store/wallets-store'
import { Tooltip } from '@/components/tooltip'

interface SwapRecipientProps {
  provider: ProviderName
  onFetchQuote: (quote: QuoteResponseRoute) => void
}

export const SwapRecipient = ({ provider, onFetchQuote }: SwapRecipientProps) => {
  const isMobile = useIsMobile()
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const { valueFrom } = useSwap()
  const slippage = useSlippage()
  const accounts = useAccounts()
  const selectedAccount = useSelectedAccount()

  const [quoting, setQuoting] = useState(false)
  const [quoteError, setQuoteError] = useState<Error | undefined>()

  const [destinationAddress, setDestinationAddress] = useState<string>('')
  const [refundAddress, setRefundAddress] = useState<string>('')
  const [isValidDestination, setIsValidDestination] = useState(true)
  const [isValidRefund, setIsValidRefund] = useState(true)

  if (!assetFrom || !assetTo) return null

  const refundRequired = !selectedAccount && provider === 'NEAR'
  const options = accounts.filter(a => a.network === assetTo.chain)

  useEffect(() => {
    if (destinationAddress.length === 0) return setIsValidDestination(true)

    getAddressValidator()
      .then(validateAddress =>
        setIsValidDestination(validateAddress({ address: destinationAddress, chain: assetTo.chain }))
      )
      .catch(() => setIsValidDestination(false))
  }, [destinationAddress])

  useEffect(() => {
    if (refundAddress.length === 0) return setIsValidRefund(true)

    getAddressValidator()
      .then(validateAddress => setIsValidRefund(validateAddress({ address: refundAddress, chain: assetFrom.chain })))
      .catch(() => setIsValidRefund(false))
  }, [refundAddress])

  const fetchQuote = () => {
    setQuoting(true)

    getQuotes({
      buyAsset: assetTo,
      sellAsset: assetFrom,
      sellAmount: valueFrom,
      sourceAddress: selectedAccount?.address,
      destinationAddress: destinationAddress,
      refundAddress: refundRequired ? refundAddress : selectedAccount?.address,
      dry: !(refundRequired || selectedAccount),
      slippage: slippage,
      providers: [provider]
    })
      .then(quotes => {
        onFetchQuote(quotes[0])
      })
      .catch(error => {
        let newError = error

        if (error instanceof AxiosError) {
          const errors = error.response?.data?.providerErrors
          if (errors && errors[0]?.message) {
            newError = new Error(errors[0]?.message)
          } else {
            newError = new Error(error.response?.data?.message || error.message)
          }
        }

        setQuoteError(newError)
      })
      .finally(() => setQuoting(false))
  }

  const buttonEnabled =
    isValidDestination &&
    destinationAddress.length &&
    !quoting &&
    (refundRequired ? isValidRefund && refundAddress.length : true)

  const addressInput = (
    asset: Asset,
    address: string,
    setAddress: (address: string) => void,
    isValid: boolean,
    options: WalletAccount[] = []
  ) => {
    const currentOption = options.find(a => a.address.toLowerCase() === address.toLowerCase())

    return (
      <>
        <div className="relative">
          <Textarea
            placeholder={isMobile ? undefined : `${chainLabel(asset.chain)} address`}
            value={address}
            aria-invalid={!isValid}
            onChange={e => setAddress(e.target.value)}
            className={cn('max-h-21 pr-15', { 'pl-13': currentOption })}
            tabIndex={isMobile ? -1 : 0}
          />

          {currentOption && (
            <Image
              src={`/wallets/${currentOption.provider.toLowerCase()}.svg`}
              alt={currentOption.provider}
              width="24"
              height="24"
              className="absolute top-1/2 left-4 -translate-y-1/2"
            />
          )}

          {address.length ? (
            <ThemeButton
              variant="circleSmall"
              className="absolute end-4 top-1/2 -translate-y-1/2"
              onClick={() => {
                setAddress('')
              }}
            >
              <Icon name="trash" />
            </ThemeButton>
          ) : (
            <div className="absolute end-4 top-1/2 flex -translate-y-1/2 gap-2">
              {[...options].map((account, index) => (
                <Tooltip key={index} content={truncate(account.address)}>
                  <ThemeButton
                    variant="circleSmall"
                    className="rounded-xl"
                    onClick={() => setDestinationAddress(account.address)}
                  >
                    <Image
                      src={`/wallets/${account.provider.toLowerCase()}.svg`}
                      alt={account.provider}
                      width="24"
                      height="24"
                    />
                  </ThemeButton>
                </Tooltip>
              ))}

              <ThemeButton
                variant="secondarySmall"
                className="hidden md:block"
                onClick={() => {
                  navigator.clipboard.readText().then(text => {
                    setAddress(text)
                  })
                }}
              >
                Paste
              </ThemeButton>
            </div>
          )}
        </div>

        {!isValid && <div className="text-lucian text-xs font-semibold">Invalid {chainLabel(asset.chain)} address</div>}
      </>
    )
  }

  return (
    <>
      <CredenzaHeader>
        <CredenzaTitle>{refundRequired ? 'Enter Addresses' : 'Enter Address'}</CredenzaTitle>
      </CredenzaHeader>

      <ScrollArea className="relative flex min-h-0 flex-1 px-4 md:px-8" classNameViewport="flex-1 h-auto">
        <div className="mb-4 flex flex-col gap-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-6">
              {refundRequired && (
                <div className="flex flex-col gap-3">
                  <div className="text-thor-gray text-sm font-semibold">Enter refund address:</div>
                  {addressInput(assetFrom, refundAddress, setRefundAddress, isValidRefund)}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <div className="text-thor-gray text-sm font-semibold">Enter receiving address:</div>
                {addressInput(assetTo, destinationAddress, setDestinationAddress, isValidDestination, options)}
              </div>
            </div>

            <div className="border-jacob flex flex-col gap-3 rounded-xl border p-4 text-sm">
              <div className="flex gap-3">
                <Icon name="warning" className="text-jacob size-6 shrink-0" />
                <div className="text-leah font-semibold">Use only personal wallet address</div>
              </div>
              <div className="text-thor-gray">Do not use contract or exchange addresses — funds may be lost.</div>
            </div>
          </div>

          {quoteError && <SwapError error={quoteError} />}
        </div>

        <div className="from-lawrence pointer-events-none absolute inset-x-0 -bottom-[1px] h-4 bg-linear-to-t to-transparent" />
      </ScrollArea>

      <div className="p-4 pt-2 md:p-8 md:pt-2">
        <ThemeButton variant="primaryMedium" className="w-full" onClick={() => fetchQuote()} disabled={!buttonEnabled}>
          {quoting && <LoaderCircle size={20} className="animate-spin" />}
          <span>{quoting ? 'Preparing Swap' : 'Next'}</span>
        </ThemeButton>
      </div>
    </>
  )
}
