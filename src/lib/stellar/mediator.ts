import type { MediatorHandle } from 'stellar-web-sdk'
import { getStellarSdk } from '@/lib/stellar/sdk'

// A StellarBroker swap runs on a throwaway "mediator" account that the wallet funds with one
// signature and that merges back into the wallet when the session ends (see the SDK's
// executeViaMediator). Between those two transactions the user's funds sit on an account whose
// only key is in page memory — so the key is written here before the wallet is even asked to
// sign, and cleared once the merge lands. Whatever is still here on the next visit is a swap the
// page did not live to finish, and the funds come back through `recoverMediators`.

const KEY_PREFIX = 'stellar-mediator:'

/**
 * What the mediator holds on top of the sell amount, for the confirm screen: the SDK's 5 XLM fee
 * reserve plus base reserves for the account, its signer and up to two trustlines (0.5 XLM each).
 * Refunded on merge, less the network fees actually spent.
 */
export const MEDIATOR_RESERVE_XLM = 7

/**
 * A handle younger than this is left alone by recovery: it may belong to a session still running
 * in another tab. Funding + a 180s session ceiling + the settlement wait fit comfortably inside.
 */
const RECOVERY_MIN_AGE_MS = 10 * 60_000

interface StoredMediator extends MediatorHandle {
  createdAt: number
}

/** Mediators with a session running in this tab. Recovery must never merge one of these away. */
const active = new Set<string>()
/** Mediators whose session ended in this tab without a merge — safe to recover straight away. */
const released = new Set<string>()

const storageKey = (address: string) => `${KEY_PREFIX}${address}`

const read = (key: string): StoredMediator | undefined => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as Partial<StoredMediator>
    if (!parsed.address || !parsed.secret || !parsed.source) return undefined
    return { address: parsed.address, secret: parsed.secret, source: parsed.source, createdAt: parsed.createdAt ?? 0 }
  } catch {
    return undefined
  }
}

/** Write the handle before anything is on-chain. Throws if it cannot — funding must not proceed then. */
export const persistMediator = (handle: MediatorHandle): void => {
  const stored: StoredMediator = { ...handle, createdAt: Date.now() }
  localStorage.setItem(storageKey(handle.address), JSON.stringify(stored))
  active.add(handle.address)
}

export const forgetMediator = (address: string): void => {
  active.delete(address)
  released.delete(address)
  try {
    localStorage.removeItem(storageKey(address))
  } catch {
    // Nothing to do: the next recovery pass will find it already merged and drop it then.
  }
}

/** The session is over (merged or not); the handle may stay persisted, but it is no longer live. */
export const releaseMediator = (address: string): void => {
  active.delete(address)
  released.add(address)
}

/** Handles for `source` that no running session owns and that are old enough to be abandoned. */
export const strandedMediators = (source: string): StoredMediator[] => {
  if (typeof window === 'undefined') return []
  const found: StoredMediator[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(KEY_PREFIX)) continue
      const stored = read(key)
      if (!stored || stored.source !== source || active.has(stored.address)) continue
      if (!released.has(stored.address) && Date.now() - stored.createdAt < RECOVERY_MIN_AGE_MS) continue
      found.push(stored)
    }
  } catch {
    // localStorage unavailable — nothing persisted, nothing to recover.
  }
  return found
}

export interface MediatorRecovery {
  address: string
  /** The merge transaction, when funds came back. */
  hash?: string
  /** Set when the mediator still holds funds and the merge failed. Left persisted for next time. */
  error?: Error
}

const inFlight = new Map<string, Promise<MediatorRecovery[]>>()

/**
 * Merge every stranded mediator for `source` back into it, using the persisted secret — no wallet
 * prompt. One pass per account at a time; a second caller shares the running one.
 *
 * A mediator that no longer exists on-chain was already merged (the page died after the merge but
 * before the handle was cleared), so its handle is dropped without a transaction.
 */
export const recoverMediators = (source: string): Promise<MediatorRecovery[]> => {
  const running = inFlight.get(source)
  if (running) return running

  const pass = (async () => {
    const stranded = strandedMediators(source)
    if (!stranded.length) return []

    const sdk = await getStellarSdk()
    const { keypairSigner } = await import('stellar-web-sdk')

    const results: MediatorRecovery[] = []
    for (const handle of stranded) {
      try {
        const account = await sdk.horizon.getAccount(handle.address)
        if (!account) {
          forgetMediator(handle.address)
          results.push({ address: handle.address })
          continue
        }
        const submit = await sdk.disposeMediator(handle.address, source, keypairSigner(handle.secret))
        forgetMediator(handle.address)
        results.push({ address: handle.address, hash: submit.hash })
      } catch (err) {
        results.push({ address: handle.address, error: err instanceof Error ? err : new Error(String(err)) })
      }
    }
    return results
  })().finally(() => inFlight.delete(source))

  inFlight.set(source, pass)
  return pass
}
