import type { BrokerSessionCallbacks, CommittedRoute, ExecutionResult, RouteTracking } from 'stellar-web-sdk'
import { Asset } from '@/components/swap/asset'
import { adaptStellarRoute, adaptStellarTrack } from '@/lib/stellar/adapt'
import { forgetMediator, persistMediator, releaseMediator } from '@/lib/stellar/mediator'
import { getStellarSdk } from '@/lib/stellar/sdk'
import { freighterSigner } from '@/lib/stellar/wallet'
import { AppProviderName, QuoteResponseRoute, TrackResponse } from '@/types'

// Commit → (trustline gate) → execute, for the routes stellar-web-sdk owns. The aggregator's
// /swap + uSwap.swap() path is untouched; swap-dialog picks between them on the provider.

export interface StellarCommitParams {
  assetFrom: Asset
  assetTo: Asset
  sellAmount: string
  /** PERCENT, as the quote request takes it. */
  slippage: number
  sourceAddress: string
  destinationAddress: string
  provider: AppProviderName
}

export interface StellarCommit {
  /** The shape the confirm screen and transaction store already render. */
  route: QuoteResponseRoute
  /** The SDK's own object — `execute()` and `track()` both need this, not the adapted copy. */
  committed: CommittedRoute
}

/**
 * Error codes worth a second attempt at commit: a stale price and transport failures. Everything
 * else (`invalid_params`, `no_route`, `trustline_required`) fails the same way however often it is
 * asked, so retrying only delays telling the user.
 */
const RETRYABLE_COMMIT_CODES = new Set(['rate_expired', 'server_error', 'timeout', 'provider_error'])

const isRetryable = (error: unknown): boolean => {
  const code = (error as { code?: string })?.code
  return !!code && RETRYABLE_COMMIT_CODES.has(code)
}

/**
 * Commit against one venue. Re-prices at the picked provider, so the returned amount can differ
 * slightly from the quote the user clicked — that is the point of committing.
 *
 * Retried once on a transient failure. This is safe in a way `execute` is not: committing only
 * builds an order and an unsigned envelope, so a second attempt cannot double-spend. It re-prices
 * on the retry, which is the correct behaviour for a quote that went stale.
 */
export const commitStellarRoute = async (params: StellarCommitParams): Promise<StellarCommit> => {
  try {
    return await commitOnce(params)
  } catch (error) {
    if (!isRetryable(error)) throw error
    return commitOnce(params)
  }
}

const commitOnce = async (params: StellarCommitParams): Promise<StellarCommit> => {
  const sdk = await getStellarSdk()

  const committed = await sdk.commit({
    sellAsset: params.assetFrom.identifier,
    buyAsset: params.assetTo.identifier,
    sellAmount: params.sellAmount,
    slippage: params.slippage,
    sourceAddress: params.sourceAddress,
    destinationAddress: params.destinationAddress,
    provider: params.provider
  })

  return {
    committed,
    route: adaptStellarRoute(committed, {
      sourceAddress: params.sourceAddress,
      destinationAddress: params.destinationAddress
    })
  }
}

export interface TrustlineGate {
  /** True when the recipient cannot receive the buy asset yet. */
  required: boolean
  /** True when we can fix it — only the account's own owner can add its trustline. */
  activatable: boolean
}

/**
 * Buying a classic Stellar asset the recipient does not trust fails on-chain (`op_no_trust`), so
 * this runs before committing.
 *
 * A trustline can only be created by the account that will hold it. When the recipient is a third
 * party we can detect the problem but not fix it, and the user has to be told rather than walked
 * into a transaction that cannot succeed.
 */
export const checkStellarTrustline = async (recipient: string, buyAsset: Asset, sourceAddress?: string): Promise<TrustlineGate> => {
  const sdk = await getStellarSdk()
  const { parseStellarAssetIdentifier } = await import('stellar-web-sdk')

  const status = await sdk.checkTrustline(recipient, parseStellarAssetIdentifier(buyAsset.identifier).identifier)

  return {
    required: status.required,
    activatable: status.required && !!sourceAddress && recipient === sourceAddress
  }
}

/** Add the trustline to the connected account, then the caller re-quotes. */
export const activateStellarTrustline = async (address: string, asset: Asset): Promise<string> => {
  const sdk = await getStellarSdk()
  const { parseStellarAssetIdentifier } = await import('stellar-web-sdk')

  const signer = await freighterSigner(address)
  const result = await sdk.activateTrustline(signer, parseStellarAssetIdentifier(asset.identifier).identifier)
  return result.hash
}

export interface StellarExecuteOptions {
  callbacks?: BrokerSessionCallbacks
  signal?: AbortSignal
  /** StellarBroker only: the wallet is about to be asked to fund the mediator account. */
  onFunding?: () => void
}

export interface StellarMediator {
  address: string
  fundingHash: string
  /** The merge back into the wallet. Absent when it failed — see `sweepFailed`. */
  disposeHash?: string
  /**
   * The swap may well have completed, but its proceeds are still on the mediator account. The
   * handle stays persisted and `recoverMediators` brings them back on a later visit.
   */
  sweepFailed?: Error
}

