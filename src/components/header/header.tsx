'use client'

import Image from 'next/image'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { WalletConnectDialog } from '@/components/header/wallet-connect-dialog'
import { useConnectedProviders, useDisconnect } from '@/store/account-store'
import { useDialog } from '@/components/global-dialog'
import { TransactionHistoryButton } from '@/components/header/transaction-history-button'
import { ThemeButton } from '@/components/theme-button'
import { ThemeSwitchButton } from '@/components/header/theme-switch-button'
import { Icon } from '@/components/icons'

export function Header() {
  const { openDialog } = useDialog()

  const connectedProviders = useConnectedProviders()
  const disconnectProvider = useDisconnect()

  return (
    <header className="">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="THORChain Swap" width={32} height={32} priority />
            <div className="flex items-center gap-2">
              <div className="text-leah text-sm font-semibold whitespace-nowrap">THORChain Swap</div>
              <Image src="/beta.svg" alt="Beta" width={37} height={17} priority />
            </div>
          </div>

          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            <ThemeSwitchButton />
            <TransactionHistoryButton />
            <ThemeButton
              variant="secondarySmall"
              className="hidden md:flex"
              onClick={() => openDialog(WalletConnectDialog, {})}
            >
              Connect Wallet
            </ThemeButton>
            <ThemeButton
              variant="circleSmall"
              className="flex md:hidden"
              onClick={() => {
                openDialog(WalletConnectDialog, {})
              }}
            >
              <Icon name="plus" />
            </ThemeButton>
            {connectedProviders.map((provider, i) => (
              <DropdownMenu key={i}>
                <DropdownMenuTrigger asChild>
                  <ThemeButton variant="circleSmall" className="rounded-xl">
                    <Image width="24" height="24" src={`/wallets/${provider.toLowerCase()}.svg`} alt={provider} />
                  </ThemeButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-2xl border-0 p-0">
                  <DropdownMenuItem
                    className="text-thor-gray flex cursor-pointer gap-4 p-4"
                    onClick={() => disconnectProvider(provider)}
                  >
                    <Icon name="disconnect" className="size-6" />
                    <span className="text-sm">Disconnect</span>
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
