'use client'

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { LogOut, RotateCcw } from 'lucide-react'
import { Provider } from '@/wallets'
import { useAccounts } from '@/context/accounts-provider'
import Image from 'next/image'

interface WalletDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider?: Provider
}

export const WalletDrawer = ({ open, onOpenChange, provider }: WalletDrawerProps) => {
  const { disconnect } = useAccounts()

  if (!provider) {
    return null
  }

  const onDisconnect = () => {
    if (provider) {
      disconnect(provider)
      onOpenChange(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full bg-gray-950">
        <DrawerHeader className="p-0">
          <div className="flex items-center justify-between border-b border-gray-800 p-4">
            <div className="flex items-center space-x-3">
              <Image width="32" height="32" src={`/wallets/${provider.toLowerCase()}.svg`} alt={provider} />
              <div>
                <DrawerTitle className="text-lg font-semibold">{provider}</DrawerTitle>
                <p className="text-sm text-gray-400">account 1</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="rounded-lg p-2 transition-colors hover:bg-gray-800">
                <LogOut className="h-5 w-5" onClick={onDisconnect} />
              </button>
              <button className="rounded-lg p-2 transition-colors hover:bg-gray-800">
                <RotateCcw className="h-5 w-5" />
              </button>
            </div>
          </div>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  )
}
