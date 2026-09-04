import type { ProviderError as SdkProviderError } from 'stellar-web-sdk'
import { STELLAR_LOG_PATH } from '@/lib/stellar/upstreams'
import { AppProviderName, TxStatus } from '@/types'

// Client half of the Deliverable 6 observability path. Every call is fire-and-forget: reporting is
// never allowed to fail, delay, or throw into a swap. A logging outage must not become a swap
// outage.

type StellarLogEvent =
  | {
      kind: 'routing'
      pair: string
      sellAmount: string
      /** Per-provider wall-clock, ms — the SDK measures these because it made the calls itself. */
      timings: Record<string, number>
      /** Venues that answered, best first. */
      routes: { provider: string; expectedBuyAmount: string; minBuyAmount: string | null }[]
      /** Venues that declined, and why. The only place a missing provider is explained. */
      declined: { provider: string; errorCode?: string; error?: string }[]
      selected?: string
    }
  | {
      kind: 'execution'
      provider: AppProviderName
      pair: string
      outcome: 'submitted' | 'failed'
      /** Public on-chain identifier; present on a partial broker fill too. */
      hash?: string
      errorCode?: string
      error?: string
      /** StellarBroker signs up to five transactions per session; this is how many it signed. */
      signedCount?: number
    }
  | {
      kind: 'tracking'
      provider: string
      pair: string
      status: TxStatus
      hash?: string
      /** Cross-chain routes settle over several legs; this is how far along it is. */
      legs?: { type?: string; status?: string }[]
    }

const send = (event: StellarLogEvent): void => {
  if (typeof window === 'undefined') return

  const body = JSON.stringify(event)

  // sendBeacon survives the page being closed mid-swap, which is exactly when an execution outcome
  // is most worth having. It is not available everywhere, so fetch is the fallback.
  try {
    if (navigator.sendBeacon?.(STELLAR_LOG_PATH, new Blob([body], { type: 'application/json' }))) return
  } catch {
    // fall through to fetch
  }

  void fetch(STELLAR_LOG_PATH, { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {})
}

/** What the solver saw and what it picked — Deliverable 6's "routing decisions are logged". */
export const logRouting = (args: {
  pair: string
  sellAmount: string
  timings: Record<string, number>
  routes: { providers: string[]; expectedBuyAmount: string; minBuyAmount?: string | null }[]
  providerErrors: SdkProviderError[]
  selected?: string
}): void =>
  send({
    kind: 'routing',
    pair: args.pair,
    sellAmount: args.sellAmount,
    timings: args.timings,
    routes: args.routes.map(r => ({
      provider: r.providers[0],
      expectedBuyAmount: r.expectedBuyAmount,
      minBuyAmount: r.minBuyAmount ?? null
    })),
    declined: args.providerErrors.map(e => ({ provider: e.provider, errorCode: e.errorCode, error: e.error })),
    selected: args.selected
  })

/** Whether a swap was broadcast, and what went wrong when it wasn't. */
export const logExecution = (args: {
  provider: AppProviderName
  pair: string
  outcome: 'submitted' | 'failed'
  hash?: string
  error?: { code?: string; message?: string }
  signedCount?: number
}): void =>
  send({
    kind: 'execution',
    provider: args.provider,
    pair: args.pair,
    outcome: args.outcome,
    hash: args.hash,
    errorCode: args.error?.code,
    error: args.error?.message,
    signedCount: args.signedCount
  })

/** Each observed status change, so a swap's progress and failures are visible after the fact. */
export const logTracking = (args: {
  provider: string
  pair: string
  status: TxStatus
  hash?: string
  legs?: { type?: string; status?: string }[]
}): void => send({ kind: 'tracking', ...args })
