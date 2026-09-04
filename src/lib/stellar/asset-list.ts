import { ProviderName } from '@uswap/helpers'
import { AppProviderName } from '@/types'

/**
 * The Stellar assets the app offers. stellar-web-sdk ships no asset catalog (`crossChainTokens()`
 * covers NEAR and Axelar only) and the aggregator publishes just XLM and SHX, so this list is
 * curated by hand until one of them serves a real one.
 *
 * Soroswap's `/api/tokens` looks like a candidate but is not one: its `mainnet` array is empty and
 * only `testnet`/`standalone` carry entries.
 *
 * EVERY ISSUER BELOW WAS VERIFIED before being added, because a wrong issuer is a different asset
 * that happens to share a ticker — the classic Stellar phishing shape. Two checks, both against
 * mainnet:
 *   1. the asset exists on Horizon (`/assets?asset_code=&asset_issuer=`), and
 *   2. the issuer account's own `home_domain` matches, and its `.well-known/stellar.toml` lists a
 *      [[CURRENCIES]] entry naming this exact code + issuer.
 *
 * Circle (USDC, EURC) serves a 403 to scripted requests, so step 2 could not be run for those two.
 * They rest on step 1 plus the issuer account's on-chain `home_domain = circle.com` — the claim the
 * issuer itself publishes — and USDC's 2.38M trustlines. Re-check by hand in a browser if in doubt.
 *
 * Adding an asset here means repeating both checks. Do not paste an issuer from memory.
 */

/** Stellar's fixed precision — every classic asset is 7 decimal places. */
export const STELLAR_DECIMALS = 7

/** Matches the `supportedChainIds` the aggregator reports for its own Stellar providers. */
export const STELLAR_CHAIN_ID = 'stellar'

export interface StellarAssetEntry {
  /** Asset code as it appears on-chain. Case-sensitive and never normalized. */
  code: string
  /** `G…` issuer, or undefined for native XLM. */
  issuer?: string
  name: string
  /** Price lookups go through the shared gecko/BlocksDecoded map. */
  coingeckoId?: string
  logoURI?: string
  /** Bridged 1:1 by Axelar ITS between Stellar and Ethereum. */
  axelar?: boolean
}

export const STELLAR_ASSETS: StellarAssetEntry[] = [
  {
    code: 'XLM',
    name: 'Stellar Lumens',
    coingeckoId: 'stellar',
    logoURI: 'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png',
    axelar: true
  },
  {
    code: 'USDC',
    issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    name: 'USD Coin',
    coingeckoId: 'usd-coin',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png'
  },
  {
    code: 'EURC',
    issuer: 'GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2',
    name: 'Euro Coin',
    coingeckoId: 'euro-coin',
    logoURI: 'https://assets.coingecko.com/coins/images/26045/large/euro.png'
  },
  {
    code: 'AQUA',
    issuer: 'GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA',
    name: 'Aquarius',
    coingeckoId: 'aquarius',
    logoURI: 'https://assets.coingecko.com/coins/images/19045/large/aqua.png'
  },
  {
    code: 'SHX',
    issuer: 'GDSTRSHXHGJ7ZIVRBXEYE5Q74XUVCUSEKEBR7UCHEUUEK72N7I7KJ6JH',
    name: 'Stronghold Token',
    coingeckoId: 'stronghold-token',
    axelar: true
  },
  { code: 'yXLM', issuer: 'GARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55', name: 'Ultra Stellar XLM' },
  { code: 'yUSDC', issuer: 'GDGTVWSM4MGS4T7Z6W4RPWOCHE2I6RDFCIFZGS3DOA63LWQTRNZNTTFF', name: 'Ultra Stellar USDC' },
  { code: 'yBTC', issuer: 'GBUVRNH4RW4VLHP4C5MOF46RRIRZLAVHYGX45MVSTKA2F6TMR7E7L6NW', name: 'Ultra Stellar BTC' },
  { code: 'yETH', issuer: 'GDYQNEF2UWTK4L6HITMT53MZ6F5QWO3Q4UVE6SCGC4OMEQIZQQDERQFD', name: 'Ultra Stellar ETH' }
]

/** The SDK's canonical identifier: `XLM.XLM` for native, `XLM.CODE-GISSUER…` for a classic asset. */
export const stellarIdentifier = (entry: StellarAssetEntry): string => (entry.issuer ? `XLM.${entry.code}-${entry.issuer}` : 'XLM.XLM')

/**
 * The venues that can quote a given Stellar asset. All four in-chain providers serve every classic
 * asset; AXELAR_ITS bridges only the two tickers it has an ITS registration for.
 */
export const stellarProvidersFor = (entry: StellarAssetEntry): AppProviderName[] => {
  const providers: AppProviderName[] = ['STELLARBROKER', 'SOROSWAP', 'AQUARIUS', 'STELLAR_DEX']
  if (entry.axelar) providers.push('AXELAR_ITS')
  // NEAR quotes Stellar too, but through the aggregator's own catalog — leaving it off here keeps
  // one venue from appearing twice once the SDK and aggregator route lists are merged.
  return providers
}

/** True for an identifier on the Stellar chain, whatever spelling of the asset it uses. */
export const isStellarIdentifier = (identifier?: string): boolean => !!identifier && identifier.toUpperCase().startsWith('XLM.')

export const isStellarChain = (chain?: string): boolean => chain === 'XLM'

/**
 * The Stellar in-chain venues. The SDK always quotes these, so the aggregator never should — it
 * publishes no token list for them either, which is why /tokens is filtered by this set.
 */
export const SDK_QUOTED_PROVIDERS = new Set<string>(['STELLARBROKER', 'SOROSWAP', 'AQUARIUS', 'STELLAR_DEX'])

/**
 * Providers to withhold from the aggregator for a given pair, so no venue is quoted twice.
 *
 * AXELAR_ITS is split by direction. Stellar → Ethereum is a Stellar transaction the SDK signs, so
 * the SDK owns it. Ethereum → Stellar is an EVM transaction the Stellar SDK builds but refuses to
 * sign, so it stays with the aggregator and the EVM wallet — withholding it there would leave that
 * direction with no route at all.
 */
export const aggregatorExcludedProviders = (sellAssetChain?: string, sellAssetTicker?: string): Set<string> => {
  const excluded = new Set<string>(SDK_QUOTED_PROVIDERS)

  // Withhold AXELAR_ITS only for a ticker the SDK actually bridges. Its coverage is a static list,
  // so if the aggregator ever adds a third ITS token, withholding unconditionally would leave that
  // token's Stellar → Ethereum direction with no route from either source.
  if (isStellarChain(sellAssetChain) && (!sellAssetTicker || AXELAR_BRIDGED_TICKERS.has(sellAssetTicker))) {
    excluded.add('AXELAR_ITS')
  }

  return excluded
}

/** Mirrors the SDK's own `AXELAR_ITS_TICKERS`. Verified against `crossChainTokens('AXELAR_ITS')`. */
export const AXELAR_BRIDGED_TICKERS = new Set(['XLM', 'SHX'])

// Re-exported so callers don't reach into @uswap/helpers for the one name they need alongside these.
export { ProviderName }
