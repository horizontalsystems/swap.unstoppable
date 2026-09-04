import { NextRequest } from 'next/server'

// Shared gate for the /api/stellar/* routes.
//
// These proxies exist to keep the Soroswap and ValidationCloud keys off the client, and they
// succeed at that — the values never reach the bundle. But an unauthenticated relay still lets a
// third party *use* those credentials, or burn the ValidationCloud quota until quoting degrades
// for real users. Same-origin plus a rate limit closes both without adding a session.

/**
 * Is this request from our own pages?
 *
 * `Sec-Fetch-Site` is the signal to lead with. Browsers set it on every fetch and it cannot be
 * spoofed by page script, whereas **`Origin` is not sent on a same-origin GET at all** — leading
 * with `Origin` would refuse the app's own Horizon reads. `Referer` is only a fallback because a
 * referrer policy can strip it.
 */
const sameOrigin = (req: NextRequest): boolean => {
  const self = req.nextUrl.origin

  // 'none' is a user-initiated navigation; 'same-origin' is our own page's fetch.
  const fetchSite = req.headers.get('sec-fetch-site')
  if (fetchSite) return fetchSite === 'same-origin' || fetchSite === 'none'

  const origin = req.headers.get('origin')
  if (origin) return origin === self

  const referer = req.headers.get('referer')
  if (referer) {
    try {
      return new URL(referer).origin === self
    } catch {
      return false
    }
  }

  // No browser signal at all: a non-browser caller. Allowed in development so curl and the
  // verification scripts keep working; refused in production.
  return process.env.NODE_ENV !== 'production'
}

interface Bucket {
  count: number
  resetAt: number
}

// Per-instance and in-memory on purpose: this is a spend brake, not a security boundary, and it
// must not add a datastore to a stateless deployment. A horizontally scaled deployment gets this
// limit per instance, which is still bounded.
const buckets = new Map<string, Bucket>()

const MAX_BUCKETS = 10_000

const clientKey = (req: NextRequest): string => req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'

const withinRate = (req: NextRequest, limit: number, windowMs: number): boolean => {
  const now = Date.now()
  const key = clientKey(req)
  const bucket = buckets.get(key)

  if (!bucket || now >= bucket.resetAt) {
    // Cheap bound on the map: drop everything expired once it grows past the cap.
    if (buckets.size > MAX_BUCKETS) {
      for (const [k, b] of buckets) if (now >= b.resetAt) buckets.delete(k)
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  bucket.count += 1
  return bucket.count <= limit
}

export interface GuardOptions {
  /** Requests allowed per window, per client. */
  limit: number
  windowMs?: number
}

/** Returns a Response to send back when the request should be refused, or undefined to proceed. */
export const guardStellarRoute = (req: NextRequest, { limit, windowMs = 60_000 }: GuardOptions): Response | undefined => {
  if (!sameOrigin(req)) {
    return Response.json({ error: 'cross-origin requests are not accepted' }, { status: 403 })
  }

  if (!withinRate(req, limit, windowMs)) {
    return Response.json({ error: 'rate limit exceeded' }, { status: 429, headers: { 'retry-after': String(Math.ceil(windowMs / 1000)) } })
  }

  return undefined
}
