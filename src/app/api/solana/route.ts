import { NextRequest, NextResponse } from 'next/server'
import { apiError, methodNotAllowed } from '@/lib/api-error'
import { rateLimit } from '@/lib/rate-limit'
import { isSameOrigin } from '@/lib/same-origin'

// Server-side proxy for the Solana JSON-RPC calls the SDK's toolbox makes. No
// free endpoint works from a browser: api.mainnet-beta.solana.com answers a
// server fine but returns 403 to anything carrying an `Origin` header,
// publicnode blocks `getTokenAccountsByOwner` (half of what a balance asks
// for), and the rest want a key. Coming from our own origin sidesteps both, and
// keeps the key server-side when SOLANA_RPC_URL points at a paid endpoint.
const UPSTREAM = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'

// A batch of balance calls is a few KB; anything beyond this is not the toolbox.
const MAX_BODY_BYTES = 100_000

// Enough for the 30s balance refresh plus a swap in flight, per client per the
// limiter's 10-minute window.
const RATE_LIMIT = 600

// Every JSON-RPC method the toolbox needs is allowed -- pinning the list down
// would break a swap the day the SDK reaches for one more -- but the shape is
// checked so this cannot be used to POST arbitrary bodies at the upstream.
function isJsonRpc(payload: unknown): boolean {
  if (Array.isArray(payload)) return payload.length > 0 && payload.every(isJsonRpc)
  if (!payload || typeof payload !== 'object') return false

  return typeof (payload as { method?: unknown }).method === 'string'
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return apiError(
      403,
      'forbidden',
      'Cross-origin requests are not allowed',
      'This proxy only serves the Unstoppable Swap frontend. Use your own Solana RPC endpoint instead.'
    )
  }

  const retryAfter = rateLimit(req, 'solana', RATE_LIMIT)
  if (retryAfter !== null) {
    return apiError(429, 'rate_limited', 'Too many requests', `Retry after ${retryAfter} seconds (see the Retry-After header).`, {
      'Retry-After': String(retryAfter)
    })
  }

  const body = await req.text()
  if (body.length > MAX_BODY_BYTES) {
    return apiError(413, 'payload_too_large', 'Request body is too large', `Solana JSON-RPC requests are limited to ${MAX_BODY_BYTES} bytes.`)
  }

  try {
    if (!isJsonRpc(JSON.parse(body))) throw new Error('not a JSON-RPC request')
  } catch {
    return apiError(400, 'bad_request', 'Invalid JSON-RPC request', 'The body must be a JSON-RPC request object, or an array of them.')
  }

  const upstream = await fetch(UPSTREAM, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    cache: 'no-store'
  }).catch(() => null)

  if (!upstream) {
    return apiError(502, 'upstream_unreachable', 'The Solana RPC is unreachable', 'The upstream node did not respond. Retry in a moment.')
  }

  const payload = await upstream.text()
  return new NextResponse(payload, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
      'Cache-Control': 'no-store'
    }
  })
}

export const GET = methodNotAllowed(['POST'])
export const PUT = methodNotAllowed(['POST'])
export const PATCH = methodNotAllowed(['POST'])
export const DELETE = methodNotAllowed(['POST'])
