import { useEffect } from 'react'
import { useAssetTo, useDestination, useSetDestination } from '@/hooks/use-swap'
import { useAccounts } from '@/store/wallets-store'
import { getAddressValidator } from '@swapkit/toolboxes'

export const useResolveDestination = () => {
  const assetTo = useAssetTo()
  const destination = useDestination()
  const setDestination = useSetDestination()
  const accounts = useAccounts()

  const resolveDestination = async () => {
    const validateAddress = await getAddressValidator()

    // Check if there is a custom address and it is suitable for a new assetTo
    if (
      assetTo &&
      destination &&
      !destination.provider &&
      validateAddress({ address: destination.address, chain: assetTo.chain })
    ) {
      setDestination({ address: destination.address, network: assetTo.chain })
      return
    }

    const fromPrevious = accounts?.find(
      a => a.provider === destination?.provider && a.address === destination?.address && a.network === assetTo?.chain
    )

    setDestination(fromPrevious ?? accounts?.find(a => a.network === assetTo?.chain))
  }

  useEffect(() => {
    resolveDestination()
  }, [accounts, assetTo])
}
