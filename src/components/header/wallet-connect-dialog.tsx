import Image from 'next/image'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { LoaderCircle } from 'lucide-react'
import { Network, networkLabel } from 'rujira.js'
import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle
} from '@/components/ui/credenza'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Provider } from '@/wallets'
import { usePools } from '@/hooks/use-pools'
import { useAccounts } from '@/hooks/use-accounts'
import { cn } from '@/lib/utils'

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
  const { connect, isAvaialable, accounts } = useAccounts()
  const [connecting, setConnecting] = useState(false)
  const [selectedWallets, setSelectedWallets] = useState<Provider[]>([])
  const [hoveredChain, setHoveredChain] = useState<Network | null>(null)

  const { pools } = usePools()
  const networks: Network[] = [...new Set((pools || []).map(p => p.chain))]
  const connectedProviders = useMemo(() => [...new Set(accounts?.map(a => a.provider))], [accounts])

  const toggleSelection = (walletKey: Provider) => {
    setSelectedWallets(prev =>
      prev.includes(walletKey) ? prev.filter(key => key !== walletKey) : [...prev, walletKey]
    )
  }

  const getSelectedWalletsChains = () => {
    if (selectedWallets.length === 0) return []
    return WALLETS.filter(wallet => selectedWallets.includes(wallet.provider)).flatMap(wallet => wallet.supportedChains)
  }

  const isChainHighlighted = (chain: Network) => {
    if (hoveredChain === chain) return true
    if (selectedWallets.length > 0) {
      return getSelectedWalletsChains().includes(chain)
    }
    return false
  }

  const isWalletHighlightedForChain = (provider: Provider) => {
    if (!hoveredChain) return false
    const wallet = WALLETS.find(w => w.provider === provider)
    return wallet?.supportedChains.includes(hoveredChain) || false
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
        setConnecting(false)
      })
  }

  return (
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent className="bg-lawrence min-h-1/2 w-full gap-6 rounded-4xl border-0 p-6 md:min-w-3xl md:p-12">
        <CredenzaHeader className="flex items-start">
          <CredenzaTitle className="mb-4 text-base font-semibold text-white md:text-2xl">Connect Wallet</CredenzaTitle>
          <VisuallyHidden>
            <CredenzaDescription>&nbsp;</CredenzaDescription>
          </VisuallyHidden>
        </CredenzaHeader>

        <div className="grid flex-1 grid-cols-1 gap-8 md:grid-cols-5">
          <div className="col-span-2 border-0 md:border-r">
            <div className="text-gray mb-5 hidden text-base font-semibold md:block">Wallets</div>
            <ScrollArea className="h-full max-h-[40vh] md:max-h-[50vh]">
              <div className="space-y-1">
                {WALLETS.map(wallet => {
                  const isConnected = connectedProviders.find(w => w === wallet.provider)
                  const isInstalled = isAvaialable(wallet.provider)

                  const isSelected = selectedWallets.includes(wallet.provider)
                  const isHighlighted = isWalletHighlightedForChain(wallet.provider)

                  return (
                    <div
                      key={wallet.key}
                      className={cn('mr-10 flex items-center space-x-3 rounded-lg border-1 border-transparent p-3', {
                        'border-runes-blue': isSelected,
                        'opacity-25': !isHighlighted && !!hoveredChain,
                        'hover:bg-blade cursor-pointer': isInstalled && !isConnected
                      })}
                      onClick={() => {
                        if (isConnected || !isInstalled) return
                        toggleSelection(wallet.provider)
                      }}
                    >
                      <Image src={`/wallets/${wallet.key}.svg`} alt="" width="32" height="32" />
                      <div className="flex-1">
                        <div className="font-medium text-white">{wallet.label}</div>
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
            <h3 className="text-gray mb-5 text-base font-semibold">Supported Networks</h3>
            <div className="grid grid-cols-2 gap-2">
              {networks.map(chain => {
                const isHighlighted = isChainHighlighted(chain)

                return (
                  <div
                    key={chain}
                    className={cn(
                      'hover:bg-blade flex cursor-pointer items-center gap-3 rounded-lg border-1 border-transparent px-4 py-3',
                      {
                        'opacity-25': selectedWallets.length && !isHighlighted
                      }
                    )}
                    onMouseEnter={() => setHoveredChain(chain)}
                    onMouseLeave={() => setHoveredChain(null)}
                    onClick={() => {
                      const walletsForChain = WALLETS.filter(wallet => wallet.supportedChains.includes(chain))
                      if (walletsForChain.length) {
                        setSelectedWallets(walletsForChain.map(w => w.provider))
                      }
                    }}
                  >
                    <Image src={`/networks/${chain.toLowerCase()}.svg`} alt={chain} width="24" height="24" />
                    <div className="text-sm">{networkLabel(chain)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <CredenzaFooter>
          <div className="flex justify-end">
            <button
              className={cn(
                'flex items-center justify-center gap-2',
                'text-lawrence disabled:text-andy disabled:bg-blade h-14 rounded-4xl px-10 text-base font-semibold transition-colors',
                'bg-liquidity-green hover:bg-liquidity-green/90'
              )}
              disabled={selectedWallets.length < 1 || connecting}
              onClick={() => handleConnect()}
            >
              {connecting && <LoaderCircle size={20} className="animate-spin" />}
              {connecting ? 'Connecting' : 'Connect'} {selectedWallets.length || ''} Wallet
            </button>
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
  // {
  //   key: "ledger",
  //   label: "Ledger",
  //   provider: "Ledger",
  // },
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
