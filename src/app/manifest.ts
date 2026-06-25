import type { MetadataRoute } from 'next'
import { AppConfig } from '@/config'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: AppConfig.name,
    short_name: AppConfig.shortName,
    description: AppConfig.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [{ src: AppConfig.appIcon, sizes: '500x500', type: 'image/png' }]
  }
}
