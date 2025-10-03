import Image from 'next/image'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { LoaderCircle } from 'lucide-react'
import { Network, networkLabel } from 'rujira.js'
import { ThemeButton } from '@/components/theme-button'
import { Credenza, CredenzaContent, CredenzaHeader, CredenzaTitle } from '@/components/ui/credenza'
import { WalletConnectLedger } from '@/components/header/wallet-connect-ledger'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Provider } from '@/wallets'
import { useDialog } from '@/components/global-dialog'
import { useAccounts } from '@/hooks/use-accounts'
import { cn } from '@/lib/utils'

enum WalletType {
  browser,
  hardware
}

interface WalletProps<T> {
  key: string
  type: WalletType
  label: string
  provider: T
  link: string
  supportedChains: Network[]
}

interface WalletConnectDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export const WalletConnectDialog = ({ isOpen, onOpenChange }: WalletConnectDialogProps) => {
  const [connecting, setConnecting] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<WalletProps<Provider> | undefined>(undefined)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | undefined>(undefined)
  const { connect, isAvailable, accounts } = useAccounts()
  const { openDialog } = useDialog()

  const connectedProviders = useMemo(() => [...new Set(accounts?.map(a => a.provider))], [accounts])
  const networks = useMemo(
    () =>
      [
        Network.Avalanche,
        Network.Base,
        Network.Bitcoin,
        Network.BitcoinCash,
        Network.Bsc,
        Network.Gaia,
        Network.Dogecoin,
        Network.Ethereum,
        Network.Litecoin,
        Network.Solana,
        Network.Thorchain,
        Network.Tron,
        Network.Xrp
      ].sort((a, b) => {
        return networkLabel(a).localeCompare(networkLabel(b))
      }),
    []
  )

  const wallets = useMemo(() => {
    const installed: WalletProps<Provider>[] = []
    const others: WalletProps<Provider>[] = []

    WALLETS.forEach(wallet => {
      if (isAvailable(wallet.provider)) {
        installed.push(wallet)
      } else {
        others.push(wallet)
      }
    })

    const sortByLabel = (a: WalletProps<Provider>, b: WalletProps<Provider>) => a.label.localeCompare(b.label)

    installed.sort(sortByLabel)
    others.sort(sortByLabel)

    const getWalletsByType = (type: WalletType) => [
      ...installed.filter(w => w.type === type),
      ...others.filter(w => w.type === type)
    ]

    return {
      [WalletType.browser]: getWalletsByType(WalletType.browser),
      [WalletType.hardware]: getWalletsByType(WalletType.hardware)
    }
  }, [isAvailable])

  const onSelectWallet = (wallet: WalletProps<Provider>) => {
    setSelectedWallet(prev => {
      if (prev === wallet) {
        return undefined
      }

      if (wallet.key === 'ledger') {
        openDialog(WalletConnectLedger, {})
      }

      return wallet
    })
    setSelectedNetwork(undefined)
  }

  const onSelectNetwork = (network: Network) => {
    setSelectedNetwork(prev => (prev === network ? undefined : network))
    setSelectedWallet(undefined)
  }

  const isWalletHighlighted = (walletProvider: Provider) => {
    if (!selectedNetwork) return true

    const wallet = WALLETS.find(w => w.provider === walletProvider)
    return wallet && wallet.supportedChains.includes(selectedNetwork)
  }

  const isNetworkHighlighted = (network: Network) => {
    if (!selectedWallet) return true

    return selectedWallet.supportedChains.includes(network)
  }

  const handleConnect = async () => {
    if (!selectedWallet) return

    setConnecting(true)

    withTimeout(connect(selectedWallet.provider), 20_000)
      .then(() => {
        onOpenChange(false)
      })
      .catch(err => {
        console.log(err.message)
      })
      .finally(() => {
        setConnecting(false)
      })
  }

  const walletList = (wallets: WalletProps<Provider>[]) => {
    return wallets.map((wallet, index) => {
      const isConnected = connectedProviders.find(w => w === wallet.provider)
      const isInstalled = isAvailable(wallet.provider)
      const isSelected = wallet === selectedWallet
      const isHighlighted = isWalletHighlighted(wallet.provider)

      return (
        <div
          key={index}
          className={cn('mb-1 flex items-center space-x-3 rounded-2xl border-1 border-transparent p-3', {
            'border-runes-blue': isSelected,
            'opacity-25': !isHighlighted,
            'hover:bg-blade cursor-pointer': isInstalled && !isConnected,
            'mb-4 md:mb-8': index === wallets.length - 1
          })}
          onClick={() => {
            if (isConnected || !isInstalled) return
            onSelectWallet(wallet)
          }}
        >
          <Image src={`/wallets/${wallet.key}.svg`} alt="" width="32" height="32" />
          <div className="flex-1">
            <div className="text-leah font-medium">{wallet.label}</div>
            <div className="text-xs">
              {isInstalled ? (
                isConnected ? (
                  <span className="text-liquidity-green">Connected</span>
                ) : (
                  <span>Disconnected</span>
                )
              ) : (
                <a href={wallet.link} className="text-jacob" rel="noopener noreferrer" target="_blank">
                  Install
                </a>
              )}
            </div>
          </div>
        </div>
      )
    })
  }

