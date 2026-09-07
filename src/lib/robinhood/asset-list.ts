import { Chain, getChainConfig } from '@uswap/core'

/**
 * Robinhood Chain support.
 *
 * The aggregator routes this chain — 1inch and LI.FI both report `4663` in their
 * `supportedChainIds` — but publishes no catalog for it: `/tokens/all` carries no 4663 entries, and
 * asking `/tokens` for either provider answers `count: 0`, because both quote every token on the
 * chains they support rather than a fixed list. (That is the same reason `use-assets` already
 * attaches them to tokens by chain id via `MANUAL_PROVIDERS`.) So the catalog is fetched here
 * instead, and handed to `use-assets` in the shape `/tokens` would have returned.
 */

export const ROBINHOOD_CHAIN_ID = getChainConfig(Chain.Robinhood).chainId

/** Robinhood Chain settles in ETH, like the L2s it resembles. */
export const ROBINHOOD_NATIVE_TICKER = 'ETH'

/** The gas asset, spelled the way every other EVM chain spells its own. */
export const ROBINHOOD_NATIVE_IDENTIFIER = `${Chain.Robinhood}.${ROBINHOOD_NATIVE_TICKER}`

/**
 * The EIP-7528 native-asset sentinel, which is the ONLY spelling of native ETH the aggregator
 * accepts on this chain.
 *
 * It has no token registry for 4663 — it identifies Robinhood assets purely by contract address and
 * echoes quotes back as `ROBINHOOD.UNKNOWN-0X…` whatever ticker you send. Bare `ROBINHOOD.ETH` is
 * rejected ("ETH is not a valid EVM address"), and 1inch additionally refuses `0x000…0` ("for
 * native token use 0xeeee…"), which is what LI.FI's own token list publishes for the native coin.
 *
 * So the app keeps `ROBINHOOD.ETH` internally — that spelling is what makes `AssetValue` resolve it
 * as the gas asset, which balances, fee estimation and the approval check all key off — and
 * `toAggregatorIdentifier` swaps the sentinel in on the way to `/rate` and `/swap`.
 */
export const ROBINHOOD_NATIVE_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

/** True for the sentinel above, in any casing — the aggregator echoes it back uppercased. */
export const isNativeSentinel = (address?: string): boolean =>
  !!address && address.toLowerCase() === ROBINHOOD_NATIVE_ADDRESS.toLowerCase()

export const isRobinhoodChain = (chain?: string): boolean => chain === Chain.Robinhood

/** Rewrites the gas asset to the address form the aggregator demands. Everything else passes through. */
export const toAggregatorIdentifier = (identifier: string): string =>
  identifier.toUpperCase() === ROBINHOOD_NATIVE_IDENTIFIER
    ? `${ROBINHOOD_NATIVE_IDENTIFIER}-${ROBINHOOD_NATIVE_ADDRESS}`
    : identifier

/** The token shape `use-assets` consumes, matching what `/tokens` returns for every other chain. */
export interface RobinhoodToken {
  address?: string
  chain: Chain
  chainId: string
  coingeckoId?: string
  decimals: number
  identifier: string
  logoURI?: string
  name?: string
  ticker: string
}

interface RawToken {
  address?: string
  symbol?: string
  name?: string
  decimals?: number
  logoURI?: string
}

const COINGECKO_TOKENS = 'https://tokens.coingecko.com/robinhood/all.json'

const toToken = (raw: RawToken): RobinhoodToken | null => {
  const { address, symbol, decimals } = raw
  if (!address || !symbol || typeof decimals !== 'number') return null

  // A list that spells the native coin as a contract still describes the gas asset, which the app
  // addresses by its bare identifier. CoinGecko does not currently publish such an entry.
  const isNative = /^0x0{40}$/i.test(address) || isNativeSentinel(address)

  return {
    address: isNative ? undefined : address,
    chain: Chain.Robinhood,
    chainId: ROBINHOOD_CHAIN_ID,
    // The only Robinhood asset with a CoinGecko coin of its own: it is ETH. Everything else is
    // priced from DexScreener, which indexes the chain under the slug `robinhood`.
    coingeckoId: isNative ? 'ethereum' : undefined,
    decimals,
    identifier: isNative ? ROBINHOOD_NATIVE_IDENTIFIER : `${Chain.Robinhood}.${symbol.toUpperCase()}-${address.toUpperCase()}`,
    logoURI: raw.logoURI,
    name: raw.name,
    ticker: isNative ? ROBINHOOD_NATIVE_TICKER : symbol
  }
}

const NATIVE_TOKEN: RobinhoodToken = {
  chain: Chain.Robinhood,
  chainId: ROBINHOOD_CHAIN_ID,
  coingeckoId: 'ethereum',
  decimals: getChainConfig(Chain.Robinhood).baseDecimal,
  identifier: ROBINHOOD_NATIVE_IDENTIFIER,
  logoURI: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  name: 'Ethereum',
  ticker: ROBINHOOD_NATIVE_TICKER
}

const fetchJson = async (url: string): Promise<any> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} answered ${res.status}`)
  return res.json()
}

/**
 * The Robinhood Chain token catalog: CoinGecko's `robinhood` asset platform.
 *
 * Around 800 tokens, including the tokenized equities the chain exists for, with the names and
 * logos CoinGecko already supplies for every other chain in the picker. It is a static CDN file —
 * keyless, CORS-open and cached upstream — rather than a rate-limited API call, so it is safe to
 * fetch from every visitor's browser.
 *
 * The gas asset is seeded unconditionally: CoinGecko's list covers contracts only, and losing the
 * native coin would cost the chain its most important pair. Seeding it also means a fetch failure
 * degrades to a one-asset chain rather than an absent one.
 */
export const fetchRobinhoodTokens = async (): Promise<RobinhoodToken[]> => {
  const raw: RawToken[] = await fetchJson(COINGECKO_TOKENS)
    .then(list => list.tokens ?? [])
    .catch(() => [])

  // Keyed on the contract so one address cannot land in the picker twice.
  const byAddress = new Map<string, RobinhoodToken>([[ROBINHOOD_NATIVE_IDENTIFIER, NATIVE_TOKEN]])
  for (const entry of raw) {
    const token = toToken(entry)
    if (token) byAddress.set(token.address?.toUpperCase() ?? ROBINHOOD_NATIVE_IDENTIFIER, token)
  }

  return Array.from(byAddress.values())
}
