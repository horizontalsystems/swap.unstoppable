import { QuoteResponseRoute } from '@uswap/helpers/api'

export function modifyMemoForLimitSwap(memo: string, priceAtomic: string, expiryBlocks?: number): string {
  if (!memo.startsWith('=:')) return memo

  const parts = memo.split(':')
  // parts:
  // [0] "="
  // [1] ASSET (eg ETH.USDT)
  // [2] destination address
  // [3] amount (ignored for limit swaps)

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
