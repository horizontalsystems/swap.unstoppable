const MIDGARD = process.env.NEXT_PUBLIC_MIDGARD_API
const THORNODE = process.env.NEXT_PUBLIC_THOR_API

export const getPools = async () => {
  const res = await fetch(`${MIDGARD}/v2/pools`)

  if (!res.ok) {
    throw new Error('Failed to fetch transactions')
  }

  return (await res.json()).map((item: any) => {
    const [chain, asset] = item.asset.split('.')
    const [symbol] = asset.split('-')

    return {
      type: chain === 'THOR' ? 'NATIVE' : 'LAYER_1',
      asset: item.asset,
      chain,
      metadata: {
        symbol,
        decimals: item.nativeDecimal
      }
    }
  })
}

export const getQuote = async (params: Record<string, any>) => {
  const qs = new URLSearchParams(Object.entries(params).filter(i => i[1]))
  const res = await fetch(`${THORNODE}/thorchain/quote/swap?${qs.toString()}`)

  if (!res.ok) {
    throw new Error('Failed to fetch transactions')
  }

  return await res.json()
}
