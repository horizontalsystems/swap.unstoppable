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

  const filteredChains = chains.filter(c => availableChains.includes(c))

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

      <div className="relative flex min-h-0 flex-1">
        <ScrollArea className="flex-1 px-4 md:px-8">
          <div
            className="grid flex-1 grid-flow-col gap-2 pb-4"
            style={{
              gridTemplateRows: `repeat(${Math.ceil(filteredChains.length / 2)}, minmax(0, 1fr))`,
              gridTemplateColumns: 'repeat(2, 1fr)'
            }}
          >
            {filteredChains.map(chain => {
              const isSelected = selectedChains.includes(chain)
              const isAvailable = availableChains.includes(chain)
              const isComingSoon = COMING_SOON_CHAINS.includes(chain)

              return (
                <div
                  key={chain}
                  className={cn('flex items-center gap-3 rounded-2xl border-1 border-transparent px-4 py-3', {
                    'border-brand-second': isSelected,
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

        <div className="from-lawrence pointer-events-none absolute inset-x-0 -bottom-[1px] h-4 bg-linear-to-t to-transparent" />
      </div>

      <div className="flex p-4 pt-2 md:justify-end md:px-8 md:pb-8">
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
