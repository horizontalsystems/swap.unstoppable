import { describe, expect, it } from 'vitest'
import { Chain } from '@uswap/core'
import { Asset } from '@/components/swap/asset'
import { adaptStellarRoute, providersForPairKind, stellarPairKind } from '@/lib/stellar/adapt'
import { aggregatorExcludedProviders, stellarIdentifier, stellarProvidersFor } from '@/lib/stellar/asset-list'

const asset = (chain: string, identifier: string): Asset => ({
  chain: chain as Chain,
  chainId: chain === 'XLM' ? 'stellar' : '1',
  decimals: 7,
  identifier,
  ticker: identifier.split('.')[1]?.split('-')[0] ?? identifier,
  providers: []
})

const XLM = asset('XLM', 'XLM.XLM')
const USDC = asset('XLM', 'XLM.USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN')
const ETH_XLM = asset('ETH', 'ETH.XLM-0X8CF74FC1EC7B2187DDA77EA289F78CC54E2B7C8B')
const BTC = asset('BTC', 'BTC.BTC')

// Stands in for the SDK's isAxelarPair: true only for the same ticker bridged across chains.
const isAxelarPair = (a: string, b: string) => {
  const ticker = (id: string) => id.split('.')[1]?.split('-')[0]
  return ticker(a) === ticker(b) && ['XLM', 'SHX'].includes(ticker(a) ?? '')
}

describe('stellarPairKind', () => {
  it('claims a Stellar-native pair for the in-chain venues', () => {
    expect(stellarPairKind(XLM, USDC, isAxelarPair)).toBe('in_chain')
  })

  it('claims the Axelar bridge only with a Stellar origin', () => {
    // The SDK signs this direction.
    expect(stellarPairKind(XLM, ETH_XLM, isAxelarPair)).toBe('axelar')
    // Ethereum origin is an EVM transaction the Stellar SDK refuses to sign — claiming it would
    // surface a route that cannot be executed. It belongs to the aggregator.
    expect(stellarPairKind(ETH_XLM, XLM, isAxelarPair)).toBe('none')
  })

  it('routes a Stellar-origin cross-chain pair to NEAR', () => {
    expect(stellarPairKind(XLM, BTC, isAxelarPair)).toBe('near')
  })

  it('leaves every non-Stellar origin to the aggregator', () => {
    // The SDK can only sign a Stellar-origin swap. Anything else needs an origin-chain wallet and
    // an origin-chain refund address, which is the aggregator's deposit flow.
    expect(stellarPairKind(BTC, XLM, isAxelarPair)).toBe('none')
    // Including the Ethereum half of an Axelar pair: isAxelarPair is symmetric, but the SDK builds
    // an EVM transaction for that direction and then refuses to sign it.
    expect(stellarPairKind(ETH_XLM, XLM, isAxelarPair)).toBe('none')
  })

  it('claims nothing without both assets', () => {
    expect(stellarPairKind(undefined, USDC, isAxelarPair)).toBe('none')
    expect(stellarPairKind(XLM, undefined, isAxelarPair)).toBe('none')
  })
})

describe('providersForPairKind', () => {
  it('includes STELLARBROKER only when the wallet can sign Soroban auth entries', () => {
    expect(providersForPairKind('in_chain', true)).toContain('STELLARBROKER')
    expect(providersForPairKind('in_chain', false)).not.toContain('STELLARBROKER')
  })

  it('always offers the three venues that need no auth-entry signing', () => {
    for (const capable of [true, false]) {
      expect(providersForPairKind('in_chain', capable)).toEqual(expect.arrayContaining(['SOROSWAP', 'AQUARIUS', 'STELLAR_DEX']))
    }
  })

  it('fans out to a single venue for each cross-chain kind, and to nothing otherwise', () => {
    expect(providersForPairKind('axelar', true)).toEqual(['AXELAR_ITS'])
    expect(providersForPairKind('near', true)).toEqual(['NEAR'])
    expect(providersForPairKind('none', true)).toEqual([])
  })
})

describe('aggregatorExcludedProviders', () => {
  it('always withholds the four in-chain venues, which the SDK quotes itself', () => {
    const excluded = aggregatorExcludedProviders('BTC')
    for (const venue of ['STELLARBROKER', 'SOROSWAP', 'AQUARIUS', 'STELLAR_DEX']) {
      expect(excluded.has(venue)).toBe(true)
    }
  })

  it('withholds AXELAR_ITS only for a Stellar origin', () => {
    // SDK owns Stellar → Ethereum.
    expect(aggregatorExcludedProviders('XLM').has('AXELAR_ITS')).toBe(true)
    // The aggregator must keep Ethereum → Stellar, or that direction has no route at all.
    expect(aggregatorExcludedProviders('ETH').has('AXELAR_ITS')).toBe(false)
  })
})

