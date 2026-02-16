import { Chain } from '@uswap/core'
import { ProviderName } from '@/types'

export interface Asset {
  address?: string
  chain: Chain
  chainId: string
  coingeckoId?: string
  decimals: number
  identifier: string
  logoURI?: string
  name?: string
  shortCode?: string
  ticker: string
  providers: ProviderName[]
}
