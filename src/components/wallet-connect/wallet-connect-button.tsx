'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Clock3, LoaderCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WalletConnectDialog, WalletProps } from '@/components/wallet-connect/wallet-connect-dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { HistoryDialog } from '@/components/history-dialog'
import { WalletDrawer } from '@/components/wallet-connect/wallet-drawer'
import { Provider } from '@/wallets'
import { useAccounts } from '@/context/accounts-provider'
import { useTransactions } from '@/hook/use-transactions'

export const WalletConnectButton = () => {
  const [showHistory, setShowHistory] = useState(false)
  const [addWallet, setAddWallet] = useState(false)
  const [drawer, setDrawer] = useState<{ open: boolean; provider?: Provider }>({
    open: false
  })

  const { showPendingAlert, setPendingAlert, transactions } = useTransactions()
  const pendingTx = transactions.find(t => t.status === 'pending')

  const accountProvider = useAccounts()
  const connectedProviders = [...new Set(accountProvider.accounts?.map(a => a.provider))]
  const onClickHistory = () => {
    setShowHistory(true)
    if (showPendingAlert) setPendingAlert(false)
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <Tooltip open={showPendingAlert}>
          <TooltipTrigger asChild>
            <Button className="rounded-xl" variant="outline" onClick={onClickHistory}>
              <Clock3 /> History
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-blade rounded-xl p-3 text-white" arrowClassName="bg-blade fill-blade">
            <div className="flex items-center gap-2">
              {pendingTx ? (
                <div>
                  {pendingTx?.fromAsset?.metadata?.symbol} to {pendingTx?.toAsset?.metadata?.symbol}
                </div>
              ) : (
                'Pending transactions'
              )}
              <LoaderCircle size={16} className="animate-spin" />
            </div>
          </TooltipContent>
        </Tooltip>
        <Button className="rounded-xl" variant="outline" onClick={() => setAddWallet(true)}>
          <Plus />
        </Button>
        {connectedProviders.map(provider => (
          <Button
            variant="outline"
            key={provider}
            className="rounded-lg border-1 border-emerald-500 px-0"
            onClick={() => setDrawer({ open: true, provider })}
          >
            <Image width="32" height="32" src={`/wallets/${provider.toLowerCase()}.svg`} alt={provider} />
          </Button>
        ))}
      </div>

      <WalletDrawer
        open={drawer.open}
        provider={drawer.provider}
        onOpenChange={bool => setDrawer({ ...drawer, open: bool })}
      />

      <WalletConnectDialog
        open={addWallet}
        onOpenChange={setAddWallet}
        provider={accountProvider}
        connectedProviders={connectedProviders}
        wallets={WALLETS}
      />

      <HistoryDialog open={showHistory} onOpenChange={setShowHistory} />
    </div>
  )
}

const WALLETS: WalletProps<Provider>[] = [
  {
    key: 'ctrl',
    label: 'Ctrl',
    provider: 'Ctrl',
    link: 'https://ctrl.xyz'
  },
  // {
  //   key: 'keplr',
  //   label: 'Keplr',
  //   provider: 'Keplr'
  // },
  // {
  //   key: "ledger",
  //   label: "Ledger",
  //   provider: "Ledger",
  // },
  {
    key: 'metamask',
    label: 'Metamask',
    provider: 'Metamask',
    link: 'https://metamask.io'
  },
  // {
  //   key: 'okx',
  //   label: 'OKX',
  //   provider: 'Okx',
  //   isHardware: true
  // },
  // {
  //   key: 'trust-extenion',
  //   label: 'Trust Extension',
  //   provider: 'Trust'
  // },
  {
    key: 'vultisig',
    label: 'Vultisig',
    provider: 'Vultisig',
    link: 'https://vultisig.com'
  },
  {
    key: 'tronlink',
    label: 'TronLink',
    provider: 'Tronlink',
    link: 'https://www.tronlink.org'
  }
]
