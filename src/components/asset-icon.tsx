import Image from 'next/image'
import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Asset } from 'rujira.js'

export function AssetIcon({ asset }: { asset: Asset | undefined }) {
  const [loading, setLoading] = useState(true)

  if (!asset) {
    return <Skeleton className="h-8 w-8 rounded-full" />
  }

  return (
    <div className="relative h-8 w-8">
      {loading && <Skeleton className="absolute inset-0 h-8 w-8 rounded-full" />}
      {!loading && !isNativeAsset(asset) && (
        <Image
          className="outline-lawrence bg-lawrence absolute -top-1 -right-1 h-4 w-4 rounded-md"
          src={`/networks/${asset.chain.toLowerCase()}.svg`}
          alt={asset.chain.toLowerCase()}
          width={16}
          height={16}
        />
      )}
      <Image
        className="rounded-full"
        src={`/coins/${asset.metadata.symbol.toLowerCase()}.svg`}
        alt={asset.metadata.symbol}
        width={32}
        height={32}
        onLoad={() => setLoading(false)}
      />
    </div>
  )
}

function isNativeAsset(asset: Asset): boolean {
  return (
    ['THOR.RUNE', 'BSC.BNB', 'GAIA.ATOM'].includes(asset.asset) ||
    asset.chain.toLowerCase() === asset.metadata.symbol.toLowerCase()
  )
}
