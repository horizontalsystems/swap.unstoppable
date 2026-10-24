import axios, { AxiosError } from 'axios'
import { AssetValue, Chain, getChainConfig } from '@uswap/core'
import { BalanceResponse, QuoteRequest, QuoteResponse, SwapRequest, USwapApi } from '@uswap/helpers/api'
import { AmlCheckResponse, CommitResponse, Provider, ProviderName, QuoteResponseRoute, TrackResponse } from '@/types'
import { normalizeThorBankDenom } from '@/lib/swap-helpers'
import { toAggregatorIdentifier } from '@/lib/robinhood/asset-list'

const uSwap = axios.create({
  baseURL: process.env.NEXT_PUBLIC_USWAP_API_URL,
  headers: {
    'x-api-key': process.env.NEXT_PUBLIC_USWAP_API_KEY
  }
})

const thornode = axios.create({ baseURL: 'https://gateway.liquify.com/chain/thorchain_api' })
const midgard = axios.create({ baseURL: 'https://gateway.liquify.com/chain/thorchain_midgard' })
const mayaMidgard = axios.create({ baseURL: 'https://midgard.mayachain.info' })

/** DexScreener's own chain slugs, for the chains this app looks up prices on. */
export type DexScreenerChain = 'solana' | 'ethereum' | 'robinhood'

export const getDexScreenerTokens = async (
  tokenAddresses: string[],
  chainId: DexScreenerChain = 'solana'
): Promise<Record<string, { price?: number; logo?: string }>> => {
  if (tokenAddresses.length === 0) return {}
  const addresses = tokenAddresses.join(',')
  try {
    const res = await axios.get(`https://api.dexscreener.com/tokens/v1/${chainId}/${addresses}`)
    const result: Record<string, { price?: number; logo?: string }> = {}
    for (const pair of res.data || []) {
      const addr = pair?.baseToken?.address
      if (!addr) continue
      const key = chainId === 'solana' ? addr : addr.toLowerCase()
      const existing = result[key] ?? {}
      if (existing.price == null && pair?.priceUsd != null) {
        existing.price = parseFloat(pair.priceUsd)
      }
      if (!existing.logo && pair?.info?.imageUrl) {
        existing.logo = pair.info.imageUrl
      }
      result[key] = existing
    }
    return result
  } catch {
    return {}
  }
}

export const getBlocksDecodedPrices = async (ids: string[]): Promise<Record<string, number>> => {
  if (ids.length === 0) return {}
  try {
    const res = await axios.get('https://api.blocksdecoded.com/v1/coins', {
      params: { uids: ids.join(','), fields: 'uid,price' }
    })
    const result: Record<string, number> = {}
    for (const coin of (res.data as { uid?: string; price?: string }[]) || []) {
      if (!coin?.uid) continue
      const price = parseFloat(coin.price ?? '')
      if (!isNaN(price) && price > 0) result[coin.uid] = price
    }
    return result
  } catch {
    return {}
  }
}

export interface AlchemyTokenBalance {
  contractAddress: string
  tokenBalance: string
  symbol: string
  name: string
  decimals: number
  logo?: string
}

export const getAlchemyTokenBalances = async (address: string, rpcUrl: string): Promise<AlchemyTokenBalance[]> => {
  try {
    const balanceRes = await axios.post(
      rpcUrl,
      { jsonrpc: '2.0', method: 'alchemy_getTokenBalances', params: [address, 'erc20'], id: 1 },
      { timeout: 10_000 }
    )

    const tokenBalances: Array<{ contractAddress: string; tokenBalance: string }> = balanceRes.data?.result?.tokenBalances || []
    const nonZero = tokenBalances.filter(t => {
      try {
        return BigInt(t.tokenBalance) > 0n
      } catch {
        return false
      }
    })
    if (nonZero.length === 0) return []

    const metaRes = await Promise.all(
      nonZero.map(t =>
        axios
          .post(rpcUrl, { jsonrpc: '2.0', method: 'alchemy_getTokenMetadata', params: [t.contractAddress], id: 1 }, { timeout: 10_000 })
          .then(r => r.data?.result)
          .catch(() => null)
      )
    )

    return nonZero
      .map((t, i) => ({
        contractAddress: t.contractAddress,
        tokenBalance: t.tokenBalance,
        symbol: (metaRes[i]?.symbol as string) || '',
        name: (metaRes[i]?.name as string) || '',
        decimals: (metaRes[i]?.decimals as number) ?? 18,
        logo: (metaRes[i]?.logo as string) || undefined
      }))
      .filter(t => t.symbol)
  } catch {
    return []
  }
}

