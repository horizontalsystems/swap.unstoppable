import Decimal from 'decimal.js'
import { ChevronDown } from 'lucide-react'
import { SwapSelectAsset } from '@/components/swap/swap-select-asset'
import { DecimalInput } from '@/components/decimal-input'
import { AssetIcon } from '@/components/asset-icon'
import { Skeleton } from '@/components/ui/skeleton'
import { networkLabel } from 'rujira.js'
import { DecimalFiat } from '@/components/decimal-fiat'
import { useAccounts } from '@/context/accounts-provider'
import { Quote } from '@/hooks/use-quote'
import { useDestination, useSetDestination, useSwap } from '@/hooks/use-swap'
import { useDialog } from '@/components/global-dialog'

interface SwapInputProps {
  quote?: Quote
}

export const SwapInputTo = ({ quote }: SwapInputProps) => {
  const { openDialog } = useDialog()
  const { toAsset, setSwap } = useSwap()
  const { accounts } = useAccounts()
  const destination = useDestination()
  const setDestination = useSetDestination()

  const amount = toAsset ? BigInt(quote?.expected_amount_out || 0) : 0n
  const valueTo = new Decimal(amount)
    .div(10 ** 8)
    .mul(toAsset?.price || 1)
    .toString()

  const onClick = () =>
    openDialog(SwapSelectAsset, {
      selected: toAsset,
      onSelectAsset: asset => {
        if (destination?.network !== asset.chain) {
          setDestination(accounts?.find(x => x.network === asset.chain))
        }

        setSwap(undefined, asset)
      }
    })

  return (
    <div className="px-6 py-8">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-2xl font-medium text-white">
            <DecimalInput
              className="text-leah w-full bg-transparent text-2xl font-medium outline-none"
              amount={amount}
              onAmountChange={() => null}
              autoComplete="off"
              disabled
            />
          </div>
          <div className="text-gray mt-1 text-sm">
            <DecimalFiat amount={valueTo} />
          </div>
        </div>
        <div className="flex cursor-pointer items-center gap-3" onClick={onClick}>
          <AssetIcon url={toAsset ? `/coins/${toAsset.metadata.symbol.toLowerCase()}.svg` : null} />
          <div className="flex flex-col items-start">
            <span className="text-leah text-lg font-semibold">
              {toAsset ? toAsset.metadata.symbol : <Skeleton className="mb-0.5 h-6 w-12" />}
            </span>
            <span className="text-gray text-sm">
              {toAsset?.chain ? networkLabel(toAsset.chain) : <Skeleton className="mt-0.5 h-3 w-16" />}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-white" />
        </div>
      </div>
    </div>
  )
}
