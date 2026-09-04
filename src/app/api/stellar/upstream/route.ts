import { NextRequest } from 'next/server'
import { guardStellarRoute } from '@/lib/stellar/guard'
import { ALLOWED_UPSTREAM_HOSTS } from '@/lib/stellar/upstreams'

// Forwards one SDK provider call to its real upstream, attaching the credentials that must not
// reach the browser. The target rides in ?url= because the SDK's adapters build absolute upstream
// URLs themselves — the client fetch shim only rewrites the origin, it never rebuilds the path.
//
// The StellarBroker partner key is deliberately NOT handled here: it travels on the browser's own
// wss://api.stellar.broker/ws?partner= URL, so it is public by protocol design and ships as
// NEXT_PUBLIC_STELLARBROKER_PARTNER_KEY.

// hop-by-hop and body-framing headers that must not be copied onto a new request
const STRIPPED = new Set(['host', 'connection', 'content-length', 'accept-encoding', 'cookie', 'origin', 'referer'])

const credentialsFor = (host: string): Record<string, string> => {
  if (host === 'api.soroswap.finance' && process.env.SOROSWAP_API_KEY) {
    return { Authorization: `Bearer ${process.env.SOROSWAP_API_KEY}` }
  }
  return {}
}

// A quote fan-out is ~6 upstream calls; this leaves room for steady re-quoting without letting a
// scripted caller spend our Soroswap key freely.
const RATE_LIMIT = 240

const proxy = async (req: NextRequest) => {
  const refused = guardStellarRoute(req, { limit: RATE_LIMIT })
  if (refused) return refused

  const target = req.nextUrl.searchParams.get('url')
  if (!target) {
    return Response.json({ error: 'missing url parameter' }, { status: 400 })
  }

  let url: URL
  try {
    url = new URL(target)
  } catch {
    return Response.json({ error: 'malformed url parameter' }, { status: 400 })
  }

  if (url.protocol !== 'https:' || !ALLOWED_UPSTREAM_HOSTS.has(url.hostname)) {
    return Response.json({ error: `upstream not allowed: ${url.hostname}` }, { status: 403 })
  }

  const headers = new Headers()
  req.headers.forEach((value, key) => {
    if (!STRIPPED.has(key.toLowerCase())) headers.set(key, value)
  })
  for (const [key, value] of Object.entries(credentialsFor(url.hostname))) {
    headers.set(key, value)
  }

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      // the SDK applies its own per-provider time budget and aborts the client side
      cache: 'no-store'
    })

    // Pass the status through untouched: several of these APIs signal "no route" with a 4xx, and
    // only the SDK's adapter knows which status means what.
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
        'cache-control': 'no-store'
      }
    })
  } catch (error) {
    return Response.json({ error: `upstream request failed: ${(error as Error).message}` }, { status: 502 })
  }
}

export const GET = proxy
export const POST = proxy