describe('asset list', () => {
  it('builds canonical identifiers, native included', () => {
    expect(stellarIdentifier({ code: 'XLM', name: 'Stellar Lumens' })).toBe('XLM.XLM')
    expect(stellarIdentifier({ code: 'USDC', issuer: 'GA5Z', name: 'USD Coin' })).toBe('XLM.USDC-GA5Z')
  })

  it('adds AXELAR_ITS only to the bridged tickers', () => {
    expect(stellarProvidersFor({ code: 'USDC', issuer: 'GA5Z', name: 'USD Coin' })).not.toContain('AXELAR_ITS')
    expect(stellarProvidersFor({ code: 'XLM', name: 'Stellar Lumens', axelar: true })).toContain('AXELAR_ITS')
  })
})

describe('adaptStellarRoute', () => {
  const base = {
    providers: ['STELLARBROKER'],
    sellAsset: 'XLM.XLM',
    sellAmount: '100',
    buyAsset: 'XLM.USDC-GA5Z',
    expectedBuyAmount: '18.27',
    fees: [{ type: 'inbound' as const, chain: 'XLM', asset: 'XLM.XLM', amount: '0.0001', protocol: 'STELLARBROKER' }],
    estimatedTime: { inbound: 0, swap: 15, outbound: 0, total: 15 }
  }

  it('preserves a null minBuyAmount rather than collapsing it to undefined', () => {
    // null means "estimate, no on-chain floor" (StellarBroker re-quotes live). Losing the
    // distinction would show a guaranteed minimum the route does not have.
    const adapted = adaptStellarRoute({ ...base, minBuyAmount: null })
    expect(adapted.minBuyAmount).toBeNull()
  })

  it('carries an enforced floor through unchanged', () => {
    expect(adaptStellarRoute({ ...base, minBuyAmount: '18.09' }).minBuyAmount).toBe('18.09')
  })

  it('echoes the addresses the API does not return', () => {
    const adapted = adaptStellarRoute({ ...base, minBuyAmount: null }, { sourceAddress: 'GSRC', destinationAddress: 'GDST' })
    expect(adapted.sourceAddress).toBe('GSRC')
    expect(adapted.destinationAddress).toBe('GDST')
  })

  it('defaults a fee with no chain to Stellar', () => {
    const adapted = adaptStellarRoute({
      ...base,
      minBuyAmount: null,
      fees: [{ type: 'inbound' as const, asset: 'XLM.XLM', amount: '0.0001' }]
    })
    expect(adapted.fees[0].chain).toBe('XLM')
  })
})

describe('route merge deduplication', () => {
  // Mirrors the merge in use-quote.ts. A venue must appear once, at its best price — the route
  // list keys rows by providers[0], so a duplicate collides rather than rendering honestly.
  const merge = (aggregator: { providers: string[]; expectedBuyAmount: string }[], stellar: typeof aggregator) => {
    if (!stellar.length) return aggregator
    const best = new Map<string, (typeof aggregator)[number]>()
    for (const route of [...aggregator, ...stellar]) {
      const venue = route.providers.join('+')
      const existing = best.get(venue)
      if (!existing || Number(existing.expectedBuyAmount) < Number(route.expectedBuyAmount)) best.set(venue, route)
    }
    return Array.from(best.values()).sort((a, b) => Number(b.expectedBuyAmount) - Number(a.expectedBuyAmount))
  }

  const agg = [
    { providers: ['SOROSWAP'], expectedBuyAmount: '1.0930278' },
    { providers: ['STELLARBROKER'], expectedBuyAmount: '1.1118522' },
    { providers: ['EXOLIX'], expectedBuyAmount: '1.0900000' }
  ]
  const sdk = [
    { providers: ['SOROSWAP'], expectedBuyAmount: '1.1116113' },
    { providers: ['STELLARBROKER'], expectedBuyAmount: '1.1118738' }
  ]

  it('shows each venue once even when both sources return it', () => {
    const names = merge(agg, sdk).map(r => r.providers[0])
    expect(names).toHaveLength(new Set(names).size)
    expect(names.filter(n => n === 'SOROSWAP')).toHaveLength(1)
  })

  it('keeps the better-paying quote when a venue is duplicated', () => {
    const merged = merge(agg, sdk)
    expect(merged.find(r => r.providers[0] === 'SOROSWAP')?.expectedBuyAmount).toBe('1.1116113')
    expect(merged.find(r => r.providers[0] === 'STELLARBROKER')?.expectedBuyAmount).toBe('1.1118738')
  })

  it('keeps venues only one source returned', () => {
    expect(merge(agg, sdk).map(r => r.providers[0])).toContain('EXOLIX')
  })

  it('leaves the aggregator list untouched when there are no Stellar routes', () => {
    expect(merge(agg, [])).toBe(agg)
  })
})

