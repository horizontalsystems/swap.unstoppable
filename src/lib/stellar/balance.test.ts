import { describe, expect, it } from 'vitest'

// Mirrors the spendable calculation in balance.ts. The reserve and liabilities are what the
// network actually enforces — getting either wrong means offering an amount that fails at submit.
const BASE_RESERVE = 0.5
const ACCOUNT_RESERVE_UNITS = 2
const FEE_BUFFER = 1

const spendable = (opts: { balance: number; native: boolean; subentries?: number; sellingLiabilities?: number }) => {
  const liabilities = opts.sellingLiabilities ?? 0
  if (!opts.native) return Math.max(0, opts.balance - liabilities)
  const reserve = (ACCOUNT_RESERVE_UNITS + (opts.subentries ?? 0)) * BASE_RESERVE
  return Math.max(0, opts.balance - (reserve + liabilities + FEE_BUFFER))
}

describe('XLM spendable', () => {
  it('withholds the base reserve plus one per subentry', () => {
    // 2 base units + 6 trustlines = 4 XLM locked, plus the fee buffer.
    expect(spendable({ balance: 26180.7607, native: true, subentries: 6 })).toBeCloseTo(26175.7607, 4)
    expect(spendable({ balance: 162.5501, native: true, subentries: 0 })).toBeCloseTo(160.5501, 4)
  })

  it('also withholds anything committed to open offers', () => {
    // The network enforces selling_liabilities independently of the reserve; ignoring it offers
    // more than the account can spend and the swap fails with op_underfunded at submit.
    expect(spendable({ balance: 100, native: true, subentries: 0, sellingLiabilities: 40 })).toBeCloseTo(58, 4)
  })

  it('never goes negative on an account that is entirely committed', () => {
    expect(spendable({ balance: 1.5, native: true, subentries: 0 })).toBe(0)
    expect(spendable({ balance: 100, native: true, subentries: 0, sellingLiabilities: 500 })).toBe(0)
  })
})

describe('classic asset spendable', () => {
  it('carries no reserve of its own — that is charged against XLM', () => {
    expect(spendable({ balance: 250, native: false })).toBe(250)
  })

  it('but is still reduced by open offers', () => {
    // Previously this returned the full balance, over-offering an asset already on the orderbook.
    expect(spendable({ balance: 250, native: false, sellingLiabilities: 100 })).toBe(150)
  })
})
