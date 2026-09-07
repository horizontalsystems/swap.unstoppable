import { describe, expect, it } from 'vitest'
import { CROSS_CHAIN_STALL_MS, isStellarTrackingStalled, isTxPending, isTxTerminal, STELLAR_STALL_MS } from '@/store/transaction-store'

const NOW = Date.UTC(2026, 0, 1, 12, 0, 0)
const agoMs = (ms: number) => new Date(NOW - ms)

describe('isStellarTrackingStalled', () => {
  it('keeps waiting inside the window — a swap a few ledgers old is normal', () => {
    expect(isStellarTrackingStalled('pending', agoMs(10_000), undefined, NOW)).toBe(false)
    expect(isStellarTrackingStalled('pending', agoMs(STELLAR_STALL_MS - 1), undefined, NOW)).toBe(false)
  })

  it('gives up once a hash has gone unfindable past the window', () => {
    // Stellar has no mempool: past this point the transaction is not arriving.
    expect(isStellarTrackingStalled('pending', agoMs(STELLAR_STALL_MS + 1), undefined, NOW)).toBe(true)
    expect(isStellarTrackingStalled('not_started', agoMs(STELLAR_STALL_MS + 1), undefined, NOW)).toBe(true)
  })

  it('never stalls a swap the provider has acknowledged', () => {
    // 'swapping' means it is in flight; 'action_required' on an Axelar transfer means funds left
    // the source chain with no refund path and need manual recovery. Giving up on either would
    // hide a swap that still needs attention.
    for (const status of ['swapping', 'action_required']) {
      expect(isStellarTrackingStalled(status, agoMs(STELLAR_STALL_MS * 100), undefined, NOW)).toBe(false)
      expect(isStellarTrackingStalled(status, agoMs(CROSS_CHAIN_STALL_MS * 100), 'AXELAR_ITS', NOW)).toBe(false)
    }
  })

  it('gives an Axelar bridge hours rather than minutes', () => {
    // Two hub hops have to execute after the funds leave Stellar; minutes is normal.
    const wellPastStellar = agoMs(STELLAR_STALL_MS + 60_000)
    expect(isStellarTrackingStalled('pending', wellPastStellar, 'STELLAR_DEX', NOW)).toBe(true)
    expect(isStellarTrackingStalled('pending', wellPastStellar, 'AXELAR_ITS', NOW)).toBe(false)
    expect(isStellarTrackingStalled('pending', agoMs(CROSS_CHAIN_STALL_MS + 1), 'AXELAR_ITS', NOW)).toBe(true)
  })

  it('never overrides a status the chain already settled', () => {
    for (const status of ['completed', 'failed', 'refunded', 'expired']) {
      expect(isStellarTrackingStalled(status, agoMs(STELLAR_STALL_MS * 100), undefined, NOW)).toBe(false)
    }
  })

  it('accepts the persisted timestamp shape — localStorage revives Date as a string', () => {
    expect(isStellarTrackingStalled('pending', agoMs(STELLAR_STALL_MS + 1).toISOString(), undefined, NOW)).toBe(true)
  })
})

describe('status predicates', () => {
  it('treats unknown as neither pending nor terminal, so the poll loop stops', () => {
    // The query is enabled on isTxPending, and once details exist an un-pending status ends it.
    expect(isTxPending('unknown')).toBe(false)
    expect(isTxTerminal('unknown')).toBe(false)
  })

  it('keeps polling the statuses a swap can still move out of', () => {
    for (const status of ['not_started', 'pending', 'swapping', 'action_required']) {
      expect(isTxPending(status)).toBe(true)
    }
  })
})
