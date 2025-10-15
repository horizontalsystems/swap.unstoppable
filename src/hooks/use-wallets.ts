import { useWalletStore } from '@/store/wallets-store'
import { WalletOption } from '@swapkit/core'

export const useAccounts = () => {
  const accounts = useWalletStore(s => s.accounts)
  const isHydrated = useWalletStore(s => s.hasHydrated)
  const selected = useWalletStore(s => s.selected)
  const connectedWallets = useWalletStore(s => s.connectedWallets)
  const select = useWalletStore(s => s.select)
  const connect = useWalletStore(s => s.connect)
  const disconnect = useWalletStore(s => s.disconnect)
  // const isAvailable = useWalletStore(s => s.isAvailable)

  return {
    accounts,
    selected: isHydrated ? selected : undefined,
    connectedWallets,
    select,
    connect,
    disconnect,
    isAvailable: (option: WalletOption) => true // todo
  }
}
