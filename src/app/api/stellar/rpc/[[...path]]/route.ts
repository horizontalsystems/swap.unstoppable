import { NextRequest } from 'next/server'
import { guardStellarRoute } from '@/lib/stellar/guard'

// Horizon REST and Soroban RPC, proxied so the ValidationCloud key stays server-side.
//
// ValidationCloud serves both protocols off one `<host>/<apiKey>` base, which is why a single
// catch-all covers them: Horizon reads arrive as `/accounts/G…`, `/transactions`, `/paths/…`,
// while Soroban JSON-RPC arrives as a POST to the route root. Without a key we fall back to the
// public endpoints, which are rate-limited enough to drop routes under a real fan-out but keep
// development working.

const PUBLIC_HORIZON = 'https://horizon.stellar.org'
const PUBLIC_SOROBAN = 'https://mainnet.sorobanrpc.com'

// hop-by-hop and body-framing headers that must not be copied onto a new request
const STRIPPED = new Set(['host', 'connection', 'content-length', 'accept-encoding', 'cookie', 'origin', 'referer'])

const vendorBase = (): string | undefined => {
  const apiKey = process.env.VALIDATION_CLOUD_API_KEY
  if (!apiKey) return undefined
  const host = (process.env.VALIDATION_CLOUD_HOST ?? 'https://mainnet.stellar.validationcloud.io/v1').replace(/\/+$/, '')
  return `${host}/${apiKey}`
}

const resolveTarget = (path: string[], method: string): string => {
  const vendor = vendorBase()
  if (vendor) return `${vendor}${path.length ? `/${path.join('/')}` : ''}`

  // No vendor key: a bodied request to the root is Soroban JSON-RPC, everything else is Horizon.
  if (!path.length && method === 'POST') return PUBLIC_SOROBAN
  return `${PUBLIC_HORIZON}${path.length ? `/${path.join('/')}` : ''}`
}

// Horizon reads, Soroban simulation and the 5s tracking poll all land here.
const RATE_LIMIT = 360

const proxy = async (req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) => {
  const refused = guardStellarRoute(req, { limit: RATE_LIMIT })
  if (refused) return refused

  const { path } = await ctx.params
  const target = new URL(resolveTarget(path ?? [], req.method))
  target.search = req.nextUrl.search

  const headers = new Headers()
  req.headers.forEach((value, key) => {
    if (!STRIPPED.has(key.toLowerCase())) headers.set(key, value)
  })

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      cache: 'no-store'
    })

    // Statuses pass through: the SDK reads a Horizon 404 as "no account" and a 4xx submit body as
    // the transaction's result codes, so collapsing them here would lose the outcome.
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
        'cache-control': 'no-store'
      }
    })
  } catch (error) {
    return Response.json({ error: `stellar rpc request failed: ${(error as Error).message}` }, { status: 502 })
  }
}

export const GET = proxy
export const POST = proxy

export const dynamic = 'force-dynamic'
// Horizon holds POST /transactions open until the tx is in a ledger — don't cut submission short.
export const maxDuration = 60
