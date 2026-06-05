import { JSX } from 'react'
import { HeaderLogoText } from '@/components/header/header-logo-text'
import { ProviderName } from '@/types'

type AppKey = 'unstoppable'
type App = {
  id: AppKey
  title: string
  description: string
  baseUrl: string
  providers: ProviderName[]
  favicon: string
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
    description:
      'Swap Bitcoin, Ethereum, and hundreds of tokens across chains with the best rates from THORChain, Near, 1inch, and more — non-custodial, no sign-up, no limits.',
    baseUrl: 'https://swap.unstoppable.money',
    providers: [
      ProviderName.THORCHAIN,
      ProviderName.NEAR,
      ProviderName.ONEINCH,
      ProviderName.MAYACHAIN,
      ProviderName.LETSEXCHANGE,
      ProviderName.QUICKEX,
      ProviderName.STEALTHEX,
      ProviderName.SWAPUZ
    ],
    favicon: '/favicon.ico',
    logo: '/logo.svg',
    LogoText: HeaderLogoText,
    supportEmail: 'swap@horizontalsystems.io',
    gtag: 'G-9VJMF1935H'
  }
}

export const AppConfig: App = apps.unstoppable
