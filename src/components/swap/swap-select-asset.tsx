import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Credenza, CredenzaContent, CredenzaHeader, CredenzaTitle } from '@/components/ui/credenza'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Search } from 'lucide-react'
import { Asset } from '@/components/swap/asset'
import { Input } from '@/components/ui/input'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { AssetIcon } from '@/components/asset-icon'
import { Chain } from '@swapkit/core'
import { chainLabel } from '@/components/connect-wallet/config'
import { useAssets } from '@/hooks/use-assets'
import { useVirtualizer } from '@tanstack/react-virtual'

const FEATURED_ASSETS = [
  'AVAX.AVAX',
  'BASE.ETH',
  'BCH.BCH',
  'BSC.BNB',
  'BTC.BTC',
  'DOGE.DOGE',
  'ETH.ETH',
  'GAIA.ATOM',
  'LTC.LTC',
  'TRON.TRX',
  'XRP.XRP',
  'THOR.RUNE',
  'OP.ETH',
  'ARB.ETH',
  'BERA.BERA',
  'SOL.SOL',
  'POL.POL',
  'GNO.xDAI',
  'ZEC.ZEC',
  'NEAR.NEAR'
]

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
    const query = searchQuery.toLowerCase()

    const filteredAssets = () => {
      if (!searchQuery) {
        if (selectedChain === Filter.All) {
          return assets.filter(asset => FEATURED_ASSETS.includes(asset.identifier))
        } else {
          return assets
        }
      }

      return assets.filter(asset => {
        const ticker = asset.ticker.toLowerCase()
        const name = (asset.name || '').toLowerCase()

        return ticker.includes(query) || name.includes(query)
      })
    }

    return filteredAssets().sort((a, b) => {
      const aTickerLower = a.ticker.toLowerCase()
      const bTickerLower = b.ticker.toLowerCase()

      const getPriority = (asset: Asset) => {
        if (query) {
          const ticker = asset.ticker.toLowerCase()

          if (ticker === query) return 1
          if (ticker.startsWith(query)) return 2
          if (ticker.includes(query)) return 3

          const name = (asset.name || '').toLowerCase()

          if (name.startsWith(query)) return 4
          if (name.includes(query)) return 5
        }

        const isFeatured = FEATURED_ASSETS.includes(asset.identifier)

        if (isFeatured) return 6

        return 7
      }

      const aPriority = getPriority(a)
      const bPriority = getPriority(b)

      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }

      return aTickerLower.localeCompare(bTickerLower)
    })
  }, [chainMap, selectedChain, searchQuery])

  const handleChainSelect = (chain: FilterChain) => {
    setSelectedChain(chain)
  }

  const handleAssetSelect = (asset: Asset) => {
    onSelectAsset(asset)
    onOpenChange(false)
  }

  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: chainAssets.length,
    getScrollElement: () => {
      return parentRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
    },
    estimateSize: () => 70,
    overscan: 5
  })

  useEffect(() => {
    const ref = parentRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
    if (ref) {
      ref.scrollTop = 0
    }
  }, [chainAssets])

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        virtualizer.measure()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isOpen, virtualizer])

  return (
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent className="flex max-h-5/6 flex-col">
        <CredenzaHeader>
          <CredenzaTitle>Select coin</CredenzaTitle>
        </CredenzaHeader>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
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

          <div className="mt-2 flex min-h-0 flex-1 flex-col md:mt-0">
            <div className="relative mx-4 md:mr-8 md:ml-0">
              <Search className="text-thor-gray absolute top-1/2 left-4 -translate-y-1/2 transform" size={24} />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-blade rounded-3xl border-0 py-3 pl-12"
                tabIndex={isMobile ? -1 : 0}
              />
            </div>

            <div className="mt-4 flex min-h-0 flex-1">
              <ScrollArea className="flex-1" ref={parentRef}>
                <div
                  style={{
                    height: `${virtualizer.getTotalSize() + 20}px`,
                    width: '100%',
                    position: 'relative'
                  }}
                >
                  {virtualizer.getVirtualItems().map(virtualItem => {
                    const asset = chainAssets[virtualItem.index]

                    return (
                      <div
                        key={virtualItem.key}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`
                        }}
                      >
                        <div
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
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </CredenzaContent>
    </Credenza>
  )
}
