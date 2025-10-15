'use client'

import Image from 'next/image'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { SwapAddressCustom } from '@/components/swap/swap-address-custom'
import { useAssetTo, useDestination, useSetDestination } from '@/hooks/use-swap'
import { useAccounts } from '@/hooks/use-wallets'
import { useDialog } from '@/components/global-dialog'
import { cn, truncate } from '@/lib/utils'
import { ConnectWallet } from '@/components/connect-wallet/connect-wallet'
import { Icon } from '@/components/icons'
import { wallet } from '@/components/connect-wallet/config'

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
        <div className="text-thor-gray cursor-pointer border-t-1 p-4 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {destination && destination.provider ? (
                <Image src={`/wallets/${destination.provider.toLowerCase()}.svg`} alt="" width="24" height="24" />
              ) : (
                <Icon name="wallet-in" className="size-6" />
              )}
              <span>{(destination?.provider && wallet(destination.provider)?.label) || 'Destination Wallet'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-leah font-semibold">
                {destination?.address ? truncate(destination.address) : ''}
              </span>
              <Icon name="arrow-s-down" className="size-5" />
            </div>
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-tyler rounded-2xl border-0 p-0">
        <div className="border-b p-4">
          <div className="text-thor-gray flex items-center gap-4">
            <Icon name="wallet-in" className="size-6" />
            <DropdownMenuLabel className="p-0 text-sm">Destination Wallet</DropdownMenuLabel>
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
                <span className="text-thor-gray text-sm font-medium">{wallet(account.provider)?.label}</span>
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
              <Icon name="pencil" className="text-liquidity-green size-6" />
              <span className="text-liquidity-green text-sm font-medium">Custom Address</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="focus:bg-blade flex cursor-pointer rounded-none p-4"
            onClick={() => openDialog(ConnectWallet, {})}
          >
            <div className="flex items-center gap-4">
              <Icon name="plus" className="text-storm-purple size-6" />
              <span className="text-storm-purple text-sm font-medium">Connect Wallet</span>
            </div>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
