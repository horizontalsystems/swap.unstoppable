import { Asset } from '@/components/swap/asset'
import { TokenBalance } from '@/hooks/use-wallet-balances'

export function assetIdentifierStr(b: {
  chain: string
  isSynthetic?: boolean
  isTradeAsset?: boolean
  isSecuredAsset?: boolean
  symbol?: string
  ticker: string
  address?: string
}): string {
  if (b.isSecuredAsset && b.symbol) return b.symbol
  const id = b.isSynthetic || b.isTradeAsset ? b.ticker : b.address ? `${b.ticker}-${b.address}` : b.ticker
  return `${b.chain}.${id}`
}

export function tokenToAsset(token: TokenBalance): Asset {
  const { balance, logoURI } = token
  return {
    chain: balance.chain,
    ticker: balance.ticker,
    identifier: assetIdentifierStr(balance),
    logoURI: logoURI || undefined,
    chainId: balance.chain,
    decimals: balance.decimal ?? 8,
    providers: []
  }
}
