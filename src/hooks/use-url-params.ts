'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import { useAssets } from '@/hooks/use-assets'
import { useSwapStore } from '@/store/swap-store'

const DEFAULT_SELL_ASSET = 'BTC.BTC'
const DEFAULT_BUY_ASSET = 'XMR.XMR'

export const useUrlParams = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initializedFromUrl = useRef(false)
  const isUpdatingUrl = useRef(false)

  const { assets } = useAssets()
  const { assetFrom, assetTo, hasHydrated, setAssetFrom, setAssetTo } = useSwapStore()

  // Update URL without causing navigation/re-render
  const updateUrl = useCallback(
    (sellAsset: string, buyAsset: string) => {
      if (isUpdatingUrl.current) return
      isUpdatingUrl.current = true

      const params = new URLSearchParams(searchParams.toString())
      params.set('sellAsset', sellAsset)
      params.set('buyAsset', buyAsset)

      const newUrl = `${pathname}?${params.toString()}`
      window.history.replaceState(window.history.state, '', newUrl)

      isUpdatingUrl.current = false
    },
    [pathname, searchParams]
  )

  // Initialize assets from URL params (runs once when assets are loaded)
  useEffect(() => {
    if (!assets?.length || !hasHydrated || initializedFromUrl.current) return

    const sellAssetParam = searchParams.get('sellAsset') || DEFAULT_SELL_ASSET
    const buyAssetParam = searchParams.get('buyAsset') || DEFAULT_BUY_ASSET

    const sellAsset =
      assets.find(a => a.identifier.toLowerCase() === sellAssetParam.toLowerCase()) ?? assets.find(a => a.identifier === DEFAULT_SELL_ASSET)

    const buyAsset =
      assets.find(a => a.identifier.toLowerCase() === buyAssetParam.toLowerCase()) ?? assets.find(a => a.identifier === DEFAULT_BUY_ASSET)

    // Ensure we don't set the same asset for both
    if (sellAsset && buyAsset && sellAsset.identifier === buyAsset.identifier) {
      setAssetFrom(sellAsset)
    } else {
      if (sellAsset) setAssetFrom(sellAsset)
      if (buyAsset) setAssetTo(buyAsset)
    }

    initializedFromUrl.current = true
  }, [assets, hasHydrated, searchParams, setAssetFrom, setAssetTo])

  // Update URL when assets change (after initial load)
  useEffect(() => {
    if (!initializedFromUrl.current || !assetFrom || !assetTo) return
    updateUrl(assetFrom.identifier, assetTo.identifier)
  }, [assetFrom, assetTo, updateUrl])
}
