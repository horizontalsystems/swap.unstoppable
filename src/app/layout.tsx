import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { GoogleAnalytics } from '@next/third-parties/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Toaster } from '@/components/ui/sonner'
import { ReactQueryProvider } from '@/components/react-query/react-query-provider'
import { WalletStoreHydration } from '@/components/wallet-store-hydration'
import { AppConfig } from '@/config'
import { getLangDir, type Locale } from '@/i18n/config'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(AppConfig.baseUrl),
  title: AppConfig.title,
  description: AppConfig.description,
  icons: {
    icon: AppConfig.favicon,
    apple: [{ url: AppConfig.appIcon, sizes: '500x500', type: 'image/png' }]
  },
  appleWebApp: {
    capable: true,
    title: AppConfig.name,
    statusBarStyle: 'black-translucent'
  },
  openGraph: {
    title: AppConfig.title,
    description: AppConfig.description,
    url: AppConfig.baseUrl,
    siteName: AppConfig.name,
    images: [
      {
        url: `${AppConfig.baseUrl}${AppConfig.ogImage}`,
        width: 1200,
        height: 630,
        alt: AppConfig.title
      }
    ],
    type: 'website',
    locale: 'en_US'
  },
  twitter: {
    card: 'summary_large_image',
    title: AppConfig.title,
    description: AppConfig.description,
    images: [
      {
        url: `${AppConfig.baseUrl}${AppConfig.ogImage}`,
        width: 1200,
        height: 630,
        alt: AppConfig.title
      }
    ]
  }
}

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap'
})

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: AppConfig.name,
  url: AppConfig.baseUrl,
  description: AppConfig.description,
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = (await getLocale()) as Locale
  const messages = await getMessages()

  return (
    <html lang={locale} dir={getLangDir(locale)} data-brand={AppConfig.id} suppressHydrationWarning>
      {AppConfig.gtag && <GoogleAnalytics gaId={AppConfig.gtag} />}
      <body className={`${manrope.className} bg-tyler antialiased`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <WalletStoreHydration />
        <ReactQueryProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <ThemeProvider defaultTheme="light" attribute="class">
              {children}
            </ThemeProvider>
          </NextIntlClientProvider>
        </ReactQueryProvider>
        <Toaster />
      </body>
    </html>
  )
}
