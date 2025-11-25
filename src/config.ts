import { JSX } from 'react'
import { HeaderUnstoppable } from '@/components/header/header-unstoppable'
import { HeaderThorchain } from '@/components/header/header-thorchain'

type AppKey = 'thorchain' | 'unstoppable'
type App = {
  title: string
  description: string
  favicon: string
  logo: string
  LogoText: () => JSX.Element
  logoLink?: string
  gtag?: string
  pixelId?: string
  pixelEvent?: string
}

const apps: Record<AppKey, App> = {
  unstoppable: {
    title: 'Unstoppable Swap',
    description: 'Unstoppable Swap',
    favicon: '/favicon.ico',
    logo: '/logo.svg',
    LogoText: HeaderUnstoppable
  },
  thorchain: {
    title: 'THORChain Swap',
    description: 'THORChain Swap',
    favicon: '/favicon-thorchain.ico',
    logo: '/logo-thorchain.svg',
    LogoText: HeaderThorchain,
    logoLink: 'https://www.thorchain.org',
    gtag: 'G-VZ0FQ1WC7G',
    pixelId: 'qki4a',
    pixelEvent: 'tw-qki4a-qop3i'
  }
}

export const AppConfig = apps[process.env.NEXT_PUBLIC_APP as AppKey] || apps.unstoppable
