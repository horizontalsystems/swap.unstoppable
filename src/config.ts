import { JSX } from 'react'
import { HeaderLogoText } from '@/components/header/header-logo-text'
import { XmrtradeLogoText } from '@/components/header/xmrtrade-logo-text'

type AppKey = 'unstoppable' | 'xmrtrade'
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
  logoWidth?: number
  LogoText?: () => JSX.Element
  defaultLocale: string
  supportEmail: string
  gtag?: string
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
    defaultLocale: 'en',
    supportEmail: 'swap@horizontalsystems.io',
    gtag: 'G-9VJMF1935H'
  },
  xmrtrade: {
    id: 'xmrtrade',
    title: 'Xmrtrade | Cross-Chain Crypto & Token Swaps',
    name: 'Xmrtrade',
    shortName: 'Xmrtrade',
    description:
      'Swap Monero, Bitcoin, Ethereum, and hundreds of tokens across chains with the best rates from THORChain, Near, 1inch, and more — non-custodial, no sign-up, no limits.',
    baseUrl: 'https://xmrtrade.com',
    favicon: '/apps/xmrtrade.ico',
    appIcon: '/apps/xmrtrade_apple_touch_icon.png',
    ogImage: '/apps/xmrtrade_og_image.png',
    logo: '/apps/xmrtrade_logo.svg',
    logoWidth: 37,
    LogoText: XmrtradeLogoText,
    defaultLocale: 'zh',
    supportEmail: 'support@xmrtrade.com'
  }
}

export const AppConfig: App = apps[process.env.NEXT_PUBLIC_APP_ID as AppKey] || apps.unstoppable
