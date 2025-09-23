import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Credenza, CredenzaContent, CredenzaDescription, CredenzaHeader, CredenzaTitle } from '@/components/ui/credenza'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
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
      <CredenzaContent className="bg-lawrence min-h-1/2 w-full gap-10 rounded-4xl border-0 p-12 pb-0 md:min-w-3xl">
        <CredenzaHeader>
          <CredenzaTitle className="text-leah hidden text-2xl font-medium md:block">Select coin</CredenzaTitle>
          <VisuallyHidden>
            <CredenzaDescription>&nbsp;</CredenzaDescription>
          </VisuallyHidden>
        </CredenzaHeader>
        <div className={cn('flex flex-col gap-0 md:flex-row md:gap-8', { 'h-full': isMobile })}>
          <div className="min-w-[280px] shrink-0 border-b md:border-r md:border-b-0">
            <ScrollArea className={cn({ 'h-full max-h-[30vh] md:max-h-[60vh]': !isMobile, 'w-full': isMobile })}>
              <div className={cn({ 'flex w-max gap-2': isMobile })}>
                {networks.map((network, index) => (
                  <div
                    key={index}
                    onClick={() => handleChainSelect(network)}
                    className={cn(
                      'hover:bg-blade m-0 flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-4 py-3 md:mr-10 md:mb-2',
                      {
                        'border-runes-blue': selectedChain === network,
                        'py-0': isMobile
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
          </div>
          <div className="flex-1">
            <div className="relative">
              <Search className="text-thor-gray absolute top-1/2 left-4 -translate-y-1/2 transform" size={24} />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-blade text-leah placeholder:text-andy rounded-3xl border-0 py-3 pl-12 focus:ring-0 focus-visible:ring-0 md:text-base"
              />
            </div>

            <ScrollArea className="mt-5 h-full max-h-[30vh] md:max-h-[51vh]">
              {chainAssets.map((item, index) => (
                <div
                  key={index}
                  onClick={() => handleAssetSelect(item)}
                  className="hover:bg-blade flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-transparent px-4 py-3"
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
                      className={cn('border-gray text-thor-gray rounded-full border px-1.5 py-0.5 text-xs font-medium')}
                    >
                      Selected
                    </div>
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
