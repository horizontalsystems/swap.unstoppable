'use client'

import { useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { AssetValue, USwapNumber } from '@uswap/core'
import { type MemolessAsset } from '@uswap/helpers/api'
import { SwapAddressFrom } from '@/components/swap/swap-address-from'
import { SwapButton } from '@/components/swap/swap-button'
import { SwapDetails } from '@/components/swap/swap-details'
import { SwapError } from '@/components/swap/swap-error'
import { SwapInputFrom } from '@/components/swap/swap-input-from'
import { SwapInputTo } from '@/components/swap/swap-input-to'
import { SwapLimit } from '@/components/swap/swap-limit'
import { SwapToggleAssets } from '@/components/swap/swap-toggle-assets'
import { BarterPromotion } from '@/components/promotion/barter-promotion'
import { useMemolessAssets } from '@/hooks/use-memoless-assets'
import { useQuote } from '@/hooks/use-quote'
import { useSwapRates } from '@/hooks/use-rates'
import { useResolveSource } from '@/hooks/use-resolve-source'
import { useAssetFrom, useSwap } from '@/hooks/use-swap'
import { useUrlParams } from '@/hooks/use-url-params'
import { useSelectedAccount } from '@/hooks/use-wallets'
import { QR_PROVIDERS, resolvePriceImpact } from '@/lib/swap-helpers'
import { useIsLimitSwap } from '@/store/limit-swap-store'

export const Swap = () => {
  const t = useTranslations('swap')
  const te = useTranslations('swap.error')
  const assetFrom = useAssetFrom()
  const selectedAccount = useSelectedAccount()
  const isLimitSwap = useIsLimitSwap()
  const { valueFrom } = useSwap()
  const { quote } = useQuote()
  const { assets: memolessAssets } = useMemolessAssets()
  const { rateFrom, rateTo } = useSwapRates()

  useUrlParams()
  useResolveSource()

  useEffect(() => {
    AssetValue.loadStaticAssets()
  }, [])

  const memolessAsset: MemolessAsset | undefined = useMemo(() => {
    if (!memolessAssets || !assetFrom || !quote || !(quote.providers[0] === 'THORCHAIN' || quote.providers[0] === 'THORCHAIN_STREAMING')) return

    return memolessAssets.find(a => a.asset === assetFrom.identifier)
  }, [assetFrom, memolessAssets, quote])

  const memolessError: Error | undefined = useMemo(() => {
    if (selectedAccount || !memolessAsset || !assetFrom) return
    const minAmount = new USwapNumber(10 ** -(memolessAsset.decimals - 5))
    if (valueFrom.lt(minAmount))
      return new Error(te('minAmountNoWallet', { amount: minAmount.toSignificant(), ticker: assetFrom.ticker }))
  }, [memolessAsset, selectedAccount, valueFrom])

  const instantSwapSupported = !!memolessAsset || QR_PROVIDERS.includes(quote?.providers[0] as string)

  const priceImpact = useMemo(() => {
    return resolvePriceImpact(quote, rateFrom, rateTo)
  }, [quote, rateFrom, rateTo])

  return (
    <div className="flex flex-col items-center justify-center px-4 pt-4 pb-4 md:pb-20">
      <div className="w-full max-w-md">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-leah h-8 text-xl font-medium">{t('title')}</h1>
          <div className="flex items-center gap-4">
            <SwapAddressFrom />
            {/*<SwapSettings />*/}
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="bg-lawrence rounded-4xl border">
            <SwapInputFrom />
          </div>
          <SwapToggleAssets />
          <div className="bg-lawrence rounded-4xl border">
            <SwapInputTo priceImpact={priceImpact} />
            {isLimitSwap && <SwapLimit quote={quote} />}
          </div>
        </div>

        {memolessError && (
          <div className="px-4 pt-2">
            <SwapError error={memolessError} />
          </div>
        )}

        <SwapButton instantSwapSupported={instantSwapSupported} instantSwapAvailable={!memolessError} />
        <SwapDetails />

        <BarterPromotion />
      </div>
    </div>
  )
}
