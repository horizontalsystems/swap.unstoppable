'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { WalletOption } from '@uswap/core'
import { Icon } from '@/components/icons'
import { ConnectWallet } from '@/components/connect-wallet/connect-wallet'
import { useDialog } from '@/components/global-dialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { useWalletBalances } from '@/hooks/use-wallet-balances'
import { WalletProviderGroup, WalletSortBy } from '@/components/wallet-sidebar/wallet-provider-group'
import { useAccounts, useConnectedWallets, useDisconnect, useExternalWalletMode, useSetExternalWalletMode } from '@/hooks/use-wallets'
import { cn } from '@/lib/utils'
import { WalletAccount } from '@/store/wallets-store'
import { ThemeButton } from '@/components/theme-button'

const SORT_OPTIONS: { value: WalletSortBy; label: string }[] = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'balance', label: 'Balance (High → Low)' }
]

interface WalletSidebarProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function WalletSidebar({ isOpen, onOpenChange }: WalletSidebarProps) {
  const externalWalletMode = useExternalWalletMode()
  const setExternalWalletMode = useSetExternalWalletMode()
  const connectedWallets = useConnectedWallets()
  const accounts = useAccounts()
  const disconnect = useDisconnect()
  const { openDialog } = useDialog()
  const { walletData, isLoading } = useWalletBalances()

  const [expandedChains, setExpandedChains] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<WalletSortBy>('name')

  const toggleChain = (key: string) => {
    setExpandedChains(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const accountsByProvider = connectedWallets.reduce<Map<WalletOption, WalletAccount[]>>((map, provider) => {
    const providerAccounts = accounts.filter(a => a.provider === provider)
    if (providerAccounts.length > 0) map.set(provider, providerAccounts)
    return map
  }, new Map())

  const handleConnectWallet = () => {
    if (externalWalletMode) return
    openDialog(ConnectWallet, {})
  }

  return (
    <Drawer direction="right" open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="flex flex-col p-8" style={{ width: 400, maxWidth: '100vw' }}>
        <DrawerHeader className="flex flex-row items-center justify-between p-0">
          <DrawerTitle className="text-2xl font-bold">Wallets</DrawerTitle>
          <div className="flex items-center gap-4">
            {accountsByProvider.size > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="text-txt-label-small hover:text-txt-high-contrast cursor-pointer transition-colors focus:outline-none"
                  aria-label="Sort wallets"
                >
                  <Icon name="filter" className="size-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-56 p-2">
                  <div className="text-txt-label-small px-3 pt-2 pb-1 text-xs">Sort by</div>
                  {SORT_OPTIONS.map(option => {
                    const selected = sortBy === option.value
                    return (
                      <DropdownMenuItem
                        key={option.value}
                        onSelect={() => setSortBy(option.value)}
                        className="cursor-pointer rounded-xl px-3 py-2.5 text-sm"
                      >
                        <span className="flex w-5 shrink-0 items-center justify-center">
                          {selected && <Icon name="check" className="text-green-contrast size-4.5" />}
                        </span>
                        <span className={cn('text-btn-style-1-text font-medium')}>{option.label}</span>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <button
              onClick={() => onOpenChange(false)}
              className="text-txt-label-small hover:text-txt-high-contrast cursor-pointer transition-colors"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
        </DrawerHeader>

        <div className="mt-7 flex flex-1 flex-col gap-7 overflow-y-auto">
          <div className="rounded-2xl border p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="text-txt-high-contrast text-sm font-semibold">External Wallet Mode</div>
                <div className="text-txt-label-small mt-0.5 text-xs leading-relaxed">
                  Enter your order, click the Swap button, and follow the instructions
                </div>
              </div>
              <Switch
                checked={externalWalletMode}
                onCheckedChange={setExternalWalletMode}
                size="md"
                className="data-[state=checked]:bg-jacob"
              />
            </div>
          </div>

          {externalWalletMode && (
            <div className="border-jacob flex items-center gap-3 rounded-xl border p-4">
              <Icon name="warning" className="text-jacob size-6 shrink-0" />
              <div className="text-txt-text-modal text-sm">
                If an asset isn’t supported in External Wallet mode, you’ll be prompted to connect an in-browser wallet
              </div>
            </div>
          )}

          {accountsByProvider.size > 0 && (
            <div className={cn('flex flex-col', externalWalletMode && 'pointer-events-none')}>
              {Array.from(accountsByProvider.entries()).map(([provider, providerAccounts]) => {
                const chainDataList = providerAccounts.map(account => {
                  const found = walletData.find(d => d.account.provider === account.provider && d.account.network === account.network)
                  return found || { account, tokens: [], totalUsd: undefined, isLoading }
                })

                return (
                  <WalletProviderGroup
                    key={provider}
                    provider={provider}
                    chainDataList={chainDataList}
                    expandedChains={expandedChains}
                    onToggleChain={toggleChain}
                    onDisconnect={disconnect}
                    disabled={externalWalletMode}
                    sortBy={sortBy}
                  />
                )
              })}
            </div>
          )}
        </div>

        <div className="py-4">
          <ThemeButton onClick={handleConnectWallet} disabled={externalWalletMode} variant="primaryMedium" className="w-full">
            Connect Wallet
          </ThemeButton>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
