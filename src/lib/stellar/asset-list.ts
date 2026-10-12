import { Chain, ChainId, getChainConfig } from '@uswap/core'
import { ProviderName } from '@/types'

// Curated Stellar classic assets: the Stellar venues publish no token list.
// Verify every issuer on Horizon and in the issuer's stellar.toml before adding it — a wrong
// issuer is a different asset with the same ticker.

// Attached to every Stellar asset by chain id. STELLARBROKER is left out: its execution is an
// interactive WebSocket session the app does not implement.
export const STELLAR_DEX_PROVIDERS: ProviderName[] = [ProviderName.SOROSWAP, ProviderName.AQUARIUS, ProviderName.STELLAR_DEX]

export const EXCLUDED_STELLAR_PROVIDERS = ['STELLARBROKER']

interface StellarAssetEntry {
  // case-sensitive
  code: string
  issuer: string
  name: string
  coingeckoId?: string
  logoURI?: string
}

const STELLAR_ASSETS: StellarAssetEntry[] = [
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
    code: 'PYUSD',
    issuer: 'GDQE7IXJ4HUHV6RQHIUPRJSEZE4DRS5WY577O2FY6YQ5LVWZ7JZTU2V5',
    name: 'PayPal USD',
    coingeckoId: 'paypal-usd',
    logoURI: 'https://assets.coingecko.com/coins/images/31212/large/PYUSD_Logo.png'
  },
  // Etherfuse stablebonds — CETES (Mexican), TESOURO (Brazilian) and USTRY (US) share one issuer.
  { code: 'CETES', issuer: 'GCRYUGD5NVARGXT56XEZI5CIFCQETYHAPQQTHO2O3IQZTHDH4LATMYWC', name: 'Etherfuse CETES', coingeckoId: 'cetes' },
  {
    code: 'TESOURO',
    issuer: 'GCRYUGD5NVARGXT56XEZI5CIFCQETYHAPQQTHO2O3IQZTHDH4LATMYWC',
    name: 'Etherfuse Tesouro',
    coingeckoId: 'etherfuse-tesouro'
  },
  // not on CoinGecko, so no fiat value
  {
    code: 'USTRY',
    issuer: 'GCRYUGD5NVARGXT56XEZI5CIFCQETYHAPQQTHO2O3IQZTHDH4LATMYWC',
    name: 'Etherfuse USTRY',
    logoURI: 'https://stablebonds.s3.us-west-2.amazonaws.com/stablebond/spl-ustry.png'
  },
  { code: 'yXLM', issuer: 'GARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55', name: 'Ultra Stellar XLM', coingeckoId: 'ultracapital-yxlm' },
  {
    code: 'yUSDC',
    issuer: 'GDGTVWSM4MGS4T7Z6W4RPWOCHE2I6RDFCIFZGS3DOA63LWQTRNZNTTFF',
    name: 'Ultra Stellar USDC',
    coingeckoId: 'ultracapital-yusdc'
  },
  { code: 'yBTC', issuer: 'GBUVRNH4RW4VLHP4C5MOF46RRIRZLAVHYGX45MVSTKA2F6TMR7E7L6NW', name: 'Ultra Stellar BTC', coingeckoId: 'ultracapital-ybtc' },
  { code: 'yETH', issuer: 'GDYQNEF2UWTK4L6HITMT53MZ6F5QWO3Q4UVE6SCGC4OMEQIZQQDERQFD', name: 'Ultra Stellar ETH', coingeckoId: 'ultracapital-yeth' }
]

// in /tokens shape; XLM and SHX already come from /tokens
export const stellarTokens = () =>
  STELLAR_ASSETS.map(entry => ({
    address: entry.issuer,
    chain: Chain.Stellar,
    chainId: ChainId.Stellar,
    coingeckoId: entry.coingeckoId,
    decimals: getChainConfig(Chain.Stellar).baseDecimal,
    identifier: `XLM.${entry.code}-${entry.issuer}`,
    logoURI: entry.logoURI,
    name: entry.name,
    ticker: entry.code,
    providers: [] as ProviderName[]
  }))
