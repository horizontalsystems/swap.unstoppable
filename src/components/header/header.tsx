'use client'

import Image from 'next/image'
import { LogOut, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { WalletConnectDialog } from '@/components/header/wallet-connect-dialog'
import { useConnectedProviders, useDisconnect } from '@/store/account-store'
import { useDialog } from '@/components/global-dialog'
import { TransactionHistoryButton } from '@/components/header/transaction-history-button'

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
              <div className="text-sm font-semibold text-white">THORChain Swap</div>
              <Image src="/beta.svg" alt="Beta" width={37} height={17} priority />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TransactionHistoryButton />
            <Button className="rounded-xl" variant="outline" onClick={() => openDialog(WalletConnectDialog, {})}>
              {connectedProviders.length ? <Plus /> : 'Connect'}
            </Button>
            {connectedProviders.map((provider, i) => (
              <DropdownMenu key={i}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-lg border-1 px-0">
                    <Image width="32" height="32" src={`/wallets/${provider.toLowerCase()}.svg`} alt={provider} />
                  </Button>
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
