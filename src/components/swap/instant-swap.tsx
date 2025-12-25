import Image from 'next/image'
import { CredenzaDescription, CredenzaHeader, CredenzaTitle } from '@/components/ui/credenza'
import { CopyButton } from '@/components/button-copy'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Icon } from '@/components/icons'
import { formatDuration, intervalToDuration } from 'date-fns'
import { chainLabel } from '@/components/connect-wallet/config'
import { Asset } from '@/components/swap/asset'
import { DepositChannel } from '@/components/swap/instant-swap-dialog'

interface SwapMemolessChannelProps {
  asset: Asset
  channel: DepositChannel
}

export const InstantSwap = ({ asset, channel }: SwapMemolessChannelProps) => {
  return (
    <>
      <CredenzaHeader>
        <CredenzaTitle>External Wallet Instructions</CredenzaTitle>
        <CredenzaDescription>
          Send exactly{' '}
          <b>
            {channel.value} {asset.ticker}
          </b>{' '}
          to the address below from a self custody wallet.
        </CredenzaDescription>
      </CredenzaHeader>

      <ScrollArea className="flex min-h-0 flex-1 px-4 md:px-8" classNameViewport="flex-1 h-auto">
        <div className="flex flex-col gap-4 pb-8">
          <div className="border-jacob flex items-center gap-3 rounded-xl border p-4">
            <Icon name="warning" className="text-jacob size-6 shrink-0" />
            <div className="text-thor-gray text-sm font-semibold">
              DO NOT send a different amount - funds could be lost <br />
              DO NOT send from a contract or exchange - funds will be lost
            </div>
          </div>

          <div className="flex flex-col items-center space-y-4 rounded-xl border-1 p-4 md:p-6">
            <div className="flex items-center gap-2">
              <span className="text-leah text-xl font-semibold">
                {channel.value} {asset.ticker}
              </span>
              <CopyButton text={channel.value} />
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="text-thor-gray text-sm font-semibold break-all">{channel.address}</div>
                <CopyButton text={channel.address} />
              </div>

              <div className="text-gray border-gray rounded-full border px-1.5 text-[10px] font-semibold">
                {chainLabel(asset.chain)}
              </div>
            </div>

            <div className="size-[200px] overflow-hidden rounded-4xl bg-white p-3">
              <Image src={channel.qrCodeData} alt="QR Code" className="h-full w-full" width={200} height={200} />
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
