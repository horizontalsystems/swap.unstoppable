import type { MetadataRoute } from 'next'
import { AppConfig } from '@/config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: '/track' }],
    sitemap: `${AppConfig.baseUrl}/sitemap.xml`
  }
}
