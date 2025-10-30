import Image from 'next/image'
import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { ThemeButton } from '@/components/theme-button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useWallets } from '@/hooks/use-wallets'
import { cn } from '@/lib/utils'
import { ALL_CHAINS, chainLabel, COMING_SOON_CHAINS, WalletParams } from '@/components/connect-wallet/config'
import { Chain } from '@swapkit/core'

export const BrowserWallet = ({
  wallet,
  chains,
  onConnect
}: {
  wallet: WalletParams
  chains: (Chain | string)[]
  onConnect: () => void
}) => {
  const availableChains: (Chain | string)[] = wallet.supportedChains.filter(c => ALL_CHAINS.includes(c))

  const [connecting, setConnecting] = useState(false)
  const [selectedChains, setSelectedChains] = useState<(Chain | string)[]>(availableChains)
  const { connect } = useWallets()

  const onSelectChain = (chain: Chain) => {
    setSelectedChains(prev => (prev.includes(chain) ? prev.filter(net => net !== chain) : [...prev, chain]))
  }

  const handleConnect = async () => {
    setConnecting(true)

    connect(
      wallet.option,
      selectedChains.map(c => c as Chain)
    )
      .then(() => {
        onConnect()
      })
      .catch(err => {
        console.log(err.message)
      })
      .finally(() => {
        setConnecting(false)
      })
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between px-4 md:px-8">
        <div className="text-thor-gray text-base font-semibold">Chains</div>
        <div
          className="text-leah cursor-pointer text-xs"
          onClick={() => setSelectedChains(selectedChains.length ? [] : availableChains)}
        >
          {selectedChains.length ? 'Deselect All' : 'Select All'}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <ScrollArea className="flex-1 px-4 md:mb-4 md:px-8">
          <div
            className="grid flex-1 grid-flow-col gap-2"
            style={{
              gridTemplateRows: `repeat(${Math.ceil(chains.length / 2)}, minmax(0, 1fr))`,
              gridTemplateColumns: 'repeat(2, 1fr)'
            }}
          >
            {chains.map(chain => {
              const isSelected = selectedChains.includes(chain)
              const isAvailable = availableChains.includes(chain)
              const isComingSoon = COMING_SOON_CHAINS.includes(chain)

              return (
                <div
                  key={chain}
                  className={cn('flex items-center gap-3 rounded-2xl border-1 border-transparent px-4 py-3', {
                    'border-runes-blue': isSelected,
                    'opacity-25': !isAvailable,
                    'hover:bg-blade/50 cursor-pointer': isAvailable
                  })}
                  onClick={() => isAvailable && onSelectChain(chain as Chain)}
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

      <div className="flex p-4 md:justify-end md:px-8 md:pt-0 md:pb-8">
        <ThemeButton
          variant="primaryMedium"
          className="w-full md:w-auto"
          disabled={connecting || selectedChains.length === 0}
          onClick={() => handleConnect()}
        >
          {connecting && <LoaderCircle size={20} className="animate-spin" />}
          Connect {wallet.label}
        </ThemeButton>
      </div>
    </>
  )
}
