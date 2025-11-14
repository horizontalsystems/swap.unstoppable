'use client'

import { useLastPendingTx, useSetPendingAlert, useShowPendingAlert } from '@/store/transaction-store'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { LoaderCircle } from 'lucide-react'
import { TransactionHistoryDialog } from '@/components/header/transaction-history-dialog'
import { useDialog } from '@/components/global-dialog'
import { useConnectedWallets } from '@/hooks/use-wallets'
import { useSyncTransactions } from '@/hooks/use-sync-transactions'
import { ThemeButton } from '@/components/theme-button'
import { Icon } from '@/components/icons'

export const TransactionHistoryButton = () => {
  const { openDialog } = useDialog()

  const pendingTx = useLastPendingTx()
  const showPendingAlert = useShowPendingAlert()
  const setPendingAlert = useSetPendingAlert()
  const connectedProviders = useConnectedWallets()

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
        <div>
          <ThemeButton variant="secondarySmall" className="hidden md:flex" onClick={onClick}>
            <Icon name="clock" /> History
          </ThemeButton>
          <ThemeButton variant="circleSmall" className="flex md:hidden" onClick={onClick}>
            <Icon name="clock" />
          </ThemeButton>
        </div>
      </TooltipTrigger>
      <TooltipContent
        className="bg-blade text-leah cursor-pointer rounded-xl p-3"
        arrowClassName="bg-blade fill-blade"
        onClick={onClick}
      >
        <div className="flex items-center gap-2">
          <div>
            {pendingTx?.assetFrom?.ticker} to {pendingTx?.assetTo?.ticker}
          </div>
          <LoaderCircle size={16} className="animate-spin" />
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
