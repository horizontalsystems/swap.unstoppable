import { Asset } from '@/components/swap/asset'
import { usePools } from '@/hook/use-pools'
import { useQuery } from '@tanstack/react-query'
import { getPoolsRates } from '@/lib/api'

export interface AssetRate extends Asset {
  price?: string | null | undefined
}

interface PoolsRates {
  pools: AssetRate[] | undefined
  isLoading: boolean
  rates: Record<string, string | null>
}

export const usePoolsRates = (): PoolsRates => {
  const { pools, isLoading } = usePools()

  const { data: rates } = useQuery({
    queryKey: ['pools-rates', pools?.length],
    queryFn: () => (pools ? getPoolsRates(pools.map(i => i.asset)) : []),
    enabled: !!pools
  })

  const ratesMap: Record<string, string | null> = {}
  const poolsRates: AssetRate[] | undefined = pools?.map(p => {
    const geckoId = poolsInfoMap[p.asset]?.geckoId
    const price = geckoId ? rates?.[geckoId]?.usd || null : null

    ratesMap[p.asset] = price
    return { ...p, price }
  })

  return { pools: poolsRates, rates: ratesMap, isLoading: isLoading }
}

export const poolsInfoMap: Record<string, { geckoId?: string; decimals: number }> = {
  // AVAX Chain
  'AVAX.AVAX': { geckoId: 'avalanche-2', decimals: 18 },
  'AVAX.SOL-0XFE6B19286885A4F7F55ADAD09C3CD1F906D2478F': { geckoId: 'solana', decimals: 9 },
  'AVAX.USDC-0XB97EF9EF8734C71904D8002F8B6BC66DD9C48A6E': { geckoId: 'usd-coin', decimals: 6 },
  'AVAX.USDT-0X9702230A8EA53601F5CD2DC00FDBC13D4DF4A8C7': { geckoId: 'tether', decimals: 6 },

  // Base
  'BASE.CBBTC-0XCBB7C0000AB88B473B1F5AFD9EF808440EED33BF': { geckoId: 'coinbase-wrapped-btc', decimals: 8 },
  'BASE.ETH': { geckoId: 'ethereum', decimals: 18 },
  'BASE.USDC-0X833589FCD6EDB6E08F4C7C32D4F71B54BDA02913': { geckoId: 'usd-coin', decimals: 6 },
  'BASE.VVV-0XACFE6019ED1A7DC6F7B508C02D1B04EC88CC21BF': { geckoId: 'venice-token', decimals: 18 },

  // BCH
  'BCH.BCH': { geckoId: 'bitcoin-cash', decimals: 8 },

  // BSC
  'BSC.BNB': { geckoId: 'binancecoin', decimals: 18 },
  'BSC.BTCB-0X7130D2A12B9BCBFAE4F2634D864A1EE1CE3EAD9C': { geckoId: 'bitcoin-bep2', decimals: 18 },
  'BSC.BUSD-0XE9E7CEA3DEDCA5984780BAFC599BD69ADD087D56': { geckoId: 'binance-usd', decimals: 18 },
  'BSC.ETH-0X2170ED0880AC9A755FD29B2688956BD959F933F8': { geckoId: 'ethereum', decimals: 18 },
  'BSC.TWT-0X4B0F1812E5DF2A09796481FF14017E6005508003': { geckoId: 'trust-wallet-token', decimals: 18 },
  'BSC.USDC-0X8AC76A51CC950D9822D68B83FE1AD97B32CD580D': { geckoId: 'usd-coin', decimals: 18 }, // check
  'BSC.USDT-0X55D398326F99059FF775485246999027B3197955': { geckoId: 'tether', decimals: 18 },

  // Bitcoin
  'BTC.BTC': { geckoId: 'bitcoin', decimals: 8 },

  // Dogecoin
  'DOGE.DOGE': { geckoId: 'dogecoin', decimals: 8 },

  // Ethereum
  'ETH.AAVE-0X7FC66500C84A76AD7E9C93437BFC5AC33E2DDAE9': { geckoId: 'aave', decimals: 18 },
  'ETH.DAI-0X6B175474E89094C44DA98B954EEDEAC495271D0F': { geckoId: 'dai', decimals: 18 },
  'ETH.DPI-0X1494CA1F11D487C2BBE4543E90080AEBA4BA3C2B': { geckoId: 'defipulse-index', decimals: 18 },
  'ETH.ETH': { geckoId: 'ethereum', decimals: 18 },
  'ETH.FOX-0XC770EEFAD204B5180DF6A14EE197D99D808EE52D': { geckoId: 'shapeshift-fox-token', decimals: 18 },
  'ETH.GUSD-0X056FD409E1D7A124BD7017459DFEA2F387B6D5CD': { geckoId: 'gemini-dollar', decimals: 2 },
  'ETH.LINK-0X514910771AF9CA656AF840DFF83E8264ECF986CA': { geckoId: 'chainlink', decimals: 18 },
  'ETH.LUSD-0X5F98805A4E8BE255A32880FDEC7F6728C6568BA0': { geckoId: 'liquity-usd', decimals: 18 },
  'ETH.RAZE-0X5EAA69B29F99C84FE5DE8200340B4E9B4AB38EAC': { decimals: 18 },
  'ETH.SNX-0XC011A73EE8576FB46F5E1C5751CA3B9FE0AF2A6F': { geckoId: 'havven', decimals: 18 },
  'ETH.TGT-0X108A850856DB3F85D0269A2693D896B394C80325': { geckoId: 'thorwallet', decimals: 18 },
  'ETH.THOR-0XA5F2211B9B8170F694421F2046281775E8468044': { geckoId: 'thorwallet', decimals: 18 },
  'ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48': { geckoId: 'usd-coin', decimals: 6 },
  'ETH.USDP-0X8E870D67F660D95D5BE530380D0EC0BD388289E1': { geckoId: 'paxos-standard', decimals: 18 },
  'ETH.USDT-0XDAC17F958D2EE523A2206206994597C13D831EC7': { geckoId: 'tether', decimals: 6 },
  'ETH.VTHOR-0X815C23ECA83261B6EC689B60CC4A58B54BC24D8D': { geckoId: 'vethor-token', decimals: 18 },
  'ETH.WBTC-0X2260FAC5E5542A773AA44FBCFEDF7C193BC2C599': { geckoId: 'wrapped-bitcoin', decimals: 8 },
  'ETH.XDEFI-0X72B886D09C117654AB7DA13A14D603001DE0B777': { geckoId: 'xdefi', decimals: 18 },
  'ETH.XRUNE-0X69FA0FEE221AD11012BAB0FDB45D444D3D2CE71C': { geckoId: 'thorstarter', decimals: 18 },
  'ETH.YFI-0X0BC529C00C6401AEF6D220BE8C6EA1667F6AD93E': { geckoId: 'yearn-finance', decimals: 18 },

  // Cosmos
  'GAIA.ATOM': { geckoId: 'cosmos', decimals: 6 },

  // Litecoin
  'LTC.LTC': { geckoId: 'litecoin', decimals: 8 },

  // Thorchain
  'THOR.RUNE': { geckoId: 'thorchain', decimals: 8 },
  'THOR.RUJI': { geckoId: 'rujira', decimals: 8 },
  'THOR.TCY': { geckoId: 'tcy', decimals: 8 },

  // Ripple
  'XRP.XRP': { geckoId: 'ripple', decimals: 6 }
}
