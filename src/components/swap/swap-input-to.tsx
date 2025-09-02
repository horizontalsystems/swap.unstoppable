import Decimal from 'decimal.js'
import { useState } from 'react'
import { ChevronDown, Wallet } from 'lucide-react'
import { SwapSelectCoin } from '@/components/swap/swap-select-coin'
import { useSwapContext } from '@/context/swap-provider'
import { DecimalInput } from '@/components/decimal-input'
import { networkLabel } from 'rujira.js'
import { DecimalFiat } from '@/components/decimal-fiat'
import { useAccounts } from '@/context/accounts-provider'
import { UseQuote } from '@/hook/use-quote'

interface SwapInputProps {
  quote?: UseQuote
}

export const SwapInputTo = ({ quote }: SwapInputProps) => {
  const [open, setOpen] = useState(false)
  const { toAsset, setSwap, setDestination, destination } = useSwapContext()
  const { accounts } = useAccounts()

  const amount = toAsset ? BigInt(quote?.expected_amount_out || 0) : 0n
  const valueTo = new Decimal(amount)
    .div(10 ** 8)
    .mul(toAsset?.price || 1)
    .toString()

  return (
    <div className="px-6 py-8">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-2xl font-medium text-white">
            <DecimalInput
              className="text-leah w-full bg-transparent text-2xl font-medium outline-none"
              amount={amount}
              onAmountChange={console.log}
              autoComplete="off"
              disabled
            />
          </div>
          <div className="text-gray mt-1 text-sm">
            <DecimalFiat amount={valueTo} />
          </div>
        </div>
        <div className="flex items-center gap-3" onClick={() => setOpen(true)}>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-300">
            <Wallet className="h-6 w-6 text-black" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-leah text-lg font-semibold">{toAsset?.metadata.symbol}</span>
            <span className="text-gray text-sm">{toAsset?.chain ? networkLabel(toAsset.chain) : ''}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-white" />
        </div>
      </div>

      <SwapSelectCoin
        key="select-to"
        isOpen={open}
        selected={toAsset}
        isInput={false}
        onClose={() => setOpen(false)}
        onSelectAsset={asset => {
          if (destination?.network !== asset.chain) {
            setDestination(accounts?.find(x => x.network === asset.chain))
          }

          setSwap(undefined, asset)
        }}
      />
    </div>
  )
}
