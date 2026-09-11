import { NextRequest, NextResponse } from 'next/server'
import { apiError, methodNotAllowed } from '@/lib/api-error'
import { rateLimit } from '@/lib/rate-limit'
import { isSameOrigin } from '@/lib/same-origin'

// Server-side proxy for the Alchemy calls the wallet-balance hook makes to
// discover ERC-20 tokens (src/hooks/use-wallet-balances.ts). The key in the
// Alchemy URL stays on the server instead of shipping in the client bundle, and
// the hook has a working endpoint whether or not the build was given one.
const UPSTREAM = process.env.ALCHEMY_ETH_RPC_URL

// A stalled upstream would otherwise hold the handler open indefinitely.
const UPSTREAM_TIMEOUT_MS = 15_000

// A balance request is a few hundred bytes; anything beyond this is not the hook.
const MAX_BODY_BYTES = 10_000

// One getTokenBalances plus a getTokenMetadata per held token, on every 30s
// balance refresh, per client per the limiter's 10-minute window.
const RATE_LIMIT = 600

// Only the two Alchemy-specific methods the hook needs, so the key cannot be
// used as a general-purpose Alchemy account by anyone who finds this route.
const METHODS = new Set(['alchemy_getTokenBalances', 'alchemy_getTokenMetadata'])

function isAllowedJsonRpc(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false

  return METHODS.has((payload as { method?: unknown }).method as string)
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return apiError(
      403,
      'forbidden',
      'Cross-origin requests are not allowed',
      'This proxy only serves the Unstoppable Swap frontend. Use your own Alchemy endpoint instead.'
    )
  }

  const retryAfter = rateLimit(req, 'alchemy', RATE_LIMIT)
  if (retryAfter !== null) {
    return apiError(429, 'rate_limited', 'Too many requests', `Retry after ${retryAfter} seconds (see the Retry-After header).`, {
      'Retry-After': String(retryAfter)
    })
  }

  if (!UPSTREAM) {
    return apiError(500, 'server_misconfigured', 'Server misconfiguration', 'ALCHEMY_ETH_RPC_URL is not set on the server.')
  }

  const body = await req.text()
  if (body.length > MAX_BODY_BYTES) {
    return apiError(413, 'payload_too_large', 'Request body is too large', `Alchemy requests are limited to ${MAX_BODY_BYTES} bytes.`)
  }

  try {
    if (!isAllowedJsonRpc(JSON.parse(body))) throw new Error('not an allowed JSON-RPC request')
  } catch {
    return apiError(400, 'bad_request', 'Invalid request', `The body must be a JSON-RPC request for one of: ${[...METHODS].join(', ')}.`)
  }

  const upstream = await fetch(UPSTREAM, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    cache: 'no-store',
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
  }).catch(() => null)

  if (!upstream) {
    return apiError(502, 'upstream_unreachable', 'Alchemy is unreachable', 'The upstream API did not respond. Retry in a moment.')
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
