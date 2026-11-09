'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { Asset } from '@/components/swap/asset'
import { useAssets } from '@/hooks/use-assets'
import { useSwapStore } from '@/store/swap-store'
import { APP_PATH } from '@/lib/app-path'

const DEFAULT_SELL = 'BTC.BTC'
const DEFAULT_BUY = 'XMR.XMR'
const SELL = 'sell-'
const BUY = '-buy-'

const isNativeAsset = (asset: Asset) => asset.chain === asset.ticker
const toSlug = (asset: Asset) => (isNativeAsset(asset) ? asset.ticker : asset.identifier)

function parsePath(pathname: string): { sell: string | null; buy: string | null } {
  const prefix = `${APP_PATH}/${SELL}`
  if (!pathname.startsWith(prefix)) return { sell: null, buy: null }
  const rest = pathname.slice(prefix.length)
  const idx = rest.indexOf(BUY)
  if (idx === -1) return { sell: null, buy: null }
  return {
    sell: decodeURIComponent(rest.slice(0, idx)),
    buy: decodeURIComponent(rest.slice(idx + BUY.length))
  }
}

function resolveAsset(assets: Asset[], token: string | null, fallback: string): Asset | undefined {
  if (token) {
    const lower = token.toLowerCase()
    const exact = assets.find(a => a.identifier.toLowerCase() === lower)
    if (exact) return exact
    // 'ETH.USDT' → 'ETH.USDT-0xdac1…' (chain + ticker, contract address omitted)
    const byChainTicker = assets.find(a => a.identifier.toLowerCase().startsWith(`${lower}-`))
    if (byChainTicker) return byChainTicker
    if (!token.includes('.')) {
      const nativeAsset = assets.find(a => a.ticker.toLowerCase() === lower && isNativeAsset(a))
      if (nativeAsset) return nativeAsset
    }
  }
  return assets.find(a => a.identifier === fallback)
}

export const useUrlParams = () => {
  const pathname = usePathname()
  const { assets } = useAssets()
  const { assetFrom, assetTo, hasHydrated, setAssetFrom, setAssetTo } = useSwapStore()
  const initialized = useRef(false)
  const skipNextSync = useRef(true)

  // Init store from URL (once)
  useEffect(() => {
    if (!assets?.length || !hasHydrated || initialized.current) return

    const { sell, buy } = parsePath(pathname)
    const sellAsset = resolveAsset(assets, sell, DEFAULT_SELL) ?? assets[0]
    const buyAsset = resolveAsset(assets, buy, DEFAULT_BUY) ?? assets.find(a => a.identifier !== sellAsset?.identifier)

    if (sellAsset) setAssetFrom(sellAsset)
    if (buyAsset && buyAsset.identifier !== sellAsset?.identifier) setAssetTo(buyAsset)

    initialized.current = true
  }, [assets, hasHydrated, pathname, setAssetFrom, setAssetTo])

  // Sync URL on user-driven asset changes (skip the first sync after init so `/` stays clean)
  useEffect(() => {
    if (!initialized.current || !assetFrom || !assetTo) return
    if (skipNextSync.current) {
      skipNextSync.current = false
      return
    }
    const newPath = `${APP_PATH}/${SELL}${toSlug(assetFrom)}${BUY}${toSlug(assetTo)}`
    const newUrl = `${newPath}${window.location.search}`
    if (window.location.pathname + window.location.search !== newUrl) {
      window.history.replaceState(window.history.state, '', newUrl)
    }
  }, [assetFrom, assetTo])
}
