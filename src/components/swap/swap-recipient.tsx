import { ThemeButton } from '@/components/theme-button'
import { CredenzaHeader, CredenzaTitle } from '@/components/ui/credenza'
import { useEffect, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Icon } from '@/components/icons'
import { LoaderCircle } from 'lucide-react'
import { QuoteResponseRoute } from '@swapkit/helpers/api'
import { Input } from '@/components/ui/input'
import { chainLabel, wallet } from '@/components/connect-wallet/config'
import { cn, truncate } from '@/lib/utils'
import { useAssetFrom, useAssetTo, useSlippage, useSwap } from '@/hooks/use-swap'
import { getAddressValidator } from '@swapkit/toolboxes'
import { useAccounts, useSelectedAccount } from '@/hooks/use-wallets'
import Image from 'next/image'
import { getQuotes } from '@/lib/api'
import { AxiosError } from 'axios'
import { SwapError } from '@/components/swap/swap-error'
import { useIsMobile } from '@/hooks/use-mobile'

interface SwapRecipientProps {
  provider: string
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

  const [address, setAddress] = useState<string>('')
  const [isValid, setIsValid] = useState(true)

  if (!assetFrom || !assetTo) return null

  const options = accounts.filter(a => a.network === assetTo.chain)

  useEffect(() => {
    if (address.length === 0) return setIsValid(true)

    getAddressValidator()
      .then(validateAddress => setIsValid(validateAddress({ address: address, chain: assetTo.chain })))
      .catch(() => setIsValid(false))
  }, [address])

  const fetchQuote = () => {
    setQuoting(true)

    getQuotes({
      buyAsset: assetTo,
      sellAsset: assetFrom,
      sellAmount: valueFrom,
      sourceAddress: selectedAccount?.address,
      destinationAddress: address,
      includeTx: !!selectedAccount,
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

  return (
    <>
      <CredenzaHeader>
        <CredenzaTitle>{options.length ? 'Choose Receiving Address' : 'Enter Receiving Address'}</CredenzaTitle>
      </CredenzaHeader>

      <ScrollArea className="relative flex min-h-0 flex-1 px-4 md:px-8" classNameViewport="flex-1 h-auto">
        <div className="mb-4 flex flex-col gap-6">
          {options.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="border-blade flex flex-col gap-2 overflow-hidden rounded-xl border">
                {options.map((account, index) => (
                  <div
                    key={index}
                    className="hover:bg-blade/30 flex cursor-pointer items-center justify-between p-4"
                    onClick={() => setAddress(account.address)}
                  >
                    <div className="flex items-center gap-4">
                      <Image src={`/wallets/${account.provider.toLowerCase()}.svg`} alt="" width="24" height="24" />
                      <span className="text-thor-gray text-xs font-semibold">{wallet(account.provider)?.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{truncate(account.address)}</span>
                      {account.address === address && <Icon name="done-e" className="text-brand-first size-5" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              {options.length > 0 && (
                <div className="text-thor-gray text-sm font-semibold">Or use address from external wallet:</div>
              )}

              <div className="relative">
                <Input
                  placeholder={isMobile ? undefined : `${chainLabel(assetTo.chain)} address`}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className={cn('pr-15', {
                    'border-lucian focus-visible:border-lucian': !isValid
                  })}
                  tabIndex={isMobile ? -1 : 0}
                />

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
                  <ThemeButton
                    variant="secondarySmall"
                    className="absolute end-4 top-1/2 hidden -translate-y-1/2 md:block"
                    onClick={() => {
                      navigator.clipboard.readText().then(text => {
                        setAddress(text)
                      })
                    }}
                  >
                    Paste
                  </ThemeButton>
                )}
              </div>

              {!isValid && (
                <div className="text-lucian text-xs font-semibold">Invalid {chainLabel(assetTo.chain)} address</div>
              )}
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
        <ThemeButton
          variant="primaryMedium"
          className="w-full"
          onClick={() => fetchQuote()}
          disabled={!isValid || !address.length || quoting}
        >
          {quoting && <LoaderCircle size={20} className="animate-spin" />}
          <span>{quoting ? 'Preparing Swap' : 'Next'}</span>
        </ThemeButton>
      </div>
    </>
  )
}
