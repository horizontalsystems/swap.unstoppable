'use client'

import Image from 'next/image'
import { useMemo } from 'react'
import { Clock3, LoaderCircle, LogOut, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { WalletConnectDialog } from '@/components/wallet-connect/wallet-connect-dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { HistoryDialog } from '@/components/history-dialog'
import { useAccounts } from '@/hooks/use-accounts'
import { useTransactions } from '@/hooks/use-transactions'
import { useDialog } from '@/components/global-dialog'

export const WalletConnectButton = () => {
  const { openDialog } = useDialog()
  const { showPendingAlert, setPendingAlert, transactions } = useTransactions()

  const accProvider = useAccounts()
  const pendingTx = transactions.find(t => t.status === 'pending')
  const connectedProviders = useMemo(
    () => [...new Set(accProvider.accounts?.map(a => a.provider))],
    [accProvider.accounts]
  )

  const onClickHistory = () => {
    openDialog(HistoryDialog, {})
    if (showPendingAlert) setPendingAlert(false)
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        {accProvider.accounts?.length ? (
          <Tooltip open={showPendingAlert && !!pendingTx}>
            <TooltipTrigger asChild>
              <Button className="rounded-xl" variant="outline" onClick={onClickHistory}>
                <Clock3 /> History
              </Button>
            </TooltipTrigger>
            <TooltipContent
              className="bg-blade cursor-pointer rounded-xl p-3 text-white"
              arrowClassName="bg-blade fill-blade"
              onClick={onClickHistory}
            >
              <div className="flex items-center gap-2">
                <div>
                  {pendingTx?.fromAsset?.metadata?.symbol} to {pendingTx?.toAsset?.metadata?.symbol}
                </div>
                <LoaderCircle size={16} className="animate-spin" />
              </div>
            </TooltipContent>
          </Tooltip>
        ) : null}
        <Button className="rounded-xl" variant="outline" onClick={() => openDialog(WalletConnectDialog, {})}>
          {accProvider.accounts?.length ? <Plus /> : 'Connect'}
        </Button>
        {connectedProviders.map((provider, i) => (
          <DropdownMenu key={i}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-lg border-1 px-0">
                <Image width="32" height="32" src={`/wallets/${provider.toLowerCase()}.svg`} alt={provider} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-0">
              <DropdownMenuItem className="flex cursor-pointer items-center justify-between gap-3 rounded-none px-3 py-2 focus:bg-neutral-800">
                <div className="flex items-center gap-3" onClick={() => accProvider.disconnect(provider)}>
                  <LogOut className="h-5 w-5" />
                  <span className="text-gray text-sm">Disconnect</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      </div>
    </div>
  )
}
