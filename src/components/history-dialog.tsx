'use client'

import Image from 'next/image'
import Decimal from 'decimal.js'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { ArrowRight, Globe, LoaderCircle, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DecimalText } from '@/components/decimal-text'
import { Button } from '@/components/ui/button'
import { DecimalFiat } from '@/components/decimal-fiat'
import { CopyButton } from '@/components/button-copy'
import { usePoolsRates } from '@/hooks/use-pools-rates'
import { useTransactions } from '@/hooks/use-transactions'

interface HistoryDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export const HistoryDialog = ({ isOpen, onOpenChange }: HistoryDialogProps) => {
  const { rates } = usePoolsRates()
  const { transactions, syncPending } = useTransactions()
  const [expandTx, setExpandTx] = useState<string | null>(null)

  useEffect(() => {
    const interval = setInterval(syncPending, 5000) // every 5s
    return () => clearInterval(interval)
  }, [syncPending])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl bg-lawrence p-6 text-white" showCloseButton={false}>
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold">History</DialogTitle>
          <button onClick={() => onOpenChange(false)}>
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </DialogHeader>

        <div className="mt-4">
          {transactions.map((tx, i) => {
            const details = tx.details
            const fromTx = details?.tx
            const fromAmount = BigInt(fromTx?.coins?.[0]?.amount || tx.fromAmount || 0)
            const fromValue = new Decimal(fromAmount || 0)
              .div(10 ** 8)
              .mul(tx.fromAsset?.price || rates[tx.fromAsset?.asset || ''] || 1)
              .toString()

            const outTxs = details?.out_txs || []
            const toTx = outTxs[outTxs.length - 1]
            const toAmount = BigInt(toTx?.coins?.[0]?.amount || tx.toAmount || 0)
            const toValue = new Decimal(toAmount)
              .div(10 ** 8)
              .mul(tx.toAsset?.price || rates[tx.toAsset?.asset || ''] || 1)
              .toString()

            const isExpanded = expandTx === tx.hash

            return (
              <div key={i}>
                <div
                  className="flex cursor-pointer items-center justify-between border-t py-3"
                  onClick={() => setExpandTx(isExpanded ? null : tx.hash)}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 rounded-full">
                      <Image src={`/coins/${tx.fromAsset?.metadata.symbol.toLowerCase()}.svg`} alt="" width="32" height="32" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        <DecimalText className="text-leah text-xs" amount={fromAmount} />
                      </p>
                      <p className="text-xs text-gray-400">{tx.fromAsset?.metadata.symbol}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center text-xs text-gray-400">
                    {tx.status === 'pending' ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <ArrowRight className="mb-1 h-4 w-4" />
                    )}
                    {tx.status}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        <DecimalText className="text-leah text-xs" amount={toAmount} />
                      </p>
                      <p className="text-xs text-gray-400">{tx.toAsset?.metadata?.symbol}</p>
                    </div>
                    <div className="flex h-8 w-8 rounded-full">
                      <Image src={`/coins/${tx.toAsset?.metadata.symbol.toLowerCase()}.svg`} alt="" width="32" height="32" />
                    </div>
                  </div>
                </div>
                {isExpanded && (
                  <div className="my-2 space-y-4">
                    <hr className="border-muted/40" />

                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">You Deposited</span>
                      <span className="font-medium">
                        <DecimalText amount={fromAmount} symbol={tx.fromAsset?.metadata.symbol} />
                        <span className="text-muted-foreground">
                          (<DecimalFiat amount={fromValue} />)
                        </span>
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Min. payout</span>
                      <span className="font-medium">
                        <DecimalText amount={toAmount} symbol={tx.toAsset?.metadata?.symbol} />
                        <span className="text-muted-foreground">
                          (<DecimalFiat amount={toValue} />)
                        </span>
                      </span>
                    </div>

                    <hr className="border-muted/40" />

                    {fromTx?.from_address && (
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-muted-foreground text-sm">From Address</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs">{fromTx.from_address}</span>
                          <CopyButton className="h-4 w-4 cursor-pointer" text={fromTx.from_address} />
                        </div>
                      </div>
                    )}

                    {toTx?.to_address && (
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-muted-foreground text-sm">Destination Address</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs">{toTx.to_address}</span>
                          <CopyButton className="h-4 w-4 cursor-pointer" text={toTx.to_address} />
                        </div>
                      </div>
                    )}

                    <div className="text-center">
                      <span className="text-gray text-xs">{format(tx.timestamp, 'Pp')}</span>
                    </div>
                    <hr className="border-muted/40" />

                    <div className="mb-4 flex justify-center">
                      <a href={`https://thorchain.net/tx/${tx.hash}`} rel="noopener noreferrer" target="_blank">
                        <Button variant="outline" className="gap-2 rounded-xl">
                          <Globe size={16} /> Thorscan
                        </Button>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {transactions.length < 1 && <div className="border-t py-2">No transactions yet</div>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
