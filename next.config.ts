import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  output: 'standalone',
  async redirects() {
    return [
      // Swap moved from the site root to /app; keep indexed pair URLs alive.
      {
        source: '/:pair(sell-[^/]+-buy-[^/]+)',
        destination: '/app/:pair',
        permanent: true
      }
    ]
  }
}

export default withNextIntl(nextConfig)
