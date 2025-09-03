import { PropsWithChildren } from 'react'
import { AccountsProvider } from '@/context/accounts-provider'
import { ReactQueryProvider } from '@/context/react-query-provider'

export function Providers({ children }: PropsWithChildren) {
  return (
    <ReactQueryProvider>
      <AccountsProvider>{children}</AccountsProvider>
    </ReactQueryProvider>
  )
}
