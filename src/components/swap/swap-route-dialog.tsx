import { useMemo } from 'react'
import { Credenza, CredenzaContent, CredenzaHeader, CredenzaTitle } from '@/components/ui/credenza'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SwapRouteCard } from '@/components/swap/swap-route-card'
import { useQuote } from '@/hooks/use-quote'
import { useAssetFrom, useAssetTo, useSwap } from '@/hooks/use-swap'
import { cn } from '@/lib/utils'

interface SwapRouteDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const SwapRouteDialog = ({ isOpen, onOpenChange }: SwapRouteDialogProps) => {
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const { valueFrom } = useSwap()
  const { quotes, selectedIndex, setSelectedIndex } = useQuote()

  const fasterIndex = useMemo(() => {
    if (quotes.length < 2) return -1
    const times = quotes.slice(1).map(r => r.estimatedTime?.total ?? Infinity)
    const min = Math.min(...times)
    return min === Infinity ? -1 : times.indexOf(min) + 1
  }, [quotes])

  if (!assetFrom || !assetTo) return null

  return (
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent className="flex h-auto max-h-5/6 flex-col md:max-w-md">
        <CredenzaHeader>
          <CredenzaTitle>Choose Route</CredenzaTitle>
        </CredenzaHeader>

        <ScrollArea className="relative flex min-h-0 flex-1 px-4 md:px-8" classNameViewport="flex-1 h-auto">
          <div className="space-y-2.5 pb-4">
            {quotes.map((route, index) => (
              <SwapRouteCard
                key={route.providers[0]}
                route={route}
                valueFrom={valueFrom}
                assetFromTicker={assetFrom.ticker}
                assetToTicker={assetTo.ticker}
                estimatedTime={route.estimatedTime}
                badge={
                  index === 0 ? (
                    <span className="text-remus border-remus rounded-lg border px-1.5 text-[10px] font-semibold">BEST PRICE</span>
                  ) : index === fasterIndex ? (
                    <span className="text-jacob border-jacob rounded-lg border px-1.5 text-[10px] font-semibold">FASTER</span>
                  ) : undefined
                }
                showAmlBadge
                showAmount
                className={cn('cursor-pointer transition-colors', index === selectedIndex && 'border-remus')}
                onClick={() => {
                  setSelectedIndex(index)
                  onOpenChange(false)
                }}
              />
            ))}
          </div>
        </ScrollArea>
      </CredenzaContent>
    </Credenza>
  )
}
