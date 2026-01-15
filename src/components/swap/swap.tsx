'use client'

import { useEffect, useMemo } from 'react'
import { SwapSettings } from '@/components/swap/swap-settings'
import { SwapInputFrom } from '@/components/swap/swap-input-from'
import { SwapInputTo } from '@/components/swap/swap-input-to'
import { SwapLimit } from '@/components/swap/swap-limit'
import { SwapToggleAssets } from '@/components/swap/swap-toggle-assets'
import { SwapDetails } from '@/components/swap/swap-details'
import { SwapButton } from '@/components/swap/swap-button'
import { ThemeButton } from '@/components/theme-button'
import { useQuote } from '@/hooks/use-quote'
import { useResolveSource } from '@/hooks/use-resolve-source'
import { useSelectedAccount } from '@/hooks/use-wallets'
import { useMemolessAssets } from '@/hooks/use-memoless-assets'
import { useAssetFrom, useSwap } from '@/hooks/use-swap'
import { useIsLimitSwap, useSetIsLimitSwap } from '@/store/limit-swap-store'
import { SwapError } from '@/components/swap/swap-error'
import { AssetValue, USwapNumber } from '@uswap/core'
import { type MemolessAsset } from '@uswap/helpers/api'
import { SwapAddressFrom } from '@/components/swap/swap-address-from'
import { SwapQuoteTimer } from '@/components/swap/swap-quote-timer'
import { resolvePriceImpact } from '@/components/swap/swap-helpers'
import { useSwapRates } from '@/hooks/use-rates'

export const Swap = () => {
  const assetFrom = useAssetFrom()
  const selectedAccount = useSelectedAccount()
  const isLimitSwap = useIsLimitSwap()
  const setIsLimitSwap = useSetIsLimitSwap()
  const { valueFrom } = useSwap()
  const { quote, isLoading, refetch } = useQuote()
  const { assets: memolessAssets } = useMemolessAssets()
  const { rateFrom, rateTo } = useSwapRates()

  useResolveSource()

  useEffect(() => {
    AssetValue.loadStaticAssets()
  }, [])

  const memolessAsset: MemolessAsset | undefined = useMemo(() => {
    if (
      !memolessAssets ||
      !assetFrom ||
      !quote ||
      !(quote.providers[0] === 'THORCHAIN' || quote.providers[0] === 'THORCHAIN_STREAMING')
    )
      return

    return memolessAssets.find(a => a.asset === assetFrom.identifier)
  }, [assetFrom, memolessAssets, quote])

  const memolessError: Error | undefined = useMemo(() => {
    if (selectedAccount || !memolessAsset || !assetFrom) return
    const minAmount = new USwapNumber(10 ** -(memolessAsset.decimals - 5))
    if (valueFrom.lt(minAmount))
      return new Error(
        `Minimum swap amount without a connected wallet is ${minAmount.toSignificant()} ${assetFrom.ticker}`
      )
  }, [memolessAsset, selectedAccount, valueFrom])

  const instantSwapSupported = !!memolessAsset || quote?.providers[0] === 'NEAR'

  const priceImpact = useMemo(() => {
    return resolvePriceImpact(quote, rateFrom, rateTo)
  }, [quote, rateFrom, rateTo])

  return (
    <div className="flex flex-col items-center justify-center px-4 pt-4 pb-4 md:pb-20">
      <div className="w-full max-w-md">
        <div className="mb-3 flex items-center justify-between">
          <div className="bg-blade rounded-full">
            <ThemeButton
              variant={isLimitSwap ? 'secondarySmall' : 'primarySmall'}
              onClick={() => setIsLimitSwap(false)}
            >
              Market
            </ThemeButton>
            <ThemeButton variant={isLimitSwap ? 'primarySmall' : 'secondarySmall'} onClick={() => setIsLimitSwap(true)}>
              Limit Order
            </ThemeButton>
          </div>
          <div className="flex items-center gap-4">
            <SwapQuoteTimer quote={quote} isLoading={isLoading} refetch={refetch} />
            <SwapAddressFrom />
            <SwapSettings />
          </div>
        </div>

        <div className="bg-lawrence rounded-3xl border">
          <SwapInputFrom />
          <SwapToggleAssets />
          <SwapInputTo priceImpact={priceImpact} />
          {isLimitSwap && <SwapLimit quote={quote} />}
        </div>

        {memolessError && (
          <div className="px-4 pt-2">
            <SwapError error={memolessError} />
          </div>
        )}

        <SwapButton instantSwapSupported={instantSwapSupported} instantSwapAvailable={!memolessError} />
        <SwapDetails priceImpact={priceImpact} />
      </div>
    </div>
  )
}
