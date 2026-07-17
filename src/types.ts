import { QuoteResponseRoute as BaseQuoteResponseRoute } from '@uswap/helpers/api'
import { ProviderName } from '@uswap/helpers'

export { ProviderName }

export type QuoteResponseRoute = Omit<BaseQuoteResponseRoute, 'providers'> & {
  providers: ProviderName[]
}

export type TxStatus = 'not_started' | 'pending' | 'swapping' | 'action_required' | 'completed' | 'refunded' | 'failed' | 'expired' | 'unknown'

export interface TrackLeg {
  chainId?: string
  hash?: string | null
  type?: string
  status?: TxStatus
  fromAsset?: string
  fromAmount?: string
  fromAddress?: string
  toAsset?: string
  toAmount?: string
  toAddress?: string
}

export interface TrackResponse extends TrackLeg {
  status: TxStatus
  providers?: ProviderName[]
  legs?: TrackLeg[]
  meta?: { sellAmountUsd?: string; pauseReason?: string }
}

export type RiskLevel = 'excellent' | 'good' | 'fair'

export type ProviderExecutionType = 'transfer' | 'signed_transaction' | 'thorchain_deposit'

export interface Provider {
  name: string
  provider: string
  count: number
  supportedChainIds: string[]
  executionType: ProviderExecutionType
  amlPolicy: RiskLevel
  amlPolicyDescription: string
  contacts: Record<string, string> | null
  suspended: boolean
  accuracy: { matched: number; total: number; avgDeviation: number | null } | null
  timestamp: string
  version: { major: number; minor: number; patch: number }
  keywords: string[]
}