  return (
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Connect Wallet</CredenzaTitle>
        </CredenzaHeader>

        <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
          <ScrollArea className="overflow-hidden md:mb-0 md:w-2/5 md:border-r md:pr-8 md:pl-8">
            <div className="mx-4 block gap-2 md:mx-0 md:block md:w-full">
              <div className="text-thor-gray mb-3 text-base font-semibold md:block">Browser Wallets</div>
              {walletList(wallets[WalletType.browser])}

              <div className="text-thor-gray mb-3 text-base font-semibold md:block">Hardware & Keystore</div>
              {walletList(wallets[WalletType.hardware])}
            </div>
          </ScrollArea>

          <div className="flex flex-col md:flex-1 md:overflow-hidden">
            <div className="text-thor-gray mb-3 hidden px-8 text-base font-semibold md:block">Chains</div>

            <div className="hidden flex-1 overflow-hidden md:flex">
              <ScrollArea className="mb-4 flex-1 px-8">
                <div
                  className="grid flex-1 grid-flow-col gap-2"
                  style={{
                    gridTemplateRows: `repeat(${Math.ceil(networks.length / 2)}, minmax(0, 1fr))`,
                    gridTemplateColumns: 'repeat(2, 1fr)'
                  }}
                >
                  {networks.map(network => {
                    const isSelected = selectedNetwork === network
                    const isHighlighted = isNetworkHighlighted(network)
                    const isComingSoon = network === Network.Solana

                    return (
                      <div
                        key={network}
                        className={cn(
                          'flex items-center gap-3 rounded-2xl border-1 border-transparent px-4 py-3',
                          {
                            'border-runes-blue': isSelected,
                            'opacity-25': !isHighlighted,
                            'cursor-pointer hover:bg-blade': !isComingSoon
                          }
                        )}
                        onClick={() => !isComingSoon && onSelectNetwork(network)}
                      >
                        <Image src={`/networks/${network.toLowerCase()}.svg`} alt={network} width="24" height="24" />
                        <div className="flex items-center gap-3 text-sm">
                          {networkLabel(network)}
                          {isComingSoon ? <Image src="/soon.svg" alt="Soon" width={37} height={17} /> : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>

            <div className="flex p-4 md:justify-end md:px-8 md:pt-0 md:pb-8">
              <ThemeButton
                variant="primaryMedium"
                className="w-full md:w-auto"
                disabled={!selectedWallet || connecting}
                onClick={() => handleConnect()}
              >
                {connecting && <LoaderCircle size={20} className="animate-spin" />}
                Connect Wallet
              </ThemeButton>
            </div>
          </div>
        </div>
      </CredenzaContent>
    </Credenza>
  )
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      toast.error('Connection timed out. Please try logging in to your wallet again')
      reject(new Error('Connection timeout'))
    }, ms)
    promise
      .then(res => {
        clearTimeout(id)
        resolve(res)
      })
      .catch(err => {
        clearTimeout(id)
        reject(err)
      })
  })
}

const WALLETS: WalletProps<Provider>[] = [
  {
    key: 'metamask',
    type: WalletType.browser,
    label: 'Metamask',
    provider: 'Metamask',
    link: 'https://metamask.io',
    supportedChains: [Network.Avalanche, Network.Base, Network.Bsc, Network.Ethereum]
  },
  {
    key: 'vultisig',
    type: WalletType.browser,
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
    key: 'phantom',
    type: WalletType.browser,
    label: 'Phantom',
    provider: 'Phantom',
    link: 'https://phantom.app',
    supportedChains: [Network.Base, Network.Bsc, Network.Ethereum]
  },
  {
    key: 'ctrl',
    type: WalletType.browser,
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
      Network.Litecoin,
      Network.Thorchain
    ]
  },
  {
    key: 'keplr',
    type: WalletType.browser,
    label: 'Keplr',
    provider: 'Keplr',
    link: 'https://www.keplr.app',
    supportedChains: [
      Network.Avalanche,
      Network.Base,
      Network.Ethereum,
      Network.Bitcoin,
      Network.Gaia,
      Network.Thorchain
    ]
  },
  {
    key: 'okx',
    type: WalletType.browser,
    label: 'OKX',
    provider: 'Okx',
    link: 'https://web3.okx.com',
    supportedChains: [
      Network.Avalanche,
      Network.Bsc,
      Network.Ethereum,
      Network.Thorchain,
      Network.Bitcoin,
      Network.Tron
    ]
  },
  {
    key: 'tronlink',
    type: WalletType.browser,
    label: 'TronLink',
    provider: 'Tronlink',
    link: 'https://www.tronlink.org',
    supportedChains: [Network.Tron, Network.Bsc, Network.Ethereum]
  },
  {
    key: 'ledger',
    type: WalletType.hardware,
    label: 'Ledger',
    provider: 'Ledger',
    link: 'https://www.ledger.com',
    supportedChains: [
      Network.Avalanche,
      Network.Base,
      Network.BitcoinCash,
      Network.Bitcoin,
      Network.Bsc,
      Network.Ethereum,
      Network.Litecoin,
      Network.Thorchain
    ]
  }
]
