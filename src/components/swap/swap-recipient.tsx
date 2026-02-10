import Image from 'next/image'
import { ThemeButton } from '@/components/theme-button'
import { CredenzaHeader, CredenzaTitle } from '@/components/ui/credenza'
import { useEffect, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Icon } from '@/components/icons'
import { LoaderCircle } from 'lucide-react'
import { QuoteResponseRoute } from '@uswap/helpers/api'
import { chainLabel } from '@/components/connect-wallet/config'
import { cn, truncate } from '@/lib/utils'
import { useAssetFrom, useAssetTo, useSlippage, useTwapMode, useCustomInterval, useCustomQuantity, useSwap } from '@/hooks/use-swap'
import { useIsLimitSwap, useLimitSwapBuyAmount, useLimitSwapExpiry } from '@/store/limit-swap-store'
import { getAddressValidator } from '@uswap/toolboxes'
import { useAccounts, useSelectedAccount } from '@/hooks/use-wallets'
import { getQuotes } from '@/lib/api'
import { SwapError } from '@/components/swap/swap-error'
import { useIsMobile } from '@/hooks/use-mobile'
import { ProviderName, USwapError } from '@uswap/helpers'
import { Asset } from '@/components/swap/asset'
import { SwapAddressWarning } from '@/components/swap/swap-address-warning'
import { Textarea } from '@/components/ui/textarea'
import { WalletAccount } from '@/store/wallets-store'
import { Tooltip } from '@/components/tooltip'
import { prepareQuoteForLimitSwap, prepareQuoteForStreaming } from '@/lib/memo-helpers'

interface SwapRecipientProps {
  provider: ProviderName
  onFetchQuote: (quote: QuoteResponseRoute) => void
}

export const SwapRecipient = ({ provider, onFetchQuote }: SwapRecipientProps) => {
  const isMobile = useIsMobile()
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const slippage = useSlippage()
  const twapMode = useTwapMode()
  const customInterval = useCustomInterval()
  const customQuantity = useCustomQuantity()
  const accounts = useAccounts()
  const selectedAccount = useSelectedAccount()
  const isLimitSwap = useIsLimitSwap()
  const limitSwapBuyAmount = useLimitSwapBuyAmount()
  const limitSwapExpiry = useLimitSwapExpiry()

  const { valueFrom } = useSwap()
  const [quoting, setQuoting] = useState(false)
  const [quoteError, setQuoteError] = useState<Error | undefined>()

  const [destinationAddress, setDestinationAddress] = useState<string>('')
  const [refundAddress, setRefundAddress] = useState<string>('')
  const [isValidDestination, setIsValidDestination] = useState(true)
  const [isValidRefund, setIsValidRefund] = useState(true)
  const [warningChecked, setWarningChecked] = useState(false)
  const [warningCheckedLTC, setWarningCheckedLTC] = useState(false)

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
      buyAsset: assetTo.identifier,
      sellAsset: assetFrom.identifier,
      sellAmount: valueFrom.toSignificant(),
      sourceAddress: selectedAccount?.address,
      destinationAddress: destinationAddress,
      refundAddress: refundRequired ? refundAddress : provider === 'MAYACHAIN' ? undefined : selectedAccount?.address,
      dry: !(refundRequired || selectedAccount),
      slippage: isLimitSwap ? 0 : (slippage ?? 99),
      providers: [provider]
    })
      .then(quotes => {
        let quote = quotes[0]

        // For THORChain limit orders, modify the memo to use limit order format
        if (isLimitSwap && (provider === 'THORCHAIN' || provider === 'THORCHAIN_STREAMING')) {
          quote = prepareQuoteForLimitSwap(quote, limitSwapBuyAmount, limitSwapExpiry)
        } else if (provider === 'THORCHAIN' || provider === 'THORCHAIN_STREAMING') {
          quote = prepareQuoteForStreaming(quote, twapMode, customInterval, customQuantity)
        }

        onFetchQuote(quote)
      })
      .catch(error => {
        let newError = error
        if (error instanceof USwapError) {
          const cause = error.cause as any
          const errors = cause.errorData?.providerErrors
          if (errors && errors.length) {
            newError = new Error(errors[0]?.message || errors[0]?.error)
          } else if (cause.errorData?.error) {
            newError = new Error(cause.errorData?.error)
          }
        }

        setQuoteError(newError)
      })
      .finally(() => setQuoting(false))
  }

  const isLTC = assetTo.ticker === 'LTC'
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
        <CredenzaTitle>{refundRequired ? 'Enter Addresses' : 'Enter Receiving Address'}</CredenzaTitle>
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
                {refundRequired && <div className="text-thor-gray text-sm font-semibold">Enter receiving address:</div>}
                {addressInput(assetTo, destinationAddress, setDestinationAddress, isValidDestination, options)}
              </div>
            </div>

            <SwapAddressWarning
              checked={warningChecked}
              onCheckedChange={setWarningChecked}
              text="I understand that I must use a self-custody wallet. I understand that using a smart contract wallet, exchange address, delegated address, or an EIP 7702 wallet, will result in"
              textAccent="loss of funds."
            />

            {isLTC && (
              <SwapAddressWarning
                checked={warningCheckedLTC}
                onCheckedChange={setWarningCheckedLTC}
                text="I understand that using an LTC MWEB address will result in"
                textAccent="loss of funds."
              />
            )}
          </div>

          {quoteError && <SwapError error={quoteError} />}
        </div>

        <div className="from-lawrence pointer-events-none absolute inset-x-0 -bottom-px h-4 bg-linear-to-t to-transparent" />
      </ScrollArea>

      <div className="p-4 pt-2 md:p-8 md:pt-2">
        <ThemeButton
          variant="primaryMedium"
          className="w-full"
          onClick={fetchQuote}
          disabled={!buttonEnabled || !warningChecked || (isLTC && !warningCheckedLTC)}
        >
          {quoting && <LoaderCircle size={20} className="animate-spin" />}
          <span>{quoting ? 'Preparing Swap' : 'Next'}</span>
        </ThemeButton>
      </div>
    </>
  )
}
