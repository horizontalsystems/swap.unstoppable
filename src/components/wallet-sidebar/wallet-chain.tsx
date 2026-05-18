import Image from 'next/image'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { chainLabel } from '@/components/connect-wallet/config'
import { ChainWalletData } from '@/hooks/use-wallet-balances'
import { cn, toCurrencyFixed, truncate } from '@/lib/utils'
import { WalletToken } from '@/components/wallet-sidebar/wallet-token'

interface WalletChainProps {
  data: ChainWalletData
  isExpanded: boolean
  onToggle: () => void
  disabled: boolean
}

export function WalletChain({ data, isExpanded, onToggle, disabled }: WalletChainProps) {
  const { account, tokens, totalUsd, isLoading } = data
  const chainName = chainLabel(account.network)

  return (
    <div className={cn({ 'opacity-30': disabled })}>
      <button
        className={cn('flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-left', { 'border-b': isExpanded })}
        onClick={onToggle}
        disabled={disabled}
      >
        <Image src={`/networks/${account.network.toLowerCase()}.svg`} alt={chainName} width={32} height={32} className="shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <div className="text-txt-high-contrast truncate text-sm font-medium">{chainName}</div>
          <div className="text-txt-label-small truncate text-xs font-medium">{truncate(account.address)}</div>
        </div>
        <div className="flex items-center gap-1">
          {isLoading ? (
            <Loader2 className="text-txt-label-small size-4 animate-spin" />
          ) : (
            <span className="text-txt-high-contrast text-sm font-medium">
              {totalUsd !== undefined ? toCurrencyFixed(totalUsd.toCurrency('$', { trimTrailingZeros: false })) : '—'}
            </span>
          )}
          {isExpanded ? <ChevronUp className="text-txt-label-small size-4" /> : <ChevronDown className="text-txt-label-small size-4" />}
        </div>
      </button>

      {isExpanded && (
        <div>
          {tokens.filter(t => t.amount > 0).length > 0 ? (
            tokens.filter(t => t.amount > 0).map((token, i) => <WalletToken bordered={false} key={i} token={token} account={account} />)
          ) : (
            <div className="text-txt-label-small px-4 py-1 text-xs">No tokens found</div>
          )}
          <div className="border-t py-1">
            <div className="mx-4 flex gap-2">
              <div
                className="text-txt-label-small hover:text-green-contrast hover:border-green-contrast flex flex-1 cursor-pointer items-center justify-center rounded-xl border py-1.5 text-sm"
                onClick={() => {
                  navigator.clipboard.writeText(account.address).then(() => toast.success('Address copied'))
                }}
              >
                Copy Address
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
