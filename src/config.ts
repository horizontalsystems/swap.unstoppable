import { JSX } from 'react'
import { HeaderLogoText } from '@/components/header/header-logo-text'

type AppKey = 'unstoppable'
type App = {
  id: AppKey
  title: string
  name: string
  shortName: string
  description: string
  baseUrl: string
  favicon: string
  appIcon: string
  ogImage: string
  logo: string
  LogoText: () => JSX.Element
  supportEmail: string
  logoLink?: string
  gtag?: string
  pixelId?: string
  pixelEvent?: string
  discordLink?: string
  telegramLink?: string
}

const apps: Record<AppKey, App> = {
  unstoppable: {
    id: 'unstoppable',
    title: 'Unstoppable Swap | Cross-Chain Crypto & Token Swaps',
    name: 'Unstoppable Swap',
    shortName: 'Unstoppable',
    description:
      'Swap Bitcoin, Ethereum, and hundreds of tokens across chains with the best rates from THORChain, Near, 1inch, and more — non-custodial, no sign-up, no limits.',
    baseUrl: 'https://swap.unstoppable.money',
    favicon: '/favicon.ico',
    appIcon: '/apple-touch-icon.png',
    ogImage: '/og-image.png',
    logo: '/logo.svg',
    LogoText: HeaderLogoText,
    supportEmail: 'swap@horizontalsystems.io',
    gtag: 'G-9VJMF1935H'
  }
}

export const AppConfig: App = apps.unstoppable
