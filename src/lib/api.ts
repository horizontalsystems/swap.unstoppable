import { AssetValue, Chain, getChainConfig } from '@uswap/core'
import { BalanceResponse, QuoteRequest, USwapApi } from '@uswap/helpers/api'
import axios from 'axios'
import { QuoteResponse } from '@/types'

const uSwap = axios.create({
  baseURL: process.env.NEXT_PUBLIC_USWAP_API_URL,
  headers: {
    'x-api-key': process.env.NEXT_PUBLIC_USWAP_API_KEY
  }
})

const thornode = axios.create({ baseURL: 'https://thornode.ninerealms.com' })
const coingecko = axios.create({ baseURL: 'https://api.coingecko.com/api/v3' })

export const getAssetRates = async (ids: string) => {
  return coingecko.get(`/simple/price?ids=${ids}&vs_currencies=usd`).then(res => res.data)
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

export const getAllTokens = async () => {
  return uSwap.get('/tokens/all').then(res => res.data)
}

export const getQuotes = async (json: QuoteRequest, signal?: AbortSignal) => {
  return uSwap
    .post(`/quote`, json, { signal })
    .then(res => res.data)
    .then((data: QuoteResponse) => data.routes)
}

export const getTrack = async (data: Record<string, any>) => {
  return uSwap.post('/track', data).then(res => res.data)
}

export const getMimir = async (): Promise<Record<string, number>> => {
  return thornode.get('/thorchain/mimir').then(res => res.data)
}

export const getInboundAddresses = () => {
  return USwapApi.thornode.getInboundAddresses()
}
