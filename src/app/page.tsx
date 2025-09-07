import { Header } from '@/components/header/header'
import { Swap } from '@/components/swap/swap'
import { GlobalDialog } from '@/components/global-dialog'
import { getQueryClient } from '@/components/react-query/react-query-client'
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
      <GlobalDialog />
    </main>
  )
}
