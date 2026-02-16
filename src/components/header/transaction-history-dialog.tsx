'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { assetFromString, ChainId, ChainIdToChain, getExplorerTxUrl, USwapNumber } from '@uswap/core'
import { format, formatDuration, intervalToDuration, isSameDay, isToday, isYesterday } from 'date-fns'
import { Check, CircleAlert, CircleCheck, ClockFading, LoaderCircle, Undo2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Credenza, CredenzaContent, CredenzaHeader, CredenzaTitle } from '@/components/ui/credenza'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AssetIcon } from '@/components/asset-icon'
import { CopyButton } from '@/components/button-copy'
import { chainLabel } from '@/components/connect-wallet/config'
import { DecimalText } from '@/components/decimal/decimal-text'
import { useDialog } from '@/components/global-dialog'
import { Icon } from '@/components/icons'
import { InstantSwapChannelDialog } from '@/components/swap/instant-swap-channel-dialog'
import { DepositChannel } from '@/components/swap/instant-swap-dialog'
import { SwapLimitCancel } from '@/components/swap/swap-limit-cancel'
import { ThemeButton } from '@/components/theme-button'
import { useRates } from '@/hooks/use-rates'
import { useSyncTransactions } from '@/hooks/use-sync-transactions'
import { useSelectedAccount } from '@/hooks/use-wallets'
import { formatExpiration } from '@/lib/swap-helpers'
import { cn, truncate } from '@/lib/utils'
import { isTxPending, Transaction, useTransactions } from '@/store/transaction-store'
import { ProviderName } from '@/types'

interface HistoryDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export const TransactionHistoryDialog = ({ isOpen, onOpenChange }: HistoryDialogProps) => {
  const transactions = useTransactions()
  const selectedAccount = useSelectedAccount()
  const [expandTx, setExpandTx] = useState<string | null>(null)
  const { openDialog } = useDialog()

  const identifiers = useMemo(() => transactions.flatMap(t => [t.assetFrom.identifier, t.assetTo.identifier]), [transactions])

  const { rates } = useRates(identifiers)

  useSyncTransactions()

  let lastDate: Date | null = null

  const now = new Date()
  const formatDate = (date: Date): string => {
    if (isToday(date)) {
      return 'Today'
    }
    if (isYesterday(date)) {
      return 'Yesterday'
    }
    return format(date, 'd MMMM')
  }

  const onLimitModify = (mode: 'cancel' | 'modify', tx: Transaction) => {
    if (selectedAccount?.network !== tx.assetFrom.chain) {
      return toast.error('Only the original swap creator can modify')
    }

    openDialog(SwapLimitCancel, {
      mode,
      transaction: {
        assetFrom: tx.assetFrom,
        assetTo: tx.assetTo,
        amountFrom: tx.amountFrom,
        amountTo: tx.amountTo,
        addressFrom: tx.addressFrom,
        limitSwapMemo: tx.limitSwapMemo
      }
    })
  }

