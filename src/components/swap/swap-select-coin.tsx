'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { Network, networkLabel } from 'rujira.js'
import { Asset } from '@/components/swap/asset'
import { usePools } from '@/hook/use-pools'
import { cn } from '@/lib/utils'

interface SelectCoinDialogProps {
  isOpen: boolean
  isInput: boolean
  onClose: () => void
  selected?: Asset
  onSelectAsset: (asset: Asset) => void
}

export function SwapSelectCoin({ isOpen, onClose, selected, onSelectAsset, isInput }: SelectCoinDialogProps) {
  const [selectedChain, setSelectedChain] = useState<Network>(Network.Bitcoin)
  const [searchQuery, setSearchQuery] = useState('')

  const { pools } = usePools()

  const chains: Map<Network, Asset[]> = new Map()
  const items = pools || []

  for (let i = 0; i < items.length; i++) {
    const asset = items[i]
    const list = chains.get(asset.chain)

    if (list) {
      list.push(asset)
    } else {
      chains.set(asset.chain, [asset])
    }
  }

  const networks = Array.from(chains.keys())
  const chainAssets = (chains.get(selectedChain) || []).filter(asset => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return asset.metadata.symbol.toLowerCase().includes(query)
  })

  const handleChainSelect = (chain: Network) => {
    setSelectedChain(chain)
  }

  const handleAssetSelect = (asset: Asset) => {
    onSelectAsset(asset)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-deep-black w-full max-w-3xl gap-0 p-0 md:h-auto md:max-h-[90vh] md:min-w-2xl">
        <DialogHeader className="hidden p-6 pb-4 md:block">
          <DialogTitle className="text-2xl font-medium text-white">Select Coin</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row">
          <div className="flex-1 border-b p-6 sm:pt-4 md:border-r md:border-b-0 md:pt-0">
            <h3 className="text-gray mb-4 text-sm font-medium">Chains</h3>
            <div className="h-full max-h-[30vh] space-y-1 overflow-y-auto md:max-h-[60vh]">
              {networks.map((network, index) => (
                <button
                  key={index}
                  onClick={() => handleChainSelect(network)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 hover:bg-neutral-900 ${
                    selectedChain === network ? 'border-runes-blue' : 'border-transparent'
                  }`}
                >
                  <div className="flex h-8 w-8 items-center rounded-lg">
                    <Image src={`/networks/${network}.svg`} alt="" width="32" height="32" />
                  </div>
                  <div className="flex h-8 w-full items-center text-sm font-bold text-white">
                    {networkLabel(network)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 p-6 sm:pt-4 md:pt-0">
            <h3 className="text-gray mb-4 text-sm font-medium">Assets</h3>

            <div className="relative mb-4">
              <Search className="text-gray absolute top-1/2 left-3 -translate-y-1/2 transform" size={18} />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-blade text-gray pl-10 placeholder-gray-400"
              />
            </div>

            <div className="h-full max-h-[30vh] space-y-1 overflow-y-auto md:max-h-[60vh]">
              {chainAssets.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleAssetSelect(item)}
                  className="flex w-full items-center justify-between border border-transparent p-3 transition-all hover:bg-neutral-900"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 rounded-full">
                      <Image src={`/coins/${item.metadata.symbol}.svg`} alt="" width="32" height="32" />
                    </div>
                    <div className="text-left">
                      <div className="text-leah font-semibold">{item.metadata.symbol}</div>
                      <div className="text-gray text-sm">{networkLabel(item.chain)}</div>
                    </div>
                  </div>
                  {item.asset === selected?.asset && (
                    <div
                      className={cn('rounded-full border px-2 py-1 text-xs font-medium', {
                        'border-green-500 text-green-400': isInput,
                        'border-yellow-500 text-yellow-400': !isInput
                      })}
                    >
                      {isInput ? 'INPUT' : 'OUTPUT'}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
