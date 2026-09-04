import { NextRequest } from 'next/server'
import { guardStellarRoute } from '@/lib/stellar/guard'

// Deliverable 6's observability sink. The Stellar stack runs entirely in the browser — routing,
// execution and tracking all happen client-side — so nothing about a swap reaches a server unless
// the page reports it. This endpoint is that report, written to the standard output of whatever
// runs the standalone build, where the platform's log collector picks it up.
//
// Deliberately NOT logged: wallet addresses. A transaction hash already resolves to them on a
// public explorer, so recording them here would add a store of user identifiers without adding
// anything an operator cannot already look up.

export type StellarLogKind = 'routing' | 'execution' | 'tracking'

const KINDS = new Set<StellarLogKind>(['routing', 'execution', 'tracking'])

// One event is a few hundred bytes; anything larger is not one of ours.
const MAX_BODY_BYTES = 8_192

/** A routing event per quote, an execution event per swap, a tracking event per transition. */
const RATE_LIMIT = 120

export async function POST(req: NextRequest) {
  // Without this, anyone could flood the log stream or forge 'execution' events into the data the
  // monitoring runbook is read from.
  const refused = guardStellarRoute(req, { limit: RATE_LIMIT })
  if (refused) return refused

  const raw = await req.text()

  // Byte length, not string length: `raw.length` counts UTF-16 code units, so a multi-byte payload
  // would slip through at roughly twice the intended cap.
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    return Response.json({ error: 'event too large' }, { status: 413 })
  }

  let event: Record<string, unknown>
  try {
    event = JSON.parse(raw)
  } catch {
    return Response.json({ error: 'malformed event' }, { status: 400 })
  }

  const kind = event.kind
  if (typeof kind !== 'string' || !KINDS.has(kind as StellarLogKind)) {
    return Response.json({ error: 'unknown event kind' }, { status: 400 })
  }

  // A single line of JSON per event, so the logs stay greppable and machine-readable.
  console.log(
    JSON.stringify({
      at: new Date().toISOString(),
      source: 'stellar',
      ...event
    })
  )

  return new Response(null, { status: 204 })
}

export const dynamic = 'force-dynamic'
