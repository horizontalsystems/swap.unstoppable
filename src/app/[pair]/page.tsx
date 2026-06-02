import { notFound } from 'next/navigation'
import { SwapPage } from '@/app/components/swap-page'

const PAIR_PATTERN = /^sell-.+-buy-.+$/

export default async function Page({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params
  if (!PAIR_PATTERN.test(pair)) notFound()
  return <SwapPage />
}
