import { ArrowDown } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { useAccounts } from '@/hooks/use-accounts'
import { useSwap } from '@/hooks/use-swap'

export const SwapToggleAssets = () => {
  const { accounts, select } = useAccounts()
  const { swapAssets, toAsset, fromAsset, destination, setDestination } = useSwap()

  const onSwapAssets = () => {
    swapAssets()
    const fromAssetNew = toAsset
    const toAssetNew = fromAsset
    const fromAssetAccount = accounts?.find(x => x.network === fromAssetNew?.chain)
    select(fromAssetAccount || null)

    if (destination?.network === toAssetNew?.chain) {
      return
    }

    const toAssetAccount = accounts?.find(x => x.network === toAssetNew?.chain)
    setDestination(toAssetAccount)
  }

  return (
    <div className="relative flex cursor-pointer items-center justify-center overflow-hidden">
      <Separator />
      <div className="bg-blade rounded-full">
        <ArrowDown
          className="text-gray p-2 transition-transform duration-300 hover:rotate-180"
          onClick={onSwapAssets}
          size={32}
        />
      </div>
      <Separator />
    </div>
  )
}
