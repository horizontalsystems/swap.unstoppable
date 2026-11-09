import { NextRequest } from 'next/server'

/**
 * Same-origin only. `Sec-Fetch-Site` is a forbidden header name, so JavaScript
 * running on another site cannot forge it -- that is what stops someone else's
 * frontend from pointing at one of our proxy routes and spending our upstream
 * quota. It is not a defence against a scripted, non-browser caller, which can
 * send any header it likes; the rate limit is the brake for those.
 *
 * The client builds its URL from `window.location.origin`, so a real request is
 * same-origin whichever host serves the app -- swap.unstoppable.money or
 * localhost in dev -- and no host allowlist is needed.
 */
export function isSameOrigin(req: NextRequest) {
  const site = req.headers.get('sec-fetch-site')
  if (site) return site === 'same-origin'

  // Browsers predating Sec-Fetch-* (Safari < 16.4) still send a Referer on a
  // same-origin fetch, so fall back to matching its host against ours.
  const referer = req.headers.get('referer')
  if (!referer) return false

  try {
    return new URL(referer).host === req.headers.get('host')
  } catch {
    return false
  }
}
