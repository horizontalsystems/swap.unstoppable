import Image from 'next/image'
import { useEffect } from 'react'
import { ChevronDown, Wallet } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useAccounts } from '@/context/accounts-provider'
import { Asset } from '@/components/swap/asset'
import { cn, truncate } from '@/lib/utils'
import { useSwap } from '@/hooks/use-swap'

interface SwapAddressFromProps {
  asset?: Asset
}

export const SwapAddressFrom = ({ asset }: SwapAddressFromProps) => {
  const { accounts, selected, select } = useAccounts()
  const { fromAsset } = useSwap()
  const options = accounts?.filter(a => a.network === asset?.chain)

  useEffect(() => {
    if (fromAsset && !selected) {
      const fromAssetAccount = accounts?.find(x => x.network === fromAsset?.chain)
      if (fromAssetAccount) {
        select(fromAssetAccount)
      }
    }
  }, [accounts, fromAsset, select, selected])

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {selected ? (
          <Image src={`/wallets/${selected.provider.toLowerCase()}.svg`} alt="" width="24" height="24" />
        ) : (
          <Wallet className="text-gray h-6 w-6" />
        )}
        <span className="text-gray text-sm">{selected?.provider || 'Source Wallet'}</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="text-leah cursor-pointer text-sm">
            <span>{selected?.address ? truncate(selected.address) : ''}</span>
            <ChevronDown className="ms-2 inline h-4 w-4" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-lawrence rounded-2xl p-0">
          <div className="border-b p-3 py-2">
            <div className="flex items-center gap-3">
              <Wallet className="text-gray h-6 w-6" />
              <DropdownMenuLabel className="text-gray p-0 text-sm">Source Wallet</DropdownMenuLabel>
            </div>
          </div>

          <div className="divide-y divide-neutral-800">
            {options?.map((account, index) => (
              <DropdownMenuItem
                key={index}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-none px-3 py-2 focus:bg-neutral-800"
                onSelect={() => select(account)}
              >
                <div className="flex items-center gap-3">
                  <Image src={`/wallets/${account.provider.toLowerCase()}.svg`} alt="" width="24" height="24" />
                  <span className="text-gray text-sm">{account.provider}</span>
                </div>
                <span
                  className={cn('ms-5 text-sm', {
                    'text-runes-blue': account.provider === selected?.provider && account.address === selected?.address
                  })}
                >
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
