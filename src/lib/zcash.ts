import { ZcashAddressRule } from '@/types'

// The aggregator's addressRules name three encodings a route can take. Shielded sapling
// (zs1…) addresses never appear in the rules, so they get no kind here and fail the rule check.
export type ZcashAddressKind = 'transparent' | 'tex' | 'unified'

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
const BECH32_CHARS = `[${BECH32_CHARSET}]`
// a unified address (ZIP-316) with a single orchard receiver is 141 chars; anything near that is plausible
const UNIFIED_REGEX = new RegExp(`^u1${BECH32_CHARS}{50,}$`)
// tex1 + 32 data chars + 6 checksum chars (ZIP-320 wraps a 20-byte hash)
const TEX_REGEX = new RegExp(`^tex1${BECH32_CHARS}{38}$`)

const BECH32M_CONST = 0x2bc830a3
const BECH32M_GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]

const polymod = (values: number[]): number => {
  let checksum = 1
  for (const value of values) {
    const top = checksum >>> 25
    checksum = ((checksum & 0x1ffffff) << 5) ^ value
    for (let i = 0; i < 5; i++) {
      if ((top >>> i) & 1) checksum ^= BECH32M_GENERATOR[i]
    }
  }
  return checksum
}

// Checksum check for an all-lowercase bech32m string. Unified (ZIP-316) and tex (ZIP-320) addresses
// are both Bech32m; ZIP-316 lifts bech32's 90-char length cap, so no length check here.
export const bech32mVerify = (address: string): boolean => {
  const separator = address.lastIndexOf('1')
  if (separator < 1 || separator + 7 > address.length) return false

  const hrp = address.slice(0, separator)
  const values: number[] = []
  for (const char of hrp) values.push(char.charCodeAt(0) >>> 5)
  values.push(0)
  for (const char of hrp) values.push(char.charCodeAt(0) & 31)
  for (const char of address.slice(separator + 1)) {
    const index = BECH32_CHARSET.indexOf(char)
    if (index === -1) return false
    values.push(index)
  }

  return polymod(values) === BECH32M_CONST
}

// Unified and tex addresses are shape- and checksum-checked here (the server only checks the kind,
// and only once enforcement is on); transparent base58 checksums are the SDK validator's job.
export const zcashAddressKind = (address: string): ZcashAddressKind | undefined => {
  const lower = address.toLowerCase()
  // bech32 forbids mixed case
  const normalized = address === lower || address === address.toUpperCase() ? lower : address
  if (UNIFIED_REGEX.test(normalized)) return bech32mVerify(normalized) ? 'unified' : undefined
  if (TEX_REGEX.test(normalized)) return bech32mVerify(normalized) ? 'tex' : undefined
  if (/^t[13][1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) return 'transparent'
  return undefined
}

// Whether the route takes this address. 'checksum' = it is a transparent address the rule takes,
// but the caller still owes it a base58 checksum validation (the SDK validator).
export const zcashRuleAllows = (rule: ZcashAddressRule, address: string): boolean | 'checksum' => {
  switch (zcashAddressKind(address)) {
    case 'unified':
      return !!rule.unified
    case 'tex':
      return !!rule.tex
    case 'transparent':
      return rule.transparent ? 'checksum' : false
    default:
      return false
  }
}
