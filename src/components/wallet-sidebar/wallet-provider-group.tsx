import { useMemo } from 'react'
import { Power } from 'lucide-react'
import { WalletOption } from '@uswap/core'
import { WalletIcon } from '@/components/wallet-icon'
import { chainLabel, wallet, WALLETS } from '@/components/connect-wallet/config'
import { ChainWalletData } from '@/hooks/use-wallet-balances'
import { WalletChain } from '@/components/wallet-sidebar/wallet-chain'
import { cn } from '@/lib/utils'

export type WalletSortBy = 'name' | 'balance'

export interface WalletProviderGroupProps {
  provider: WalletOption
  chainDataList: ChainWalletData[]
  expandedChains: Set<string>
  onToggleChain: (key: string) => void
  onDisconnect: (provider: WalletOption) => void
  disabled: boolean
  sortBy: WalletSortBy
}

export function WalletProviderGroup({ provider, chainDataList, expandedChains, onToggleChain, onDisconnect, disabled, sortBy }: WalletProviderGroupProps) {
  const walletInfo = wallet(provider) || WALLETS.find(w => w.option === provider)
  const walletKey = walletInfo?.key || provider.toLowerCase()
  const walletName = walletInfo?.label || provider

  const showAllChains = provider === WalletOption.LEDGER || provider === WalletOption.KEYSTORE

  const visibleChains = useMemo(() => {
    const filtered = showAllChains ? chainDataList : chainDataList.filter(data => data.isLoading || data.tokens.some(t => t.amount > 0))
    const sorted = [...filtered]
    if (sortBy === 'name') {
      sorted.sort((a, b) => chainLabel(a.account.network).localeCompare(chainLabel(b.account.network)))
    } else {
      sorted.sort((a, b) => {
        const aHas = a.totalUsd !== undefined
        const bHas = b.totalUsd !== undefined
        if (aHas && bHas) return b.totalUsd!.gt(a.totalUsd!) ? 1 : b.totalUsd!.lt(a.totalUsd!) ? -1 : 0
        if (aHas) return -1
        if (bHas) return 1
        return 0
      })
    }
    return sorted
  }, [chainDataList, showAllChains, sortBy])

  return (
    <div>
      <div className={cn('flex items-center justify-center px-4 py-3', { 'opacity-30': disabled })}>
        <div className="flex flex-1 items-center justify-center gap-3">
          <WalletIcon walletKey={walletKey} width={24} height={24} alt={walletName} className="shrink-0 rounded-lg" />
          <span className="text-txt-high-contrast text-sm font-medium">{walletName}</span>
        </div>
        <button
          onClick={() => !disabled && onDisconnect(provider)}
          className={cn('text-txt-label-small transition-colors', { 'hover:text-txt-high-contrast cursor-pointer': !disabled })}
          aria-label={`Disconnect ${walletName}`}
        >
          <Power className="size-4.5" />
        </button>
      </div>

      <div className="bg-body rounded-2xl border">
        {visibleChains.length === 0 ? (
          <div className="text-txt-label-small px-4 py-4 text-center text-sm">No coins</div>
        ) : (
          visibleChains.map((data, i) => {
            const key = `${data.account.provider}-${data.account.network}`
            return (
              <div key={key} className={cn({ 'border-t': i > 0 })}>
                <WalletChain data={data} isExpanded={expandedChains.has(key)} onToggle={() => onToggleChain(key)} disabled={disabled} />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
