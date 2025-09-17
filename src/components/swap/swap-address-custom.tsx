import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { useAssetTo, useSetDestination } from '@/hooks/use-swap'
import { networkLabel, validateAddress } from 'rujira.js'
import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle
} from '@/components/ui/credenza'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SwapAddressProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const SwapAddressCustom = ({ isOpen, onOpenChange }: SwapAddressProps) => {
  const assetTo = useAssetTo()
  const setDestination = useSetDestination()
  const [address, setAddress] = useState<string>('')

  const onSave = async () => {
    if (!assetTo) {
      return
    }

    setDestination({ address, network: assetTo.chain })
    onOpenChange(false)
  }

  const isValid = address.length && assetTo ? validateAddress(assetTo?.chain, address) : true

  return (
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent className="bg-lawrence gap-5 rounded-4xl border-0 p-12 sm:max-w-md">
        <CredenzaHeader>
          <CredenzaTitle>Destination</CredenzaTitle>
          <CredenzaDescription className="mt-5">
            Enter the destination address for the swap. Make sure it is correct, as sending to an incorrect address may
            result in loss of funds.
          </CredenzaDescription>
        </CredenzaHeader>
        <div className="relative grid gap-2">
          <Input
            placeholder={assetTo ? `${networkLabel(assetTo.chain)} address` : 'Enter address'}
            value={address}
            onChange={e => setAddress(e.target.value)}
            className={cn(
              'text-leah placeholder:text-andy border-blade focus-visible:border-blade rounded-xl border-1 px-4 py-4 focus:ring-0 focus-visible:ring-0 md:text-base',
              {
                'border-lucian focus-visible:border-lucian': !isValid
              }
            )}
          />

          {!address.length && (
            <Button
              className="text-leah absolute inset-y-0 end-4 my-auto rounded-3xl border-0 text-xs font-semibold"
              variant="outline"
              onClick={() => {
                navigator.clipboard.readText().then(text => {
                  setAddress(text)
                })
              }}
            >
              Paste
            </Button>
          )}

          {!isValid && <div className="text-lucian text-xs font-semibold">Invalid address</div>}
        </div>
        <CredenzaFooter className="sm:justify-start">
          <button
            className={cn(
              'flex w-full cursor-pointer items-center justify-center gap-2 disabled:cursor-auto',
              'text-lawrence disabled:text-andy disabled:bg-blade h-14 rounded-4xl px-10 text-base font-semibold transition-colors',
              'bg-liquidity-green hover:bg-liquidity-green/90'
            )}
            disabled={!isValid || !address.length}
            onClick={onSave}
          >
            Save
          </button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  )
}
