'use client'

import Image from 'next/image'
import { LogOut } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { WalletConnectDialog } from '@/components/header/wallet-connect-dialog'
import { useConnectedProviders, useDisconnect } from '@/store/account-store'
import { useDialog } from '@/components/global-dialog'
import { TransactionHistoryButton } from '@/components/header/transaction-history-button'
import { ThemeButton } from '@/components/theme-button'
import { ThemeSwitchButton } from '@/components/header/theme-switch-button'

export function Header() {
  const { openDialog } = useDialog()

  const connectedProviders = useConnectedProviders()
  const disconnectProvider = useDisconnect()

  return (
    <header className="">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="THORChain Swap" width={32} height={32} priority />
            <div className="flex items-center gap-2">
              <div className="text-leah text-sm font-semibold">THORChain Swap</div>
              <Image src="/beta.svg" alt="Beta" width={37} height={17} priority />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeSwitchButton />
            <TransactionHistoryButton />
            <ThemeButton variant="secondarySmall" onClick={() => openDialog(WalletConnectDialog, {})}>
              Connect Wallet
            </ThemeButton>
            {connectedProviders.map((provider, i) => (
              <DropdownMenu key={i}>
                <DropdownMenuTrigger asChild>
                  <ThemeButton variant="circleSmall" className="rounded-xl">
                    <Image width="24" height="24" src={`/wallets/${provider.toLowerCase()}.svg`} alt={provider} />
                  </ThemeButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="p-0">
                  <DropdownMenuItem className="flex cursor-pointer items-center justify-between gap-3 rounded-none px-3 py-2 focus:bg-neutral-800">
                    <div className="flex items-center gap-3" onClick={() => disconnectProvider(provider)}>
                      <LogOut className="h-5 w-5" />
                      <span className="text-gray text-sm">Disconnect</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
