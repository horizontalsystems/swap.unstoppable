import type { Fee as SdkFee, Route as SdkRoute, TrackResponse as SdkTrackResponse } from 'stellar-web-sdk'
import { ProviderName } from '@uswap/helpers'
import { Asset } from '@/components/swap/asset'
import { isStellarChain } from '@/lib/stellar/asset-list'
import { AppProviderName, QuoteResponseRoute, TrackResponse, TxStatus } from '@/types'

/**
 * stellar-web-sdk's `Route` and the aggregator's `QuoteResponseRoute` describe the same thing in
 * nearly the same shape, so this is a field mapping rather than a translation. The differences that
 * matter:
 *
 *  - the SDK types `providers`, `fees[].protocol` and `fees[].type` as plain strings, while the
 *    aggregator's zod schema pins them to its own enums — hence the casts, which are safe because
 *    every SDK fee `type` is a value of `FeeTypeEnum` and `protocol` is only ever displayed;
 *  - `minBuyAmount: null` is meaningful, not missing: STELLARBROKER re-quotes live in-session and
 *    has no client-verifiable floor. It is carried through as an explicit null, which is exactly
 *    what the aggregator's own floating-rate P2P routes use;
 *  - the SDK's `estimatedTime` always has every leg; the aggregator's has them optional.
 */

const feeChain = (fee: SdkFee): string => fee.chain ?? 'XLM'

const adaptFees = (fees: SdkFee[]): QuoteResponseRoute['fees'] =>
  fees.map(fee => ({
    amount: fee.amount,
    asset: fee.asset,
    chain: feeChain(fee),
    protocol: (fee.protocol ?? 'STELLAR_DEX') as ProviderName,
    type: fee.type as QuoteResponseRoute['fees'][number]['type']
  }))

export interface AdaptRouteContext {
  /** Echoed onto the route: the API doesn't return them and the confirm screen needs them. */
  sourceAddress?: string
  destinationAddress?: string
  refundAddress?: string
}

/** Map one SDK route onto the shape the rest of the app already renders and executes. */
export const adaptStellarRoute = (route: SdkRoute, ctx: AdaptRouteContext = {}): QuoteResponseRoute => ({
  providers: route.providers as AppProviderName[],
  sellAsset: route.sellAsset,
  sellAmount: route.sellAmount,
  buyAsset: route.buyAsset,
  expectedBuyAmount: route.expectedBuyAmount,
  // Explicit null: an estimate, not a floor. Do not collapse to undefined.
  minBuyAmount: route.minBuyAmount,
  fees: adaptFees(route.fees),
  estimatedTime: route.estimatedTime,
  amlPolicy: route.amlPolicy,
  accuracy: route.accuracy,
  amlErrors: route.amlErrors,
  // Marks the route as one this SDK produced and must execute. It matters for NEAR: that provider
  // name also comes from the aggregator, where it is a deposit-address flow needing no wallet,
  // whereas here it is signed and submitted by the connected Stellar wallet.
  meta: { ...(route.meta as object), stellarSdk: true } as QuoteResponseRoute['meta'],
  expiresAt: route.expiresAt,
  execution: route.execution as QuoteResponseRoute['execution'],
  uuid: route.uuid,
  sourceAddress: ctx.sourceAddress,
  destinationAddress: ctx.destinationAddress,
  refundAddress: ctx.refundAddress
})

/** True for a route produced by stellar-web-sdk, which the SDK must also be the one to execute. */
export const isStellarSdkRoute = (route: Pick<QuoteResponseRoute, 'meta'>): boolean =>
  (route.meta as { stellarSdk?: boolean } | undefined)?.stellarSdk === true

/** Map the SDK's tracking read onto the app's `TrackResponse`. */
export const adaptStellarTrack = (track: SdkTrackResponse): TrackResponse => ({
  status: track.status as TxStatus,
  providers: track.providers as AppProviderName[],
  fromAsset: track.fromAsset,
  fromAmount: track.fromAmount,
  fromAddress: track.fromAddress,
  toAsset: track.toAsset,
  toAmount: track.toAmount,
  toAddress: track.toAddress,
  legs: track.legs as TrackResponse['legs'],
  meta: track.meta as TrackResponse['meta']
})

/**
 * Which SDK fan-out, if any, serves this pair.
 *
 * The dividing line is the **sell** asset, not "either leg". A Stellar-origin swap is one the
 * connected Stellar wallet signs and the SDK submits; anything else needs an origin-chain wallet,
 * an origin-chain refund address, and a deposit-address flow that the aggregator already provides.
 *
 * `in_chain` — both legs on Stellar; the four Stellar venues compete on price.
 * `axelar`   — the same token bridged Stellar → Ethereum (XLM→XLM, SHX→SHX).
 * `near`     — Stellar → any other chain, via 1Click. The SDK builds and submits the Stellar-side
 *              deposit itself, so this needs no deposit UI of its own.
 * `none`     — everything else, the aggregator's. Notably every NON-Stellar origin, including the
 *              Ethereum → Stellar half of an Axelar pair: `isAxelarPair` is symmetric, but the SDK
 *              builds an EVM transaction for that direction and then refuses to sign it, so
 *              claiming it here would surface a route that cannot be executed.
 */
export type StellarPairKind = 'in_chain' | 'axelar' | 'near' | 'none'

export const stellarPairKind = (from: Asset | undefined, to: Asset | undefined, isAxelarPair: (a: string, b: string) => boolean): StellarPairKind => {
  if (!from || !to) return 'none'
  if (isStellarChain(from.chain) && isStellarChain(to.chain)) return 'in_chain'

  // Stellar ORIGIN only. Axelar's other direction (Ethereum → Stellar) is an EVM transaction the
  // Stellar SDK builds but explicitly refuses to sign, so claiming it here would surface a route
  // that cannot be executed. That direction stays with the aggregator, which reaches it through
  // the EVM wallet — see aggregatorExcludedProviders.
  // Non-Stellar origin is the aggregator's, whatever the destination.
  if (!isStellarChain(from.chain)) return 'none'

  // Checked before the NEAR fallback: an ITS pair is also cross-chain, and NEAR cannot bridge it 1:1.
  if (isAxelarPair(from.identifier, to.identifier)) return 'axelar'

  return 'near'
}

/**
 * The venues to fan out to for a pair kind.
 *
 * Two capability limits, both applied here rather than discovered at commit:
 *
 * - STELLARBROKER needs Soroban auth-entry signing, and it picks Soroban vs classic per message
 *   mid-session, so a wallet that cannot sign entries has to be kept out of the fan-out entirely
 *   rather than finding out after a partial fill has already moved value.
 * - STELLARBROKER and AQUARIUS settle on the trader's own account and cannot pay a third party at
 *   all. Quoting them for a swap that pays someone else offers a route that is guaranteed to be
 *   rejected at commit with `recipient_not_supported`.
 */
export const providersForPairKind = (kind: StellarPairKind, canSignAuthEntries: boolean, hasThirdPartyRecipient = false): AppProviderName[] => {
  if (kind === 'axelar') return ['AXELAR_ITS']
  if (kind === 'near') return [ProviderName.NEAR]
  if (kind !== 'in_chain') return []

  // Mirrors the SDK's own RECIPIENT_CAPABLE_PROVIDERS.
  if (hasThirdPartyRecipient) return ['SOROSWAP', 'STELLAR_DEX']

  const providers: AppProviderName[] = ['SOROSWAP', 'AQUARIUS', 'STELLAR_DEX']
  if (canSignAuthEntries) providers.unshift('STELLARBROKER')
  return providers
}
