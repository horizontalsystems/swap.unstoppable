import { describe, expect, it, vi } from 'vitest'

// api.ts creates its axios client at import time, so the mock has to be in place first.
const post = vi.fn()
vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios')
  return {
    ...actual,
    default: { ...actual.default, create: () => ({ post, get: vi.fn() }) }
  }
})

const { getRate } = await import('@/lib/api')
const { AxiosError } = await import('axios')

const rejection = (status: number, data: unknown) => {
  const error = new AxiosError('failed')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error.response = { status, data } as any
  return error
}

const request = { sellAsset: 'XLM.SHX-G', buyAsset: 'XLM.XLM', sellAmount: '291.42', slippage: 1, providers: [] } as never

describe('getRate', () => {
  it('returns routes and provider errors from a successful response', async () => {
    post.mockResolvedValueOnce({ data: { routes: [{ providers: ['EXOLIX'] }], providerErrors: [] } })
    const result = await getRate(request)
    expect(result.routes).toHaveLength(1)
  })

  it('treats a declined pair as an answer, not a failure', async () => {
    // The API answers 404 for this, but "no venue serves this pair" is a settled result — throwing
    // left the query erroring and being re-fetched forever.
    post.mockRejectedValueOnce(
      rejection(404, { providerErrors: [{ provider: 'EXOLIX', error: 'Pair not supported', errorCode: 'pairNotSupported' }] })
    )
    const result = await getRate(request)
    expect(result.routes).toEqual([])
    expect(result.providerErrors[0].errorCode).toBe('pairNotSupported')
  })

  it('still throws on a real failure, so it is retried and reported as one', async () => {
    post.mockRejectedValueOnce(rejection(500, { error: 'internal' }))
    await expect(getRate(request)).rejects.toBeInstanceOf(AxiosError)
  })

  it('still throws when there is no response at all (network down)', async () => {
    post.mockRejectedValueOnce(new AxiosError('Network Error'))
    await expect(getRate(request)).rejects.toBeInstanceOf(AxiosError)
  })
})
