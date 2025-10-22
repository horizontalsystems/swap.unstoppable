import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Credenza, CredenzaContent, CredenzaHeader, CredenzaTitle } from '@/components/ui/credenza'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useWallets } from '@/hooks/use-wallets'
import { cn } from '@/lib/utils'
import {
  ALL_CHAINS,
  chainLabel,
  COMING_SOON_CHAINS,
  WalletParams,
  WALLETS,
  WalletType
} from '@/components/connect-wallet/config'
import { BrowserWallet } from '@/components/connect-wallet/browser-wallet'
import { Keystore } from '@/components/connect-wallet/keystore'
import { Ledger } from '@/components/connect-wallet/ledger'
import { Icon } from '@/components/icons'
import { Chain, WalletOption } from '@swapkit/core'

interface ConnectWalletProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export const ConnectWallet = ({ isOpen, onOpenChange }: ConnectWalletProps) => {
  const [selectedWallet, setSelectedWallet] = useState<WalletParams | undefined>(undefined)
  const [selectedChain, setSelectedChain] = useState<Chain | undefined>(undefined)
  const { isAvailable, connectedWallets } = useWallets()

  const chains = useMemo(
    () =>
      [...ALL_CHAINS, ...COMING_SOON_CHAINS].sort((a, b) => {
        return chainLabel(a).localeCompare(chainLabel(b))
      }),
    []
  )

  const wallets = useMemo(() => {
    const installed: WalletParams[] = []
    const others: WalletParams[] = []

    WALLETS.forEach(wallet => {
      if (isAvailable(wallet.option)) {
        installed.push(wallet)
      } else {
        others.push(wallet)
      }
    })

    const sortByLabel = (a: WalletParams, b: WalletParams) => a.label.localeCompare(b.label)

    installed.sort(sortByLabel)
    others.sort(sortByLabel)

    return [...installed, ...others]
  }, [isAvailable])

  const onSelectWallet = (wallet: WalletParams) => {
    setSelectedWallet(prev => (prev === wallet ? undefined : wallet))
    setSelectedChain(undefined)
  }

  const onSelectChain = (chain: Chain) => {
    setSelectedChain(prev => (prev === chain ? undefined : chain))
  }

  const isWalletHighlighted = (walletOption: WalletOption) => {
    if (!selectedChain) return true

    const wallet = WALLETS.find(w => w.option === walletOption)
    return wallet && wallet.supportedChains.includes(selectedChain)
  }

  const walletList = (wallets: WalletParams[]) => {
    return wallets.map((wallet, index) => {
      const isConnected = connectedWallets.find(w => w === wallet.option)
      const isInstalled = isAvailable(wallet.option)
      const isSelected = wallet === selectedWallet
      const isHighlighted = isWalletHighlighted(wallet.option)

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

  const renderSelectedWallet = (wallet: WalletParams) => {
    const onConnect = () => {
      onOpenChange(false)
    }

    if (wallet.type === WalletType.browser) {
      return <BrowserWallet key={wallet.key} wallet={wallet} chains={chains} onConnect={onConnect} />
    }

    if (wallet.key === 'ledger') {
      return <Ledger key={wallet.key} wallet={wallet} onConnect={onConnect} />
    }

    if (wallet.key === 'keystore') {
      return <Keystore key={wallet.key} wallet={wallet} onConnect={onConnect} />
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
              renderSelectedWallet(selectedWallet)
            ) : (
              <>
                <div className="text-thor-gray mb-3 hidden px-8 text-base font-semibold md:block">Chains</div>

                <div className="hidden flex-1 overflow-hidden md:flex">
                  <ScrollArea className="mb-4 flex-1 px-8">
                    <div
                      className="grid flex-1 grid-flow-col gap-2"
                      style={{
                        gridTemplateRows: `repeat(${Math.ceil(chains.length / 2)}, minmax(0, 1fr))`,
                        gridTemplateColumns: 'repeat(2, 1fr)'
                      }}
                    >
                      {chains.map(chain => {
                        const isSelected = selectedChain === chain
                        const isComingSoon = COMING_SOON_CHAINS.includes(chain)

                        return (
                          <div
                            key={chain}
                            className={cn('flex items-center gap-3 rounded-2xl border-1 border-transparent px-4 py-3', {
                              'border-runes-blue': isSelected,
                              'hover:bg-blade cursor-pointer': !isComingSoon
                            })}
                            onClick={() => !isComingSoon && onSelectChain(chain)}
                          >
                            <Image src={`/networks/${chain.toLowerCase()}.svg`} alt={chain} width="24" height="24" />
                            <div className="text-sm">{chainLabel(chain)}</div>
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
