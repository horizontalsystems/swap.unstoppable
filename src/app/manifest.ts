import type { MetadataRoute } from 'next'
import { AppConfig } from '@/config'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Unstoppable Swap',
    short_name: 'Unstoppable',
    description: AppConfig.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [{ src: '/apple-touch-icon.png', sizes: '500x500', type: 'image/png' }]
  }
}
