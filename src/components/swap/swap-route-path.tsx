import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { SwapProvider } from '@/components/swap/swap-provider'
import { InfoTooltip } from '@/components/tooltip'
import { decodeStellarPath, directPath, RouteHop } from '@/lib/stellar/path'
import { QuoteResponseRoute } from '@/types'

interface SwapRoutePathProps {
  quote: QuoteResponseRoute
  fromTicker: string
  toTicker: string
}

/**
 * The execution path for a committed route: which venue fills it and, where the envelope says so,
 * the assets it hops through on the way.
 *
 * Real hops are only knowable for a path-payment envelope. A Soroban route hides its path inside
 * the contract call and StellarBroker has no envelope until it builds one mid-session, so those
 * fall back to the two assets the user picked — shown as the direct pair rather than an invented
 * route.
 */
export function SwapRoutePath({ quote, fromTicker, toTicker }: SwapRoutePathProps) {
  const t = useTranslations('swap.confirm')
  const [hops, setHops] = useState<RouteHop[]>(() => directPath(fromTicker, toTicker))

  useEffect(() => {
    let active = true
    decodeStellarPath(quote).then(decoded => {
      if (active && decoded?.length) setHops(decoded)
    })
    return () => {
      active = false
    }
  }, [quote])

  return (
    <div className="text-thor-gray flex items-start justify-between gap-4 text-sm font-semibold">
      <span className="flex items-center gap-1 font-normal">
        {t('executionPath')}
        <InfoTooltip>{t('executionPathTooltip')}</InfoTooltip>
      </span>

      <div className="flex flex-wrap items-center justify-end gap-x-1.5 gap-y-1">
        {hops.map((hop, index) => (
          <span key={`${hop.ticker}-${index}`} className="flex items-center gap-1.5">
            {index > 0 && <span className="text-thor-gray/60">→</span>}
            <span className={hop.intermediate ? 'text-thor-gray' : 'text-leah'}>{hop.ticker}</span>
          </span>
        ))}
        <span className="text-thor-gray/60">·</span>
        <SwapProvider provider={quote.providers[0]} />
      </div>
    </div>
  )
}
