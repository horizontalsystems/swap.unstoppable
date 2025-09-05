'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Clock3, LoaderCircle, LogOut, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WalletConnectDialog, WalletProps } from '@/components/wallet-connect/wallet-connect-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { HistoryDialog } from '@/components/history-dialog'
import { Network } from 'rujira.js'
import { Provider } from '@/wallets'
import { useAccounts } from '@/context/accounts-provider'
import { useTransactions } from '@/hooks/use-transactions'

export const WalletConnectButton = () => {
  const [showHistory, setShowHistory] = useState(false)
  const [addWallet, setAddWallet] = useState(false)

  const { showPendingAlert, setPendingAlert, transactions } = useTransactions()

  const accProvider = useAccounts()
  const pendingTx = transactions.find(t => t.status === 'pending')
  const connectedProviders = useMemo(
    () => [...new Set(accProvider.accounts?.map(a => a.provider))],
    [accProvider.accounts]
  )

  const onClickHistory = () => {
    setShowHistory(true)
    if (showPendingAlert) setPendingAlert(false)
  }

  return (
    <div>
      <div className="flex items-center gap-2">
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
        <Button className="rounded-xl" variant="outline" onClick={() => setAddWallet(true)}>
          <Plus />
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

      <WalletConnectDialog
        open={addWallet}
        onOpenChange={setAddWallet}
        provider={accProvider}
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
    link: 'https://ctrl.xyz',
    supportedChains: [
      Network.Avalanche,
      Network.Base,
      Network.BitcoinCash,
      Network.Bitcoin,
      Network.Bsc,
      Network.Dogecoin,
      Network.Ethereum,
      Network.Litecoin
    ]
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
    link: 'https://metamask.io',
    supportedChains: [Network.Avalanche, Network.Base, Network.Bsc, Network.Ethereum, Network.Thorchain]
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
    link: 'https://vultisig.com',
    supportedChains: [
      Network.Avalanche,
      Network.Base,
      Network.BitcoinCash,
      Network.Bitcoin,
      Network.Bsc,
      Network.Dogecoin,
      Network.Ethereum,
      Network.Litecoin,
      Network.Osmo
    ]
  },
  {
    key: 'tronlink',
    label: 'TronLink',
    provider: 'Tronlink',
    link: 'https://www.tronlink.org',
    supportedChains: [Network.Tron, Network.Bsc, Network.Ethereum]
  }
]
