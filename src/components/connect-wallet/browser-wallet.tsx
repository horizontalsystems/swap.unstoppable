import Image from 'next/image'
import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { Network, networkLabel } from 'rujira.js'
import { ThemeButton } from '@/components/theme-button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Provider } from '@/wallets'
import { useAccounts } from '@/hooks/use-accounts'
import { cn } from '@/lib/utils'
import { Wallet } from '@/components/connect-wallet/config'

export const BrowserWallet = ({
  wallet,
  networks,
  onConnect
}: {
  wallet: Wallet<Provider>
  networks: Network[]
  onConnect: () => void
}) => {
  const [connecting, setConnecting] = useState(false)
  const [selectedNetworks, setSelectedNetworks] = useState<Network[]>(wallet.supportedChains)
  const { connect } = useAccounts()

  const onSelectNetwork = (network: Network) => {
    setSelectedNetworks(prev => (prev.includes(network) ? prev.filter(net => net !== network) : [...prev, network]))
  }

  const handleConnect = async () => {
    setConnecting(true)

    connect(wallet.provider)
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
      <div className="text-thor-gray mb-3 hidden px-8 text-base font-semibold md:block">Chains</div>

      <div className="flex flex-1 overflow-hidden">
        <ScrollArea className="flex-1 px-4 md:mb-4 md:px-8">
          <div
            className="grid flex-1 grid-flow-col gap-2"
            style={{
              gridTemplateRows: `repeat(${Math.ceil(networks.length / 2)}, minmax(0, 1fr))`,
              gridTemplateColumns: 'repeat(2, 1fr)'
            }}
          >
            {networks.map(network => {
              const isSelected = selectedNetworks.includes(network)
              const isAvailable = wallet.supportedChains.includes(network)
              const isComingSoon = network === Network.Solana || network === Network.Monero

              return (
                <div
                  key={network}
                  className={cn('flex items-center gap-3 rounded-2xl border-1 border-transparent px-4 py-3', {
                    'border-runes-blue': isSelected,
                    'opacity-25': !isAvailable,
                    'hover:bg-blade cursor-pointer': isAvailable
                  })}
                  onClick={() => isAvailable && onSelectNetwork(network)}
                >
                  <Image src={`/networks/${network.toLowerCase()}.svg`} alt={network} width="24" height="24" />
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

      <div className="flex p-4 md:justify-end md:px-8 md:pt-0 md:pb-8">
        <ThemeButton
          variant="primaryMedium"
          className="w-full md:w-auto"
          disabled={connecting || selectedNetworks.length === 0}
          onClick={() => handleConnect()}
        >
          {connecting && <LoaderCircle size={20} className="animate-spin" />}
          Connect {wallet.label}
        </ThemeButton>
      </div>
    </>
  )
}
