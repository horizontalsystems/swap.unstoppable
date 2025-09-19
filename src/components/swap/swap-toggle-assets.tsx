import { Separator } from '@/components/ui/separator'
import { useSwapAssets } from '@/hooks/use-swap'
import { Icon } from '@/components/icons'

export const SwapToggleAssets = () => {
  const swapAssets = useSwapAssets()

  return (
    <div className="relative flex cursor-pointer items-center justify-center overflow-hidden">
      <Separator />
      <div className="bg-blade rounded-full p-1.5 transition-transform duration-300 hover:rotate-180">
        <Icon name="arrow-m-down" className="text-thor-gray size-5" onClick={swapAssets} />
      </div>
      <Separator />
    </div>
  )
}
