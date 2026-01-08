import { useEffect, useRef, useState } from 'react'
import { Tooltip } from '@/components/tooltip'
import { RefetchOptions } from '@tanstack/react-query'
import { QuoteResponseRoute } from '@uswap/helpers/api'

const QUOTE_EXPIRATION_MS = 60000

interface SwapQuoteTimerProps {
  quote?: QuoteResponseRoute | undefined
  refetch: (options?: RefetchOptions) => void
  isLoading: boolean
}

export const SwapQuoteTimer = ({ quote, isLoading, refetch }: SwapQuoteTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState(QUOTE_EXPIRATION_MS)
  const [progress, setProgress] = useState(100)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const autoRefetchTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (quote && !isLoading) {
      setExpiresAt(Date.now() + QUOTE_EXPIRATION_MS)
    } else {
      setExpiresAt(null)
    }
  }, [quote, isLoading])

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (autoRefetchTimerRef.current) {
      clearTimeout(autoRefetchTimerRef.current)
      autoRefetchTimerRef.current = null
    }

    if (!expiresAt) {
      setTimeRemaining(QUOTE_EXPIRATION_MS)
      setProgress(100)
      return
    }

    const updateTimer = () => {
      const now = Date.now()
      const remaining = Math.max(0, expiresAt - now)
      const progressPercent = (remaining / QUOTE_EXPIRATION_MS) * 100

      setTimeRemaining(remaining)
      setProgress(progressPercent)
    }

    updateTimer()
    intervalRef.current = setInterval(updateTimer, 100)

    const timeUntilExpiration = expiresAt - Date.now()
    if (timeUntilExpiration > 0) {
      autoRefetchTimerRef.current = setTimeout(() => {
        refetch()
      }, timeUntilExpiration)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (autoRefetchTimerRef.current) {
        clearTimeout(autoRefetchTimerRef.current)
      }
    }
  }, [expiresAt, refetch])

  if (!quote || isLoading) {
    return null
  }

  const seconds = Math.ceil(timeRemaining / 1000)
  const strokeDasharray = 2 * Math.PI * 12
  const strokeDashoffset = strokeDasharray - (strokeDasharray * progress) / 100

  return (
    <Tooltip content="Refresh">
      <div className="relative cursor-pointer" onClick={() => refetch()}>
        <svg width="32" height="32" viewBox="0 0 28 28" className="-rotate-90">
          <circle cx="14" cy="14" r="12" fill="none" strokeWidth="2" className="stroke-blade" />
          <circle
            cx="14"
            cy="14"
            r="12"
            fill="none"
            strokeWidth="2"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="stroke-andy transition-all duration-100"
          />
        </svg>
        <span className="text-thor-gray absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform text-[12px] font-semibold">
          {seconds}
        </span>
      </div>
    </Tooltip>
  )
}
