'use client'

import Image from 'next/image'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ConnectWallet } from '@/components/connect-wallet/connect-wallet'
import { useConnectedWallets, useDisconnect } from '@/hooks/use-wallets'
import { useDialog } from '@/components/global-dialog'
import { TransactionHistoryButton } from '@/components/header/transaction-history-button'
import { ThemeButton } from '@/components/theme-button'
import { ThemeSwitchButton } from '@/components/header/theme-switch-button'
import { Icon } from '@/components/icons'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function Header() {
  const { openDialog } = useDialog()

  const connectedProviders = useConnectedWallets()
  const disconnectProvider = useDisconnect()

  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn('bg-tyler sticky inset-x-0 top-0 z-50 container mx-auto p-4 transition-all duration-200', {
        'border-blade border-b': isScrolled
      })}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="THORChain Swap" width={32} height={32} priority />
          <div className="flex items-center gap-2">
            <div className="text-leah text-sm font-semibold whitespace-nowrap">THORChain Swap</div>
            <div className="text-storm-purple border-storm-purple rounded-full border px-1.5 py-[1px] text-[10px] font-semibold">
              BETA
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <ThemeSwitchButton />
          <TransactionHistoryButton />
          <ThemeButton
            variant="secondarySmall"
            className="hidden md:flex"
            onClick={() => openDialog(ConnectWallet, {})}
          >
            Connect Wallet
          </ThemeButton>
          <ThemeButton
            variant="circleSmall"
            className="flex md:hidden"
            onClick={() => {
              openDialog(ConnectWallet, {})
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
              <DropdownMenuContent>
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
    </header>
  )
}
