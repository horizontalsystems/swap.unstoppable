'use client'

import Decimal from 'decimal.js'
import { Fragment, useState } from 'react'
import { format, isSameDay, isToday, isYesterday } from 'date-fns'
import { Check, CircleCheck, Globe, LoaderCircle, X } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DecimalText } from '@/components/decimal/decimal-text'
import { DecimalFiat } from '@/components/decimal/decimal-fiat'
import { CopyButton } from '@/components/button-copy'
import { useTransactions } from '@/store/transaction-store'
import { useRates } from '@/hooks/use-rates'
import { cn, truncate } from '@/lib/utils'
import { AssetIcon } from '@/components/asset-icon'
import { Credenza, CredenzaContent, CredenzaHeader, CredenzaTitle } from '@/components/ui/credenza'
import { Icon } from '@/components/icons'
import { ThemeButton } from '@/components/theme-button'

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
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent className="bg-lawrence h-5/6 max-w-xl gap-10 overflow-hidden rounded-4xl border-0 p-0">
        <CredenzaHeader className="p-12 pb-0">
          <CredenzaTitle className="text-leah text-base font-semibold md:text-2xl">History</CredenzaTitle>
        </CredenzaHeader>

        {transactions.length ? (
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-12">
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
                      <div className={cn('text-andy px-4 pb-3 text-sm font-semibold', { 'pt-3': i !== 0 })}>
                        {formatDate(txDate)}
                      </div>
                    )}
                    <div className="border-blade mb-3 rounded-xl border-1">
                      <div
                        className="grid cursor-pointer grid-cols-3 px-4 py-3"
                        onClick={() => setExpandTx(isExpanded ? null : tx.hash)}
                      >
                        <div className="flex items-center gap-3">
                          {tx.fromAsset && <AssetIcon asset={tx.fromAsset} />}
                          <div className="flex flex-col">
                            <DecimalText className="text-leah font-base font-semibold" amount={fromAmount} />
                            <span className="text-thor-gray text-sm">{tx.fromAsset?.metadata.symbol}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                          <span className="pb-2">
                            {tx.status === 'failed' ? (
                              <X className="text-lucian" size={16} />
                            ) : tx.status === 'completed' ? (
                              <Check className="text-liquidity-green" size={16} />
                            ) : (
                              loadingCircle
                            )}
                          </span>
                          <span className="text-thor-gray text-[10px]">{tx.status}</span>
                        </div>
                        <div className="flex items-center justify-end gap-3">
                          <div className="flex flex-col text-right">
                            <DecimalText className="text-leah text-base font-semibold" amount={toAmount} />
                            <span className="text-thor-gray text-sm">{tx.toAsset?.metadata?.symbol}</span>
                          </div>
                          {tx.toAsset && <AssetIcon asset={tx.toAsset} />}
                        </div>
                      </div>
                      {isExpanded && (
                        <>
                          <div className="space-y-4 border-t p-4">
                            <div className="text-thor-gray flex justify-between text-sm">
                              <span>You Deposited</span>
                              <div className="flex gap-2">
                                <DecimalText
                                  className="text-leah font-semibold"
                                  amount={fromAmount}
                                  symbol={tx.fromAsset?.metadata.symbol}
                                />
                                <span>
                                  (<DecimalFiat amount={fromValue} />)
                                </span>
                              </div>
                            </div>

                            <div className="text-thor-gray flex justify-between text-sm">
                              <span>Min. payout</span>
                              <div className="flex gap-2">
                                <DecimalText
                                  className="text-leah font-semibold"
                                  amount={toAmount}
                                  symbol={tx.toAsset?.metadata?.symbol}
                                />
                                <span>
                                  (<DecimalFiat amount={toValue} />)
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4 border-t p-4">
                            {fromTx?.from_address && (
                              <div className="text-thor-gray flex justify-between text-sm">
                                <span>Source Address</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-leah font-semibold">{truncate(fromTx.from_address)}</span>
                                  <CopyButton className="h-4 w-4 cursor-pointer" text={fromTx.from_address} />
                                </div>
                              </div>
                            )}

                            {toTx?.to_address && (
                              <div className="text-thor-gray flex justify-between text-sm">
                                <span>Destination Address</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-leah font-semibold">{truncate(toTx.to_address)}</span>
                                  <CopyButton className="h-4 w-4 cursor-pointer" text={toTx.to_address} />
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-4 border-t p-4">
                            <div className="text-thor-gray flex justify-between text-sm">
                              <div className="flex items-center gap-2">
                                {inCompleted ? (
                                  <CircleCheck className="text-liquidity-green" size="16" />
                                ) : (
                                  loadingCircle
                                )}
                                <div className="">
                                  {tx.fromAsset?.metadata.symbol} {inCompleted ? 'Deposited' : 'Depositing'}
                                </div>
                              </div>
                              {/*todo: who time*/}
                            </div>

                            <div className="text-thor-gray flex justify-between text-sm">
                              <div className="flex items-center gap-2">
                                {swapCompleted ? (
                                  <CircleCheck className="text-liquidity-green" size="16" />
                                ) : (
                                  loadingCircle
                                )}
                                <div className="">
                                  Swap {tx.fromAsset?.metadata.symbol} to {tx.toAsset?.metadata.symbol}
                                </div>
                              </div>
                              {/*todo: who time*/}
                            </div>

                            <div className="text-thor-gray flex justify-between text-sm">
                              <div className="flex items-center gap-2">
                                {outCompleted ? (
                                  <CircleCheck className="text-liquidity-green" size="16" />
                                ) : (
                                  loadingCircle
                                )}
                                <div className="">
                                  {outCompleted ? 'Sent' : 'Sending'} {tx.toAsset?.metadata.symbol}
                                </div>
                              </div>
                              {/*todo: who time*/}
                            </div>
                          </div>

                          <div className="flex items-center justify-end px-4 py-3">
                            <ThemeButton
                              variant="secondarySmall"
                              onClick={() => {
                                window.open(`https://thorchain.net/tx/${tx.hash}`, '_blank')
                              }}
                            >
                              <Globe size={16} /> THORCHain.net
                            </ThemeButton>
                          </div>
                        </>
                      )}
                    </div>
                    {i === transactions.length - 1 && <div className="mb-6">&nbsp;</div>}
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
