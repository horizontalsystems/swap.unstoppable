import { Separator } from '@/components/ui/separator'
import { useSwapAssets } from '@/hooks/use-swap'
import { Icon } from '@/components/icons'
import { useQuote } from '@/hooks/use-quote'
import { SwapKitNumber } from '@swapkit/core'

export const SwapToggleAssets = () => {
  const swapAssets = useSwapAssets()
  const { quote } = useQuote()

  const amount = quote && new SwapKitNumber(quote.expectedBuyAmount).toSignificant()

  return (
    <div className="relative flex cursor-pointer items-center justify-center overflow-hidden">
      <Separator />
      <div className="bg-blade rounded-full p-1.5">
        <Icon name="arrow-m-down" className="text-thor-gray size-5" onClick={() => swapAssets(amount)} />
      </div>
      <Separator />
    </div>
  )
}
