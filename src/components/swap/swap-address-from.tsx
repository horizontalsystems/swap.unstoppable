import Image from 'next/image'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { wallet } from '@/components/connect-wallet/config'
import { Icon } from '@/components/icons'
import { ThemeButton } from '@/components/theme-button'
import { useAssetFrom } from '@/hooks/use-swap'
import { useAccounts, useSelectAccount, useSelectedAccount } from '@/hooks/use-wallets'
import { cn, truncate } from '@/lib/utils'

export const SwapAddressFrom = () => {
  const accounts = useAccounts()
  const selectedAccount = useSelectedAccount()
  const selectAccount = useSelectAccount()
  const assetFrom = useAssetFrom()

  const options = accounts.filter(a => a.network === assetFrom?.chain)

  if (!selectedAccount || options.length < 2) return null

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <ThemeButton variant="secondarySmall" className="gap-2 pr-2">
          <Image src={`/wallets/${selectedAccount.provider.toLowerCase()}.svg`} alt="" width="16" height="16" /> {truncate(selectedAccount.address)}
          <Icon name="arrow-s-down" className="size-4" />
        </ThemeButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div>
          {options?.map((account, index) => (
            <DropdownMenuItem
              key={index}
              className="focus:bg-blade/50 flex cursor-pointer items-center justify-between gap-4 rounded-none px-4 py-3"
              onSelect={() => selectAccount(account)}
            >
              <div className="flex items-center gap-4">
                <Image src={`/wallets/${account.provider.toLowerCase()}.svg`} alt="" width="20" height="20" />
                <span className="text-thor-gray text-xs font-semibold">{wallet(account.provider)?.label}</span>
              </div>
              <span
                className={cn('ms-5 text-xs font-semibold', {
                  'text-brand-second': account.provider === selectedAccount?.provider && account.address === selectedAccount?.address
                })}
              >
                {truncate(account.address)}
              </span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
