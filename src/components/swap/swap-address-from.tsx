import Image from 'next/image'
import { ChevronDown, Wallet } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useAccounts } from '@/hooks/use-accounts'
import { cn, truncate } from '@/lib/utils'
import { useAssetFrom } from '@/hooks/use-swap'
import { WalletConnectDialog } from '@/components/header/wallet-connect-dialog'
import { useDialog } from '@/components/global-dialog'
import { Icon } from '@/components/icons'

export const SwapAddressFrom = () => {
  const { accounts, selected, select } = useAccounts()
  const assetFrom = useAssetFrom()
  const { openDialog } = useDialog()

  const options = accounts?.filter(a => a.network === assetFrom?.chain)

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <div className="cursor-pointer border-b-1 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selected ? (
                <Image src={`/wallets/${selected.provider.toLowerCase()}.svg`} alt="" width="24" height="24" />
              ) : (
                <Wallet className="text-gray h-6 w-6" />
              )}
              <span className="text-gray text-sm">{selected?.provider || 'Source Wallet'}</span>
            </div>
            <div className="text-leah text-sm font-semibold">
              <span>{selected?.address ? truncate(selected.address) : ''}</span>
              <ChevronDown className="ms-2 inline h-4 w-4" />
            </div>
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-tyler rounded-2xl border-0 p-0">
        <div className="border-b p-4">
          <div className="flex items-center gap-4">
            <Wallet className="text-gray h-6 w-6" />
            <DropdownMenuLabel className="text-gray p-0 text-sm font-medium">Source Wallet</DropdownMenuLabel>
          </div>
        </div>

        <div>
          {options?.map((account, index) => (
            <DropdownMenuItem
              key={index}
              className="focus:bg-blade flex cursor-pointer items-center justify-between gap-4 rounded-none p-4"
              onSelect={() => select(account)}
            >
              <div className="flex items-center gap-4">
                <Image src={`/wallets/${account.provider.toLowerCase()}.svg`} alt="" width="24" height="24" />
                <span className="text-gray text-sm font-medium">{account.provider}</span>
              </div>
              <span
                className={cn('ms-5 text-sm font-semibold', {
                  'text-runes-blue': account.provider === selected?.provider && account.address === selected?.address
                })}
              >
                {truncate(account.address)}
              </span>
            </DropdownMenuItem>
          ))}

          <DropdownMenuItem
            className="focus:bg-blade flex cursor-pointer rounded-none p-4"
            onClick={() => openDialog(WalletConnectDialog, {})}
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
