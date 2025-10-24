import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Network, networkLabel } from 'rujira.js'
import { Credenza, CredenzaContent, CredenzaHeader, CredenzaTitle } from '@/components/ui/credenza'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Provider } from '@/wallets'
import { useAccounts } from '@/hooks/use-accounts'
import { cn } from '@/lib/utils'
import { Wallet, WALLETS, WalletType } from '@/components/connect-wallet/config'
import { BrowserWallet } from '@/components/connect-wallet/browser-wallet'
import { Ledger } from '@/components/connect-wallet/ledger'
import { Icon } from '@/components/icons'

interface WalletConnectDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export const ConnectWallet = ({ isOpen, onOpenChange }: WalletConnectDialogProps) => {
  const [selectedWallet, setSelectedWallet] = useState<Wallet<Provider> | undefined>(undefined)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | undefined>(undefined)
  const { isAvailable, accounts } = useAccounts()

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
        Network.Monero,
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
    const installed: Wallet<Provider>[] = []
    const others: Wallet<Provider>[] = []

    WALLETS.forEach(wallet => {
      if (isAvailable(wallet.provider)) {
        installed.push(wallet)
      } else {
        others.push(wallet)
      }
    })

    const sortByLabel = (a: Wallet<Provider>, b: Wallet<Provider>) => a.label.localeCompare(b.label)

    installed.sort(sortByLabel)
    others.sort(sortByLabel)

    return [...installed, ...others]
  }, [isAvailable])

  const onSelectWallet = (wallet: Wallet<Provider>) => {
    setSelectedWallet(prev => (prev === wallet ? undefined : wallet))
    setSelectedNetwork(undefined)
  }

  const onSelectNetwork = (network: Network) => {
    setSelectedNetwork(prev => (prev === network ? undefined : network))
  }

  const isWalletHighlighted = (walletProvider: Provider) => {
    if (!selectedNetwork) return true

    const wallet = WALLETS.find(w => w.provider === walletProvider)
    return wallet && wallet.supportedChains.includes(selectedNetwork)
  }

  const walletList = (wallets: Wallet<Provider>[]) => {
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
            'hover:bg-blade cursor-pointer': isInstalled && !isConnected && isHighlighted,
            'mb-4 md:mb-8': index === wallets.length - 1
          })}
          onClick={() => {
            if (isConnected || !isInstalled || !isHighlighted) return
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

  const connectWallet = (wallet: Wallet<Provider>) => {
    const onConnect = () => {
      onOpenChange(false)
    }

    if (wallet.type === WalletType.browser) {
      return <BrowserWallet key={wallet.key} wallet={wallet} networks={networks} onConnect={onConnect} />
    }

    if (wallet.key === 'ledger') {
      return <Ledger key={wallet.key} wallet={wallet} onConnect={onConnect} />
    }

    return null
  }

  return (
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Connect Wallet</CredenzaTitle>
        </CredenzaHeader>

        <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
          <ScrollArea
            className={cn('overflow-hidden md:mb-0 md:w-2/5 md:border-r md:pr-8 md:pl-8', {
              'hidden md:block': selectedWallet
            })}
          >
            <div className="mx-4 block gap-2 md:mx-0 md:block md:w-full">{walletList(wallets)}</div>
          </ScrollArea>

          {selectedWallet && (
            <div
              className="mb-2 flex cursor-pointer items-center gap-4 px-4 pb-4 md:hidden"
              onClick={() => setSelectedWallet(undefined)}
            >
              <Icon name="arrow-m-left" className="text-thor-gray size-6" />
              <div className="flex gap-2">
                <Image src={`/wallets/${selectedWallet.key}.svg`} alt="" width="20" height="20" />
                <span className="text-thor-gray text-sm font-medium">{selectedWallet.label}</span>
              </div>
            </div>
          )}

          <div className="flex flex-1 flex-col overflow-hidden">
            {selectedWallet ? (
              connectWallet(selectedWallet)
            ) : (
              <>
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
                        const isComingSoon = network === Network.Solana || network === Network.Monero

                        return (
                          <div
                            key={network}
                            className={cn('flex items-center gap-3 rounded-2xl border-1 border-transparent px-4 py-3', {
                              'border-runes-blue': isSelected,
                              'hover:bg-blade cursor-pointer': !isComingSoon
                            })}
                            onClick={() => !isComingSoon && onSelectNetwork(network)}
                          >
                            <Image
                              src={`/networks/${network.toLowerCase()}.svg`}
                              alt={network}
                              width="24"
                              height="24"
                            />
                            <div className="text-sm">{networkLabel(network)}</div>
                            {isComingSoon && (
                              <div className="text-gray border-gray rounded-full border px-1.5 text-[10px] font-semibold">
                                Soon
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </>
            )}
          </div>
        </div>
      </CredenzaContent>
    </Credenza>
  )
}
