import Image from 'next/image'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { LoaderCircle } from 'lucide-react'
import { Network, networkLabel } from 'rujira.js'
import { ThemeButton } from '@/components/theme-button'
import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle
} from '@/components/ui/credenza'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { WalletConnectLedger } from '@/components/header/wallet-connect-ledger'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Provider } from '@/wallets'
import { usePools } from '@/hooks/use-pools'
import { useAccounts } from '@/hooks/use-accounts'
import { cn } from '@/lib/utils'
import { useDialog } from '@/components/global-dialog'

interface WalletProps<T> {
  key: string
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
  const [selectedWallets, setSelectedWallets] = useState<Provider[]>([])
  const [selectedNetworks, setSelectedNetworks] = useState<Network[]>([])
  const { connect, isAvailable, accounts } = useAccounts()
  const { openDialog } = useDialog()
  const { pools } = usePools()

  const connectedProviders = useMemo(() => [...new Set(accounts?.map(a => a.provider))], [accounts])

  const networks = useMemo(() => {
    return [...new Set((pools || []).map(p => p.chain))].sort((a, b) => {
      return networkLabel(a).localeCompare(networkLabel(b))
    })
  }, [pools])

  const wallets = useMemo(() => {
    const sortByLabel = (a: WalletProps<Provider>, b: WalletProps<Provider>) => a.label.localeCompare(b.label)

    const installed: WalletProps<Provider>[] = []
    const others: WalletProps<Provider>[] = []

    WALLETS.forEach(wallet => {
      if (isAvailable(wallet.provider)) {
        installed.push(wallet)
      } else {
        others.push(wallet)
      }
    })

    installed.sort(sortByLabel)
    others.sort(sortByLabel)

    return [...installed, ...others]
  }, [isAvailable])

  const toggleWalletSelection = (provider: Provider) => {
    setSelectedWallets(prev => {
      if (prev.includes(provider)) {
        return prev.filter(p => p !== provider)
      }

      if (provider === 'Ledger') {
        openDialog(WalletConnectLedger, {})
      }

      return [...prev, provider]
    })
  }

  const toggleNetworkSelection = (network: Network) => {
    setSelectedNetworks(prev => (prev.includes(network) ? prev.filter(net => net !== network) : [...prev, network]))
  }

  const getSelectedWalletsChains = () => {
    if (selectedWallets.length === 0) return []
    return WALLETS.filter(wallet => selectedWallets.includes(wallet.provider)).flatMap(wallet => wallet.supportedChains)
  }

  const isNetworkHighlighted = (network: Network) => {
    // Highlight if network is selected OR if any selected wallet supports it
    return (
      selectedNetworks.includes(network) || (selectedWallets.length > 0 && getSelectedWalletsChains().includes(network))
    )
  }

  const isWalletHighlighted = (walletProvider: Provider) => {
    // Highlight if wallet is selected OR if any selected network is supported by this wallet
    const wallet = WALLETS.find(w => w.provider === walletProvider)
    return (
      selectedWallets.includes(walletProvider) ||
      (selectedNetworks.length > 0 && wallet && wallet.supportedChains.some(chain => selectedNetworks.includes(chain)))
    )
  }

  const handleConnect = async () => {
    setConnecting(true)

    withTimeout(Promise.all(selectedWallets.map(provider => connect(provider))), 20_000)
      .then(() => {
        onOpenChange(false)
      })
      .catch(err => {
        console.log(err.message)
      })
      .finally(() => {
        setSelectedWallets([])
        setSelectedNetworks([])
        setConnecting(false)
      })
  }

