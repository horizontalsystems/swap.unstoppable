import Image from 'next/image'
import { useMemo, useState } from 'react'
import { Credenza, CredenzaContent, CredenzaHeader, CredenzaTitle } from '@/components/ui/credenza'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Search } from 'lucide-react'
import { Asset } from '@/components/swap/asset'
import { Input } from '@/components/ui/input'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { AssetIcon } from '@/components/asset-icon'
import { AssetValue, Chain } from '@swapkit/core'
import { chainLabel } from '@/components/connect-wallet/config'
import { useAssets } from '@/hooks/use-assets'

interface SwapSelectAssetProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  selected?: Asset
  onSelectAsset: (asset: Asset) => void
}

enum Filter {
  All = 'All'
}

type FilterChain = Chain | Filter

export const SwapSelectAsset = ({ isOpen, onOpenChange, selected, onSelectAsset }: SwapSelectAssetProps) => {
  const isMobile = useIsMobile()
  const [selectedChain, setSelectedChain] = useState<FilterChain>(Filter.All)
  const [searchQuery, setSearchQuery] = useState('')

  const { assets } = useAssets()

  const chainMap: Map<FilterChain, Asset[]> = useMemo(() => {
    if (!assets?.length) return new Map()

    const chainMap: Map<FilterChain, Asset[]> = new Map()
    const allAssets: Asset[] = []

    for (const asset of assets) {
      allAssets.push(asset)

      const chainAssets = chainMap.get(asset.chain)
      if (chainAssets) {
        chainAssets.push(asset)
      } else {
        chainMap.set(asset.chain, [asset])
      }
    }

    chainMap.set(Filter.All, allAssets)

    return chainMap
  }, [assets])

  const chains = useMemo(() => {
    return Array.from(chainMap.keys()).sort((a, b) => {
      if (a === Filter.All) return -1
      if (b === Filter.All) return 1
      return chainLabel(a).localeCompare(chainLabel(b))
    })
  }, [chainMap])

  const chainAssets = useMemo(() => {
    const assets = chainMap.get(selectedChain) || []
    const filteredAssets = !searchQuery
      ? assets
      : assets.filter(asset => {
          const assetValue = AssetValue.from({
            asset: asset.identifier
          })

          if (assetValue.isGasAsset && chainLabel(asset.chain).toLowerCase().includes(searchQuery.toLowerCase())) {
            return true
          }

          return asset.ticker.toLowerCase().includes(searchQuery.toLowerCase())
        })

    return filteredAssets.sort((a, b) => {
      return a.ticker.toLowerCase().localeCompare(b.ticker.toLowerCase())
    })
  }, [chainMap, selectedChain, searchQuery])

  const handleChainSelect = (chain: FilterChain) => {
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

        <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
          <ScrollArea className="border-b md:mr-8 md:w-2/5 md:border-r md:border-b-0 md:pl-8">
            <div className="mx-4 mb-4 flex w-max gap-2 md:mx-0 md:mb-8 md:block md:w-full">
              {chains.map((chain, index) => (
                <div
                  key={index}
                  onClick={() => handleChainSelect(chain)}
                  className={cn(
                    'hover:bg-blade/50 m-0 flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-4 py-2 md:mr-10 md:mb-2 md:py-3',
                    {
                      'border-runes-blue': selectedChain === chain
                    }
                  )}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full">
                    <Image
                      src={chain === Filter.All ? '/icons/windows.svg' : `/networks/${chain.toLowerCase()}.svg`}
                      alt=""
                      width="24"
                      height="24"
                    />
                  </div>
                  <span className="text-leah text-sm">{chain === Filter.All ? 'All Chains' : chainLabel(chain)}</span>
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
                  {chainAssets.map((asset, index) => (
                    <div
                      key={index}
                      onClick={() => handleAssetSelect(asset)}
                      className="hover:bg-blade/50 mx-4 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-transparent px-4 py-3 md:mr-8 md:ml-0"
                    >
                      <div className="flex items-center gap-3">
                        <AssetIcon key={asset.identifier} asset={asset} />
                        <div className="text-left">
                          <div className="text-leah max-w-30 truncate font-semibold">{asset.ticker}</div>
                          <div className="text-thor-gray text-sm">{chainLabel(asset.chain)}</div>
                        </div>
                      </div>
                      {asset.identifier === selected?.identifier && (
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
