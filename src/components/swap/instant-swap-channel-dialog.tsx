import { Credenza, CredenzaContent } from '@/components/ui/credenza'
import { InstantSwap } from '@/components/swap/instant-swap'
import { Asset } from '@/components/swap/asset'
import { DepositChannel } from '@/components/swap/instant-swap-dialog'

interface InstantSwapDialogProps {
  assetFrom: Asset
  channel: DepositChannel
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const InstantSwapChannelDialog = ({ assetFrom, channel, isOpen, onOpenChange }: InstantSwapDialogProps) => {
  return (
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent className="flex h-auto max-h-5/6 flex-col md:max-w-xl">
        <InstantSwap asset={assetFrom} channel={channel} />
      </CredenzaContent>
    </Credenza>
  )
}
