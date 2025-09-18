'use client'

import Image from 'next/image'
import { ChevronDown, Wallet } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { SwapAddressCustom } from '@/components/swap/swap-address-custom'
import { useAssetTo, useDestination, useSetDestination } from '@/hooks/use-swap'
import { useAccounts } from '@/hooks/use-accounts'
import { useDialog } from '@/components/global-dialog'
import { cn, truncate } from '@/lib/utils'
import { WalletConnectDialog } from '@/components/header/wallet-connect-dialog'
import { Pencil, Plus } from '@/components/icons'

export const SwapAddressTo = () => {
  const { openDialog } = useDialog()
  const { accounts } = useAccounts()
  const assetTo = useAssetTo()
  const destination = useDestination()
  const setDestination = useSetDestination()

  const options = accounts?.filter(a => a.network === assetTo?.chain)

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <div className="cursor-pointer border-t-1 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {destination && destination.provider ? (
                <Image src={`/wallets/${destination.provider.toLowerCase()}.svg`} alt="" width="24" height="24" />
              ) : (
                <Wallet className="text-gray h-6 w-6" />
              )}
              <span className="text-gray text-sm">{destination?.provider || 'Destination Wallet'}</span>
            </div>
            <div className="text-leah text-sm font-semibold">
              <span>{destination?.address ? truncate(destination.address) : ''}</span>
              <ChevronDown className="ms-2 inline h-4 w-4" />
            </div>
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-tyler rounded-2xl border-0 p-0">
        <div className="border-b p-4">
          <div className="flex items-center gap-4">
            <Wallet className="text-gray h-6 w-6" />
            <DropdownMenuLabel className="text-gray p-0 text-sm font-medium">Destination Wallet</DropdownMenuLabel>
          </div>
        </div>

        <div>
          {options?.map((account, index) => (
            <DropdownMenuItem
              key={index}
              className="focus:bg-blade flex cursor-pointer items-center justify-between gap-4 rounded-none p-4"
              onSelect={() => setDestination(account)}
            >
              <div className="flex items-center gap-4">
                <Image src={`/wallets/${account.provider.toLowerCase()}.svg`} alt="" width="24" height="24" />
                <span className="text-gray text-sm font-medium">{account.provider}</span>
              </div>
              <span
                className={cn('ms-5 text-sm font-semibold', {
                  'text-runes-blue': account.address === destination?.address
                })}
              >
                {truncate(account.address)}
              </span>
            </DropdownMenuItem>
          ))}

          <DropdownMenuItem
            key="custom-address"
            className="focus:bg-blade flex cursor-pointer rounded-none p-4"
            onClick={() => openDialog(SwapAddressCustom, {})}
          >
            <div className="flex items-center gap-4">
              <Pencil className="text-liquidity-green size-6" />
              <span className="text-liquidity-green text-sm font-medium">Custom Address</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="focus:bg-blade flex cursor-pointer rounded-none p-4"
            onClick={() => openDialog(WalletConnectDialog, {})}
          >
            <div className="flex items-center gap-4">
              <Plus className="text-storm-purple size-6" />
              <span className="text-storm-purple text-sm font-medium">Connect Wallet</span>
            </div>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
