import { useState } from 'react'
import { USwapNumber } from '@uswap/core'
import { Separator } from '@/components/ui/separator'
import { Icon } from '@/components/icons'
import { useQuote } from '@/hooks/use-quote'
import { useSwapAssets } from '@/hooks/use-swap'

export const SwapToggleAssets = () => {
  const swapAssets = useSwapAssets()
  const [isFlipped, setIsFlipped] = useState(false)
  const { quote } = useQuote()

  const handleToggle = () => {
    setIsFlipped(prev => !prev)
    const amount = quote && new USwapNumber(quote.expectedBuyAmount).toSignificant()
    swapAssets(amount)
  }

  return (
    <div className="relative flex cursor-pointer items-center justify-center overflow-hidden">
      <Separator />
      <div className="bg-blade rounded-full p-1.5">
        <Icon name={isFlipped ? 'arrow-m-up' : 'arrow-m-down'} className="text-thor-gray size-5" onClick={handleToggle} />
      </div>
      <Separator />
    </div>
  )
}
