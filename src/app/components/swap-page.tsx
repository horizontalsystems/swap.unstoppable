import { Suspense } from 'react'
import { Footer } from '@/components/footer/footer'
import { GlobalDialog } from '@/components/global-dialog'
import { Header } from '@/components/header/header'
import { Swap } from '@/components/swap/swap'

export function SwapPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <Suspense>
        <Swap />
      </Suspense>
      <GlobalDialog />
      <Footer />
    </main>
  )
}
