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
import { AssetIcon } from '@/components/asset-icon'

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
    return Array.from(chains.keys()).sort((a, b) => {
      if (a === Filter.All) return -1
      if (b === Filter.All) return 1
      return networkLabel(a).localeCompare(networkLabel(b))
    })
  }, [chains])

  const chainAssets = useMemo(() => {
    const assets = chains.get(selectedChain) || []
    const filteredAssets = !searchQuery
      ? assets
      : assets.filter(asset => {
          return asset.metadata.symbol.toLowerCase().includes(searchQuery.toLowerCase())
        })

    return filteredAssets.sort((a, b) => {
      return a.metadata.symbol.toUpperCase().localeCompare(b.metadata.symbol.toUpperCase())
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
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Select coin</CredenzaTitle>
        </CredenzaHeader>

        <div className="flex flex-1 flex-col overflow-hidden border-b md:flex-row md:border-r md:border-b-0">
          <ScrollArea className="md:mr-8 md:w-2/5 md:pl-8">
            <div className="mx-4 mb-4 flex w-max gap-2 md:mx-0 md:mb-8 md:block md:w-full">
              {networks.map((network, index) => (
                <div
                  key={index}
                  onClick={() => handleChainSelect(network)}
                  className={cn(
                    'hover:bg-blade m-0 flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-4 py-2 md:mr-10 md:mb-2 md:py-3',
                    {
                      'border-runes-blue': selectedChain === network
                    }
                  )}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full">
                    <Image
                      src={network === Filter.All ? '/icons/windows.svg' : `/networks/${network.toLowerCase()}.svg`}
                      alt=""
                      width="24"
                      height="24"
                    />
                  </div>
                  <span className="text-leah text-sm">
                    {network === Filter.All ? 'All Networks' : networkLabel(network as Network)}
                  </span>
                </div>
              ))}
            </div>
            {isMobile && <ScrollBar orientation="horizontal" />}
          </ScrollArea>

          <div className="mt-2 flex flex-1 flex-col overflow-hidden md:mt-0">
            <div className="relative mx-4 md:mr-8 md:ml-0">
              <Search className="text-thor-gray absolute top-1/2 left-4 -translate-y-1/2 transform" size={24} />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-blade text-leah placeholder:text-andy rounded-3xl border-0 py-3 pl-12 focus:ring-0 focus-visible:ring-0 md:text-base"
              />
            </div>

            <div className="mt-4 flex flex-1 overflow-hidden">
              <ScrollArea className="flex-1">
                <div className="mb-4 md:mb-8">
                  {chainAssets.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => handleAssetSelect(item)}
                      className="hover:bg-blade mx-4 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-transparent px-4 py-3 md:mr-8 md:ml-0"
                    >
                      <div className="flex items-center gap-3">
                        <AssetIcon asset={item} />
                        <div className="text-left">
                          <div className="text-leah font-semibold">{item.metadata.symbol}</div>
                          <div className="text-thor-gray text-sm">{networkLabel(item.chain)}</div>
                        </div>
                      </div>
                      {item.asset === selected?.asset && (
                        <div
                          className={cn(
                            'border-gray text-thor-gray rounded-full border px-1.5 py-0.5 text-xs font-medium'
                          )}
                        >
                          Selected
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </CredenzaContent>
    </Credenza>
  )
}
