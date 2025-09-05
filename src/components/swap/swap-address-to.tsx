'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { ChevronDown, Pencil, Wallet } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Asset } from '@/components/swap/asset'
import { SwapAddressConfig } from '@/components/swap/swap-address-config'
import { useDestination, useSetDestination, useSwap } from '@/hooks/use-swap'
import { useAccounts } from '@/context/accounts-provider'
import { cn, truncate } from '@/lib/utils'

interface SwapSelectToProps {
  asset?: Asset
}

export const SwapAddressTo = ({ asset }: SwapSelectToProps) => {
  const { accounts } = useAccounts()
  const { toAsset } = useSwap()
  const [isOpen, setIsOpen] = useState(false)

  const destination = useDestination()
  const setDestination = useSetDestination()
  const options = accounts?.filter(a => a.network === asset?.chain)

  useEffect(() => {
    if (toAsset && !destination) {
      const toAssetAccount = accounts?.find(x => x.network === toAsset?.chain)
      if (toAssetAccount) {
        setDestination(toAssetAccount)
      }
    }
  }, [accounts, destination, setDestination, toAsset])

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {destination && destination.provider ? (
          <Image src={`/wallets/${destination.provider.toLowerCase()}.svg`} alt="" width="24" height="24" />
        ) : (
          <Wallet className="text-gray h-6 w-6" />
        )}
        <span className="text-gray text-sm">{destination?.provider || 'Destination Wallet'}</span>
      </div>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <div className="text-leah cursor-pointer text-sm">
            <span>{destination?.address ? truncate(destination.address) : ''}</span>
            <ChevronDown className="ms-2 inline h-4 w-4" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-lawrence rounded-2xl p-0">
          <div className="border-b p-3">
            <div className="flex items-center gap-3">
              <Wallet className="text-gray h-6 w-6" />
              <DropdownMenuLabel className="text-gray p-0 text-sm">Destination Wallet</DropdownMenuLabel>
            </div>
          </div>

          <div className="divide-y divide-neutral-800">
            {options?.map((account, index) => (
              <DropdownMenuItem
                key={index}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-none px-3 py-2 focus:bg-neutral-800"
                onSelect={() => setDestination(account)}
              >
                <div className="flex items-center gap-3">
                  <Image src={`/wallets/${account.provider.toLowerCase()}.svg`} alt="" width="24" height="24" />
                  <span className="text-gray text-sm">{account.provider}</span>
                </div>
                <span className={cn('ms-5 text-sm', { 'text-runes-blue': account.address === destination?.address })}>
                  {truncate(account.address)}
                </span>
              </DropdownMenuItem>
            ))}

            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-3 rounded-none px-3 py-2 focus:bg-neutral-800"
              onClick={e => {
                e.preventDefault()
                setIsOpen(true)
              }}
            >
              <Pencil size={24} className="text-green ms-1 flex-shrink-0" />
              <span className="text-green ps-1 text-sm">Custom Address</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <SwapAddressConfig isOpen={isOpen} setOpen={setIsOpen} />
    </div>
  )
}