  return (
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent className="bg-lawrence min-h-1/2 w-full gap-6 rounded-4xl border-0 p-6 md:min-w-3xl md:p-12">
        <CredenzaHeader className="flex items-start">
          <CredenzaTitle className="text-leah mb-4 text-base font-semibold md:text-2xl">Connect Wallet</CredenzaTitle>
          <VisuallyHidden>
            <CredenzaDescription>&nbsp;</CredenzaDescription>
          </VisuallyHidden>
        </CredenzaHeader>

        <div className="grid flex-1 grid-cols-1 gap-8 md:grid-cols-5">
          <div className="col-span-2 border-0 md:border-r">
            <div className="text-thor-gray mb-5 hidden text-base font-semibold md:block">Wallets</div>
            <ScrollArea className="h-full max-h-[40vh] md:max-h-[50vh]">
              <div className="space-y-1">
                {wallets.map(wallet => {
                  const isConnected = connectedProviders.find(w => w === wallet.provider)
                  const isInstalled = isAvailable(wallet.provider)
                  const isSelected = selectedWallets.includes(wallet.provider)
                  const isHighlighted = isWalletHighlighted(wallet.provider)

                  return (
                    <div
                      key={wallet.key}
                      className={cn('mr-10 flex items-center space-x-3 rounded-lg border-1 border-transparent p-3', {
                        'border-runes-blue bg-blade': isSelected,
                        'opacity-25': selectedNetworks.length > 0 && !isHighlighted,
                        'hover:bg-blade cursor-pointer': isInstalled && !isConnected
                      })}
                      onClick={() => {
                        if (isConnected || !isInstalled) return
                        toggleWalletSelection(wallet.provider)
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
                })}
              </div>
            </ScrollArea>
          </div>

          <div className="col-span-3 hidden md:block">
            <h3 className="text-thor-gray mb-5 text-base font-semibold">Chains</h3>
            <div
              className="grid grid-flow-col gap-2"
              style={{
                gridTemplateRows: `repeat(${Math.ceil(networks.length / 2)}, minmax(0, 1fr))`,
                gridTemplateColumns: 'repeat(2, 1fr)'
              }}
            >
              {networks.map(network => {
                const isSelected = selectedNetworks.includes(network)
                const isHighlighted = isNetworkHighlighted(network)

                return (
                  <div
                    key={network}
                    className={cn(
                      'hover:bg-blade flex cursor-pointer items-center gap-3 rounded-lg border-1 border-transparent px-4 py-3',
                      {
                        'bg-blade': isSelected || isHighlighted,
                        'opacity-25': (selectedWallets.length > 0 || selectedNetworks.length > 0) && !isHighlighted
                      }
                    )}
                    onClick={() => toggleNetworkSelection(network)}
                  >
                    <Image src={`/networks/${network.toLowerCase()}.svg`} alt={network} width="24" height="24" />
                    <div className="text-sm">{networkLabel(network)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <CredenzaFooter>
          <div className="flex justify-end">
            <ThemeButton
              variant="primaryMedium"
              disabled={selectedWallets.length < 1 || connecting}
              onClick={() => handleConnect()}
            >
              {connecting && <LoaderCircle size={20} className="animate-spin" />}
              {connecting ? 'Connecting' : 'Connect'} {selectedWallets.length || ''} Wallet
            </ThemeButton>
          </div>
        </CredenzaFooter>
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
    label: 'Metamask',
    provider: 'Metamask',
    link: 'https://metamask.io',
    supportedChains: [Network.Avalanche, Network.Base, Network.Bsc, Network.Ethereum]
  },
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
    key: 'phantom',
    label: 'Phantom',
    provider: 'Phantom',
    link: 'https://phantom.app',
    supportedChains: [Network.Base, Network.Bsc, Network.Ethereum]
  },
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
      Network.Litecoin,
      Network.Thorchain
    ]
  },
  {
    key: 'keplr',
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
    key: 'ledger',
    label: 'Ledger',
    provider: 'Ledger',
    link: 'https://www.ledger.com',
    supportedChains: [Network.Avalanche, Network.Bsc, Network.Ethereum, Network.Thorchain, Network.Bitcoin]
  },
  {
    key: 'okx',
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
    label: 'TronLink',
    provider: 'Tronlink',
    link: 'https://www.tronlink.org',
    supportedChains: [Network.Tron, Network.Bsc, Network.Ethereum]
  }
]
