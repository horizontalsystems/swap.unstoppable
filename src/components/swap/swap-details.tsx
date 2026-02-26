import { useMemo } from 'react'
import { useDialog } from '@/components/global-dialog'
import { Icon } from '@/components/icons'
import { SwapProvider } from '@/components/swap/swap-provider'
import { SwapRouteCard } from '@/components/swap/swap-route-card'
import { SwapRouteDialog } from '@/components/swap/swap-route-dialog'
import { useQuote } from '@/hooks/use-quote'
import { useAssetFrom, useAssetTo, useCustomInterval, useCustomQuantity, useSwap, useTwapMode } from '@/hooks/use-swap'
import { recalculateEstimatedTime, THORCHAIN_BLOCK_TIME_SECONDS } from '@/lib/memo-helpers'
import { ProviderName } from '@/types'

export function SwapDetails() {
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const { valueFrom } = useSwap()
  const { quote, quotes, selectedIndex } = useQuote()
  const { openDialog } = useDialog()
  const twapMode = useTwapMode()
  const customInterval = useCustomInterval()
  const customQuantity = useCustomQuantity()

  const isThorchain = quote?.providers[0] === ProviderName.THORCHAIN || quote?.providers[0] === ProviderName.THORCHAIN_STREAMING
  const estimatedTime = useMemo(() => {
    if (!quote?.estimatedTime || !isThorchain || twapMode === 'bestPrice') return quote?.estimatedTime
    if (twapMode === 'bestTime') {
      return recalculateEstimatedTime(quote.estimatedTime, 0)
    }

    const swapSeconds = customInterval * customQuantity * THORCHAIN_BLOCK_TIME_SECONDS
    return recalculateEstimatedTime(quote.estimatedTime, swapSeconds)
  }, [quote?.estimatedTime, isThorchain, twapMode, customInterval, customQuantity])

  if (!assetFrom || !assetTo || !quote) return null

  return (
    <SwapRouteCard
      route={quote}
      valueFrom={valueFrom}
      assetFromTicker={assetFrom.ticker}
      assetToTicker={assetTo.ticker}
      estimatedTime={estimatedTime}
      providerAction={
        quotes.length > 1 ? (
          <button className="flex cursor-pointer items-center gap-1 outline-none" onClick={() => openDialog(SwapRouteDialog, {})}>
            <SwapProvider provider={quote.providers[0]} />
            <Icon name="arrow-s-down" className="text-thor-gray size-4" />
          </button>
        ) : undefined
      }
      badge={selectedIndex === 0 ? <span className="text-remus border-remus rounded-3xl border px-1.5 text-[10px]">BEST PRICE</span> : undefined}
    />
  )
}
