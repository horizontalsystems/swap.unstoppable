'use client'

import { Fragment, useState } from 'react'
import { format, isSameDay, isToday, isYesterday } from 'date-fns'
import { Check, CircleAlert, CircleCheck, ClockFading, LoaderCircle, Undo2, X } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CopyButton } from '@/components/button-copy'
import { useTransactions } from '@/store/transaction-store'
import { useRates } from '@/hooks/use-rates'
import { cn, truncate } from '@/lib/utils'
import { AssetIcon } from '@/components/asset-icon'
import { Credenza, CredenzaContent, CredenzaHeader, CredenzaTitle } from '@/components/ui/credenza'
import { Icon } from '@/components/icons'
import { assetFromString, ChainId, ChainIdToChain, getExplorerTxUrl, SwapKitNumber } from '@swapkit/core'
import { chainLabel } from '@/components/connect-wallet/config'

interface HistoryDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export const TransactionHistoryDialog = ({ isOpen, onOpenChange }: HistoryDialogProps) => {
  const { rates } = useRates()
  const [expandTx, setExpandTx] = useState<string | null>(null)
  const transactions = useTransactions()

  let lastDate: Date | null = null

  const formatDate = (date: Date): string => {
    if (isToday(date)) {
      return 'Today'
    }
    if (isYesterday(date)) {
      return 'Yesterday'
    }
    return format(date, 'd MMMM')
  }

  const leg = (tx: any, legTx: any) => {
    const from = assetFromString(legTx.fromAsset)
    const to = assetFromString(legTx.toAsset)

    const text =
      legTx.fromAsset === legTx.toAsset
        ? legTx.fromAsset.toLowerCase() === tx.assetFrom.asset.toLowerCase()
          ? `Deposit ${from.ticker}`
          : `Send ${to.ticker}`
        : `Swap ${from.ticker} to ${to.ticker}`

    const chain = ChainIdToChain[legTx.chainId as ChainId]
    const explorerUrl = getExplorerTxUrl({ chain: chain, txHash: legTx.hash })

    return (
      <div className="text-thor-gray flex justify-between text-sm">
        <div className="flex items-center gap-2">
          {legTx.status === 'completed' ? (
            <CircleCheck className="text-liquidity-green" size={16} />
          ) : (
            <LoaderCircle className="animate-spin" size={16} />
          )}
          <span>{text}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>{chainLabel(chain)}</span>
          <Icon
            name="globe"
            className="size-5 cursor-pointer"
            onClick={() => {
              window.open(explorerUrl, '_blank')
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle className="text-leah text-base font-semibold md:text-2xl">History</CredenzaTitle>
        </CredenzaHeader>

        {transactions.length ? (
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-4 md:px-8">
              {transactions.map((tx, i) => {
                const txDate = new Date(tx.timestamp)
                const shouldRenderHeader = !lastDate || !isSameDay(txDate, lastDate)
                lastDate = txDate

                const details = tx.details
                const status = tx.status

                const amountFrom = new SwapKitNumber(tx.amountFrom)
                const rateFrom = rates[tx.assetFrom.identifier]
                const fiatFrom = rateFrom && rateFrom.mul(amountFrom)

                const amountTo = new SwapKitNumber(tx.amountTo)
                const rateTo = rates[tx.assetTo.identifier]
                const fiatTo = rateTo && rateTo.mul(amountTo)

                const isExpanded = expandTx === tx.hash

                return (
                  <Fragment key={i}>
                    {shouldRenderHeader && (
                      <div className={cn('text-andy px-4 pb-3 text-sm font-semibold', { 'pt-3': i !== 0 })}>
                        {formatDate(txDate)}
                      </div>
                    )}
                    <div
                      className={cn('border-blade mb-3 rounded-xl border-1', {
                        'mb-4 md:mb-8': i === transactions.length - 1
                      })}
                    >
                      <div
                        className="grid cursor-pointer grid-cols-3 px-4 py-3"
                        onClick={() => setExpandTx(isExpanded ? null : tx.hash)}
                      >
                        <div className="flex items-center gap-3">
                          {tx.assetFrom && <AssetIcon asset={tx.assetFrom} />}
                          <div className="flex flex-col">
                            <span className="text-leah text-base font-semibold">{amountFrom.toSignificant()}</span>
                            <span className="text-thor-gray text-sm">{tx.assetFrom?.ticker}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                          <span className="pb-2">
                            {status === 'not_started' ? (
                              <ClockFading className="text-thor-gray" size={16} />
                            ) : status === 'pending' || status === 'swapping' ? (
                              <LoaderCircle className="animate-spin" size={16} />
                            ) : status === 'completed' ? (
                              <Check className="text-liquidity-green" size={16} />
                            ) : status === 'failed' ? (
                              <X className="text-lucian" size={16} />
                            ) : status === 'refunded' ? (
                              <Undo2 className="text-thor-gray" size={16} />
                            ) : (
                              <CircleAlert className="text-thor-gray" size={16} />
                            )}
                          </span>
                          <span className="text-thor-gray text-[10px] capitalize">{status.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center justify-end gap-3">
                          <div className="flex flex-col text-right">
                            <span className="text-leah text-base font-semibold">{amountTo.toSignificant()}</span>
                            <span className="text-thor-gray text-sm">{tx.assetTo?.ticker}</span>
                          </div>
                          {tx.assetTo && <AssetIcon asset={tx.assetTo} />}
                        </div>
                      </div>
                      {isExpanded && (
                        <>
                          <div className="space-y-4 border-t p-4">
                            <div className="text-thor-gray flex justify-between text-sm">
                              <span>Deposit</span>
                              <div className="flex gap-2">
                                <span className="text-leah font-semibold">
                                  {amountFrom.toSignificant()} {tx.assetFrom?.ticker}
                                </span>
                                {fiatFrom && <span className="font-medium">({fiatFrom.toCurrency()})</span>}
                              </div>
                            </div>

                            <div className="text-thor-gray flex justify-between text-sm">
                              <span>Receive</span>
                              <div className="flex gap-2">
                                <span className="text-leah font-semibold">
                                  {amountTo.toSignificant()} {tx.assetTo?.ticker}
                                </span>
                                {fiatTo && <span className="font-medium">({fiatTo.toCurrency()})</span>}
                              </div>
                            </div>
                          </div>

                          {details && (
                            <>
                              <div className="space-y-4 border-t p-4">
                                <div className="text-thor-gray flex justify-between text-sm">
                                  <span>Source Address</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-leah font-semibold">{truncate(details.fromAddress)}</span>
                                    <CopyButton text={details.fromAddress} />
                                  </div>
                                </div>

                                <div className="text-thor-gray flex justify-between text-sm">
                                  <span>Destination Address</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-leah font-semibold">{truncate(details.toAddress)}</span>
                                    <CopyButton text={details.toAddress} />
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4 border-t p-4">
                                {details.legs.map((legTx: any, i: number) => {
                                  return <div key={i}>{legTx.status !== 'not_started' && leg(tx, legTx)}</div>
                                })}
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </Fragment>
                )
              })}
            </ScrollArea>
          </div>
        ) : (
          <div className="text-thor-gray flex flex-1 flex-col items-center justify-center gap-8">
            <Icon name="warning-filled" className="size-18" />
            <span className="text-sm font-medium">No transactions yet</span>
          </div>
        )}
      </CredenzaContent>
    </Credenza>
  )
}