export interface StellarExecution {
  /** The hash to track by. Absent only when nothing was ever signed. */
  hash?: string
  /** False for a StellarBroker session that ended in failure — it may still have filled partially. */
  succeeded: boolean
  /** Why the broker session failed, when it did. */
  error?: Error
  result: ExecutionResult
  /**
   * The handle to track `hash` with. For a StellarBroker swap this points at the mediator account,
   * which is the account the broker credited; the route's own handle would read zero.
   */
  tracking: RouteTracking
  /** Present for StellarBroker routes, which run through a mediator account. */
  mediator?: StellarMediator
}

/**
 * Sign and broadcast a committed route.
 *
 * A StellarBroker route goes through a mediator account (`sdk.executeViaMediator`): Freighter
 * signs one transaction that funds a throwaway account, an in-page key drives the session at the
 * speed the broker's ~15 s envelope windows demand, and the account merges back afterwards. The
 * mediator's key is persisted before Freighter is asked to sign, and cleared once the merge lands.
 *
 * A failed StellarBroker session is **returned, not thrown** — the SDK hands back
 * `brokerSession.status === 'failed'` with the last signed hash attached. That distinction matters:
 * the broker fills across several transactions, so a failed session may already have moved value,
 * and treating it as a plain throw would drop the hash and leave a real swap untracked. The caller
 * records the transaction whenever `hash` is present, whatever `succeeded` says.
 */
export const executeStellarRoute = async (
  committed: CommittedRoute,
  sourceAddress: string,
  opts: StellarExecuteOptions = {}
): Promise<StellarExecution> => {
  const sdk = await getStellarSdk()
  const signer = await freighterSigner(sourceAddress)

  if (committed.execution.method !== 'stellar_broker') {
    const result = await sdk.execute(committed, signer, { callbacks: opts.callbacks, signal: opts.signal })
    return { hash: result.inboundTxHash, succeeded: true, result, tracking: committed.tracking }
  }

  let mediatorAddress: string | undefined
  try {
    opts.onFunding?.()
    const result = await sdk.executeViaMediator(committed, signer, {
      callbacks: opts.callbacks,
      signal: opts.signal,
      onMediator: handle => {
        mediatorAddress = handle.address
        persistMediator(handle)
      }
    })

    if (result.disposeHash) forgetMediator(result.mediator.address)

    const session = result.brokerSession
    return {
      hash: result.inboundTxHash,
      succeeded: session.status === 'success',
      error: session.error,
      result,
      tracking: result.tracking,
      mediator: {
        address: result.mediator.address,
        fundingHash: result.fundingHash,
        disposeHash: result.disposeHash,
        sweepFailed: result.disposeError
      }
    }
  } finally {
    // Whatever happened, no session owns this mediator any more. If the funding transaction never
    // landed the persisted handle points at an account that does not exist, and recovery drops it.
    if (mediatorAddress) releaseMediator(mediatorAddress)
  }
}

/**
 * Send the deposit for an AGGREGATOR route that sells from Stellar — the NEAR routes the aggregator
 * quotes alongside the SDK's own (see aggregatorExcludedProviders for why both are asked).
 *
 * These routes are not `stellarSdk`-marked, so swap-dialog would otherwise hand them to
 * `uSwap.swap()`, which resolves the sell-chain wallet through USwap — and USwap has no Stellar
 * wallet, so a Freighter account fails there with "Unknown connected chain: XLM". The SDK's
 * `TransferExecutor` builds the same payment (+ text memo) from the aggregator's `transfer` block,
 * which is shape-identical to the SDK's own, and signs it with Freighter.
 *
 * Tracking then goes through the aggregator's `/track` by uuid + this hash, exactly as for any
 * other aggregator route — nothing Stellar-specific to persist.
 */
export const executeStellarDeposit = async (route: QuoteResponseRoute, sourceAddress: string): Promise<string> => {
  if (route.execution?.method !== 'transfer') {
    throw new Error(`Stellar deposit needs a transfer route, got ${route.execution?.method ?? 'none'}`)
  }

  const sdk = await getStellarSdk()
  const { TransferExecutor } = await import('stellar-web-sdk')
  const signer = await freighterSigner(sourceAddress)

  // Only `execution` is read; the rest of CommittedRoute is the SDK's bookkeeping.
  const result = await new TransferExecutor(sdk.config).execute({ execution: route.execution } as unknown as CommittedRoute, signer)
  if (!result.submitted || !result.inboundTxHash) {
    throw new Error('Stellar deposit was not submitted')
  }

  return result.inboundTxHash
}

/**
 * Read a committed Stellar swap's current outcome.
 *
 * Takes the `RouteTracking` block rather than the whole route, because that is genuinely all the
 * SDK needs and it is what survives in localStorage across a reload. `sdk.track(uuid)` is not an
 * option here: its uuid registry is in-memory only and empty after a refresh, which is exactly the
 * case tracking has to handle. `trackRoute` is the same function `sdk.track()` calls, given the
 * SDK's own public `router.context` and `horizon`.
 *
 * The outcome is read from the chain (Horizon) or the venue's own status endpoint — Axelarscan for
 * a bridge transfer — never from a record we kept.
 */
export const trackStellarRoute = async (tracking: RouteTracking, inboundTxHash?: string, signal?: AbortSignal): Promise<TrackResponse> => {
  const sdk = await getStellarSdk()
  const { trackRoute } = await import('stellar-web-sdk')

  const result = await trackRoute(tracking, inboundTxHash, sdk.router.context, sdk.horizon, signal)
  return adaptStellarTrack(result)
}
