import { useEffect } from 'react'
import { useAssetFrom } from '@/hooks/use-swap'
import { useAccounts, useSelectAccount, useSelectedAccount } from '@/hooks/use-wallets'

export const useResolveSource = () => {
  const assetFrom = useAssetFrom()
  const accounts = useAccounts()
  const selectedAccount = useSelectedAccount()
  const selectAccount = useSelectAccount()

  useEffect(() => {
    const fromPrevious = accounts.find(
      s => s.provider === selectedAccount?.provider && s.address === selectedAccount?.address && s.network === assetFrom?.chain
    )

    selectAccount(fromPrevious ?? accounts.find(a => a.network === assetFrom?.chain))
  }, [accounts, assetFrom])
}
