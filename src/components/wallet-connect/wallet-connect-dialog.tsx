import Image from 'next/image'
import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { AccountProvider, Network, networkLabel } from 'rujira.js'
import { Credenza, CredenzaContent, CredenzaFooter, CredenzaHeader, CredenzaTitle } from '@/components/ui/credenza'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Provider } from '@/wallets'
import { usePools } from '@/hooks/use-pools'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export interface WalletProps<T> {
  key: string
  label: string
  provider: T
  link: string
  supportedChains: Network[]
}

interface WalletConnectDialogProps<T> {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: AccountProvider<T>
  wallets: WalletProps<T>[]
  connectedProviders: Provider[]
}

export const WalletConnectDialog = <T,>({
  open,
  onOpenChange,
  provider,
  wallets,
  connectedProviders
}: WalletConnectDialogProps<T>) => {
  const { connect, isAvaialable } = provider
  const [connecting, setConnecting] = useState(false)
  const [selectedWallets, setSelectedWallets] = useState<T[]>([])
  const [hoveredChain, setHoveredChain] = useState<Network | null>(null)

  const { pools } = usePools()
  const networks: Network[] = [...new Set((pools || []).map(p => p.chain))]

  const toggleSelection = (walletKey: T) => {
    setSelectedWallets(prev =>
      prev.includes(walletKey) ? prev.filter(key => key !== walletKey) : [...prev, walletKey]
    )
  }

  const getSelectedWalletsChains = () => {
    if (selectedWallets.length === 0) return []
    return wallets.filter(wallet => selectedWallets.includes(wallet.provider)).flatMap(wallet => wallet.supportedChains)
  }

  const isChainHighlighted = (chain: Network) => {
    if (hoveredChain === chain) return true
    if (selectedWallets.length > 0) {
      return getSelectedWalletsChains().includes(chain)
    }
    return false
  }

  const isWalletHighlightedForChain = (provider: T) => {
    if (!hoveredChain) return false
    const wallet = wallets.find(w => w.provider === provider)
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
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="bg-lawrence min-h-1/2 w-full p-6 md:min-w-2xl md:p-12">
        <CredenzaHeader className="flex items-start">
          <CredenzaTitle className="text-base font-semibold text-white md:text-2xl">Connect Wallet</CredenzaTitle>
        </CredenzaHeader>

        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-5">
          <div className="col-span-2 border-0 pe-3 md:border-r">
            <div className="text-gray mb-3 hidden text-base font-semibold md:block">Wallets</div>
            <ScrollArea className="h-full max-h-[40vh] md:max-h-[60vh]">
              <div className="space-y-1">
                {wallets.map(wallet => {
                  const isConnected = connectedProviders.find(w => w === wallet.provider)
                  const isInstalled = isAvaialable(wallet.provider)

                  const isSelected = selectedWallets.includes(wallet.provider)
                  const isHighlighted = isWalletHighlightedForChain(wallet.provider)

                  return (
                    <div
                      key={wallet.key}
                      className={cn('flex items-center space-x-3 rounded-lg border-1 border-transparent p-3', {
                        'border-runes-blue': isSelected,
                        'opacity-25': !isHighlighted && !!hoveredChain,
                        'bg-emerald-500/10': isConnected,
                        'cursor-pointer': isInstalled && !isConnected
                      })}
                      onClick={() => {
                        if (isConnected || !isInstalled) return
                        toggleSelection(wallet.provider)
                      }}
                    >
                      <Image src={`/wallets/${wallet.key}.svg`} alt="" width="32" height="32" />
                      <div className="flex-1">
                        <div className="font-medium text-white">{wallet.label}</div>
                        <div className="text-xs"></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
          <div className="col-span-3 hidden md:block">
            <h3 className="text-gray mb-3 text-base font-semibold">Supported Networks</h3>
            <div className="grid grid-cols-2 gap-2">
              {networks.map(chain => {
                const isHighlighted = isChainHighlighted(chain)

                return (
                  <div
                    key={chain}
                    className={cn('flex cursor-pointer items-center gap-3 border-1 border-transparent p-2', {
                      'opacity-25': selectedWallets.length && !isHighlighted
                    })}
                    onMouseEnter={() => setHoveredChain(chain)}
                    onMouseLeave={() => setHoveredChain(null)}
                    onClick={() => {
                      const walletsForChain = wallets.filter(wallet => wallet.supportedChains.includes(chain))
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
            <Button
              className="border-0 bg-gradient-to-r from-green-400 to-blue-500 text-white hover:from-green-500 hover:to-blue-600"
              disabled={selectedWallets.length < 1 || connecting}
              onClick={() => handleConnect()}
            >
              {connecting && <LoaderCircle size={16} className="animate-spin" />}
              {connecting ? 'Connecting' : 'Connect'} {selectedWallets.length || ''} Wallet
            </Button>
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
