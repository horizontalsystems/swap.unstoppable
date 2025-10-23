import { assetFromString, SwapKitNumber } from '@swapkit/core'
import { QuoteResponseRoute } from '@swapkit/api'

export type FeeData = {
  amount: SwapKitNumber
  usd: SwapKitNumber
  symbol: string
}

export const resolveFees = (quote: QuoteResponseRoute) => {
  const feeData = (type: string): FeeData | undefined => {
    const fee = quote.fees.find(f => f.type === type)

    if (!fee) return undefined

    const amount = new SwapKitNumber(fee.amount)
    const meta = quote.meta.assets?.find(f => f.asset === fee.asset)

    const asset = assetFromString(fee.asset)

    return {
      amount: amount,
      usd: meta ? amount.mul(new SwapKitNumber(meta.price)) : new SwapKitNumber(0),
      symbol: asset.ticker || asset.symbol
    }
  }

  const inbound = feeData('inbound')
  const outbound = feeData('outbound')
  const liquidity = feeData('liquidity')
  const affiliate = feeData('affiliate')

  const total = (inbound?.usd || new SwapKitNumber(0))
    .add(outbound?.usd || new SwapKitNumber(0))
    .add(liquidity?.usd || new SwapKitNumber(0))
    .add(affiliate?.usd || new SwapKitNumber(0))

  return {
    inbound,
    outbound,
    liquidity,
    affiliate,
    total
  }
}
