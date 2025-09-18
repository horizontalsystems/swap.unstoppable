import { Input } from '@/components/ui/input'
import { ThemeButton } from '@/components/theme-button'
import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle
} from '@/components/ui/credenza'
import { useState } from 'react'
import { useAssetTo, useSetDestination } from '@/hooks/use-swap'
import { networkLabel, validateAddress } from 'rujira.js'
import { cn } from '@/lib/utils'

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
            <ThemeButton
              variant="secondarySmall"
              className="absolute end-4 top-1/2 -translate-y-1/2"
              onClick={() => {
                navigator.clipboard.readText().then(text => {
                  setAddress(text)
                })
              }}
            >
              Paste
            </ThemeButton>
          )}

          {!isValid && <div className="text-lucian text-xs font-semibold">Invalid address</div>}
        </div>
        <CredenzaFooter className="sm:justify-start">
          <ThemeButton
            variant="primaryMedium"
            className="w-full"
            disabled={!isValid || !address.length}
            onClick={onSave}
          >
            Save
          </ThemeButton>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  )
}
