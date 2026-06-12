import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Credenza, CredenzaContent, CredenzaHeader, CredenzaTitle } from '@/components/ui/credenza'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SwapRouteBadge } from '@/components/swap/swap-route-badge'
import { SwapRouteCard } from '@/components/swap/swap-route-card'
import { useQuote } from '@/hooks/use-quote'
import { useAssetFrom, useAssetTo, useSwap } from '@/hooks/use-swap'
import { findFasterIndex } from '@/lib/swap-helpers'
import { cn } from '@/lib/utils'

interface SwapRouteDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const SwapRouteDialog = ({ isOpen, onOpenChange }: SwapRouteDialogProps) => {
  const t = useTranslations('swap.route')
  const assetFrom = useAssetFrom()
  const assetTo = useAssetTo()
  const { valueFrom } = useSwap()
  const { quotes, selectedIndex, setSelectedIndex } = useQuote()

  const fasterIndex = useMemo(() => findFasterIndex(quotes), [quotes])

  if (!assetFrom || !assetTo) return null

  return (
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent className="flex h-auto max-h-5/6 flex-col md:max-w-md">
        <CredenzaHeader>
          <CredenzaTitle>{t('chooseRoute')}</CredenzaTitle>
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
                badge={<SwapRouteBadge index={index} fasterIndex={fasterIndex} />}
                showRiskLevel
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
