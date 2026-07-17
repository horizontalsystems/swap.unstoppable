'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { assetFromString, ChainId, ChainIdToChain, getExplorerTxUrl, USwapNumber } from '@uswap/core'
import { Check, CircleAlert, CircleCheck, ClockFading, LoaderCircle, Undo2, X } from 'lucide-react'
import { CopyButton } from '@/components/button-copy'
import { chainLabel } from '@/components/connect-wallet/config'
import { DecimalText } from '@/components/decimal/decimal-text'
import { Icon } from '@/components/icons'
import { useRates } from '@/hooks/use-rates'
import { getTrack, getTrackEvm, getTrackThorchain } from '@/lib/api'
import { cn, truncate } from '@/lib/utils'
import { isTxPending, isTxTerminal, TxStatus } from '@/store/transaction-store'

export interface TrackParams {
  uuid?: string
  provider: string
  hash?: string
  chainId: string
  fromAsset: string
  fromAddress?: string
  fromAmount: string
  toAsset: string
  toAddress: string
  toAmount: string
  depositAddress?: string
  refundAddress?: string
}

// tracks by uuid; legacy links without one fall back to the stateless on-chain trackers
function fetchTrackStatus(params: TrackParams) {
  if (params.uuid) {
    return getTrack({ uuid: params.uuid, inboundTxHash: params.hash })
  }

  if (params.provider === 'THORCHAIN' || params.provider === 'MAYACHAIN') {
    return getTrackThorchain({
      provider: params.provider,
      fromAsset: params.fromAsset,
      toAsset: params.toAsset,
      toAddress: params.toAddress,
      inboundTxHash: params.hash,
      depositAddress: params.depositAddress,
      chainId: params.chainId || undefined,
      fromAmount: params.fromAmount || undefined,
      toAmount: params.toAmount || undefined,
      fromAddress: params.fromAddress
    })
  }

  if (params.provider === 'ONEINCH' || params.provider === 'BARTER') {
    return getTrackEvm({
      provider: params.provider,
      hash: params.hash,
      chainId: params.chainId,
      fromAsset: params.fromAsset,
      toAsset: params.toAsset,
      toAddress: params.toAddress
    })
  }

  throw new Error('Swap is not trackable: missing uuid')
}

