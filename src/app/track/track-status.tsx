'use client'

import { useQuery } from '@tanstack/react-query'
import { assetFromString, ChainId, ChainIdToChain, getExplorerTxUrl } from '@uswap/core'
import { Check, CircleAlert, CircleCheck, ClockFading, LoaderCircle, Undo2, X } from 'lucide-react'
import { CopyButton } from '@/components/button-copy'
import { chainLabel } from '@/components/connect-wallet/config'
import { Icon } from '@/components/icons'
import { getTrack } from '@/lib/api'
import { cn, truncate } from '@/lib/utils'
import { isTxPending, isTxTerminal, TxStatus } from '@/store/transaction-store'

export interface TrackParams {
  provider: string
  providerSwapId?: string
  hash?: string
  chainId: string
  fromAsset: string
  fromAddress?: string
  fromAmount: string
  toAsset: string
  toAddress: string
  toAmount: string
  depositAddress?: string
}

export function TrackStatus({ params }: { params: TrackParams }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['track', params],
    queryFn: () => getTrack(params),
    refetchInterval: query => {
      const status: TxStatus = query.state.data?.status
      if (!status) return 10_000
      if (isTxPending(status) || (!query.state.data && !isTxTerminal(status))) return 10_000
      return false
    },
    refetchIntervalInBackground: false
  })

  if (isPending) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <LoaderCircle className="text-brand-first animate-spin" size={32} />
        <span className="text-thor-gray text-sm font-semibold">Loading transaction status…</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <CircleAlert className="text-lucian" size={32} />
        <span className="text-thor-gray text-sm font-semibold">Failed to load transaction status</span>
      </div>
    )
  }

  const status: TxStatus = data?.status ?? 'unknown'

  let statusTitle = status.replace('_', ' ')
  if (status === 'not_started') statusTitle = 'Deposit Pending'

  return (
    <div className="bg-blade/25 rounded-xl border">
      <div className="flex items-center justify-between border-b px-4 py-4">
        <span className="text-leah text-sm font-semibold">Transaction Status</span>
        <div className="flex items-center gap-2">
          <StatusIcon status={status} />
          <span
            className={cn('text-thor-gray text-sm font-semibold capitalize', {
              'text-lucian': status === 'expired' || status === 'failed'
            })}
          >
            {statusTitle}
          </span>
        </div>
      </div>

      {(data?.fromAddress || data?.toAddress) && (
        <div className="space-y-3 border-b px-4 py-4 text-xs font-semibold">
          {data.fromAddress && (
            <div className="text-thor-gray flex items-center justify-between">
              <span>Source Address</span>
              <div className="flex items-center gap-2">
                <span className="text-leah">{truncate(data.fromAddress)}</span>
                <CopyButton text={data.fromAddress} />
              </div>
            </div>
          )}
          {data.toAddress && (
            <div className="text-thor-gray flex items-center justify-between">
              <span>Destination Address</span>
              <div className="flex items-center gap-2">
                <span className="text-leah">{truncate(data.toAddress)}</span>
                <CopyButton text={data.toAddress} />
              </div>
            </div>
          )}
        </div>
      )}

      {data?.legs?.length > 0 && (
        <div className="space-y-4 px-4 py-4">
          {data.legs.map((leg: any, i: number) => (
            <LegRow key={i} leg={leg} txFromAsset={params.fromAsset} />
          ))}
        </div>
      )}
    </div>
  )
}

function StatusIcon({ status }: { status: TxStatus }) {
  if (status === 'not_started') return <ClockFading className="text-thor-gray" size={16} />
  if (status === 'pending' || status === 'swapping') return <LoaderCircle className="animate-spin" size={16} />
  if (status === 'completed') return <Check className="text-brand-first" size={16} />
  if (status === 'failed') return <X className="text-lucian" size={16} />
  if (status === 'expired') return <ClockFading className="text-lucian" size={16} />
  if (status === 'refunded') return <Undo2 className="text-thor-gray" size={16} />
  return <CircleAlert className="text-thor-gray" size={16} />
}

function LegRow({ leg, txFromAsset }: { leg: any; txFromAsset: string }) {
  const from = assetFromString(leg.fromAsset)
  const to = assetFromString(leg.toAsset)

  const text =
    leg.fromAsset === leg.toAsset
      ? leg.fromAsset.toLowerCase() === txFromAsset.toLowerCase()
        ? `Deposit ${from.ticker}`
        : `Send ${to.ticker}`
      : `Swap ${from.ticker} to ${to.ticker}`

  const chain = ChainIdToChain[leg.chainId as ChainId]
  const explorerUrl = leg.hash && getExplorerTxUrl({ chain, txHash: leg.hash })

  return (
    <div className="text-thor-gray flex justify-between text-xs font-semibold">
      <div className="flex items-center gap-2">
        {leg.status === 'completed' ? (
          <CircleCheck className="text-brand-first" size={16} />
        ) : leg.status === 'not_started' ? (
          <ClockFading size={16} />
        ) : (
          <LoaderCircle className="animate-spin" size={16} />
        )}
        <span>{text}</span>
      </div>
      <div className="flex items-center gap-2">
        <span>{chainLabel(chain)}</span>
        {explorerUrl && <Icon name="globe" className="size-5 cursor-pointer" onClick={() => window.open(explorerUrl, '_blank')} />}
      </div>
    </div>
  )
}
