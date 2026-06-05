import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import Script from 'next/script'
import { GoogleAnalytics } from '@next/third-parties/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { ReactQueryProvider } from '@/components/react-query/react-query-provider'
import { AppConfig } from '@/config'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(AppConfig.baseUrl),
  title: AppConfig.title,
  description: AppConfig.description,
  icons: {
    icon: AppConfig.favicon,
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }]
  },
  appleWebApp: {
    capable: true,
    title: 'Unstoppable Swap',
    statusBarStyle: 'black-translucent'
  },
  openGraph: {
    title: AppConfig.title,
    description: AppConfig.description,
    url: AppConfig.baseUrl,
    siteName: 'Unstoppable Swap',
    images: [
      {
        url: `${AppConfig.baseUrl}/og-image.png`,
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
        url: `${AppConfig.baseUrl}/og-image.png`,
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-brand={AppConfig.id} suppressHydrationWarning>
      {AppConfig.gtag && <GoogleAnalytics gaId={AppConfig.gtag} />}
      {AppConfig.pixelId && (
        <Script
          dangerouslySetInnerHTML={{
            __html: `!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');twq('config','${AppConfig.pixelId}')`
          }}
        />
      )}
      <body className={`${manrope.className} bg-tyler antialiased`}>
        <ReactQueryProvider>
          <ThemeProvider defaultTheme="light" attribute="class">
            {children}
          </ThemeProvider>
        </ReactQueryProvider>
        <Toaster />
      </body>
    </html>
  )
}
