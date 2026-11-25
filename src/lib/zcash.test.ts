import { describe, expect, it } from 'vitest'
import { bech32mVerify, zcashAddressKind, zcashRuleAllows } from '@/lib/zcash'

// a test-local bech32m encoder, so the fixtures carry real checksums
const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]

const polymod = (values: number[]): number => {
  let checksum = 1
  for (const value of values) {
    const top = checksum >>> 25
    checksum = ((checksum & 0x1ffffff) << 5) ^ value
    for (let i = 0; i < 5; i++) {
      if ((top >>> i) & 1) checksum ^= GENERATOR[i]
    }
  }
  return checksum
}

const bech32m = (hrp: string, payload: string): string => {
  const values: number[] = []
  for (const char of hrp) values.push(char.charCodeAt(0) >>> 5)
  values.push(0)
  for (const char of hrp) values.push(char.charCodeAt(0) & 31)
  for (const char of payload) values.push(CHARSET.indexOf(char))
  const mod = polymod([...values, 0, 0, 0, 0, 0, 0]) ^ 0x2bc830a3
  let checksum = ''
  for (let i = 0; i < 6; i++) checksum += CHARSET[(mod >>> (5 * (5 - i))) & 31]
  return `${hrp}1${payload}${checksum}`
}

const TRANSPARENT = 't1VJL2dPUyXK7avDRGdhqPt5qJzWcUR9yJF'
// 32 payload + 6 checksum = the 38 data chars of a ZIP-320 address
const TEX = bech32m('tex', CHARSET)
const UNIFIED = bech32m('u', CHARSET.repeat(4))

describe('bech32mVerify', () => {
  it('accepts the BIP-350 test vectors', () => {
    expect(bech32mVerify('a1lqfn3a')).toBe(true)
    expect(bech32mVerify('abcdef1l7aum6echk45nj3s0wdvt2fg8x9yrzpqzd3ryx')).toBe(true)
    expect(bech32mVerify('bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0')).toBe(true)
  })

  it('rejects a corrupted checksum and strings without a separator', () => {
    expect(bech32mVerify('a1lqfn33')).toBe(false)
    expect(bech32mVerify('qqqqqq')).toBe(false)
  })
})

describe('zcashAddressKind', () => {
  it('detects transparent p2pkh and p2sh addresses', () => {
    expect(zcashAddressKind(TRANSPARENT)).toBe('transparent')
    expect(zcashAddressKind('t3Vz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd')).toBe('transparent')
  })

  it('detects tex (ZIP-320) addresses', () => {
    expect(zcashAddressKind(TEX)).toBe('tex')
  })

  it('detects unified addresses, in either letter case', () => {
    expect(zcashAddressKind(UNIFIED)).toBe('unified')
    expect(zcashAddressKind(UNIFIED.toUpperCase())).toBe('unified')
  })

  it('rejects a unified or tex address with a broken checksum', () => {
    const flip = (address: string, at: number) => address.slice(0, at) + (address[at] === 'q' ? 'p' : 'q') + address.slice(at + 1)
    expect(zcashAddressKind(flip(UNIFIED, 10))).toBeUndefined()
    expect(zcashAddressKind(flip(TEX, 10))).toBeUndefined()
  })

  it('rejects sapling, mixed-case bech32, uppercase base58 and malformed strings', () => {
    expect(zcashAddressKind('zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly')).toBeUndefined()
    expect(zcashAddressKind(`u1Q${UNIFIED.slice(3)}`)).toBeUndefined()
    expect(zcashAddressKind(TRANSPARENT.toUpperCase())).toBeUndefined()
    expect(zcashAddressKind('u1short')).toBeUndefined()
    expect(zcashAddressKind('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq')).toBeUndefined()
  })
})

describe('zcashRuleAllows', () => {
  it('takes a unified address only where the rule recommends one', () => {
    expect(zcashRuleAllows({ unified: { receivers: ['orchard'], requiresOneOf: ['orchard'] }, transparent: true }, UNIFIED)).toBe(true)
    expect(zcashRuleAllows({ transparent: true }, UNIFIED)).toBe(false)
  })

  it('defers transparent addresses to a checksum validation', () => {
    expect(zcashRuleAllows({ transparent: true }, TRANSPARENT)).toBe('checksum')
    expect(zcashRuleAllows({ tex: true }, TRANSPARENT)).toBe(false)
  })

  it('takes tex addresses only where the rule lists them', () => {
    expect(zcashRuleAllows({ transparent: true, tex: true }, TEX)).toBe(true)
    expect(zcashRuleAllows({ transparent: true }, TEX)).toBe(false)
  })

  it('rejects an address with no recognised kind', () => {
    expect(zcashRuleAllows({ transparent: true, tex: true, unified: { receivers: [], requiresOneOf: [] } }, 'zs1something')).toBe(false)
  })
})
