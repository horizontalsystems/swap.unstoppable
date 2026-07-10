import { ArrowUpDown } from 'lucide-react'
import { USwapNumber } from '@uswap/core'
import { useQuote } from '@/hooks/use-quote'
import { useSwapAssets } from '@/hooks/use-swap'

export const SwapToggleAssets = () => {
  const swapAssets = useSwapAssets()
  const { quote } = useQuote()

  const handleToggle = () => {
    const amount = quote && new USwapNumber(quote.expectedBuyAmount).toSignificant()
    swapAssets(amount)
  }

  return (
    <div className="z-10 flex h-0 items-center justify-center">
      <button
        className="bg-blade text-thor-gray flex size-8 cursor-pointer items-center justify-center rounded-full transition-all duration-300 hover:opacity-90 active:opacity-60"
        onClick={handleToggle}
      >
        <ArrowUpDown className="size-4" />
      </button>
    </div>
  )
}
