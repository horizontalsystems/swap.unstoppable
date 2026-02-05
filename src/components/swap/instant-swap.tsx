import Image from 'next/image'
import { useState } from 'react'
import { formatDuration, intervalToDuration } from 'date-fns'
import { CredenzaDescription, CredenzaHeader, CredenzaTitle } from '@/components/ui/credenza'
import { CopyButton } from '@/components/button-copy'
import { Asset } from '@/components/swap/asset'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DepositChannel } from '@/components/swap/instant-swap-dialog'
import { SwapAddressWarning } from '@/components/swap/swap-address-warning'
import { chainLabel } from '@/components/connect-wallet/config'
import { cn } from '@/lib/utils'

interface SwapMemolessChannelProps {
  assetFrom: Asset
  assetTo: Asset
  channel: DepositChannel
}

export const InstantSwap = ({ assetFrom, assetTo, channel }: SwapMemolessChannelProps) => {
  const [warningChecked, setWarningChecked] = useState(false)
  const [warningCheckedLTC, setWarningCheckedLTC] = useState(false)

  const isLTC = assetTo.ticker === 'LTC'
  const isBlurred = !warningChecked || (isLTC && !warningCheckedLTC)

  return (
    <>
      <CredenzaHeader>
        <CredenzaTitle>Send {assetFrom.name || assetFrom.ticker}</CredenzaTitle>
        <CredenzaDescription>
          Send exactly{' '}
          <b>
            {channel.value} {assetFrom.ticker}
          </b>{' '}
          to the address below from a self custody wallet.
        </CredenzaDescription>
      </CredenzaHeader>

      <ScrollArea className="flex min-h-0 flex-1 px-4 md:px-8" classNameViewport="flex-1 h-auto">
        <div className="flex flex-col gap-4 pb-8">
          <SwapAddressWarning
            checked={warningChecked}
            onCheckedChange={setWarningChecked}
            text="I understand that I must send exactly the specified amount from a self-custody wallet. Sending from contracts or exchanges will result in"
            textAccent="loss of funds."
          />

          {isLTC && (
            <SwapAddressWarning
              checked={warningCheckedLTC}
              onCheckedChange={setWarningCheckedLTC}
              text="I understand that using an LTC MWEB address will result in"
              textAccent="loss of funds."
            />
          )}
          <div className="flex flex-col items-center space-y-4 rounded-xl border p-4 md:p-6">
            <div className="flex items-center gap-2">
              <span className="text-leah text-xl font-semibold">
                {channel.value} {assetFrom.ticker}
              </span>
              <CopyButton text={channel.value} />
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <div className={cn('text-thor-gray text-sm font-semibold break-all', { 'blur-xs': isBlurred })}>
                  {channel.address}
                </div>
                <CopyButton text={channel.address} />
              </div>

              <div className="text-gray border-gray rounded-full border px-1.5 text-[10px] font-semibold">
                {chainLabel(assetFrom.chain)}
              </div>
            </div>

            <div className="size-50 overflow-hidden rounded-4xl bg-white p-3">
              <Image
                src={channel.qrCodeData}
                alt="QR Code"
                className={cn('h-full w-full', { 'blur-sm': isBlurred })}
                width={200}
                height={200}
              />
            </div>

            {channel.expiration && (
              <div className="text-jacob text-xs font-semibold">
                Expires in &nbsp;
                {formatDuration(
                  intervalToDuration({
                    start: new Date().getTime(),
                    end: channel.expiration * 1000
                  }),
                  { format: ['hours', 'minutes', 'seconds'], zero: false }
                )}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </>
  )
}
