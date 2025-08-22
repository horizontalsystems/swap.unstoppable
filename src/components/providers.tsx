import { PropsWithChildren } from 'react'
import { AccountsProvider } from '@/context/accounts-provider'
import { ReactQueryProvider } from '@/context/react-query-provider'
import { SwapProvider } from '@/context/swap-provider'

export function Providers({ children }: PropsWithChildren) {
  return (
    <ReactQueryProvider>
      <SwapProvider>
        <AccountsProvider>{children}</AccountsProvider>
      </SwapProvider>
    </ReactQueryProvider>
  )
}
