import Script from 'next/script'
import { Suspense } from 'react'
import { Header } from '@/components/header/header'
import { Swap } from '@/components/swap/swap'
import { GlobalDialog } from '@/components/global-dialog'
import { Footer } from '@/components/footer/footer'
import { AppConfig } from '@/config'

export default async function SwapPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <Suspense>
        <Swap />
      </Suspense>
      <GlobalDialog />
      <Footer />
      {AppConfig.pixelEvent && (
        <Script
          id="twitter-events"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: `twq('event', '${AppConfig.pixelEvent}', {})` }}
        />
      )}
    </main>
  )
}
