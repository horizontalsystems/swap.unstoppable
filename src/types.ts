import { QuoteResponseRoute as BaseQuoteResponseRoute } from '@uswap/helpers/api'
import { ProviderName } from '@uswap/helpers'

export { ProviderName }

export type QuoteResponseRoute = Omit<BaseQuoteResponseRoute, 'providers'> & {
  providers: ProviderName[]
  // set by /preview; commit it to create the order (the uuid comes from /commit)
  previewToken?: string
  // transfer providers at preview: a ready-to-receive account on the sell chain, for fee estimation only — never send to it
  stubDepositAddress?: string
}

export interface CommitResponse {
  status: 'ok'
  uuid: string
  sellAmount: string
  expectedBuyAmount: string
  minBuyAmount?: string | null
  expiresAt?: number
  // only for transfer providers; the others keep the execution from the preview
  execution?: QuoteResponseRoute['execution']
  replayed: boolean
}

// signed: the inbound hash is reported but the deposit is not observed yet
export type TxStatus =
  | 'not_started'
  | 'signed'
  | 'pending'
  | 'swapping'
  | 'action_required'
  | 'completed'
  | 'refunded'
  | 'failed'
  | 'expired'
  | 'unknown'

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
  // split swaps: a payout or refund leg names the output it belongs to (its position in the order)
  meta?: { outputIndex?: number; refund?: boolean; sellAmountUsd?: string; pauseReason?: string }
}

export interface TrackResponse extends TrackLeg {
  status: TxStatus
  providers?: ProviderName[]
  legs?: TrackLeg[]
  meta?: { sellAmountUsd?: string; pauseReason?: string }
}

export interface AmlCheckResult {
  address: string
  passed: boolean
  completed: boolean
}

export interface AmlCheckResponse {
  // true = all passed, false = at least one failed, null = inconclusive
  passedAmlCheck: boolean | null
  results: AmlCheckResult[]
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
