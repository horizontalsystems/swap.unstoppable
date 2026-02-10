import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import Script from 'next/script'
import { GoogleTagManager } from '@next/third-parties/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { ReactQueryProvider } from '@/components/react-query/react-query-provider'
import { AppConfig } from '@/config'
import './globals.css'

export const metadata: Metadata = {
  title: AppConfig.title,
  description: AppConfig.description,
  icons: {
    icon: AppConfig.favicon
  }
}

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap'
})

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-brand={AppConfig.id} suppressHydrationWarning>
      {AppConfig.gtag && <GoogleTagManager gtmId={AppConfig.gtag} />}
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
