import { PropsWithChildren } from 'react'
import { ReactQueryProvider } from '@/context/react-query-provider'

export function Providers({ children }: PropsWithChildren) {
  return <ReactQueryProvider>{children}</ReactQueryProvider>
}
