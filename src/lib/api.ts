import axios from 'axios'
import { poolsInfoMap } from '@/hook/use-pools-rates'

const midgard = axios.create({ baseURL: 'https://midgard.ninerealms.com' })
const thornode = axios.create({ baseURL: 'https://thornode.ninerealms.com' })
const coingecko = axios.create({ baseURL: 'https://api.coingecko.com/api/v3' })

export const getPools = async () => {
  return midgard
    .get('/v2/pools')
    .then(res => res.data)
    .then((data: any) =>
      data.map((item: any) => {
        const [chain, asset] = item.asset.split('.')
        const [symbol] = asset.split('-')

        return {
          type: chain === 'THOR' ? 'NATIVE' : 'LAYER_1',
          asset: item.asset,
          chain,
          metadata: {
            symbol,
            decimals: poolsInfoMap[item.asset]?.decimals || parseInt(item.nativeDecimal)
          }
        }
      })
    )
}

export const getPoolsRates = async (assets: string[]) => {
  const ids = assets
    .map(asset => poolsInfoMap[asset]?.geckoId)
    .filter(Boolean)
    .join(',')

  if (!ids) return {}

  return coingecko.get(`/simple/price?ids=${ids}&vs_currencies=usd`).then(res => res.data)
}

export const getQuote = async (params: Record<string, any>) => {
  const qs = new URLSearchParams(Object.entries(params).filter(i => i[1]))
  return thornode.get(`/thorchain/quote/swap?${qs.toString()}`).then(res => res.data)
}
