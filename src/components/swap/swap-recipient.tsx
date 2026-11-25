import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import { Chain } from '@uswap/core'
import { getAddressValidator } from '@uswap/toolboxes'
import { AxiosError } from 'axios'
import { LoaderCircle } from 'lucide-react'
import { CredenzaHeader, CredenzaTitle } from '@/components/ui/credenza'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { chainLabel } from '@/components/connect-wallet/config'
import { Icon } from '@/components/icons'
import { Asset } from '@/components/swap/asset'
import { SwapAddressWarning } from '@/components/swap/swap-address-warning'
import { SwapError } from '@/components/swap/swap-error'
import { ThemeButton } from '@/components/theme-button'
import { Tooltip } from '@/components/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'
import { useAssetFrom, useAssetTo, useCustomInterval, useCustomQuantity, useSlippage, useSwap, useTwapMode } from '@/hooks/use-swap'
import { ensureAmlPrecheck } from '@/hooks/use-aml-precheck'
import { useProviders } from '@/hooks/use-providers'
import { useQuote } from '@/hooks/use-quote'
import { useAccounts, useSelectedAccount } from '@/hooks/use-wallets'
import { parseApiError, previewSwap } from '@/lib/api'
import { prepareQuoteForLimitSwap, prepareQuoteForStreaming } from '@/lib/memo-helpers'
import { QR_PROVIDERS } from '@/lib/swap-helpers'
import { cn, truncate } from '@/lib/utils'
import { zcashRuleAllows } from '@/lib/zcash'
import { useIsLimitSwap, useLimitSwapBuyAmount, useLimitSwapExpiry } from '@/store/limit-swap-store'
import { WalletAccount } from '@/store/wallets-store'
import { ProviderName, QuoteResponseRoute, ZcashAddressRule } from '@/types'

const EXTRA_CHAIN_VALIDATORS: Record<string, (address: string) => boolean> = {
  XMR: address => /^[48][1-9A-HJ-NP-Za-km-z]{94}$/.test(address) || /^[48][1-9A-HJ-NP-Za-km-z]{105}$/.test(address)
}

interface SwapRecipientProps {
  provider: ProviderName
  // refresh re-runs the same preview (same addresses), e.g. after a commit was refused as stale
  onFetchQuote: (quote: QuoteResponseRoute, refresh: () => Promise<QuoteResponseRoute>) => void
}

