'use client'

import { useEffect } from 'react'
import { useWalletStore } from '@/store/wallets-store'

// Rehydrates the wallet store on the client (to avoid an import-cycle TDZ during module evaluation)
export function WalletStoreHydration() {
  useEffect(() => {
    useWalletStore.persist.rehydrate()
  }, [])

  return null
}