export function TrackStatus({ params }: { params: TrackParams }) {
  const t = useTranslations('tx')
  const tc = useTranslations('common')
  const { data, isPending, isError } = useQuery({
    queryKey: ['track', params],
    queryFn: () => fetchTrackStatus(params),
    refetchInterval: query => {
      const status: TxStatus | undefined = query.state.data?.status
      if (!status) return 10_000
      if (isTxPending(status) || (!query.state.data && !isTxTerminal(status))) return 10_000
      return false
    },
    refetchIntervalInBackground: false
  })

  const fromAssetId = data?.fromAsset || params.fromAsset
  const toAssetId = data?.toAsset || params.toAsset
  const fromAmountStr = data?.fromAmount || params.fromAmount
  const toAmountStr = data?.toAmount || params.toAmount
  const fromAddress = data?.fromAddress || params.fromAddress
  const toAddress = data?.toAddress || params.toAddress
  const depositAddress = params.depositAddress
  const refundAddress = params.refundAddress

  const assetFrom = fromAssetId ? assetFromString(fromAssetId) : null
  const assetTo = toAssetId ? assetFromString(toAssetId) : null
  const amountFrom = fromAmountStr ? new USwapNumber(fromAmountStr) : null
  const amountTo = toAmountStr ? new USwapNumber(toAmountStr) : null

  const { rates } = useRates([fromAssetId, toAssetId].filter(Boolean))
  const rateFrom = fromAssetId ? rates[fromAssetId] : undefined
  const fiatFrom = rateFrom && amountFrom && rateFrom.mul(amountFrom)
  const rateTo = toAssetId ? rates[toAssetId] : undefined
  const fiatTo = rateTo && amountTo && rateTo.mul(amountTo)

  const status: TxStatus = data?.status ?? 'unknown'
  const statusTitle = t(`status.${status}`)

  return (
    <div className="bg-blade/25 rounded-xl border">
      <div className="flex px-4 py-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-leah text-sm font-semibold">
              {amountFrom && assetFrom && <DecimalText className="break-all" amount={amountFrom.toSignificant()} symbol={assetFrom.ticker} />}
            </span>
            {fiatFrom && <span className="text-thor-gray text-xs font-medium">{fiatFrom.toCurrency()}</span>}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center px-1">
          <span className="pb-2">{isPending || isError ? <LoaderCircle className="animate-spin" size={16} /> : <StatusIcon status={status} />}</span>
          <span
            className={cn('text-thor-gray text-[10px] font-semibold capitalize', {
              'text-lucian': !isPending && !isError && (status === 'expired' || status === 'failed')
            })}
          >
            {isPending || isError ? t('loading') : statusTitle}
          </span>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="flex flex-col gap-1 text-right">
            <span className="text-leah text-sm font-semibold">
              {amountTo && assetTo && <DecimalText className="break-all" amount={amountTo.toSignificant()} symbol={assetTo.ticker} />}
            </span>
            {fiatTo && <span className="text-thor-gray text-xs font-medium">{fiatTo.toCurrency()}</span>}
          </div>
        </div>
      </div>

      {(fromAddress || toAddress || depositAddress || refundAddress) && (
        <div className="space-y-3 border-t px-4 py-4 text-xs font-semibold">
          {fromAddress && (
            <div className="text-thor-gray flex items-center justify-between">
              <span>{tc('address.source')}</span>
              <div className="flex items-center gap-2">
                <span className="text-leah">{truncate(fromAddress)}</span>
                <CopyButton text={fromAddress} />
              </div>
            </div>
          )}
          {toAddress && (
            <div className="text-thor-gray flex items-center justify-between">
              <span>{tc('address.destination')}</span>
              <div className="flex items-center gap-2">
                <span className="text-leah">{truncate(toAddress)}</span>
                <CopyButton text={toAddress} />
              </div>
            </div>
          )}
          {depositAddress && (
            <div className="text-thor-gray flex items-center justify-between">
              <span>{tc('address.deposit')}</span>
              <div className="flex items-center gap-2">
                <span className="text-leah">{truncate(depositAddress)}</span>
                <CopyButton text={depositAddress} />
              </div>
            </div>
          )}
          {refundAddress && (
            <div className="text-thor-gray flex items-center justify-between">
              <span>{tc('address.refund')}</span>
              <div className="flex items-center gap-2">
                <span className="text-leah">{truncate(refundAddress)}</span>
                <CopyButton text={refundAddress} />
              </div>
            </div>
          )}
        </div>
      )}

      {!isPending && !isError && !!data?.legs?.length && (
        <div className="space-y-4 border-t px-4 py-4">
          {data.legs!.map((leg: any, i: number) => (
            <LegRow key={i} leg={leg} txFromAsset={fromAssetId} />
          ))}
        </div>
      )}
    </div>
  )
}

function StatusIcon({ status }: { status: TxStatus }) {
  if (status === 'not_started') return <ClockFading className="text-thor-gray" size={16} />
  if (status === 'pending' || status === 'swapping') return <LoaderCircle className="animate-spin" size={16} />
  if (status === 'action_required') return <CircleAlert className="text-jacob" size={16} />
  if (status === 'completed') return <Check className="text-brand-first" size={16} />
  if (status === 'failed') return <X className="text-lucian" size={16} />
  if (status === 'expired') return <ClockFading className="text-lucian" size={16} />
  if (status === 'refunded') return <Undo2 className="text-thor-gray" size={16} />
  return <CircleAlert className="text-thor-gray" size={16} />
}

function LegRow({ leg, txFromAsset }: { leg: any; txFromAsset: string }) {
  const t = useTranslations('tx')
  const from = assetFromString(leg.fromAsset)
  const to = assetFromString(leg.toAsset)

  const text =
    leg.fromAsset === leg.toAsset
      ? leg.fromAsset.toLowerCase() === txFromAsset.toLowerCase()
        ? t('leg.deposit', { ticker: from.ticker ?? '' })
        : t('leg.send', { ticker: to.ticker ?? '' })
      : t('leg.swap', { from: from.ticker ?? '', to: to.ticker ?? '' })

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
