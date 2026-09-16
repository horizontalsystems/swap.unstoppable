import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { forgetMediator, persistMediator, releaseMediator, strandedMediators } from '@/lib/stellar/mediator'

// A minimal localStorage: the module only needs the four methods it calls.
const makeStorage = () => {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k)
  }
}

const SOURCE = 'GA222GT47JF65EZPZFWQMTMSUMG7TVMZLOI3AWTUAQGO5XL5N6DIQB74'
const OTHER = 'GCRYUGD5NVARGXT56XEZI5CIFCQETYHAPQQTHO2O3IQZTHDH4LATMYWC'
const handle = (address: string, source = SOURCE) => ({ address, secret: 'S' + address.slice(1), source })

describe('mediator persistence', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', makeStorage())
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-16T12:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('a mediator with a live session is never stranded, however old', () => {
    persistMediator(handle('GAAA'))
    vi.advanceTimersByTime(60 * 60_000)
    expect(strandedMediators(SOURCE)).toEqual([])
  })

  it('a fresh handle from another tab is left alone until it is old enough', () => {
    localStorage.setItem('stellar-mediator:GBBB', JSON.stringify({ ...handle('GBBB'), createdAt: Date.now() - 60_000 }))
    expect(strandedMediators(SOURCE)).toEqual([])
    vi.advanceTimersByTime(10 * 60_000)
    expect(strandedMediators(SOURCE).map(m => m.address)).toEqual(['GBBB'])
  })

  it('a session that ended in this tab without a merge is recoverable straight away', () => {
    persistMediator(handle('GCCC'))
    releaseMediator('GCCC')
    expect(strandedMediators(SOURCE).map(m => m.address)).toEqual(['GCCC'])
  })

  it('only the funding account’s own mediators are offered to it', () => {
    persistMediator(handle('GDDD', OTHER))
    releaseMediator('GDDD')
    expect(strandedMediators(SOURCE)).toEqual([])
    expect(strandedMediators(OTHER).map(m => m.address)).toEqual(['GDDD'])
  })

  it('forgetting removes the handle for good', () => {
    persistMediator(handle('GEEE'))
    releaseMediator('GEEE')
    forgetMediator('GEEE')
    expect(strandedMediators(SOURCE)).toEqual([])
    expect(localStorage.getItem('stellar-mediator:GEEE')).toBeNull()
  })

  it('ignores records it cannot read', () => {
    localStorage.setItem('stellar-mediator:GFFF', '{not json')
    localStorage.setItem('stellar-mediator:GGGG', JSON.stringify({ address: 'GGGG' }))
    expect(strandedMediators(SOURCE)).toEqual([])
  })
})