export const getMidgardPools = async (): Promise<{ asset: string; assetPriceUSD: string }[]> => {
  return midgard.get('/v2/pools').then(res => res.data)
}

export const getMidgardRunePrice = async (): Promise<number> => {
  return midgard.get('/v2/stats').then(res => parseFloat(res.data.runePriceUSD))
}

export const getMayaMidgardPools = async (): Promise<{ asset: string; assetPriceUSD: string }[]> => {
  return mayaMidgard.get('/v2/pools').then(res => res.data)
}

export const getMayaMidgardCacaoPrice = async (): Promise<number> => {
  return mayaMidgard.get('/v2/stats').then(res => parseFloat(res.data.cacaoPriceUSD))
}

export const getThorBankBalances = async (address: string): Promise<AssetValue[]> => {
  try {
    const res = await thornode.get(`/cosmos/bank/v1beta1/balances/${address}`)
    const balances: { denom: string; amount: string }[] = res.data?.balances || []
    const out: AssetValue[] = []
    for (const { denom, amount } of balances) {
      if (!denom || denom.includes('IBC/')) continue
      const asset = normalizeThorBankDenom(denom)
      if (!asset) continue
      try {
        out.push(AssetValue.from({ asset, fromBaseDecimal: 8, value: amount }))
      } catch {
        // skip unparseable denoms (e.g. unknown factory tokens)
      }
    }
    return out
  } catch {
    return []
  }
}

export const getAssetBalance = async (chain: Chain, address: string, identifier: string) => {
  return uSwap
    .get(`/balance?chain=${chain}&address=${address}&identifier=${identifier}`)
    .then(res => res.data)
    .then((data: BalanceResponse) => {
      const { baseDecimal } = getChainConfig(chain)
      return data.map(({ identifier, value, decimal }) => {
        return new AssetValue({ decimal: decimal || baseDecimal, identifier, value })
      })
    })
}

export const getTokenList = async (provider: string) => {
  return uSwap.get(`/tokens?provider=${provider}`).then(res => res.data)
}

export const getProviderTokens = async (providerNames: ProviderName[]) => {
  const lists = await Promise.all(providerNames.map(getTokenList))
  const merged = new Map<string, any>()
  lists.forEach((list, i) => {
    for (const token of list.tokens ?? []) {
      const key = `${token.chain}-${token.identifier}`.toLowerCase()
      const existing = merged.get(key)
      if (existing) {
        existing.providers.push(providerNames[i])
      } else {
        merged.set(key, { ...token, providers: [providerNames[i]] })
      }
    }
  })
  return Array.from(merged.values())
}

export const getAllTokens = async () => {
  return uSwap.get('/tokens/all').then(res => res.data)
}

/**
 * Rewrites the asset pair into the spelling the aggregator accepts.
 *
 * Only Robinhood Chain needs this, and only for its gas asset — see `toAggregatorIdentifier`. Every
 * other identifier passes through untouched, so this is safe to run over every request.
 */
const forAggregator = <T extends { sellAsset: string; buyAsset: string }>(json: T): T => ({
  ...json,
  buyAsset: toAggregatorIdentifier(json.buyAsset),
  sellAsset: toAggregatorIdentifier(json.sellAsset)
})

export const getRate = async (json: QuoteRequest, signal?: AbortSignal): Promise<QuoteResponseRoute[]> => {
  return uSwap
    .post('/rate', forAggregator(json), { signal })
    .then(res => res.data)
    .then((data: QuoteResponse) => data.routes as QuoteResponseRoute[])
}

// builds the route for a single provider without creating anything; call it freely (refresh, address change)
export const previewSwap = async (json: SwapRequest & { generateQR?: boolean }): Promise<QuoteResponseRoute> => {
  return uSwap.post('/preview', forAggregator(json)).then(res => res.data as QuoteResponseRoute)
}

