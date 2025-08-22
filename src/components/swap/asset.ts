import { Asset as BaseAsset, Network } from 'rujira.js'

type AssetType = 'LAYER_1' | 'SECURED' | 'NATIVE' | '%future added value'

export type Asset = BaseAsset<AssetType>

const runeBase = {
  type: 'NATIVE' as AssetType,
  chain: Network.Thorchain,
  asset: 'THOR.RUNE',
  metadata: {
    decimals: 8,
    symbol: 'RUNE'
  },
  variants: null
}

export const RUNE: Asset = {
  ...runeBase,
  variants: {
    layer1: runeBase,
    native: { denom: 'rune' }
  }
}
