import axios from 'axios'

const midgard = axios.create({
  baseURL: 'https://midgard.ninerealms.com',
  headers: {
    'x-client-id': process.env.NEXT_PUBLIC_XCLIENT_ID
  }
})

const thornode = axios.create({
  baseURL: 'https://thornode.ninerealms.com',
  headers: {
    'x-client-id': process.env.NEXT_PUBLIC_XCLIENT_ID
  }
})

const swapKit = axios.create({
  baseURL: 'https://api.swapkit.dev',
  headers: {
    'x-api-key': process.env.NEXT_PUBLIC_SWAP_KIT_API_KEY
  }
})

const coingecko = axios.create({ baseURL: 'https://api.coingecko.com/api/v3' })

export const getAssetRates = async (ids: string) => {
  return coingecko.get(`/simple/price?ids=${ids}&vs_currencies=usd`).then(res => res.data)
}

export const getTokenList = async (provider: string) => {
  return swapKit.get(`/tokens?provider=${provider}`).then(res => res.data)
}

export const getSwapKitQuote = async (data: Record<string, any>, signal?: AbortSignal) => {
  return swapKit
    .post('/quote', data, {
      signal
    })
    .then(res => res.data)
    .then(data => {
      return (data.routes || [])[0] || null
    })
}

export const getSwapKitTrack = async (data: Record<string, any>) => {
  return swapKit.post('/track', data).then(res => res.data)
}

export const getInboundAddresses = async () => {
  return thornode.get('/thorchain/inbound_addresses').then(res => res.data)
}
