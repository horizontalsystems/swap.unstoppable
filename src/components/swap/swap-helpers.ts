import { AssetRateMap } from '@/hooks/use-rates'
import { assetFromString, SwapKitNumber } from '@swapkit/core'
import { QuoteResponseRoute } from '@swapkit/helpers/api'

export type FeeData = {
  amount: SwapKitNumber
  usd: SwapKitNumber
  ticker: string
}

export const resolveFees = (quote: QuoteResponseRoute, rates: AssetRateMap) => {
  const feeData = (type: string): FeeData | undefined => {
    const fee = quote.fees.find(f => f.type === type)

    if (!fee) return undefined

    const amount = new SwapKitNumber(fee.amount)
    const rate = rates[fee.asset]

    const asset = assetFromString(fee.asset)

    return {
      amount: amount,
      usd: rate ? amount.mul(new SwapKitNumber(rate)) : new SwapKitNumber(0),
      ticker: asset.ticker || asset.symbol
    }
  }

  const inbound = feeData('inbound')
  const outbound = feeData('outbound')
  const liquidity = feeData('liquidity')
  const affiliate = feeData('affiliate')
  const service = feeData('service')

  const total = (inbound?.usd || new SwapKitNumber(0))
    .add(outbound?.usd || new SwapKitNumber(0))
    .add(liquidity?.usd || new SwapKitNumber(0))
    .add(affiliate?.usd || new SwapKitNumber(0))
    .add(service?.usd || new SwapKitNumber(0))

  return {
    inbound,
    outbound,
    liquidity,
    affiliate,
    service,
    total
  }
}
