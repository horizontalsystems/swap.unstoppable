import Script from 'next/script'
import type { Metadata } from 'next'
import { GoogleTagManager } from '@next/third-parties/google'
import { ReactQueryProvider } from '@/components/react-query/react-query-provider'
import { Toaster } from '@/components/ui/sonner'
import { Manrope } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import './globals.css'

export const metadata: Metadata = {
  title: 'THORChain Swap',
  description: 'THORChain Swap'
}

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap'
})

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {process.env.NEXT_PUBLIC_GTAG && <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTAG} />}
      {process.env.NEXT_PUBLIC_PIXEL && (
        <Script
          dangerouslySetInnerHTML={{
            __html: `!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');twq('config','${process.env.NEXT_PUBLIC_PIXEL}')`
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
