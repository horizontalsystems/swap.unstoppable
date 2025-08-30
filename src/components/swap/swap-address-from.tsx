import Image from 'next/image'
import { ChevronDown, Wallet } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useAccounts } from '@/context/accounts-provider'
import { cn, truncate } from '@/lib/utils'
import { Network } from 'rujira.js'
import { Asset } from '@/components/swap/asset'

interface SwapAddressFromProps {
  asset?: Asset
}

export const SwapAddressFrom = ({ asset }: SwapAddressFromProps) => {
  const { accounts, selected, select } = useAccounts()
  const options = accounts?.filter(a => a.network === asset?.chain || a.network === Network.Thorchain)

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {selected ? (
          <Image src={`/wallets/${selected.provider}.png`} alt="" width="24" height="24" />
        ) : (
          <Wallet className="text-gray h-6 w-6" />
        )}
        <span className="text-gray text-sm">{selected?.provider || 'Source Wallet'}</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="text-leah text-sm">
            <span>{selected?.address ? truncate(selected.address) : ''}</span>
            <ChevronDown className="ms-2 inline h-4 w-4" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-deep-black rounded-2xl p-0">
          <div className="border-b p-4">
            <div className="flex items-center gap-3">
              <Wallet className="text-gray h-6 w-6" />
              <DropdownMenuLabel className="text-gray p-0 text-sm">Source Wallet</DropdownMenuLabel>
            </div>
          </div>

          <div className="divide-y divide-neutral-900">
            {options?.map((account, index) => (
              <DropdownMenuItem
                key={index}
                className="group flex cursor-pointer items-center gap-4 rounded-none px-2 py-2 ps-5 focus:bg-neutral-900/60"
                onSelect={() => select(account)}
              >
                <Image src={`/wallets/${account.provider}.png`} alt="" width="24" height="24" />
                <span className="text-gray text-sm">{account.provider}</span>
                <span className={cn('ms-5 text-sm', { 'text-runes-blue': account === selected })}>
                  {truncate(account.address)}
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
