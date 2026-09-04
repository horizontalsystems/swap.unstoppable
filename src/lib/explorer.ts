import { Chain, ChainId, ChainIdToChain, getExplorerTxUrl } from '@uswap/core'
import { isStellarSdkProvider } from '@/types'

// Transaction explorer links. USwap's own table covers most chains, but returns an empty string for
// Stellar, and Axelar's bridge transfers are not a single-chain transaction at all — so those two
// are filled in here and everything else defers to USwap.

const STELLAR_EXPERT_TX = 'https://stellar.expert/explorer/public/tx'

/** Axelar transfers are two hub hops; Axelarscan tracks the whole message, not the Stellar leg. */
const AXELARSCAN_GMP = 'https://axelarscan.io/gmp'

export interface ExplorerLink {
  url: string
  /** The site being linked to, so the UI can name it rather than say "explorer". */
  label: string
}

/**
 * Where to view a transaction. Falls back to USwap's own explorer table for every chain it covers,
 * and fills in the two it does not.
 */
export const explorerTxLink = (args: { hash?: string; chainId?: string; chain?: Chain; provider?: string }): ExplorerLink | undefined => {
  const { hash, chainId, provider } = args
  if (!hash) return undefined

  // A bridged transfer is only half-visible on Stellar: the source transaction lands there, but
  // whether it arrived is Axelar's to answer.
  if (provider === 'AXELAR_ITS') return { url: `${AXELARSCAN_GMP}/${hash}`, label: 'axelarscan.io' }

  const chain = args.chain ?? (chainId ? ChainIdToChain[chainId as ChainId] : undefined)

  if (chain === Chain.Stellar || (provider && isStellarSdkProvider(provider))) {
    return { url: `${STELLAR_EXPERT_TX}/${hash}`, label: 'stellar.expert' }
  }

  if (!chain) return undefined

  const url = getExplorerTxUrl({ chain, txHash: hash })
  if (!url) return undefined

  try {
    return { url, label: new URL(url).hostname.replace(/^www\./, '') }
  } catch {
    return undefined
  }
}
