import { Loader } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { DecimalText } from '@/components/decimal/decimal-text'
import { useBalance } from '@/hooks/use-balance'
import { useAssetFrom } from '@/hooks/use-swap'

export const SwapBalance = () => {
  const t = useTranslations('common')
  const assetFrom = useAssetFrom()
  const { balance, isLoading: isBalanceLoading } = useBalance()

  const renderBalance = () => {
    if (isBalanceLoading) {
      return <Loader className="animate-spin" size={18} />
    }

    if (balance) {
      return (
        <span className="underline underline-offset-2">
          <DecimalText amount={balance.spendable.toSignificant()} symbol={assetFrom?.ticker} />
        </span>
      )
    }

    return null
  }

  const balanceContent = renderBalance()

  if (!balanceContent) return null

  return (
    <div className="text-thor-gray flex items-center gap-1 text-xs">
      <span>{t('balance')}</span>
      {balanceContent}
    </div>
  )
}
