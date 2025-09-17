'use client'

import Image from 'next/image'
import Decimal from 'decimal.js'
import { Fragment, useState } from 'react'
import { format, isSameDay, isToday, isYesterday } from 'date-fns'
import { Check, CircleCheck, Globe, LoaderCircle, X } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DecimalText } from '@/components/decimal/decimal-text'
import { DecimalFiat } from '@/components/decimal/decimal-fiat'
import { CopyButton } from '@/components/button-copy'
import { useTransactions } from '@/store/transaction-store'
import { useRates } from '@/hooks/use-rates'
import { cn, truncate } from '@/lib/utils'

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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-lawrence flex h-full max-h-2/3 max-w-md flex-col overflow-hidden rounded-3xl border-0 p-6"
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-row items-center justify-between px-6">
          <DialogTitle className="text-lg font-semibold">History</DialogTitle>
          <DialogDescription />
          <button onClick={() => onOpenChange(false)}>
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </DialogHeader>

        {transactions.length < 1 && <div className="px-6 py-2">No transactions yet</div>}

        <ScrollArea className="h-full max-h-[40vh] px-6 md:max-h-[60vh]">
          {transactions.map((tx, i) => {
            const txDate = new Date(tx.timestamp)
            const shouldRenderHeader = !lastDate || !isSameDay(txDate, lastDate)
            lastDate = txDate

            const details = tx.details
            const fromTx = details?.tx
            const fromAmount = BigInt(fromTx?.coins?.[0]?.amount || tx.fromAmount || 0)
            const fromValue = new Decimal(fromAmount || 0)
              .div(10 ** 8)
              .mul(rates[tx.fromAsset?.asset || ''] || 1)
              .toString()

            const outTxs = details?.out_txs || []
            const toTx = outTxs[outTxs.length - 1]
            const toAmount = BigInt(toTx?.coins?.[0]?.amount || tx.toAmount || 0)
            const toValue = new Decimal(toAmount)
              .div(10 ** 8)
              .mul(rates[tx.toAsset?.asset || ''] || 1)
              .toString()

            const stages = details?.stages
            const inCompleted = stages?.inbound_finalised?.completed
            const swapCompleted = stages?.swap_finalised?.completed
            const outCompleted = stages?.outbound_signed?.completed

            const isExpanded = expandTx === tx.hash
            const loadingCircle = <LoaderCircle className="animate-spin" size={16} />

            return (
              <Fragment key={i}>
                {shouldRenderHeader && (
                  <div className="text-andy mt-6 border-b px-4 pb-3 font-semibold">{formatDate(txDate)}</div>
                )}
                <div className={cn('px-4', { 'border-b': i !== transactions.length - 1, 'bg-blade': isExpanded })}>
                  <div className="grid grid-cols-3 py-3" onClick={() => setExpandTx(isExpanded ? null : tx.hash)}>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 rounded-full">
                        <Image
                          src={`/coins/${tx.fromAsset?.metadata.symbol.toLowerCase()}.svg`}
                          alt=""
                          width="32"
                          height="32"
                        />
                      </div>
                      <div className="flex flex-col">
                        <DecimalText className="text-leah font-base font-medium" amount={fromAmount} />
                        <span className="text-gray text-sm">{tx.fromAsset?.metadata.symbol}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="p-2">
                        {tx.status === 'failed' ? (
                          <X className="text-lucian" size={16} />
                        ) : tx.status === 'completed' ? (
                          <Check className="text-liquidity-green" size={16} />
                        ) : (
                          loadingCircle
                        )}
                      </span>
                      <span className="text-gray text-xs">{tx.status}</span>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <div className="flex flex-col text-right">
                        <DecimalText className="text-leah text-base font-medium" amount={toAmount} />
                        <span className="text-gray text-sm">{tx.toAsset?.metadata?.symbol}</span>
                      </div>
                      <div className="flex h-8 w-8 rounded-full">
                        <Image
                          src={`/coins/${tx.toAsset?.metadata.symbol.toLowerCase()}.svg`}
                          alt=""
                          width="32"
                          height="32"
                        />
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="bg-blade my-2 space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray text-sm">You Deposited</span>
                        <span className="font-medium">
                          <DecimalText amount={fromAmount} symbol={tx.fromAsset?.metadata.symbol} />
                          <span className="text-gray">
                            (<DecimalFiat amount={fromValue} />)
                          </span>
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray text-sm">Min. payout</span>
                        <span className="font-medium">
                          <DecimalText amount={toAmount} symbol={tx.toAsset?.metadata?.symbol} />
                          <span className="text-gray">
                            (<DecimalFiat amount={toValue} />)
                          </span>
                        </span>
                      </div>

                      <hr className="border-lawrence" />

                      {fromTx?.from_address && (
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-gray text-sm">Source Address</span>
                          <div className="flex items-center gap-1">
                            <span className="text-leah text-xs">{truncate(fromTx.from_address)}</span>
                            <CopyButton className="h-4 w-4 cursor-pointer" text={fromTx.from_address} />
                          </div>
                        </div>
                      )}

                      {toTx?.to_address && (
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-gray text-sm">Destination Address</span>
                          <div className="flex items-center gap-1">
                            <span className="text-leah text-xs">{truncate(toTx.to_address)}</span>
                            <CopyButton className="h-4 w-4 cursor-pointer" text={toTx.to_address} />
                          </div>
                        </div>
                      )}

                      <hr className="border-lawrence" />

                      <div className="text-gray space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          {inCompleted ? <CircleCheck className="text-liquidity-green" size="16" /> : loadingCircle}
                          <div className="">
                            {tx.fromAsset?.metadata.symbol} {inCompleted ? 'Deposited' : 'Depositing'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {swapCompleted ? <CircleCheck className="text-liquidity-green" size="16" /> : loadingCircle}
                          <div className="">
                            Swap {tx.fromAsset?.metadata.symbol} to {tx.toAsset?.metadata.symbol}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {outCompleted ? <CircleCheck className="text-liquidity-green" size="16" /> : loadingCircle}
                          <div className="">
                            {outCompleted ? 'Sent' : 'Sending'} {tx.toAsset?.metadata.symbol}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end pb-3">
                        <a
                          href={`https://thorchain.net/tx/${tx.hash}`}
                          rel="noopener noreferrer"
                          target="_blank"
                          className="flex items-center gap-1 text-xs"
                        >
                          <Globe size={16} /> THORCHain.net
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                {i === transactions.length - 1 && <div className="mb-6">&nbsp;</div>}
              </Fragment>
            )
          })}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
