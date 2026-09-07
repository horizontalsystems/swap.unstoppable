import { AssetValue, Chain, getChainConfig, USwapNumber } from '@uswap/core'
import { getProvider } from '@uswap/toolboxes/evm'
import { Asset } from '@/components/swap/asset'
import { ROBINHOOD_NATIVE_IDENTIFIER } from '@/lib/robinhood/asset-list'

/**
 * Robinhood Chain balances are read straight from the chain's own RPC.
 *
 * Every other chain's balances come from the aggregator's `/balance`, but it answers
 * "Chain ROBINHOOD is not supported" — it routes 4663 through 1inch and LI.FI without indexing it.
 * The RPC is the authority anyway, and the chain config already carries one, so the toolbox's
 * `getProvider` is all this needs.
 */

const ERC20_BALANCE_OF = ['function balanceOf(address owner) view returns (uint256)']

/**
 * One asset's balance for an address on Robinhood Chain.
 *
 * Returns zero rather than throwing when the RPC is unreachable or the contract does not answer: to
 * the caller an unreadable balance and an empty one lead to the same place, and the swap is gated
 * on a quote either way.
 */
export const getRobinhoodBalance = async (address: string, asset: Asset): Promise<AssetValue> => {
  const zero = () => new AssetValue({ decimal: asset.decimals, identifier: asset.identifier, value: 0 })

  try {
    const provider = await getProvider(Chain.Robinhood)

    let raw: bigint
    if (asset.address) {
      const { Contract } = await import('ethers')
      raw = await new Contract(asset.address, ERC20_BALANCE_OF, provider).balanceOf(address)
    } else {
      raw = await provider.getBalance(address)
    }

    return new AssetValue({
      decimal: asset.decimals,
      identifier: asset.identifier,
      value: USwapNumber.fromBigInt(raw, asset.decimals)
    })
  } catch (error) {
    console.warn(`Failed to read ${asset.identifier} balance on Robinhood Chain:`, error)
    return zero()
  }
}

/**
 * What the wallet sidebar can show for a Robinhood account: the gas asset, and only the gas asset.
 *
 * Listing an address's token holdings needs an indexer, and this chain has none the browser can
 * reach — the aggregator does not index 4663, and Robinhood's Blockscout sits behind a Cloudflare
 * challenge that a browser fetch cannot answer. Probing `balanceOf` for all ~870 catalogued tokens
 * over plain RPC is not a substitute. So the sidebar under-reports Robinhood holdings, while the
 * swap form itself is unaffected: it reads whichever asset is selected, one call, via
 * `getRobinhoodBalance`.
 */
export const getRobinhoodAccountBalances = async (address: string): Promise<AssetValue[]> => {
  try {
    const provider = await getProvider(Chain.Robinhood)
    const decimals = getChainConfig(Chain.Robinhood).baseDecimal
    const wei = await provider.getBalance(address)

    return [
      new AssetValue({
        decimal: decimals,
        identifier: ROBINHOOD_NATIVE_IDENTIFIER,
        value: USwapNumber.fromBigInt(wei, decimals)
      })
    ]
  } catch (error) {
    console.warn('Failed to read the Robinhood Chain account balance:', error)
    return []
  }
}
