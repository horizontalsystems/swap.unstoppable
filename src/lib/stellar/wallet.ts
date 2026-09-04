import type { StellarSigner } from 'stellar-web-sdk'
import { StellarWalletOption } from '@/types'

// Freighter is the one Stellar wallet the app ships. It speaks SEP-43, so stellar-web-sdk's
// `sep43Signer` adapts it directly — and unlike most Stellar extensions it implements
// `signAuthEntry`, which is what makes StellarBroker's Soroban leg (and therefore the venue that
// often quotes best) usable at all.
//
// Everything here is browser-only and dynamically imported: @stellar/freighter-api touches window
// at module scope.

/** Stellar mainnet. A wallet pointed anywhere else must not be allowed to sign. */
export const STELLAR_PUBLIC_PASSPHRASE = 'Public Global Stellar Network ; September 2015'

/**
 * Which Stellar wallets can sign Soroban authorization entries — declared, never inferred.
 *
 * Only StellarBroker's Soroban leg needs this; every other route signs whole transactions, which
 * all wallets do. It has to be a declaration because wallet kits advertise `signAuthEntry` on every
 * module and the incapable ones reject only at call time — and the broker chooses Soroban vs
 * classic per message mid-session, so an over-claim surfaces after a partial fill has already moved
 * value. Under-claiming merely costs a venue; over-claiming breaks a swap with funds in flight.
 *
 * Verify against the wallet version you ship before adding an entry here.
 */
export const STELLAR_WALLET_SIGNS_AUTH_ENTRIES: Record<StellarWalletOption, boolean> = {
  FREIGHTER: true
}

export const FREIGHTER_SIGNS_AUTH_ENTRIES = STELLAR_WALLET_SIGNS_AUTH_ENTRIES.FREIGHTER

type FreighterApi = typeof import('@stellar/freighter-api')

const api = async (): Promise<FreighterApi> => import('@stellar/freighter-api')

/**
 * Is Freighter installed?
 *
 * This has to be async. `window.freighter` is only a fast path that older builds set; current
 * Freighter announces itself by answering a `postMessage` handshake instead, which is what
 * `isConnected()` performs. A synchronous global check reports "not installed" for an extension
 * that is installed and working.
 *
 * Note `isConnected()` means "the extension is there", not "an account is unlocked or shared" —
 * which is exactly the question the wallet list is asking.
 */
export const detectFreighter = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false

  try {
    const freighter = await api()
    const result = await freighter.isConnected()
    return !!result.isConnected
  } catch {
    return false
  }
}

/** Freighter reports failure by returning an `error` field rather than throwing. */
const unwrap = <T extends { error?: unknown }>(result: T, action: string): T => {
  if (result.error) {
    const error = result.error as { message?: string } | string
    throw new Error(typeof error === 'string' ? error : (error.message ?? `Freighter ${action} failed`))
  }
  return result
}

/**
 * Prompt for access and return the active account.
 *
 * The network is checked here, not at signing time: Freighter happily sits on testnet, and a user
 * who only finds out after building a swap has wasted the whole flow. The passphrase is the
 * authoritative signal — the display name is not.
 */
export const connectFreighter = async (): Promise<string> => {
  if (!(await detectFreighter())) {
    throw new Error('Freighter is not installed')
  }

  const freighter = await api()

  // Access first: `getNetwork` is gated behind the permission prompt on some Freighter versions,
  // and a network error raised before the user has even been asked reads as a broken wallet.
  const { address } = unwrap(await freighter.requestAccess(), 'requestAccess')
  if (!address) throw new Error('Freighter returned no account')

  const network = unwrap(await freighter.getNetwork(), 'getNetwork')
  if (network.networkPassphrase !== STELLAR_PUBLIC_PASSPHRASE) {
    throw new Error(`Freighter is on ${network.network || 'an unknown network'} — switch it to Stellar mainnet (Public) to swap`)
  }

  return address
}

/**
 * A `StellarSigner` backed by Freighter, for `sdk.execute()` / `sdk.activateTrustline()`.
 *
 * The SDK verifies that what comes back is the same transaction signed by this account before
 * merging the signature, so a wallet that swaps the transaction or signs with a different account
 * is rejected as `signing_rejected` rather than surfacing later as a submit failure.
 */
export const freighterSigner = async (publicKey: string): Promise<StellarSigner> => {
  const [{ sep43Signer }, freighter] = await Promise.all([import('stellar-web-sdk'), api()])

  return sep43Signer(
    publicKey,
    { signTransaction: freighter.signTransaction, signAuthEntry: freighter.signAuthEntry },
    { authEntrySigning: FREIGHTER_SIGNS_AUTH_ENTRIES }
  )
}