describe('recipient capability', () => {
  it('drops the venues that cannot pay a third party', () => {
    // STELLARBROKER and AQUARIUS settle on the trader's own account — a hard limit, so quoting
    // them for someone else's address only defers a guaranteed commit failure.
    const forThirdParty = providersForPairKind('in_chain', true, true)
    expect(forThirdParty).toEqual(['SOROSWAP', 'STELLAR_DEX'])
    expect(forThirdParty).not.toContain('STELLARBROKER')
    expect(forThirdParty).not.toContain('AQUARIUS')
  })

  it('keeps the full fan-out when the trader is paying themselves', () => {
    expect(providersForPairKind('in_chain', true, false)).toContain('AQUARIUS')
  })
})

describe('aggregatorExcludedProviders — Axelar ticker drift', () => {
  it('withholds AXELAR_ITS for the tickers the SDK actually bridges', () => {
    expect(aggregatorExcludedProviders('XLM', 'XLM').has('AXELAR_ITS')).toBe(true)
    expect(aggregatorExcludedProviders('XLM', 'SHX').has('AXELAR_ITS')).toBe(true)
  })

  it('leaves it to the aggregator for a ticker the SDK does not bridge', () => {
    // Otherwise a third ITS token added server-side would lose both sources at once.
    expect(aggregatorExcludedProviders('XLM', 'USDC').has('AXELAR_ITS')).toBe(false)
  })
})

describe('aggregatorExcludedProviders — NEAR', () => {
  it('never withholds NEAR, so both sources quote it and the dedupe picks', () => {
    // The SDK's NEAR dry quote needs a destination address for EVM/Solana destinations, which the
    // app has none of at quote time; the aggregator's does not. Withholding would drop those
    // routes entirely, so both quote and the better price wins.
    expect(aggregatorExcludedProviders('XLM', 'XLM').has('NEAR')).toBe(false)
    expect(aggregatorExcludedProviders('BTC', 'BTC').has('NEAR')).toBe(false)
  })

  it('still withholds the in-chain venues and the Axelar direction the SDK owns', () => {
    const stellarOrigin = aggregatorExcludedProviders('XLM', 'XLM')
    expect(stellarOrigin.has('STELLARBROKER')).toBe(true)
    expect(stellarOrigin.has('AXELAR_ITS')).toBe(true)
    expect(aggregatorExcludedProviders('ETH', 'XLM').has('AXELAR_ITS')).toBe(false)
  })
})

describe('zero-output routes', () => {
  // A provider quoting nothing put a zero into the route card's price ratio, and USwapNumber
  // throws RangeError on division by zero rather than returning Infinity — so one such route from
  // any source took down the whole page.
  const merge = (routes: { providers: string[]; expectedBuyAmount: string }[]) => routes.filter(r => Number(r.expectedBuyAmount) > 0)

  it('drops a route that returns nothing', () => {
    const kept = merge([
      { providers: ['SOROSWAP'], expectedBuyAmount: '18.5' },
      { providers: ['EXOLIX'], expectedBuyAmount: '0' },
      { providers: ['QUICKEX'], expectedBuyAmount: '0.0000000' }
    ])
    expect(kept.map(r => r.providers[0])).toEqual(['SOROSWAP'])
  })

  it('drops a route whose amount is not a number at all', () => {
    expect(merge([{ providers: ['X'], expectedBuyAmount: '' }])).toEqual([])
    expect(merge([{ providers: ['X'], expectedBuyAmount: 'nonsense' }])).toEqual([])
  })

  it('keeps a genuinely tiny amount', () => {
    // Stellar is 7dp; one stroop is a real quote, not a zero.
    expect(merge([{ providers: ['STELLAR_DEX'], expectedBuyAmount: '0.0000001' }])).toHaveLength(1)
  })
})
