import { QuoteResponseRoute as BaseQuoteResponseRoute } from '@uswap/helpers/api'
import { ProviderName } from '@uswap/helpers'
import { WalletOption } from '@uswap/core'

export { ProviderName }

// Wallets the app drives itself rather than through USwap, which has no Stellar support at all —
// no plugin, no toolbox, no wallet adapter. They travel alongside WalletOption everywhere an
// account is stored or rendered.
export const STELLAR_WALLETS = ['FREIGHTER'] as const

export type StellarWalletOption = (typeof STELLAR_WALLETS)[number]

export type AppWalletOption = WalletOption | StellarWalletOption

export const isStellarWallet = (option: string): option is StellarWalletOption => (STELLAR_WALLETS as readonly string[]).includes(option)

/**
 * The USwap wallet option for an account, or undefined for one USwap doesn't manage. Anything
 * reached through `uSwap.getWallet()` — sending, gas estimation, USwap-executed swaps — is
 * unavailable for a Stellar account, so callers handle the undefined rather than cast past it.
 */
export const uSwapWalletOption = (option: AppWalletOption): WalletOption | undefined => (isStellarWallet(option) ? undefined : option)

// The Stellar venues stellar-web-sdk routes across. They are absent from @uswap/helpers'
// ProviderName because the SDK quotes them client-side rather than through the aggregator — the
// aggregator does list them, but we strip them from /rate so a venue never appears twice.
export const STELLAR_SDK_PROVIDERS = ['STELLARBROKER', 'SOROSWAP', 'AQUARIUS', 'STELLAR_DEX', 'AXELAR_ITS'] as const

export type StellarProviderName = (typeof STELLAR_SDK_PROVIDERS)[number]

export type AppProviderName = ProviderName | StellarProviderName

export const isStellarSdkProvider = (name: string): name is StellarProviderName => (STELLAR_SDK_PROVIDERS as readonly string[]).includes(name)

export type QuoteResponseRoute = Omit<BaseQuoteResponseRoute, 'providers' | 'execution'> & {
  providers: AppProviderName[]
  // The aggregator's three execution shapes plus stellar_broker, which only the SDK produces.
  execution?: BaseQuoteResponseRoute['execution'] | StellarBrokerExecution
}

/** StellarBroker's execution block — the parameters for the interactive WebSocket trade. */
export interface StellarBrokerExecution {
  method: 'stellar_broker'
  chain: string
  /** StellarBroker wire form: `XLM` native, `CODE-GISSUER…` classic. */
  sellingAsset: string
  buyingAsset: string
  sellingAmount: string
  /** A FRACTION (0.01 = 1%), not the percent the quote request takes. Use verbatim. */
  slippageTolerance: number
  partnerKey?: string
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
  providers?: AppProviderName[]
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
