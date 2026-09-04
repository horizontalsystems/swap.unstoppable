import { describe, expect, it } from 'vitest'
import { Chain } from '@uswap/core'
import { explorerTxLink } from '@/lib/explorer'

const HASH = '839b849b7a066e7084cfa45460068fb5d330f560441b8df06e75b2216112ae56'

describe('explorerTxLink', () => {
  it('links a Stellar swap to stellar.expert, which USwap has no entry for', () => {
    expect(explorerTxLink({ hash: HASH, chainId: 'stellar' })).toEqual({
      url: `https://stellar.expert/explorer/public/tx/${HASH}`,
      label: 'stellar.expert'
    })
  })

  it('resolves Stellar from the provider when no chain is given', () => {
    expect(explorerTxLink({ hash: HASH, provider: 'STELLAR_DEX' })?.label).toBe('stellar.expert')
  })

  it('sends an Axelar transfer to Axelarscan, not the source chain', () => {
    // The Stellar transaction only shows the money leaving; whether it arrived is Axelar's answer.
    expect(explorerTxLink({ hash: HASH, chainId: 'stellar', provider: 'AXELAR_ITS' })).toEqual({
      url: `https://axelarscan.io/gmp/${HASH}`,
      label: 'axelarscan.io'
    })
  })

  it('still defers to USwap for the chains it does cover', () => {
    const link = explorerTxLink({ hash: '0xabc', chain: Chain.Ethereum })
    expect(link?.url).toContain('0xabc')
    expect(link?.label).toBeTruthy()
  })

  it('returns nothing rather than a broken link', () => {
    expect(explorerTxLink({ hash: undefined, chainId: 'stellar' })).toBeUndefined()
    expect(explorerTxLink({ hash: HASH, chainId: 'not-a-chain' })).toBeUndefined()
    expect(explorerTxLink({ hash: HASH })).toBeUndefined()
  })
})
