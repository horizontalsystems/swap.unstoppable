import Image from 'next/image'
import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export function AssetIcon({ url }: { url: string | null }) {
  const [loading, setLoading] = useState(true)

  if (!url) {
    return <Skeleton className="h-10 w-10 rounded-full" />
  }

  return (
    <div className="relative h-10 w-10">
      {loading && <Skeleton className="absolute inset-0 h-10 w-10 rounded-full" />}
      <Image
        className="rounded-full"
        src={url}
        alt=""
        width={40}
        height={40}
        onLoad={() => setLoading(false)}
      />
    </div>
  )
}
