import { Footer } from '@/components/footer/footer'
import { Header } from '@/components/header/header'
import { TrackParams, TrackStatus } from './track-status'

interface TrackPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function TrackPage({ searchParams }: TrackPageProps) {
  const params = await searchParams

  const getString = (key: string) => {
    const v = params[key]
    return typeof v === 'string' ? v : undefined
  }

  const trackParams: TrackParams = {
    provider: getString('provider') ?? '',
    providerSwapId: getString('providerSwapId'),
    hash: getString('hash'),
    chainId: getString('chainId') ?? '',
    fromAsset: getString('fromAsset') ?? '',
    fromAddress: getString('fromAddress'),
    fromAmount: getString('fromAmount') ?? '',
    toAsset: getString('toAsset') ?? '',
    toAddress: getString('toAddress') ?? '',
    toAmount: getString('toAmount') ?? '',
    depositAddress: getString('depositAddress')
  }

  const missingRequired =
    !trackParams.provider ||
    !trackParams.chainId ||
    !trackParams.fromAsset ||
    !trackParams.fromAmount ||
    !trackParams.toAsset ||
    !trackParams.toAddress

  return (
    <main className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-xl px-4 py-8">
        <h1 className="text-leah mb-6 text-xl font-semibold">Track Transaction</h1>
        {missingRequired ? <p className="text-thor-gray text-sm">Missing required query parameters.</p> : <TrackStatus params={trackParams} />}
      </div>
      <Footer />
    </main>
  )
}
