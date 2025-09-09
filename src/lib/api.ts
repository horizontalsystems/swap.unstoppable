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

const coingecko = axios.create({ baseURL: 'https://api.coingecko.com/api/v3' })

export const getPools = async () => {
  return midgard.get('/v2/pools').then(res => res.data)
}

export const getPoolsRates = async (assets: string) => {
  return coingecko.get(`/simple/price?ids=${assets}&vs_currencies=usd`).then(res => res.data)
}

export const getQuote = async (params: Record<string, any>) => {
  const qs = new URLSearchParams(Object.entries(params).filter(i => i[1]))
  return thornode.get(`/thorchain/quote/swap?${qs.toString()}`).then(res => res.data)
}

export const getTxStatus = async (hash: string) => {
  const txId = hash.replace('0x', '').toUpperCase()
  return thornode.get(`/thorchain/tx/status/${txId}`).then(res => res.data)
}

export const getInboundAddresses = async () => {
  return thornode.get('/thorchain/inbound_addresses').then(res => res.data)
}