export const SwapRecipient = ({ provider, onFetchQuote }: SwapRecipientProps) => {
  const t = useTranslations('swap.recipient')
  const tc = useTranslations('common')
  const tw = useTranslations('swap.warning')
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

  const { getProvider } = useProviders()
  const { quotes } = useQuote()
  const { valueFrom } = useSwap()
  const queryClient = useQueryClient()
  const [quoting, setQuoting] = useState(false)
  const [quoteError, setQuoteError] = useState<Error | undefined>()

  const [destinationAddress, setDestinationAddress] = useState<string>('')
  const [refundAddress, setRefundAddress] = useState<string>('')
  const [isValidDestination, setIsValidDestination] = useState(true)
  const [isValidRefund, setIsValidRefund] = useState(true)
  const [warningChecked, setWarningChecked] = useState(false)
  const [warningCheckedLTC, setWarningCheckedLTC] = useState(false)
  // the address /preview named in a 400 `field` — kept apart from the client validity flags, which
  // the validation effects own and would overwrite; cleared when the user edits that field
  const [serverRejected, setServerRejected] = useState<'refund' | 'destination'>()
  // Read-only on mobile until touched: focus gets moved into the field (e.g. by ticking the warning) and raises the keyboard.
  const [editingField, setEditingField] = useState<'refund' | 'destination'>()

  // a route with ZEC on either side says which Zcash addresses it takes — follow it over the SDK
  // validator, which knows transparent addresses only. The rate query empties `quotes` while it
  // refetches (window focus) or errors, so keep the last rules seen for this screen's provider.
  const quoteAddressRules = quotes.find(q => q.providers[0] === provider)?.addressRules
  const addressRulesRef = useRef(quoteAddressRules)
  if (quoteAddressRules) addressRulesRef.current = quoteAddressRules
  const addressRules = quoteAddressRules ?? addressRulesRef.current

  if (!assetFrom || !assetTo) return null

  const refundRequired = !selectedAccount && [...QR_PROVIDERS, 'THORCHAIN'].includes(provider)
  const requiresSourceAddress = getProvider(provider)?.executionType === 'signed_transaction'
  const options = accounts.filter(a => a.network === assetTo.chain)
  const destinationZecRule = assetTo.chain === Chain.Zcash ? addressRules?.destination : undefined
  const refundZecRule = assetFrom.chain === Chain.Zcash ? addressRules?.refund : undefined

  useEffect(() => {
    if (destinationAddress.length === 0) return setIsValidDestination(true)

    if (destinationZecRule) {
      const allowed = zcashRuleAllows(destinationZecRule, destinationAddress)
      if (allowed !== 'checksum') return setIsValidDestination(allowed)
    }

    const extraValidator = EXTRA_CHAIN_VALIDATORS[assetTo.chain]
    if (extraValidator) {
      return setIsValidDestination(extraValidator(destinationAddress))
    }

    // the effect can re-run (new input, rules arriving) before the validator resolves — a stale
    // result must not overwrite the newer one
    let cancelled = false
    getAddressValidator()
      .then(validateAddress => !cancelled && setIsValidDestination(validateAddress({ address: destinationAddress, chain: assetTo.chain })))
      .catch(() => !cancelled && setIsValidDestination(false))
    return () => {
      cancelled = true
    }
  }, [destinationAddress, destinationZecRule])

  useEffect(() => {
    if (refundAddress.length === 0) return setIsValidRefund(true)

    if (refundZecRule) {
      const allowed = zcashRuleAllows(refundZecRule, refundAddress)
      if (allowed !== 'checksum') return setIsValidRefund(allowed)
    }

    const extraValidator = EXTRA_CHAIN_VALIDATORS[assetFrom.chain]
    if (extraValidator) {
      return setIsValidRefund(extraValidator(refundAddress))
    }

    let cancelled = false
    getAddressValidator()
      .then(validateAddress => !cancelled && setIsValidRefund(validateAddress({ address: refundAddress, chain: assetFrom.chain })))
      .catch(() => !cancelled && setIsValidRefund(false))
    return () => {
      cancelled = true
    }
  }, [refundAddress, refundZecRule])

  const fetchQuote = () => {
    setQuoting(true)

    const sourceAddress = selectedAccount?.address
    const resolvedRefundAddress = refundRequired ? refundAddress : provider === 'MAYACHAIN' ? undefined : selectedAccount?.address

    // previews are free — nothing is created until the user confirms (commit)
    const preview = async () => {
      const route = await previewSwap({
        buyAsset: assetTo.identifier,
        sellAsset: assetFrom.identifier,
        sellAmount: valueFrom.toSignificant(),
        // sourceAddress makes the server build an unsignedTx
        sourceAddress: requiresSourceAddress ? sourceAddress : undefined,
        destinationAddress,
        refundAddress: resolvedRefundAddress,
        slippage: isLimitSwap ? 0 : (slippage ?? 99),
        provider,
        // the deposit-address flow (no wallet) shows the commit's deposit QR
        generateQR: !selectedAccount && QR_PROVIDERS.includes(provider) ? true : undefined
      })

      // the API doesn't echo the request addresses — the confirm screen and plugins need them
      let quote: QuoteResponseRoute = { ...route, sourceAddress, destinationAddress, refundAddress: resolvedRefundAddress }

      // For THORChain limit orders, modify the memo to use limit order format
      if (isLimitSwap && (provider === 'THORCHAIN' || provider === 'THORCHAIN_STREAMING')) {
        quote = prepareQuoteForLimitSwap(quote, limitSwapBuyAmount, limitSwapExpiry)
      } else if (provider === 'THORCHAIN' || provider === 'THORCHAIN_STREAMING') {
        quote = prepareQuoteForStreaming(quote, twapMode, customInterval, customQuantity)
      }

      return quote
    }

    preview()
      .then(async quote => {
        // run the AML precheck (QUICKEX) and wait for the verdict before navigating to the confirm screen
        await ensureAmlPrecheck(queryClient, provider, { sourceAddress, refundAddress: resolvedRefundAddress, destinationAddress })

        onFetchQuote(quote, preview)
      })
      .catch(error => {
        // a 400 with `field` names the address the route does not take (Zcash address rules);
        // only flag a field the user can edit — a rejected wallet address shows via quoteError alone
        const field = error instanceof AxiosError ? error.response?.data?.field : undefined
        if (field === 'destinationAddress') setServerRejected('destination')
        else if (field === 'refundAddress' && refundRequired) setServerRejected('refund')
        setQuoteError(parseApiError(error))
      })
      .finally(() => setQuoting(false))
  }

  const isLTC = assetTo.ticker === 'LTC'
  const buttonEnabled = isValidDestination && destinationAddress.length && !quoting && (refundRequired ? isValidRefund && refundAddress.length : true)

  const addressInput = (
    field: 'refund' | 'destination',
    asset: Asset,
    address: string,
    setAddress: (address: string) => void,
    isValid: boolean,
    options: WalletAccount[] = []
  ) => {
    const currentOption = options.find(a => a.address.toLowerCase() === address.toLowerCase())

    // an edit withdraws the server's verdict on this field — it answers the old address
    const updateAddress = (value: string) => {
      setServerRejected(prev => (prev === field ? undefined : prev))
      setAddress(value)
    }

    const showInvalid = !isValid || serverRejected === field

    // under a Zcash rule, say which address encodings this route takes — unless the encoding is one
    // the rule takes ('checksum': a transparent address that failed base58check), where the kind
    // hint would mislead and plain "invalid address" is the truth
    const zecRule: ZcashAddressRule | undefined = field === 'destination' ? destinationZecRule : refundZecRule
    const invalidText =
      serverRejected === field && isValid
        ? // the server refused an address the client-side rules take (e.g. a UA missing a required
          // receiver) — the kind hint would mislead; the server's own message shows in the error below
          undefined
        : zecRule && zcashRuleAllows(zecRule, address) !== 'checksum'
          ? zecRule.unified
            ? zecRule.transparent
              ? t('invalidZcashUnified')
              : t('invalidZcashUnifiedOnly')
            : t('invalidZcashTransparent')
          : t('invalidAddress', { chain: chainLabel(asset.chain) })

    return (
      <>
        <div className="relative">
          <Textarea
            placeholder={t('addressPlaceholder', { chain: chainLabel(asset.chain) })}
            value={address}
            aria-invalid={showInvalid}
            onChange={e => updateAddress(e.target.value)}
            enterKeyHint="done"
            readOnly={isMobile && editingField !== field}
            onPointerDown={() => setEditingField(field)}
            onBlur={() => setEditingField(undefined)}
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
                updateAddress('')
              }}
            >
              <Icon name="trash" />
            </ThemeButton>
          ) : (
            <div className="absolute end-4 top-1/2 flex -translate-y-1/2 gap-2">
              {[...options].map((account, index) => (
                <Tooltip key={index} content={truncate(account.address)}>
                  <ThemeButton variant="circleSmall" className="rounded-xl" onClick={() => updateAddress(account.address)}>
                    <Image src={`/wallets/${account.provider.toLowerCase()}.svg`} alt={account.provider} width="24" height="24" />
                  </ThemeButton>
                </Tooltip>
              ))}

              <ThemeButton
                variant="secondarySmall"
                className="hidden md:block"
                onClick={() => {
                  navigator.clipboard.readText().then(text => {
                    updateAddress(text)
                  })
                }}
              >
                {tc('paste')}
              </ThemeButton>
            </div>
          )}
        </div>

        {showInvalid && invalidText && <div className="text-lucian text-xs font-semibold">{invalidText}</div>}
      </>
    )
  }

  const nextButton = (
    <ThemeButton
      variant="primaryMedium"
      className="w-full"
      onClick={fetchQuote}
      disabled={!buttonEnabled || !warningChecked || (isLTC && !warningCheckedLTC)}
    >
      {quoting && <LoaderCircle size={20} className="animate-spin" />}
      <span>{quoting ? t('preparingSwap') : t('next')}</span>
    </ThemeButton>
  )

  return (
    <>
      <CredenzaHeader>
        <CredenzaTitle>{refundRequired ? t('titleAddresses') : t('titleReceiving')}</CredenzaTitle>
      </CredenzaHeader>

      <ScrollArea className="relative flex min-h-0 flex-1 px-4 md:px-8" classNameViewport="flex-1 h-auto">
        <div className="mb-4 flex flex-col gap-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-6">
              {refundRequired && (
                <div className="flex flex-col gap-3">
                  <div className="text-thor-gray text-sm font-semibold">{t('enterRefundAddress')}</div>
                  {addressInput('refund', assetFrom, refundAddress, setRefundAddress, isValidRefund)}
                </div>
              )}

              <div className="flex flex-col gap-3">
                {refundRequired && <div className="text-thor-gray text-sm font-semibold">{t('enterReceivingAddress')}</div>}
                {addressInput('destination', assetTo, destinationAddress, setDestinationAddress, isValidDestination, options)}
              </div>
            </div>

            <SwapAddressWarning
              checked={warningChecked}
              onCheckedChange={setWarningChecked}
              text={tw('selfCustody')}
              textAccent={tw('lossOfFunds')}
            />

            {isLTC && (
              <SwapAddressWarning
                checked={warningCheckedLTC}
                onCheckedChange={setWarningCheckedLTC}
                text={tw('ltcMweb')}
                textAccent={tw('lossOfFunds')}
              />
            )}
          </div>

          {quoteError && <SwapError error={quoteError} />}
        </div>

        {isMobile && <div className="pb-4">{nextButton}</div>}

        <div className="from-lawrence pointer-events-none absolute inset-x-0 -bottom-px h-4 bg-linear-to-t to-transparent" />
      </ScrollArea>

      {!isMobile && <div className="p-8 pt-2">{nextButton}</div>}
    </>
  )
}
