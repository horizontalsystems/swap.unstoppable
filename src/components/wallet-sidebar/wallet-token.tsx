import { useDialog } from '@/components/global-dialog'
import { Send } from '@/components/send/send'
import { DecimalText } from '@/components/decimal/decimal-text'
import { TokenBalance } from '@/hooks/use-wallet-balances'
import { cn, toCurrencyFixed } from '@/lib/utils'
import { WalletAccount } from '@/store/wallets-store'
import { Icon } from '@/components/icons'

interface TokenRowProps {
  token: TokenBalance
  bordered: boolean
  account: WalletAccount
}

export function WalletToken({ token, bordered, account }: TokenRowProps) {
  const { openDialog } = useDialog()
  const { balance, usdValue, logoURI } = token
  const iconUrl = logoURI

  return (
    <div className={cn('flex items-center gap-3 px-4 py-2', { 'border-b': bordered })}>
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        {iconUrl && <img src={iconUrl} alt={balance.ticker} width={32} height={32} className="rounded-full" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-txt-high-contrast text-sm font-medium">{balance.ticker}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="text-right">
          {usdValue !== undefined ? (
            <>
              <div className="text-txt-high-contrast text-sm font-medium">{toCurrencyFixed(usdValue.toCurrency('$', { trimTrailingZeros: false }))}</div>
              <div className="text-txt-label-small text-xs">
                <DecimalText amount={balance.toSignificant()} symbol={balance.ticker} />
              </div>
            </>
          ) : (
            <div className="text-txt-high-contrast text-sm font-medium">
              <DecimalText amount={balance.toSignificant()} symbol={balance.ticker} />
            </div>
          )}
        </div>
        <button
          onClick={() => {
            openDialog(Send, { initialToken: token, account })
          }}
          className="text-txt-label-small hover:text-green-contrast cursor-pointer"
          aria-label={`Send ${balance.ticker}`}
        >
          <Icon name="send" className="size-6" />
        </button>
      </div>
    </div>
  )
}
