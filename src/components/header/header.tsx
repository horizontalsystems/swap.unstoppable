'use client'

import { ArrowRightLeft } from 'lucide-react'
import { WalletConnectButton } from '@/components/header/wallet-connect-button'

export function Header() {
  return (
    <header className="">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-green-400 to-blue-500">
              <ArrowRightLeft className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">THORChain Swap</h1>
          </div>

          <WalletConnectButton />
        </div>
      </div>
    </header>
  )
}
