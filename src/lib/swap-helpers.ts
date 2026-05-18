import { assetFromString, Chain, USwapNumber } from '@uswap/core'
import { intervalToDuration } from 'date-fns'
import { AssetRateMap } from '@/hooks/use-rates'
import { QuoteResponseRoute } from '@/types'

export type FeeData = {
  amount: USwapNumber
  usd: USwapNumber
  ticker: string
}

export const resolveFees = (quote: QuoteResponseRoute, rates: AssetRateMap) => {
  const feeData = (type: string): FeeData | undefined => {
    const fee = quote.fees.find(f => f.type === type)

    if (!fee) return undefined

    const amount = new USwapNumber(fee.amount)
    const rate = rates[fee.asset]

    const asset = assetFromString(fee.asset)

    return {
      amount: amount,
      usd: rate ? amount.mul(new USwapNumber(rate)) : new USwapNumber(0),
      ticker: asset.ticker || asset.symbol
    }
  }

  const inbound = feeData('inbound')
  const outbound = feeData('outbound')
  const liquidity = feeData('liquidity')
  const affiliate = feeData('affiliate')
  const service = feeData('service')

  const platform: FeeData | undefined = (affiliate || service) && {
    amount: (affiliate?.amount || new USwapNumber(0)).add(service?.amount || new USwapNumber(0)),
    usd: (affiliate?.usd || new USwapNumber(0)).add(service?.usd || new USwapNumber(0)),
    ticker: affiliate?.ticker || service?.ticker || ''
  }

  const included = (outbound?.usd || new USwapNumber(0)).add(liquidity?.usd || new USwapNumber(0)).add(platform?.usd || new USwapNumber(0))

  return {
    inbound,
    outbound,
    liquidity,
    platform,
    included
  }
}

export const resolvePriceImpact = (quote?: QuoteResponseRoute, rateFrom?: USwapNumber, rateTo?: USwapNumber) => {
  const sellAmountInUsd = quote && rateFrom && new USwapNumber(quote.sellAmount).mul(rateFrom)
  const buyAmountInUsd = quote && rateTo && new USwapNumber(quote.expectedBuyAmount).mul(rateTo)

  const hundredPercent = new USwapNumber(100)
  const toPriceRatio = buyAmountInUsd && sellAmountInUsd && buyAmountInUsd.mul(hundredPercent).div(sellAmountInUsd)
  return toPriceRatio && toPriceRatio.lte(hundredPercent) ? hundredPercent.sub(toPriceRatio) : undefined
}

export const findFasterIndex = (quotes: QuoteResponseRoute[]): number => {
  if (quotes.length < 2) return -1
  const times = quotes.slice(1).map(r => r.estimatedTime?.total ?? Infinity)
  const min = Math.min(...times)
  return min === Infinity ? -1 : times.indexOf(min) + 1
}

export const formatExpiration = (seconds: number) => {
  const duration = intervalToDuration({ start: 0, end: seconds * 1000 })
  const parts = []

  if (duration.months) parts.push(`${duration.months}M`)
  if (duration.weeks) parts.push(`${duration.weeks}w`)
  if (duration.days) parts.push(`${duration.days}d`)
  if (duration.hours) parts.push(`${duration.hours}h`)
  if (duration.minutes) parts.push(`${duration.minutes}m`)
  if (duration.seconds && !(duration.hours || duration.days || duration.weeks)) {
    parts.push(`${duration.seconds}s`)
  }

  return parts.join(' ')
}

// Fetches all bank-module balances for a THORChain address. Includes Secured Asset denoms
// (e.g. "btc-btc", "eth-usdc-0x…") which the wallet toolbox may or may not surface depending
// on its scam-filter heuristics. Decimals on THORChain bank are always 8.
//
// Bank denoms come back in several shapes — we normalise each one so it parses cleanly:
//   rune, tcy            → THOR.RUNE / THOR.TCY  (THORChain natives, missing chain prefix)
//   x/ruji               → THOR.RUJI            (factory denom, strip the "x/" prefix)
//   btc/btc              → THOR.BTC/BTC          (synth)
//   btc~btc              → THOR.BTC~BTC          (trade)
//   eth-eth, eth-usdc-0x → ETH-ETH               (secured, bare canonical form)
export function normalizeThorBankDenom(denom: string): string | null {
  const lower = denom.toLowerCase()

  if (lower.startsWith('x/')) return `${Chain.THORChain}.${lower.slice(2).toUpperCase()}`
  if (lower.includes('/') || lower.includes('~')) return `${Chain.THORChain}.${lower.toUpperCase()}`
  if (lower.includes('-')) return lower.toUpperCase()

  return `${Chain.THORChain}.${lower.toUpperCase()}`
}
