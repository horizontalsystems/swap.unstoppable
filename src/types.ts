import { QuoteResponse as BaseQuoteResponse, QuoteResponseRoute as BaseQuoteResponseRoute } from '@uswap/helpers/api'
import { ProviderName } from '@uswap/helpers'

export { ProviderName }

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

export type AmlPolicy = 'auto' | 'flexible' | 'precheck' | 'controlled'

export interface Provider {
  name: string
  provider: string
  count: number
  supportedChainIds: string[]
  amlPolicy: AmlPolicy
  amlPolicyDescription: string
  contact: string | null
  timestamp: string
  version: { major: number; minor: number; patch: number }
  keywords: string[]
}