export type StaleCommitReason = 'refresh_required' | 'rate_changed'

// the preview can no longer be committed (token expired, provider suspended, or the price moved beyond slippage) — preview again
export class StaleQuoteError extends Error {
  constructor(readonly reason: StaleCommitReason) {
    super(reason)
    this.name = 'StaleQuoteError'
  }
}

// the order was refused (provider error, or commit kept failing) — carries the aggregator's message
export class CommitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CommitError'
  }
}

const COMMIT_ATTEMPTS = 4
const COMMIT_RETRY_DELAY = 1500

// Creates the order — the only call with side effects. A previewToken commits at most once (a resend replays the
// first answer), so a double tap (in_progress) or an internal failure is retried with the same token, never a new preview.
export const commitSwap = async (previewToken: string, inboundTxHash?: string): Promise<CommitResponse> => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await uSwap.post('/commit', { previewToken, inboundTxHash }).then(res => res.data as CommitResponse)
    } catch (error) {
      const response = error instanceof AxiosError ? error.response : undefined
      const status = response?.data?.status
      if (status === 'refresh_required' || status === 'rate_changed') throw new StaleQuoteError(status)

      const retryable = status === 'in_progress' || (!status && (!response || response.status >= 500))
      if (!retryable || attempt === COMMIT_ATTEMPTS) throw new CommitError(parseApiError(error).message)

      await new Promise(resolve => setTimeout(resolve, COMMIT_RETRY_DELAY))
    }
  }
}

// commits a previewed route and returns it with the order's uuid, amounts and (transfer providers) deposit execution
export const commitRoute = async (route: QuoteResponseRoute): Promise<QuoteResponseRoute> => {
  if (!route.previewToken) throw new StaleQuoteError('refresh_required')

  const commit = await commitSwap(route.previewToken)
  return {
    ...route,
    uuid: commit.uuid,
    sellAmount: commit.sellAmount,
    expectedBuyAmount: commit.expectedBuyAmount,
    minBuyAmount: commit.minBuyAmount,
    // a transfer order's deposit window is the commit's own; the preview's expiresAt only bounds the quote
    expiresAt: commit.execution ? commit.expiresAt : (commit.expiresAt ?? route.expiresAt),
    // routes with a transaction (thorchain_deposit, signed_transaction) keep the preview's — commit does not rebuild it
    execution: commit.execution ?? route.execution
  }
}

// reports the inbound tx hash; a different hash for the same uuid replaces the old one (speed-up / fee bump)
export const reportSigned = async (data: { uuid: string; inboundTxHash: string }) => {
  return uSwap.post('/signed', data).then(res => res.data)
}

export const getTrack = async (data: { uuid: string; inboundTxHash?: string }): Promise<TrackResponse> => {
  return uSwap.post('/track', data).then(res => res.data)
}

// a split swap (one deposit, several outputs) as ONE swap in the /track shape: one deposit leg, then each
// output's legs tagged meta.outputIndex; the status is the least-finished output's
export const getSplitTrack = async (data: { splitUuid: string; inboundTxHash?: string }): Promise<TrackResponse> => {
  return uSwap.post('/split/track', data).then(res => res.data)
}

export const parseApiError = (error: unknown): Error => {
  if (error instanceof AxiosError) {
    const data = error.response?.data
    const providerError = data?.providerErrors?.[0]
    const message = providerError?.message || providerError?.error || data?.error || data?.message
    if (message) return new Error(message)
  }

  return error instanceof Error ? error : new Error(String(error))
}

export const getMimir = async (): Promise<Record<string, number>> => {
  return thornode.get('/thorchain/mimir').then(res => res.data)
}

export const getInboundAddresses = () => {
  return USwapApi.thornode.getInboundAddresses()
}

export const getProviders = async (): Promise<Provider[]> => {
  return uSwap.get('/providers').then(res => res.data)
}

// AML address precheck (QUICKEX only) — run before the user sends funds
export const checkAddresses = async (addresses: string[]): Promise<AmlCheckResponse> => {
  return uSwap.get('/check-addresses', { params: { addresses: addresses.join(',') } }).then(res => res.data)
}
