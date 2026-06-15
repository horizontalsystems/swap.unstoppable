import type { Metadata } from 'next'
import { SwapPage } from '@/app/components/swap-page'

export const metadata: Metadata = {
  alternates: { canonical: '/' }
}

export default async function Page() {
  return <SwapPage />
}
