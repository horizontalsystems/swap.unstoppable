import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useSetDestination, useSwap } from '@/hooks/use-swap'
import { networkLabel, validateAddress } from 'rujira.js'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { OctagonAlertIcon } from 'lucide-react'

interface SwapAddressProps {
  isOpen: boolean
  setOpen: (isOpen: boolean) => void
}

export const SwapAddressConfig = ({ isOpen, setOpen }: SwapAddressProps) => {
  const { toAsset } = useSwap()
  const [address, setAddress] = useState<string>('')
  const setDestination = useSetDestination()

  const onSave = async () => {
    if (!toAsset) {
      return
    }

    setDestination({ address, network: toAsset.chain })
    setOpen(false)
  }

  const isValid = address.length && toAsset ? validateAddress(toAsset?.chain, address) : true

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="bg-lawrence sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Destination Address</DialogTitle>
          <DialogDescription>
            Enter the destination address for the swap. Make sure it is correct, as sending to an incorrect address may
            result in loss of funds.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <div className="grid flex-1 gap-2">
            <label htmlFor="address" className="sr-only">
              Address
            </label>
            <Input placeholder="Enter destination address" value={address} onChange={e => setAddress(e.target.value)} />
          </div>
        </div>
        {!isValid && (
          <Alert variant="destructive">
            <OctagonAlertIcon className="h-4 w-4" />
            <AlertDescription>
              {toAsset ? `Invalid address for ${networkLabel(toAsset.chain)}` : 'Invalid address'}
            </AlertDescription>
          </Alert>
        )}
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={onSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
