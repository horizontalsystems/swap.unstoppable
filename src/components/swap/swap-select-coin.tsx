'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { Network, networkLabel } from 'rujira.js'
import { Asset } from '@/components/swap/asset'
import { usePools } from '@/hook/use-pools'
import { cn } from '@/lib/utils'
import Image from 'next/image'

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
  const chainAssets = chains.get(selectedChain) || []
  const handleChainSelect = (chain: Network) => {
    setSelectedChain(chain)
  }

  const handleAssetSelect = (asset: Asset) => {
    onSelectAsset(asset)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-3xl min-w-2xl gap-0 border-gray-800 bg-gray-900 p-0 text-white">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center justify-between text-2xl font-medium text-white">
            Select Coin
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1">
          {/* Left Side - Chains */}
          <div className="w-1/2 border-r border-gray-800 p-6 pt-0">
            <h3 className="mb-4 text-sm font-medium text-gray-400">Chains</h3>
            <div className="h-full max-h-[400px] space-y-2 overflow-y-auto">
              {networks.map((network, index) => (
                <button
                  key={index}
                  onClick={() => handleChainSelect(network)}
                  className={`flex w-full items-center gap-3 rounded-lg p-3 hover:bg-gray-800 ${
                    selectedChain === network ? 'border border-green-500 bg-gray-800' : 'border border-transparent'
                  }`}
                >
                  <div className="flex h-8 w-8 items-center rounded-lg">
                    <Image src={`/networks/${network}.png`} alt="" width="32" height="32" />
                  </div>
                  <div className="flex w-full h-8 items-center text-sm font-bold text-white">{networkLabel(network)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Side - Assets */}
          <div className="w-1/2 p-6 pt-0">
            <h3 className="mb-4 text-sm font-medium text-gray-400">Assets</h3>

            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400" size={18} />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="border-gray-700 bg-gray-800 pl-10 text-white placeholder-gray-400 focus:border-gray-600 focus:ring-0"
              />
            </div>

            {/* Asset List */}
            <div className="h-full max-h-[400px] space-y-2 overflow-y-auto">
              {chainAssets.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleAssetSelect(item)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-transparent p-3 transition-all hover:border-gray-700 hover:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white"></div>
                    <div className="text-left">
                      <div className="font-medium text-white">{item.metadata.symbol}</div>
                      <div className="text-sm text-gray-400">{networkLabel(item.chain)}</div>
                    </div>
                  </div>
                  {item.asset === selected?.asset && (
                    <div
                      className={cn('rounded border px-2 py-1 text-xs font-medium', {
                        'border-green-500': isInput,
                        'text-green-400': isInput,
                        'border-yellow-500': !isInput,
                        'text-yellow-400': !isInput
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
