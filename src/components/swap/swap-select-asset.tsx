import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Credenza, CredenzaContent, CredenzaHeader, CredenzaTitle } from '@/components/ui/credenza'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Search } from 'lucide-react'
import { Network, networkLabel } from 'rujira.js'
import { Asset } from '@/components/swap/asset'
import { Input } from '@/components/ui/input'
import { useIsMobile } from '@/hooks/use-mobile'
import { usePools } from '@/hooks/use-pools'
import { cn } from '@/lib/utils'

interface SwapSelectAssetProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  selected?: Asset
  onSelectAsset: (asset: Asset) => void
}

enum Filter {
  All = 'All'
}

type FilterNetwork = Network | Filter

export const SwapSelectAsset = ({ isOpen, onOpenChange, selected, onSelectAsset }: SwapSelectAssetProps) => {
  const isMobile = useIsMobile()
  const [selectedChain, setSelectedChain] = useState<FilterNetwork>(Filter.All)
  const [searchQuery, setSearchQuery] = useState('')

  const { pools } = usePools()

  const chains: Map<FilterNetwork, Asset[]> = useMemo(() => {
    if (!pools?.length) return new Map()

    const chainsMap: Map<FilterNetwork, Asset[]> = new Map()
    const allAssets: Asset[] = []

    for (const asset of pools) {
      allAssets.push(asset)

      const chainAssets = chainsMap.get(asset.chain)
      if (chainAssets) {
        chainAssets.push(asset)
      } else {
        chainsMap.set(asset.chain, [asset])
      }
    }

    chainsMap.set(Filter.All, allAssets)

    return chainsMap
  }, [pools])

  const networks = useMemo(() => {
    const networkKeys = Array.from(chains.keys())
    const priorityOrder = [Filter.All, Network.Bitcoin, Network.Ethereum]

    return networkKeys.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a)
      const bIndex = priorityOrder.indexOf(b)

      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex
      }

      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1

      return a.localeCompare(b)
    })
  }, [chains])

  const chainAssets = useMemo(() => {
    const assets = chains.get(selectedChain) || []
    const filteredAssets = !searchQuery
      ? assets
      : assets.filter(asset => {
          return asset.metadata.symbol.toLowerCase().includes(searchQuery.toLowerCase())
        })

    const symbolPriorityOrder = ['BTC.BTC', 'ETH.ETH', 'BSC.BNB', 'THOR.RUNE', 'AVAX.AVAX']

    return filteredAssets.sort((a, b) => {
      const symbolA = a.asset.toUpperCase()
      const symbolB = b.asset.toUpperCase()

      const aIndex = symbolPriorityOrder.indexOf(symbolA)
      const bIndex = symbolPriorityOrder.indexOf(symbolB)

      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex
      }

      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1

      return symbolA.localeCompare(symbolB)
    })
  }, [chains, selectedChain, searchQuery])

  const handleChainSelect = (chain: FilterNetwork) => {
    setSelectedChain(chain)
  }

  const handleAssetSelect = (asset: Asset) => {
    onSelectAsset(asset)
    onOpenChange(false)
  }

  return (
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent className="bg-lawrence min-h-1/2 w-full px-4 pb-0 md:min-w-2xl">
        <CredenzaHeader>
          <CredenzaTitle className="hidden text-2xl font-medium text-white md:block">Select coin</CredenzaTitle>
        </CredenzaHeader>
        <div className={cn('flex flex-col gap-0 md:flex-row md:gap-3', { 'h-full': isMobile })}>
          <div className="min-w-[250px] shrink-0 border-b md:border-r md:border-b-0">
            <ScrollArea className={cn({ 'h-full max-h-[30vh] md:max-h-[60vh]': !isMobile, 'w-full': isMobile })}>
              <div className={cn({ 'flex w-max gap-2': isMobile })}>
                {networks.map((network, index) => (
                  <div
                    key={index}
                    onClick={() => handleChainSelect(network)}
                    className={cn(
                      'm-0 flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 hover:bg-neutral-900 md:my-2 md:mr-3',
                      {
                        'border-runes-blue': selectedChain === network,
                        'py-0': isMobile
                      }
                    )}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full">
                      <Image
                        src={network === Filter.All ? '/icons/windows.svg' : `/networks/${network.toLowerCase()}.svg`}
                        alt=""
                        width="24"
                        height="24"
                      />
                    </div>
                    <span className="text-sm text-white">
                      {network === Filter.All ? 'All Networks' : networkLabel(network as Network)}
                    </span>
                  </div>
                ))}
              </div>
              {isMobile && <ScrollBar orientation="horizontal" />}
            </ScrollArea>
          </div>
          <div className="flex-1">
            <div className="relative mt-2">
              <Search className="text-gray absolute top-1/2 left-3 -translate-y-1/2 transform" size={18} />
              <Input
                placeholder="Type BTC or ETH for precise searches"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-blade text-gray pl-10 placeholder-gray-400"
              />
            </div>

            <ScrollArea className="h-full max-h-[35vh] md:max-h-[53vh]">
              {chainAssets.map((item, index) => (
                <div
                  key={index}
                  onClick={() => handleAssetSelect(item)}
                  className="my-2 flex items-center justify-between gap-3 rounded-lg border border-transparent p-3 transition-all hover:bg-neutral-900"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full">
                      <Image
                        src={`/coins/${item.metadata.symbol.toLowerCase()}.svg`}
                        alt={item.metadata.symbol}
                        width="32"
                        height="32"
                      />
                    </div>
                    <div className="text-left">
                      <div className="text-leah font-semibold">{item.metadata.symbol}</div>
                      <div className="text-gray text-sm">{networkLabel(item.chain)}</div>
                    </div>
                  </div>
                  {item.asset === selected?.asset && (
                    <div className={cn('rounded-full border px-2 py-1 text-xs font-medium')}>Selected</div>
                  )}
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>
      </CredenzaContent>
    </Credenza>
  )
}
