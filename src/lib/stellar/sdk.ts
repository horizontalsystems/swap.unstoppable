import type { StellarSwapConfig, StellarSwapSDK } from 'stellar-web-sdk'
import { ALLOWED_UPSTREAM_HOSTS, PUBLIC_SOROBAN_RPC, SOROSWAP_KEY_SENTINEL, STELLAR_RPC_PATH, STELLAR_UPSTREAM_PATH } from '@/lib/stellar/upstreams'

// One StellarSwapSDK instance for the app, mirroring getUSwap(). Loaded on demand: the SDK pulls
// @stellar/stellar-sdk (~1MB), which has no business in the main chunk when most swaps never touch
// Stellar.

let instance: StellarSwapSDK | undefined
let loading: Promise<StellarSwapSDK> | undefined

const origin = () => (typeof window === 'undefined' ? '' : window.location.origin)

/**
 * Route the SDK's provider calls through our own API so the Soroswap key never reaches the browser.
 * Requests the SDK already aims at us (Horizon and Soroban RPC, whose base URLs we set below) are
 * passed straight through — rewriting them would double-wrap them in the upstream proxy.
 */
const proxiedFetch: typeof fetch = (input, init) => {
  const url = input instanceof Request ? input.url : String(input)

  if (!/^https?:\/\//i.test(url)) return fetch(input, init)

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return fetch(input, init)
  }

  if (parsed.origin === origin()) return fetch(input, init)
  if (!ALLOWED_UPSTREAM_HOSTS.has(parsed.hostname)) return fetch(input, init)

  const proxied = `${origin()}${STELLAR_UPSTREAM_PATH}?url=${encodeURIComponent(url)}`
  return input instanceof Request ? fetch(new Request(proxied, input), init) : fetch(proxied, init)
}

/**
 * Soroban RPC endpoint. Unlike Horizon, this one is handed to `rpc.Server` from
 * @stellar/stellar-sdk, which refuses a plain-http URL outright ("Cannot connect to insecure
 * Soroban RPC server") — so over http, our own proxy is unusable and AQUARIUS (plus Axelar's
 * simulation leg) would drop out of every fan-out.
 *
 * Production is https, so the proxy is used and the ValidationCloud key stays server-side. Local
 * dev over http falls back to the public endpoint, which needs no key and so leaks nothing; the
 * only cost is the public endpoint's rate limit while developing.
 */
const sorobanRpcUrl = (): string => {
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  return isSecure ? `${origin()}${STELLAR_RPC_PATH}` : PUBLIC_SOROBAN_RPC
}

const config = (): StellarSwapConfig => ({
  // Horizon goes through our catch-all, which forwards to ValidationCloud with the key attached.
  // It uses the SDK's own fetch-based client, which has no protocol restriction.
  horizonUrl: `${origin()}${STELLAR_RPC_PATH}`,
  endpoints: { sorobanRpcUrl: sorobanRpcUrl() },
  credentials: {
    // A sentinel, not the key. The Soroswap adapter declines the pair outright when this is unset
    // (an unauthenticated Soroswap call is always a 403, so it refuses to spend the round-trip), so
    // something has to be here — and /api/stellar/upstream overwrites the Authorization header with
    // the real key on its way out. The real key never reaches the browser.
    soroswapApiKey: SOROSWAP_KEY_SENTINEL,
    // The partner key cannot be proxied the same way: commit() copies it into the execution block
    // and the browser opens wss://api.stellar.broker/ws?partner=<key> itself.
    stellarBrokerPartnerKey: process.env.NEXT_PUBLIC_STELLARBROKER_PARTNER_KEY
  },
  fetch: proxiedFetch
})

export async function getStellarSdk(): Promise<StellarSwapSDK> {
  if (instance) return instance
  if (loading) return loading

  loading = import('stellar-web-sdk').then(({ StellarSwapSDK }) => {
    instance = new StellarSwapSDK(config())
    return instance
  })

  return loading
}

/** The instance if it has already been loaded — for sync paths that must not trigger the import. */
export function peekStellarSdk(): StellarSwapSDK | undefined {
  return instance
}
