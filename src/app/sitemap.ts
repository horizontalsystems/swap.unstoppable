import type { MetadataRoute } from 'next'
import { AppConfig } from '@/config'

// Curated popular pairs (native assets use the bare ticker in slugs)
const popularPairs = [
  ['BTC', 'XMR'],
  ['XMR', 'BTC'],
  ['BTC', 'ETH'],
  ['ETH', 'BTC'],
  ['ETH', 'XMR'],
  ['XMR', 'ETH'],
  ['BTC', 'SOL'],
  ['SOL', 'BTC'],
  ['ETH', 'SOL'],
  ['SOL', 'XMR'],
  ['BTC', 'LTC'],
  ['LTC', 'BTC'],
  ['BTC', 'DOGE'],
  ['BTC', 'BCH'],
  ['BTC', 'NEAR'],
  ['ETH', 'NEAR'],
  ['BTC', 'RUNE'],
  ['RUNE', 'BTC'],
  ['BTC', 'TRX'],
  ['BTC', 'AVAX']
]

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: AppConfig.baseUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${AppConfig.baseUrl}/app`, changeFrequency: 'daily', priority: 0.9 },
    ...popularPairs.map(([sell, buy]) => ({
      url: `${AppConfig.baseUrl}/app/sell-${sell}-buy-${buy}`,
      changeFrequency: 'daily' as const,
      priority: 0.8
    }))
  ]
}
