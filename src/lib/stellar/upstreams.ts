// The upstream hosts the SDK's adapters talk to. Everything the browser sends through
// /api/stellar/upstream is checked against this list — the proxy attaches our Soroswap key, so an
// open forwarder would hand that key to any host a caller names.
export const ALLOWED_UPSTREAM_HOSTS = new Set([
  'api.soroswap.finance',
  'api.stellar.broker',
  'amm-api.aqua.network',
  '1click.chaindefuser.com',
  'api.gmp.axelarscan.io',
  'horizon.stellar.org',
  'mainnet.sorobanrpc.com',
  'ethereum-rpc.publicnode.com'
])

// Same-origin paths the SDK is pointed at instead of a public host. Requests to these are already
// ours, so the client-side fetch shim passes them straight through.
export const STELLAR_RPC_PATH = '/api/stellar/rpc'
export const STELLAR_UPSTREAM_PATH = '/api/stellar/upstream'
export const STELLAR_LOG_PATH = '/api/stellar/log'

/** Public Soroban RPC — the http-dev fallback, since `rpc.Server` rejects a plain-http endpoint. */
export const PUBLIC_SOROBAN_RPC = 'https://mainnet.sorobanrpc.com'

// Stands in for the Soroswap API key in the browser. The adapter refuses to call Soroswap without
// *some* key, and /api/stellar/upstream replaces this one with the real value server-side.
export const SOROSWAP_KEY_SENTINEL = 'proxied-server-side'
