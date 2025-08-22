import { Header } from '@/components/header'
import { Swap } from '@/components/swap/swap'
import { getQueryClient } from '@/hook/react-query-client'
import { getPools } from '@/lib/api'

export default async function Home() {
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery({
    queryKey: ['pools'],
    queryFn: () => getPools()
  })

  return (
    <main className="min-h-screen">
      <Header />
      <Swap />
    </main>
  )
}
