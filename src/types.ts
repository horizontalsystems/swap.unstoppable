import { QuoteResponse as BaseQuoteResponse, QuoteResponseRoute as BaseQuoteResponseRoute } from '@uswap/helpers/api'

export enum ProviderName {
  CAVIAR_V1 = 'CAVIAR_V1',
  CAMELOT_V3 = 'CAMELOT_V3',
  CHAINFLIP = 'CHAINFLIP',
  CHAINFLIP_STREAMING = 'CHAINFLIP_STREAMING',
  JUPITER = 'JUPITER',
  MAYACHAIN = 'MAYACHAIN',
  MAYACHAIN_STREAMING = 'MAYACHAIN_STREAMING',
  OCISWAP_V1 = 'OCISWAP_V1',
  ONEINCH = 'ONEINCH',
  OPENOCEAN_V2 = 'OPENOCEAN_V2',
  PANCAKESWAP = 'PANCAKESWAP',
  PANGOLIN_V1 = 'PANGOLIN_V1',
  SUSHISWAP_V2 = 'SUSHISWAP_V2',
  THORCHAIN = 'THORCHAIN',
  THORCHAIN_STREAMING = 'THORCHAIN_STREAMING',
  TRADERJOE_V2 = 'TRADERJOE_V2',
  UNISWAP_V2 = 'UNISWAP_V2',
  UNISWAP_V3 = 'UNISWAP_V3',
  NEAR = 'NEAR',
  GARDEN = 'GARDEN',
  LETSEXCHANGE = 'LETSEXCHANGE',
  QUICKEX = 'QUICKEX',
  STEALTHEX = 'STEALTHEX',
  SWAPUZ = 'SWAPUZ',
  BARTER = 'BARTER'
}

export type QuoteResponseRoute = Omit<BaseQuoteResponseRoute, 'providers'> & {
  providers: ProviderName[]
  txExtraAttribute?: any
  providerSwapId?: string
}

export type QuoteResponse = Omit<BaseQuoteResponse, 'routes'> & {
  maximumAmount?: string
  minimumAmount?: string
  routes: QuoteResponseRoute[]
}
