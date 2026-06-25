import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SwapPage } from '@/app/components/swap-page'
import { AppConfig } from '@/config'

const PAIR_PATTERN = /^sell-(.+?)-buy-(.+)$/

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

// 'BTC' → 'BTC', 'ETH.USDC-0XA0B8…' → 'USDC'
const assetTicker = (slug: string) => {
  const decoded = safeDecode(slug)
  const dotIndex = decoded.indexOf('.')
  const identifier = dotIndex === -1 ? decoded : decoded.slice(dotIndex + 1)
  return identifier.split('-')[0].toUpperCase()
}

interface PageProps {
  params: Promise<{ pair: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pair } = await params
  const match = PAIR_PATTERN.exec(pair)
  if (!match) return {}

  const sell = assetTicker(match[1])
  const buy = assetTicker(match[2])
  const title = `Swap ${sell} to ${buy} | ${AppConfig.name}`
  const description = `Exchange ${sell} for ${buy} at the best cross-chain rates from THORChain, Near, 1inch, and more — non-custodial, no sign-up, no limits.`
  const canonical = `/sell-${match[1].toUpperCase()}-buy-${match[2].toUpperCase()}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, siteName: AppConfig.name, images: [AppConfig.ogImage], type: 'website' },
    twitter: { card: 'summary_large_image', title, description, images: [AppConfig.ogImage] }
  }
}

export default async function Page({ params }: PageProps) {
  const { pair } = await params
  if (!PAIR_PATTERN.test(pair)) notFound()
  return <SwapPage />
}
