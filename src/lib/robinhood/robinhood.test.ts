import { afterEach, describe, expect, it, vi } from 'vitest'
import { Chain, EVMChains, getChainConfig } from '@uswap/core'
import {
  fetchRobinhoodTokens,
  isNativeSentinel,
  isRobinhoodChain,
  ROBINHOOD_NATIVE_ADDRESS,
  ROBINHOOD_NATIVE_IDENTIFIER,
  toAggregatorIdentifier
} from '@/lib/robinhood/asset-list'

const USDG = 'ROBINHOOD.USDG-0X5FC5360D0400A0FD4F2AF552ADD042D716F1D168'

describe('Robinhood chain registration', () => {
  it('is an EVM chain the asset loader will accept', () => {
    // `use-assets` drops any token whose chain USwap does not know, and only tags EVM chains with
    // LI.FI. Both gates read these two.
    expect(getChainConfig(Chain.Robinhood).chain).toBe('ROBINHOOD')
    expect(EVMChains.includes(Chain.Robinhood)).toBe(true)
  })

  it('carries the chain id the aggregator reports in supportedChainIds', () => {
    expect(getChainConfig(Chain.Robinhood).chainId).toBe('4663')
    expect(getChainConfig(Chain.Robinhood).chainIdHex).toBe('0x1237')
  })

  it('recognises its own chain handle', () => {
    expect(isRobinhoodChain('ROBINHOOD')).toBe(true)
    expect(isRobinhoodChain('ETH')).toBe(false)
    expect(isRobinhoodChain(undefined)).toBe(false)
  })
})

describe('toAggregatorIdentifier', () => {
  it('gives the gas asset the address form the aggregator demands', () => {
    // Bare `ROBINHOOD.ETH` is rejected outright ("ETH is not a valid EVM address"): the aggregator
    // has no token registry for 4663 and addresses everything on it by contract.
    expect(toAggregatorIdentifier(ROBINHOOD_NATIVE_IDENTIFIER)).toBe(`ROBINHOOD.ETH-${ROBINHOOD_NATIVE_ADDRESS}`)
  })

  it('uses the sentinel 1inch accepts, not the zero address', () => {
    // 1inch answers `0x000…0` with "for native token use 0xeeee…", so only this one form is
    // quotable by both venues.
    expect(toAggregatorIdentifier(ROBINHOOD_NATIVE_IDENTIFIER)).toContain('0xEeeeeEeee')
    expect(toAggregatorIdentifier(ROBINHOOD_NATIVE_IDENTIFIER)).not.toContain('0x0000000000')
  })

  it('leaves every other identifier alone', () => {
    expect(toAggregatorIdentifier(USDG)).toBe(USDG)
    expect(toAggregatorIdentifier('ETH.ETH')).toBe('ETH.ETH')
    expect(toAggregatorIdentifier('BTC.BTC')).toBe('BTC.BTC')
  })
})

describe('isNativeSentinel', () => {
  it('matches whatever casing the aggregator echoes back', () => {
    // Routes come back uppercased, as `ROBINHOOD.UNKNOWN-0XEEEE…`.
    expect(isNativeSentinel(ROBINHOOD_NATIVE_ADDRESS)).toBe(true)
    expect(isNativeSentinel(ROBINHOOD_NATIVE_ADDRESS.toUpperCase())).toBe(true)
    expect(isNativeSentinel(ROBINHOOD_NATIVE_ADDRESS.toLowerCase())).toBe(true)
  })

  it('does not match a real token, so approvals still run for them', () => {
    expect(isNativeSentinel('0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168')).toBe(false)
    expect(isNativeSentinel(undefined)).toBe(false)
  })
})

describe('fetchRobinhoodTokens', () => {
  const cgToken = { address: '0x5fc5360d0400a0fd4f2af552add042d716f1d168', symbol: 'USDG', name: 'Global Dollar', decimals: 6 }

  const mockTokens = (tokens: unknown[]) => vi.stubGlobal('fetch', async () => ({ ok: true, json: async () => ({ tokens }) }))

  afterEach(() => vi.unstubAllGlobals())

  it('spells identifiers the way the aggregator echoes them', async () => {
    mockTokens([cgToken])

    const usdg = (await fetchRobinhoodTokens()).find(t => t.ticker === 'USDG')

    expect(usdg?.identifier).toBe(USDG)
    expect(usdg?.decimals).toBe(6)
    expect(usdg?.chainId).toBe('4663')
  })

  it('always carries the gas asset, which the catalog lists no contract for', async () => {
    mockTokens([cgToken])

    const native = (await fetchRobinhoodTokens()).find(t => t.identifier === ROBINHOOD_NATIVE_IDENTIFIER)

    // Held without an address so `AssetValue` resolves it as the gas asset — balances, fees and the
    // approval check all key off that.
    expect(native?.address).toBeUndefined()
    expect(native?.coingeckoId).toBe('ethereum')
  })

  it('folds an entry spelled as the zero address onto the gas asset rather than listing it twice', async () => {
    mockTokens([{ address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'ETH', decimals: 18 }])

    expect(await fetchRobinhoodTokens()).toHaveLength(1)
  })

  it('deduplicates by contract, whatever casing the symbol is given in', async () => {
    mockTokens([cgToken, { ...cgToken, symbol: 'usdg' }])

    expect((await fetchRobinhoodTokens()).filter(t => t.ticker.toUpperCase() === 'USDG')).toHaveLength(1)
  })

  it('still returns the gas asset when the catalog is down', async () => {
    // Losing the catalog is survivable; losing the chain's most important pair is not.
    vi.stubGlobal('fetch', async () => {
      throw new Error('offline')
    })

    expect(await fetchRobinhoodTokens()).toEqual([expect.objectContaining({ identifier: ROBINHOOD_NATIVE_IDENTIFIER })])
  })

  it('drops entries missing the fields an Asset needs', async () => {
    mockTokens([{ address: '0xabc', symbol: 'NODECIMALS' }, { symbol: 'NOADDRESS', decimals: 18 }])

    expect(await fetchRobinhoodTokens()).toHaveLength(1) // the seeded gas asset, nothing else
  })
})