  return (
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent className="flex h-auto max-h-5/6 flex-col md:max-w-xl">
        <CredenzaHeader>
          <CredenzaTitle className="text-leah text-base font-semibold md:text-2xl">History</CredenzaTitle>
        </CredenzaHeader>

        <ScrollArea className="flex min-h-0 flex-1 px-4 md:px-8" classNameViewport="flex-1 h-auto">
          <div className="pb-4">
            {transactions.map((tx, i) => {
              const txDate = new Date(tx.timestamp)
              const shouldRenderHeader = !lastDate || !isSameDay(txDate, lastDate)
              lastDate = txDate

              const details = tx.details
              const status = tx.status

              const amountFrom = new USwapNumber(tx.amountFrom)
              const rateFrom = rates[tx.assetFrom.identifier]
              const fiatFrom = rateFrom && rateFrom.mul(amountFrom)

              const amountTo = new USwapNumber(tx.amountTo)
              const rateTo = rates[tx.assetTo.identifier]
              const fiatTo = rateTo && rateTo.mul(amountTo)

              const isExpanded = expandTx === tx.uid

              let statusTitle = status.replace('_', ' ')
              if (status === 'not_started') {
                statusTitle = 'Deposit Pending'
              }

              const showRemainingTime = statusTitle === 'pending' && tx.estimatedTime
              const showQrCode = () => {
                if (!tx.qrCodeData || !tx.addressDeposit) return

                const channel: DepositChannel = {
                  qrCodeData: tx.qrCodeData,
                  address: tx.addressDeposit,
                  value: tx.amountFrom,
                  expiration: tx.expiration
                }

                openDialog(InstantSwapChannelDialog, { assetFrom: tx.assetFrom, assetTo: tx.assetTo, channel: channel })
              }

              const showRQ = !tx.hash && status !== 'expired'
              const showLimitSwapActions = selectedAccount && tx.limitSwapMemo && isTxPending(status)

              return (
                <Fragment key={i}>
                  {shouldRenderHeader && (
                    <div className={cn('text-andy px-4 pb-3 text-sm font-semibold', { 'pt-3': i !== 0 })}>{formatDate(txDate)}</div>
                  )}
                  <div className="bg-blade/25 mb-3 rounded-xl border">
                    <div className="flex cursor-pointer px-4 py-3" onClick={() => setExpandTx(isExpanded ? null : tx.uid)}>
                      <div className="flex flex-1 items-center gap-3">
                        {tx.assetFrom && <AssetIcon asset={tx.assetFrom} />}
                        <div className="flex flex-col gap-1">
                          <span className="text-leah text-sm font-semibold">
                            <DecimalText className="break-all" amount={amountFrom.toSignificant()} symbol={tx.assetFrom?.ticker} />
                          </span>
                          <span className="text-thor-gray text-xs font-medium">{fiatFrom?.toCurrency()}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center px-1">
                        <span className="pb-2">
                          {status === 'not_started' ? (
                            <ClockFading className="text-thor-gray" size={16} />
                          ) : status === 'pending' || status === 'swapping' ? (
                            <LoaderCircle className="animate-spin" size={16} />
                          ) : status === 'completed' ? (
                            <Check className="text-brand-first" size={16} />
                          ) : status === 'failed' ? (
                            <X className="text-lucian" size={16} />
                          ) : status === 'expired' ? (
                            <ClockFading className="text-lucian" size={16} />
                          ) : status === 'refunded' ? (
                            <Undo2 className="text-thor-gray" size={16} />
                          ) : (
                            <CircleAlert className="text-thor-gray" size={16} />
                          )}
                        </span>
                        <span
                          className={cn('text-thor-gray text-[10px] font-semibold', {
                            'text-lucian': status === 'expired',
                            capitalize: !showRemainingTime
                          })}
                        >
                          {showRemainingTime ? (
                            <RemainingTime startTime={txDate.getTime()} estimatedTime={tx.estimatedTime!} fallback={statusTitle} />
                          ) : (
                            statusTitle
                          )}
                        </span>
                      </div>
                      <div className="flex flex-1 items-center justify-end gap-3">
                        <div className="flex flex-col gap-1 text-right">
                          <span className="text-leah text-sm font-semibold">
                            <DecimalText className="break-all" amount={amountTo.toSignificant()} symbol={tx.assetTo?.ticker} />
                          </span>
                          <span className="text-thor-gray text-xs font-medium">{fiatTo?.toCurrency()}</span>
                        </div>
                        {tx.assetTo && <AssetIcon asset={tx.assetTo} />}
                      </div>
                    </div>

                    {(showLimitSwapActions || showRQ) && (
                      <div className="flex items-center justify-end border-t py-1">
                        {showRQ && (
                          <div className="flex items-center justify-end py-1 pl-4">
                            <div className="text-thor-gray text-xs font-semibold">
                              {tx.expiration && (
                                <span>
                                  Expires in &nbsp;
                                  {formatDuration(
                                    intervalToDuration({
                                      start: now.getTime(),
                                      end: tx.expiration * 1000
                                    }),
                                    { format: ['hours', 'minutes'], zero: false }
                                  )}
                                </span>
                              )}
                            </div>
                            <ThemeButton variant="primarySmallTransparent" onClick={showQrCode}>
                              Show QR
                            </ThemeButton>
                          </div>
                        )}
                        {showLimitSwapActions && (
                          <ThemeButton className="rounded-none" variant="primarySmallTransparent" onClick={() => onLimitModify('modify', tx)}>
                            Modify
                          </ThemeButton>
                        )}
                        {showLimitSwapActions && (
                          <ThemeButton className="rounded-none" variant="primarySmallTransparent" onClick={() => onLimitModify('cancel', tx)}>
                            Cancel Order
                          </ThemeButton>
                        )}
                      </div>
                    )}

                    {isExpanded && details && (
                      <>
                        <div className="space-y-4 border-t p-4 text-xs font-semibold">
                          {details.fromAddress && (
                            <div className="text-thor-gray flex items-center justify-between">
                              <span>Source Address</span>
                              <div className="flex items-center gap-2">
                                <span className="text-leah">{truncate(details.fromAddress)}</span>
                                <CopyButton text={details.fromAddress} />
                              </div>
                            </div>
                          )}

                          <div className="text-thor-gray flex items-center justify-between">
                            <span>Destination Address</span>
                            <div className="flex items-center gap-2">
                              <span className="text-leah">{truncate(details.toAddress)}</span>
                              <CopyButton text={details.toAddress} />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4 border-t p-4 text-xs font-semibold">
                          {details.legs.map((legTx: any, i: number) => {
                            return <div key={i}>{renderLeg(tx, legTx)}</div>
                          })}
                        </div>
                      </>
                    )}
                    {isExpanded && tx.provider === ProviderName.THORCHAIN && tx.hash && (
                      <a
                        href={`https://thorchain.net/tx/${tx.hash}`}
                        className="flex justify-end px-4 py-3"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <ThemeButton variant="secondarySmall">
                          <Icon name="globe" className="size-5" /> thorchain.net
                        </ThemeButton>
                      </a>
                    )}
                  </div>
                </Fragment>
              )
            })}
          </div>
        </ScrollArea>
      </CredenzaContent>
    </Credenza>
  )
}

function RemainingTime({ startTime, estimatedTime, fallback }: { startTime: number; estimatedTime: number; fallback: string }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const elapsedSeconds = Math.floor((now - startTime) / 1000)
  const remainingSeconds = estimatedTime - elapsedSeconds

  if (remainingSeconds <= 0) return <span className="capitalize">{fallback}</span>

  return <>{formatExpiration(remainingSeconds)} remaining</>
}

function renderLeg(tx: any, legTx: any) {
  const from = assetFromString(legTx.fromAsset)
  const to = assetFromString(legTx.toAsset)

  const text =
    legTx.fromAsset === legTx.toAsset
      ? legTx.fromAsset.toLowerCase() === tx.assetFrom.identifier.toLowerCase()
        ? `Deposit ${from.ticker}`
        : `Send ${to.ticker}`
      : `Swap ${from.ticker} to ${to.ticker}`

  const chain = ChainIdToChain[legTx.chainId as ChainId]
  const explorerUrl = legTx.hash && getExplorerTxUrl({ chain: chain, txHash: legTx.hash })

  return (
    <div className="text-thor-gray flex justify-between">
      <div className="flex items-center gap-2">
        {legTx.status === 'completed' ? (
          <CircleCheck className="text-brand-first" size={16} />
        ) : legTx.status === 'not_started' ? (
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
