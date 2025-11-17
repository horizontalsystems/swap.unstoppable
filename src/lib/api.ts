import axios from 'axios'
import { SwapKitNumber } from '@swapkit/core'
import { Asset } from '@/components/swap/asset'

const thornode = axios.create({
  baseURL: process.env.NEXT_PUBLIC_THORCHAIN_API,
  headers: {
    'x-client-id': process.env.NEXT_PUBLIC_XCLIENT_ID
  }
})

const uKit = axios.create({
  baseURL: process.env.NEXT_PUBLIC_UKIT_API_URL,
  headers: {
    'x-api-key': process.env.NEXT_PUBLIC_UKIT_API_KEY
  }
})

const memoless = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_MEMOLESS_API}/api/v1`
})

const coingecko = axios.create({ baseURL: 'https://api.coingecko.com/api/v3' })

export const getMemolessAssets = async () => {
  return memoless.get('/assets').then(res => res.data)
}

export const registerMemoless = async (data: any) => {
  return memoless.post('/register', data).then(res => res.data)
}

export const preflightMemoless = async (data: any) => {
  return memoless.post('/preflight', data).then(res => res.data)
}

export const getAssetRates = async (ids: string) => {
  return coingecko.get(`/simple/price?ids=${ids}&vs_currencies=usd`).then(res => res.data)
}

export const getTokenList = async (provider: string) => {
  return uKit.get(`/tokens?provider=${provider}`).then(res => res.data)
}

export const getQuotes = async (
  data: {
    buyAsset: Asset
    sellAsset: Asset
    sellAmount: SwapKitNumber
    sourceAddress?: string
    destinationAddress?: string
    includeTx: boolean
    slippage: number | undefined
    providers?: string[]
  },
  signal?: AbortSignal
) => {
  return uKit
    .post(
      '/quote',
      {
        buyAsset: data.buyAsset.identifier,
        sellAsset: data.sellAsset.identifier,
        sellAmount: data.sellAmount.toSignificant(),
        sourceAddress: data.sourceAddress,
        destinationAddress: data.destinationAddress,
        includeTx: data.includeTx,
        slippage: data.slippage ?? 99,
        providers: data.providers,
        affiliate: process.env.NEXT_PUBLIC_AFFILIATE,
        affiliateFee: Number(process.env.NEXT_PUBLIC_AFFILIATE_FEE)
      },
      {
        signal
      }
    )
    .then(res => res.data)
    .then(data => data.routes || [])
}

export const getSwapKitTrack = async (data: Record<string, any>) => {
  return uKit.post('/track', data).then(res => res.data)
}

export const getInboundAddresses = async () => {
  return thornode.get('/thorchain/inbound_addresses').then(res => res.data)
}
