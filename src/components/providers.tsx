import { PropsWithChildren } from 'react'
import { AccountsProvider } from '@/context/accounts-provider'
import { ReactQueryProvider } from '@/context/react-query-provider'
import { BalancesProvider } from '@/context/balances-provider'

export function Providers({ children }: PropsWithChildren) {
  return (
    <ReactQueryProvider>
      <AccountsProvider>
        <BalancesProvider>{children}</BalancesProvider>
      </AccountsProvider>
    </ReactQueryProvider>
  )
}
