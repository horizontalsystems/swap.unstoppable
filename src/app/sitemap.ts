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
    { url: AppConfig.baseUrl, changeFrequency: 'daily', priority: 1 },
    ...popularPairs.map(([sell, buy]) => ({
      url: `${AppConfig.baseUrl}/sell-${sell}-buy-${buy}`,
      changeFrequency: 'daily' as const,
      priority: 0.8
    }))
  ]
}
