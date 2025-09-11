'use client'

import { useLastPendingTx, useSetPendingAlert, useShowPendingAlert } from '@/store/transaction-store'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Clock3, LoaderCircle } from 'lucide-react'
import { TransactionHistoryDialog } from '@/components/header/transaction-history-dialog'
import { useDialog } from '@/components/global-dialog'
import { useConnectedProviders } from '@/store/account-store'
import { useSyncTransactions } from '@/hooks/use-sync-transactions'

export const TransactionHistoryButton = () => {
  const { openDialog } = useDialog()

  const pendingTx = useLastPendingTx()
  const showPendingAlert = useShowPendingAlert()
  const setPendingAlert = useSetPendingAlert()
  const connectedProviders = useConnectedProviders()

  useSyncTransactions()

  if (!connectedProviders.length) {
    return null
  }

  const onClick = () => {
    openDialog(TransactionHistoryDialog, {})
    if (showPendingAlert) setPendingAlert(false)
  }

  return (
    <Tooltip open={showPendingAlert && !!pendingTx}>
      <TooltipTrigger asChild>
        <Button className="rounded-xl" variant="outline" onClick={onClick}>
          <Clock3 /> History
        </Button>
      </TooltipTrigger>
      <TooltipContent
        className="bg-blade cursor-pointer rounded-xl p-3 text-white"
        arrowClassName="bg-blade fill-blade"
        onClick={onClick}
      >
        <div className="flex items-center gap-2">
          <div>
            {pendingTx?.fromAsset?.metadata?.symbol} to {pendingTx?.toAsset?.metadata?.symbol}
          </div>
          <LoaderCircle size={16} className="animate-spin" />
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
