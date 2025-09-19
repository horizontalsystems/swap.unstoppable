import Image from 'next/image'
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
        <div className="text-thor-gray flex cursor-pointer items-center justify-between border-b-1 p-4 text-sm">
          <div className="flex items-center gap-4">
            {selected ? (
              <Image src={`/wallets/${selected.provider.toLowerCase()}.svg`} alt="" width="24" height="24" />
            ) : (
              <Icon name="wallet-out" className="size-6" />
            )}
            <span>{selected?.provider || 'Source Wallet'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-leah font-semibold">{selected?.address ? truncate(selected.address) : ''}</span>
            <Icon name="arrow-s-down" className="size-5" />
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-tyler rounded-2xl border-0 p-0">
        <div className="border-b p-4">
          <div className="text-thor-gray flex items-center gap-4">
            <Icon name="wallet-out" className="size-6" />
            <DropdownMenuLabel className="p-0 text-sm">Source Wallet</DropdownMenuLabel>
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
                <span className="text-thor-gray text-sm font-medium">{account.provider}</span>
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
