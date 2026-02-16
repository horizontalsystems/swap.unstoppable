import { EstimatedTime } from '@uswap/helpers/api'
import type { Asset } from '@/components/swap/asset'
import { TwapMode } from '@/store/swap-store'
import { QuoteResponseRoute } from '@/types'

export const THORCHAIN_BLOCK_TIME_SECONDS = 6

function toBaseAmount(amount: string, decimals: number = 8): bigint {
  const [whole, frac = ''] = amount.split('.')
  const paddedFrac = frac.padEnd(decimals, '0').slice(0, decimals)
  return BigInt(whole + paddedFrac)
}

export function createModifyLimitSwapMemo(
  limitSwapMemo: string,
  amountFrom: string,
  sourceAsset: Asset,
  targetAsset: Asset,
  newAmount: string
): string {
  const parts = limitSwapMemo.split(':')
  const targetAssetFromMemo = parts[1]
  const tradeTarget = (parts[3] || '').split('/')[0]

  if (!targetAssetFromMemo || !tradeTarget) {
    throw new Error('Invalid limit swap memo')
  }

  const sourceAmount = toBaseAmount(amountFrom)

  return `m=<:${sourceAmount}${sourceAsset.identifier}:${tradeTarget}${targetAsset.identifier}:${newAmount}`
}

export function createCancelLimitSwapMemo(limitSwapMemo: string, amountFrom: string, sourceAsset: Asset, sourceTo: Asset): string {
  return createModifyLimitSwapMemo(limitSwapMemo, amountFrom, sourceAsset, sourceTo, '0')
}

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

export function prepareQuoteForLimitSwap(quote: QuoteResponseRoute, limitBuyAmount?: string, expiryBlocks?: number): QuoteResponseRoute {
  if (!quote.memo || !limitBuyAmount) return quote

  return {
    ...quote,
    memo: modifyMemoForLimitSwap(quote.memo, limitBuyAmount, expiryBlocks)
  }
}

export function modifyMemoForStreaming(memo: string, interval: number, quantity: number): string {
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

  let result = `=:${asset}:${destination}:${limit}/${interval}/${quantity}`
  if (affiliate) {
    result += `:${affiliate}`
    if (bps) {
      result += `:${bps}`
    }
  }

  return result
}

export function stripStreamingParams(memo: string): string {
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

  // Only include limit, no interval/quantity
  let result = `=:${asset}:${destination}:${limit}`
  if (affiliate) {
    result += `:${affiliate}`
    if (bps) {
      result += `:${bps}`
    }
  }

  return result
}

export function recalculateEstimatedTime(estimatedTime: EstimatedTime | undefined, swapSeconds: number): EstimatedTime | undefined {
  if (!estimatedTime) return undefined

  return {
    ...estimatedTime,
    swap: swapSeconds,
    total: (estimatedTime.inbound || 0) + swapSeconds + (estimatedTime.outbound || 0)
  }
}

export function prepareQuoteForStreaming(
  quote: QuoteResponseRoute,
  twapMode: TwapMode,
  customInterval: number,
  customQuantity: number
): QuoteResponseRoute {
  if (!quote.memo) return quote

  if (twapMode === 'bestPrice') {
    return quote
  }

  if (twapMode === 'bestTime') {
    return {
      ...quote,
      memo: stripStreamingParams(quote.memo),
      estimatedTime: recalculateEstimatedTime(quote.estimatedTime, 0)
    }
  }

  // Custom: use user-specified values
  const swapSeconds = customInterval * customQuantity * THORCHAIN_BLOCK_TIME_SECONDS
  return {
    ...quote,
    memo: modifyMemoForStreaming(quote.memo, customInterval, customQuantity),
    estimatedTime: recalculateEstimatedTime(quote.estimatedTime, swapSeconds)
  }
}
