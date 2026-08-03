import { useMemo } from 'react'
import { useDialog } from '@/components/global-dialog'
import { SwapRouteBadge } from '@/components/swap/swap-route-badge'
import { SwapRouteCard } from '@/components/swap/swap-route-card'
import { SwapRouteDialog } from '@/components/swap/swap-route-dialog'
import { useQuote } from '@/hooks/use-quote'
import { useAssetFrom, useAssetTo, useSwap } from '@/hooks/use-swap'
import { findFasterIndex } from '@/lib/swap-helpers'

export function SwapDetails() {
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const { valueFrom } = useSwap()
  const { quote, quotes, selectedIndex } = useQuote()
  const { openDialog } = useDialog()

  const fasterIndex = useMemo(() => findFasterIndex(quotes), [quotes])

  if (!assetFrom || !assetTo || !quote) return null

  return (
    <SwapRouteCard
      route={quote}
      valueFrom={valueFrom}
      assetFromTicker={assetFrom.ticker}
      assetToTicker={assetTo.ticker}
      onOpenList={quotes.length > 1 ? () => openDialog(SwapRouteDialog, {}) : undefined}
      badge={<SwapRouteBadge index={selectedIndex} fasterIndex={fasterIndex} />}
    />
  )
}
