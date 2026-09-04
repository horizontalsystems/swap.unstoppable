import type { QuoteResponseRoute } from '@/types'

// The route's execution path, for the confirm screen. Deliverable 5 asks for price, path and time
// to be shown; price and time already are.
//
// stellar-web-sdk leaves `route.meta` null on every provider, so there is no hop list to read from
// a dry quote. A COMMITTED route is different: a path-payment envelope carries its real
// intermediate assets, and those are the actual hops the network will take.

export interface RouteHop {
  ticker: string
  /** True for a hop the venue routes through rather than one the user chose. */
  intermediate: boolean
}

/**
 * Decode the real hops from a committed Stellar route's transaction envelope.
 *
 * Returns undefined when the path cannot be known rather than guessing one:
 *  - AQUARIUS routes are a Soroban `invokeHostFunction`, whose path lives inside the contract call;
 *  - STELLARBROKER has no envelope at commit time at all — the broker builds each transaction
 *    mid-session, and it re-quotes as it goes, so there is no path to show up front.
 */
export const decodeStellarPath = async (route: QuoteResponseRoute): Promise<RouteHop[] | undefined> => {
  const execution = route.execution
  if (execution?.method !== 'signed_transaction') return undefined

  const entry = execution.transactions?.[0]
  if (!entry || entry.kind !== 'stellar' || !entry.xdr) return undefined

  try {
    const { TransactionBuilder, Networks } = await import('@stellar/stellar-sdk')
    const tx = TransactionBuilder.fromXDR(entry.xdr, Networks.PUBLIC)
    if (!('operations' in tx)) return undefined

    for (const op of tx.operations) {
      if (op.type !== 'pathPaymentStrictSend' && op.type !== 'pathPaymentStrictReceive') continue

      const code = (asset: { isNative(): boolean; getCode(): string }) => (asset.isNative() ? 'XLM' : asset.getCode())

      return [
        { ticker: code(op.sendAsset), intermediate: false },
        ...op.path.map(asset => ({ ticker: code(asset), intermediate: true })),
        { ticker: code(op.destAsset), intermediate: false }
      ]
    }
  } catch {
    // A path we cannot decode is simply not shown — never block a swap on a display detail.
  }

  return undefined
}

/** The fallback path when no envelope hops are available: just the two assets the user picked. */
export const directPath = (fromTicker: string, toTicker: string): RouteHop[] => [
  { ticker: fromTicker, intermediate: false },
  { ticker: toTicker, intermediate: false }
]
