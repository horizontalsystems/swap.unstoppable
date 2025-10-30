import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Asset } from '@/components/swap/asset'
import { cn } from '@/lib/utils'

export function AssetIcon({ asset }: { asset: Asset | undefined }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="bg-blade relative flex h-8 w-8 rounded-full">
      {asset && (
        <>
          {!isNativeAsset(asset) && (
            <Image
              className="outline-lawrence bg-lawrence absolute -top-1 -right-1 h-4 w-4 rounded-md"
              src={`/networks/${asset.chain.toLowerCase()}.svg`}
              alt={asset.chain.toLowerCase()}
              width={16}
              height={16}
            />
          )}
          {asset.logoURI && (
            <img
              className={cn('shrink-0 rounded-full', { 'opacity-0': !loaded })}
              src={asset.logoURI}
              alt={asset.ticker}
              width={32}
              height={32}
              onLoad={() => setLoaded(true)}
              onError={() => setLoaded(false)}
            />
          )}
        </>
      )}
    </div>
  )
}

function isNativeAsset(asset: Asset): boolean {
  return (
    ['THOR.RUNE', 'BSC.BNB', 'GAIA.ATOM'].includes(asset.identifier) ||
    asset.chain.toLowerCase() === asset.ticker.toLowerCase()
  )
}
