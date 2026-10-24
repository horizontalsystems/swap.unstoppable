'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { AxiosError } from 'axios'
import { assetFromString, ChainId, ChainIdToChain, getExplorerTxUrl, USwapNumber } from '@uswap/core'
import { Check, CircleAlert, CircleCheck, ClockFading, LoaderCircle, Undo2, X } from 'lucide-react'
import { CopyButton } from '@/components/button-copy'
import { chainLabel } from '@/components/connect-wallet/config'
import { DecimalText } from '@/components/decimal/decimal-text'
import { Icon } from '@/components/icons'
import { useRates } from '@/hooks/use-rates'
import { getSplitTrack, getTrack } from '@/lib/api'
import { cn, truncate } from '@/lib/utils'
import { isTxPending, isTxTerminal, TxStatus } from '@/store/transaction-store'
import { TrackLeg, TrackResponse } from '@/types'

export interface TrackParams {
  uuid?: string
  // a split swap: one deposit paid out to several destinations, tracked as a whole
  splitUuid?: string
  provider: string
  hash?: string
  chainId: string
  fromAsset: string
  fromAddress?: string
  fromAmount: string
  toAsset: string
  // a split's destinations, comma-separated, until its payout legs name them
  toAddress: string
  toAmount: string
  depositAddress?: string
  refundAddress?: string
}

// a legacy link without a uuid can't be tracked — retrying won't help
class NotTrackableError extends Error {}

// every swap is committed through the aggregator and tracked by uuid (a split by its splitUuid); legacy links
// without one can't be tracked
async function fetchTrackStatus(params: TrackParams) {
  if (!params.splitUuid && !params.uuid) throw new NotTrackableError('Swap is not trackable: missing uuid')

  try {
    return params.splitUuid
      ? await getSplitTrack({ splitUuid: params.splitUuid, inboundTxHash: params.hash })
      : await getTrack({ uuid: params.uuid!, inboundTxHash: params.hash })
  } catch (error) {
    // 404: the deposit hasn't been received yet — it can still arrive, so keep polling as a pending deposit
    if (error instanceof AxiosError && error.response?.status === 404) return { status: 'not_started', legs: [] } as TrackResponse
    throw error
  }
}

// a split's destinations, one per output in output order (outputs may share an address): each payout leg names its
// own once observed, the link carries them before
function splitDestinations(legs: TrackLeg[] | undefined, linked: string): { index: number; address: string }[] {
  const destinations = linked ? linked.split(',') : []
  for (const leg of legs ?? []) {
    const index = leg.meta?.outputIndex
    if (index != null && !leg.meta?.refund && leg.toAddress) destinations[index] = leg.toAddress
  }
  return destinations.map((address, index) => ({ index, address })).filter(d => d.address)
}

export function TrackStatus({ params }: { params: TrackParams }) {
  const t = useTranslations('tx')
  const tc = useTranslations('common')
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['track', params],
    queryFn: () => fetchTrackStatus(params),
    retry: (failureCount, error) => !(error instanceof NotTrackableError) && failureCount < 3,
    refetchInterval: query => {
      if (query.state.error instanceof NotTrackableError) return false
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
  // a split with several outputs lists one destination row per output, numbered like its legs below
  const destinations = params.splitUuid ? splitDestinations(data?.legs, params.toAddress) : []
  const toAddress = destinations.length > 1 ? undefined : data?.toAddress || destinations[0]?.address || params.toAddress
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
  const notFound = error instanceof NotTrackableError
  const loading = (isPending || isError) && !notFound

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
          <span className="pb-2">
            {loading ? (
              <LoaderCircle className="animate-spin" size={16} />
            ) : notFound ? (
              <CircleAlert className="text-lucian" size={16} />
            ) : (
              <StatusIcon status={status} />
            )}
          </span>
          <span
            className={cn('text-thor-gray text-[10px] font-semibold capitalize', {
              'text-lucian': notFound || (!loading && (status === 'expired' || status === 'failed'))
            })}
          >
            {loading ? t('loading') : notFound ? t('notFound') : statusTitle}
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

      {(fromAddress || toAddress || destinations.length > 1 || depositAddress || refundAddress) && (
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
          {destinations.length > 1 &&
            destinations.map(({ index, address }) => (
              <div key={index} className="text-thor-gray flex items-center justify-between">
                <span>
                  {tc('address.destination')} #{index + 1}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-leah">{truncate(address)}</span>
                  <CopyButton text={address} />
                </div>
              </div>
            ))}
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
  if (status === 'signed' || status === 'pending' || status === 'swapping') return <LoaderCircle className="animate-spin" size={16} />
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
  // a split output's own legs carry its position: number them like the destinations above
  const output = leg.meta?.outputIndex != null ? ` #${leg.meta.outputIndex + 1}` : ''

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
        <span>
          {text}
          {output}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span>{chainLabel(chain)}</span>
        {explorerUrl && <Icon name="globe" className="size-5 cursor-pointer" onClick={() => window.open(explorerUrl, '_blank')} />}
      </div>
    </div>
  )
}
