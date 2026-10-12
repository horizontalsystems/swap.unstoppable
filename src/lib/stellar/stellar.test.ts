import { describe, expect, it } from 'vitest'
import { EXCLUDED_STELLAR_PROVIDERS, STELLAR_CHAIN_ID, STELLAR_DEX_PROVIDERS, stellarTokens } from '@/lib/stellar/asset-list'

const YXLM_ISSUER = 'GARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55'

describe('stellarTokens', () => {
  it('produces catalog-shaped tokens on the Stellar chain id with case-preserved codes', () => {
    const tokens = stellarTokens()
    expect(tokens.every(t => t.chain === 'XLM' && t.chainId === STELLAR_CHAIN_ID && t.decimals === 7)).toBe(true)
    expect(tokens.find(t => t.ticker === 'yXLM')?.identifier).toBe(`XLM.yXLM-${YXLM_ISSUER}`)
    expect(new Set(tokens.map(t => t.identifier)).size).toBe(tokens.length)
  })

  it('never offers StellarBroker', () => {
    expect(STELLAR_DEX_PROVIDERS).not.toContain('STELLARBROKER')
    expect(EXCLUDED_STELLAR_PROVIDERS).toContain('STELLARBROKER')
  })
})
