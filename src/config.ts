import { JSX } from 'react'
import { HeaderLogoText } from '@/components/header/header-logo-text'
import { ProviderName } from '@/types'

type AppKey = 'unstoppable'
type App = {
  id: AppKey
  title: string
  description: string
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
    title: 'Unstoppable Swap',
    description: 'Unstoppable Swap',
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
    supportEmail: 'swap@horizontalsystems.io'
  }
}

export const AppConfig: App = apps.unstoppable
