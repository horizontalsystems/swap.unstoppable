import { useEffect } from 'react'
import { useAssetFrom } from '@/hooks/use-swap'
import { useAccounts, useSelectedAccount } from '@/store/wallets-store'
import { useWallets } from '@/hooks/use-wallets'

export const useResolveSource = () => {
  const assetFrom = useAssetFrom()
  const selectedAccount = useSelectedAccount()
  const accounts = useAccounts()
  const { select } = useWallets()

  useEffect(() => {
    const fromPrevious = accounts?.find(
      a =>
        a.provider === selectedAccount?.provider &&
        a.address === selectedAccount?.address &&
        a.network === assetFrom?.chain
    )

    select(fromPrevious ?? accounts?.find(a => a.network === assetFrom?.chain))
  }, [accounts, assetFrom])
}
