import { Loader } from 'lucide-react'
import { DecimalInput } from '@/components/decimal/decimal-input'
import { useAssetFrom } from '@/hooks/use-swap'
import { useBalance } from '@/hooks/use-balance'

export const SwapBalance = () => {
  const assetFrom = useAssetFrom()
  const { balance, isLoading: isBalanceLoading } = useBalance()

  const renderBalance = () => {
    if (isBalanceLoading) {
      return <Loader className="animate-spin" size={18} />
    }

    if (balance) {
      return (
        <span>
          <DecimalInput
            displayType="text"
            amount={balance.spendable.toSignificant()}
            onAmountChange={() => null}
            autoComplete="off"
          />{' '}
          {assetFrom?.ticker}
        </span>
      )
    }

    return null
  }

  const balanceContent = renderBalance()

  if (!balanceContent) return null

  return (
    <div className="text-thor-gray flex gap-1 text-[10px]">
      <span>Balance:</span>
      {balanceContent}
    </div>
  )
}
