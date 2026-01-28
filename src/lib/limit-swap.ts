import { QuoteResponseRoute } from '@uswap/helpers/api'

export function modifyMemoForLimitSwap(memo: string, priceAtomic: string, expiryBlocks?: number): string {
  if (!memo.startsWith('=:')) return memo

  const parts = memo.split(':')
  // parts:
  // [0] "="
  // [1] ASSET (eg ETH.USDT)
  // [2] destination address
  // [3] limit/interval/qty (optional)

  if (parts.length < 3) throw new Error('Invalid memo')

  const asset = parts[1]
  const affiliate = parts[2]

  const interval = expiryBlocks || 1
  const qty = 0

  return `=<:${asset}:${affiliate}:${priceAtomic}/${interval}/${qty}`
}

export function prepareQuoteForLimitSwap(
  quote: QuoteResponseRoute,
  limitBuyAmount?: string,
  expiryBlocks?: number
): QuoteResponseRoute {
  if (!quote.memo || !limitBuyAmount) return quote

  return {
    ...quote,
    memo: modifyMemoForLimitSwap(quote.memo, limitBuyAmount, expiryBlocks)
  }
}

export function modifyMemoForStreaming(memo: string, interval: number): string {
  if (!memo.startsWith('=:')) return memo

  const parts = memo.split(':')
  // parts:
  // [0] "="
  // [1] ASSET (eg ETH.USDT)
  // [2] destination address
  // [3] limit/interval/qty
  // [4] affiliate
  // [5] bps

  if (parts.length < 3) return memo

  const asset = parts[1]
  const destination = parts[2]
  const swapParams = parts[3] || ''
  const affiliate = parts[4]
  const bps = parts[5]

  const paramParts = swapParams.split('/')
  const limit = paramParts[0] || '0'
  const qty = 0

  let result = `=:${asset}:${destination}:${limit}/${interval}/${qty}`
  if (affiliate) {
    result += `:${affiliate}`
    if (bps) {
      result += `:${bps}`
    }
  }

  return result
}

export function prepareQuoteForStreaming(quote: QuoteResponseRoute, interval: number): QuoteResponseRoute {
  if (!quote.memo) return quote

  return {
    ...quote,
    memo: modifyMemoForStreaming(quote.memo, interval)
  }
}
