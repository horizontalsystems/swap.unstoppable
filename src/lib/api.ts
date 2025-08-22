const API = process.env.NEXT_PUBLIC_THOR_API

export const getPools = async () => {
  const res = await fetch(`${API}/thorchain/pools`)

  if (!res.ok) {
    throw new Error('Failed to fetch transactions')
  }

  return (await res.json()).map((item: any) => {
    const [chain, asset] = item.asset.split('.')
    const [symbol, contract] = asset.split('-')
    const decimals = item.decimals

    return {
      type: contract ? 'LAYER_1' : 'NATIVE',
      asset: item.asset,
      chain,
      metadata: {
        symbol,
        decimals
      }
    }
  })
}

export const getQuote = async (params: Record<string, any>) => {
  const qs = new URLSearchParams(Object.entries(params).filter(i => i[1]))
  const res = await fetch(`${API}/thorchain/quote/swap?${qs.toString()}`)

  if (!res.ok) {
    throw new Error('Failed to fetch transactions')
  }

  return await res.json()
}
