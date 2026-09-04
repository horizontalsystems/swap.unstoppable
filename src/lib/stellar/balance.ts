import { USwapNumber } from '@uswap/core'
import { Asset } from '@/components/swap/asset'
import { getStellarSdk } from '@/lib/stellar/sdk'

// Stellar balances come straight from Horizon: USwap has no Stellar toolbox, and the SDK's
// HorizonClient is already pointed at our ValidationCloud proxy.

/**
 * Every ledger entry an account owns costs this much XLM, locked and unspendable.
 *
 * A network parameter rather than a constant of the protocol — Horizon reports the live value on
 * `/ledgers` as `base_reserve_in_stroops`. It has been 0.5 XLM since 2019 and changing it needs a
 * validator vote, so it is inlined rather than fetched on every balance read; re-check it if the
 * network ever votes one through.
 */
const BASE_RESERVE = 0.5

/** Base reserve is charged twice for the account itself, before any subentries. */
const ACCOUNT_RESERVE_UNITS = 2

/**
 * Headroom for network fees, in XLM. Stellar's base fee is 0.00001 XLM per operation and a swap is
 * a handful of operations, so this is generous by orders of magnitude — but a StellarBroker session
 * can sign several transactions, and leaving the account unable to pay for the last one is a much
 * worse failure than a slightly conservative maximum.
 */
const FEE_BUFFER = 1

/**
 * Horizon returns more than the SDK's interface names. Two extras matter here: `subentry_count`
 * feeds the reserve, and `selling_liabilities` is the amount already committed to open orders.
 */
type HorizonAccountWithSubentries = {
  balances: {
    balance: string
    asset_type: string
    asset_code?: string
    asset_issuer?: string
    selling_liabilities?: string
  }[]
  subentry_count?: number
}

export interface StellarBalance {
  total: USwapNumber
  spendable: USwapNumber
  /** False when the account holds no trustline for a classic asset — it cannot receive it either. */
  hasTrustline: boolean
}

const ZERO = (): StellarBalance => ({ total: new USwapNumber(0), spendable: new USwapNumber(0), hasTrustline: false })

/**
 * Read one asset's balance for a Stellar account.
 *
 * The subtlety is XLM: an account cannot spend down to zero. It must retain
 * `(2 + subentry_count) × 0.5 XLM` — every trustline, offer, signer and data entry adds a subentry
 * — and a transaction that would breach that reserve is rejected by the network, not merely
 * discouraged. Classic assets carry no reserve of their own; the reserve their trustline costs is
 * charged against XLM.
 */
export const getStellarBalance = async (address: string, asset: Asset): Promise<StellarBalance> => {
  const sdk = await getStellarSdk()
  const { parseStellarAssetIdentifier, isNativeAsset } = await import('stellar-web-sdk')

  const account = (await sdk.horizon.getAccount(address)) as HorizonAccountWithSubentries | null
  // An account that has never been funded does not exist on-chain at all.
  if (!account) return ZERO()

  const target = parseStellarAssetIdentifier(asset.identifier)
  const native = isNativeAsset(target)

  const line = account.balances.find(balance =>
    native ? balance.asset_type === 'native' : balance.asset_code === target.code && balance.asset_issuer === target.issuer
  )

  // No matching line means no trustline: the account holds none and cannot receive any.
  if (!line) return ZERO()

  const total = new USwapNumber(line.balance)

  // Anything already committed to open SDEX offers cannot be spent, and the network enforces that
  // independently of the reserve. It applies to classic assets too, not just XLM — an account
  // selling USDC on the orderbook has that much less USDC available to swap.
  const liabilities = Number(line.selling_liabilities ?? 0)

  if (!native) {
    const locked = new USwapNumber(liabilities)
    return { total, spendable: total.gt(locked) ? total.sub(locked) : new USwapNumber(0), hasTrustline: true }
  }

  const reserve = (ACCOUNT_RESERVE_UNITS + (account.subentry_count ?? 0)) * BASE_RESERVE
  const locked = new USwapNumber(reserve + liabilities + FEE_BUFFER)

  return {
    total,
    spendable: total.gt(locked) ? total.sub(locked) : new USwapNumber(0),
    hasTrustline: true
  }
}

/**
 * Every asset a Stellar account holds, for the wallet sidebar.
 *
 * Horizon returns one line per trustline plus the native balance, which is the whole picture — an
 * account cannot hold an asset it has no trustline for. Codes and issuers are case-sensitive and
 * are passed through exactly as Horizon reports them.
 */
export interface StellarBalanceLine {
  identifier: string
  /**
   * Stroops (base units). Paired with an explicit decimal when building USwap's AssetValue, so the
   * amount never depends on USwap's decimal fallback for a Stellar token it has no static entry
   * for. (It still logs a one-off warning about that fallback; the value is unaffected, since
   * every Stellar asset is 7-dp and 7 is exactly what it falls back to.)
   */
  baseAmount: string
}

export const getStellarBalances = async (address: string): Promise<StellarBalanceLine[]> => {
  const sdk = await getStellarSdk()
  const { toStroops } = await import('stellar-web-sdk')

  const account = (await sdk.horizon.getAccount(address)) as HorizonAccountWithSubentries | null
  if (!account) return []

  return account.balances
    .map(line => {
      const identifier =
        line.asset_type === 'native' ? 'XLM.XLM' : line.asset_code && line.asset_issuer ? `XLM.${line.asset_code}-${line.asset_issuer}` : undefined
      if (!identifier) return undefined

      try {
        return { identifier, baseAmount: toStroops(line.balance).toString() }
      } catch {
        return undefined
      }
    })
    .filter((entry): entry is StellarBalanceLine => !!entry)
}
