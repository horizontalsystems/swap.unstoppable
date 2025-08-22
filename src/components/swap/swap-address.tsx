import { ChevronDown, Wallet } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useAccounts } from '@/context/accounts-provider'
import { Account } from '@/wallets'
import { truncate } from '@/lib/utils'
import { Network } from 'rujira.js'
import { Asset } from '@/components/swap/asset'
import { Button } from '@/components/ui/button'

interface SwapAddressProps {
  asset?: Asset
  account?: Account
  onSelect: (account: Account) => void
}

export const SwapAddress = ({ asset, account, onSelect }: SwapAddressProps) => {
  const { accounts } = useAccounts()
  const options = accounts?.filter(a => a.network === asset?.chain || a.network === Network.Thorchain)

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500">
          <div className="h-4 w-4 rounded-full bg-white"></div>
        </div>
        <span className="text-sm text-gray-400">{account?.provider || 'Select Source Wallet'}</span>
      </div>
      <div className="font-mono text-sm text-gray-400">
        {account?.address ? truncate(account.address) : ''}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ChevronDown className="ml-1 inline h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="rounded-2xl border-neutral-800 bg-neutral-950">
            <div className="p-5 pb-3">
              <div className="flex items-center gap-3">
                <Wallet />
                <DropdownMenuLabel className="p-0 text-sm font-semibold text-neutral-300">
                  Wallet
                </DropdownMenuLabel>
              </div>
            </div>

            <DropdownMenuSeparator className="bg-neutral-900" />

            <div className="divide-y divide-neutral-900">
              {options?.map((opt, index) => (
                <DropdownMenuItem
                  key={index}
                  className="group flex cursor-pointer items-center gap-4 rounded-none px-2 py-2 ps-5 focus:bg-neutral-900/60"
                  onSelect={() => onSelect(opt)}
                >
                  <div className="shrink-0">
                    <Wallet />
                  </div>
                  <div className="flex flex-1 items-center justify-between">
                    <span className="text-lg text-neutral-300">{truncate(opt.address)}</span>
                    <span className="truncate text-lg text-neutral-200 tabular-nums"></span>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>

            <DropdownMenuSeparator className="bg-neutral-900" />

            <div className="flex items-center justify-between gap-4 px-5 py-2">
              <div className="text-sm text-neutral-400">Custom Address</div>
              <div className="flex items-center">
                <span className="truncate text-sm text-neutral-200"></span>
                <Button
                  variant="ghost"
                  className="rounded-xl bg-transparent px-0 text-base font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  Paste
                </Button>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
