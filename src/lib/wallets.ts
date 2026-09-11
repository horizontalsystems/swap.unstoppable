import { Chain, getEIP6963Wallets, USwap, WalletOption } from '@uswap/core'
import { EVMPlugin } from '@uswap/plugins/evm'
import { NearPlugin } from '@uswap/plugins/near'
import { P2PPlugin } from '@uswap/plugins/p2p'
import { SolanaPlugin } from '@uswap/plugins/solana'
import { MayachainPlugin, ThorchainPlugin } from '@uswap/plugins/thorchain'
import { evmWallet } from '@uswap/wallets/evm-extensions'
import { keplrWallet } from '@uswap/wallets/keplr'
import { keystoreWallet } from '@uswap/wallets/keystore'
import { ledgerWallet } from '@uswap/wallets/ledger'
import { okxWallet } from '@uswap/wallets/okx'
import { phantomWallet } from '@uswap/wallets/phantom'
import { tronlinkWallet } from '@uswap/wallets/tronlink'
import { vultisigWallet } from '@uswap/wallets/vultisig'
import { connectFreighter } from '@/lib/stellar/wallet'
import { AppConfig } from '@/config'
import { AppWalletOption, isStellarWallet, uSwapWalletOption } from '@/types'
import { useWalletStore } from '@/store/wallets-store'
import { BTC_PURPOSE_ADDRESS_TYPE, btcAddressType } from '@/lib/swap-helpers'

const defaultPlugins = {
  ...EVMPlugin,
  ...MayachainPlugin,
  ...ThorchainPlugin,
  ...SolanaPlugin,
  ...NearPlugin,
  ...P2PPlugin
}

const defaultWallets = {
  ...evmWallet,
  ...keplrWallet,
  ...keystoreWallet,
  ...ledgerWallet,
  ...okxWallet,
  ...phantomWallet,
  ...tronlinkWallet,
  ...vultisigWallet
}

function createUSwap(config: Parameters<typeof USwap>[0] = {}) {
  return USwap({
    ...config,
    plugins: defaultPlugins,
    wallets: defaultWallets,
    getActiveWallet: () => {
      const selected = useWalletStore.getState().selected?.provider
      return selected && uSwapWalletOption(selected)
    }
  })
}

let instance: ReturnType<typeof createUSwap> | undefined = undefined

// The Blockchair API key stays on the server, so the UTXO toolbox talks to our
// own proxy (src/app/api/blockchair) instead of api.blockchair.com. The SDK's
// request client builds a `new URL(...)`, so this has to be absolute.
function blockchairProxyUrl() {
  const origin = typeof window === 'undefined' ? AppConfig.baseUrl : window.location.origin
  return `${origin}/api/blockchair`
}

// Solana has no free endpoint a browser can use: api.mainnet-beta.solana.com 403s anything sending
// an `Origin` header, and publicnode blocks the token-account call half of a balance needs. So the
// toolbox talks to our own proxy (src/app/api/solana) instead, the same arrangement Blockchair has.
function solanaProxyUrl() {
  const origin = typeof window === 'undefined' ? AppConfig.baseUrl : window.location.origin
  return `${origin}/api/solana`
}

export function getUSwap() {
  if (instance) return instance

  instance = createUSwap({
    config: {
      apiKeys: {
        uSwap: process.env.NEXT_PUBLIC_USWAP_API_KEY,
        blockchair: 'uws' // fake key to just avoid logs like: No Blockchair API key found
      },
      rpcUrls: {
        [Chain.Ethereum]: ['https://ethereum-rpc.publicnode.com', 'https://eth.llamarpc.com'],
        [Chain.Solana]: [solanaProxyUrl()]
      },
      envs: {
        apiUrl: process.env.NEXT_PUBLIC_USWAP_API_URL,
        blockchairApiUrl: blockchairProxyUrl(),
        memolessApiUrl: process.env.NEXT_PUBLIC_MEMOLESS_API
      }
    }
  })

  return instance
}

export async function connectWallet(option: AppWalletOption, chains: Chain[], config?: any): Promise<boolean> {
  // USwap has no Stellar plugin or wallet adapter, so these connect entirely outside it.
  if (isStellarWallet(option)) {
    await connectFreighter()
    return true
  }

  const uSwap = getUSwap()
  const connectEach = async (connect: (chain: Chain[]) => Promise<boolean>) => {
    let successCount = 0
    for (const chain of chains) {
      try {
        await connect([chain])
        successCount++
      } catch (error) {
        console.warn(`Failed to connect to ${chain}:`, error)
      }
    }

    return successCount > 0
  }

  switch (option) {
    case WalletOption.METAMASK:
      const metamask = getEIP6963Wallets().providers.find(p => p.info.name === 'MetaMask')
      return connectEach(c => uSwap.connectEVMWallet(c, WalletOption.METAMASK, metamask?.provider))
    case WalletOption.PHANTOM:
      return connectEach(c => uSwap.connectPhantom(c))
    case WalletOption.KEPLR:
      return connectEach(c => uSwap.connectKeplr(c))
    case WalletOption.OKX:
    case WalletOption.OKX_MOBILE:
      return connectEach(c => uSwap.connectOkx(c))
    case WalletOption.VULTISIG:
      return connectEach(c => uSwap.connectVultisig(c))
    case WalletOption.TRONLINK:
      return connectEach(c => uSwap.connectTronLink(c))
    case WalletOption.KEYSTORE:
      return uSwap.connectKeystore(chains, config?.phrase, config?.derivationPath)
    case WalletOption.LEDGER:
      return connectEach(c => uSwap.connectLedger(c, config?.derivationPath))
    default: {
      throw new Error(`Unsupported wallet option: ${option}`)
    }
  }
}

export async function getAccounts(
  option: AppWalletOption,
  chains: Chain[],
  config?: any
): Promise<{ address: string; network: Chain; provider: AppWalletOption }[]> {
  if (isStellarWallet(option)) {
    const address = await connectFreighter()
    return [{ address, network: Chain.Stellar, provider: option }]
  }

  const uSwap = getUSwap()

  const connected = await connectWallet(option, chains, config)
  if (!connected) return []

  return chains
    .map(chain => {
      const address = uSwap.getAddress(chain)
      if (!address) return null
      const mismatch = btcPathMismatch(chain, address, config?.derivationPath)
      if (mismatch) {
        uSwap.disconnectChain(chain)
        throw new Error(mismatch)
      }
      return { address, network: chain, provider: option }
    })
    .filter(acc => acc !== null)
}

// A device asked for a BIP-86 path has to answer with a Taproot (bc1p…) address. Ledger
// firmware that predates Taproot instead derives a Native SegWit address from the Taproot
// key: a valid-looking bc1q… address holding none of the user's coins. Fail loudly rather
// than connect an account whose balance will always read zero.
function btcPathMismatch(chain: Chain, address: string, derivationPath?: number[]): string | null {
  if (chain !== Chain.Bitcoin || !derivationPath) return null

  const expected = BTC_PURPOSE_ADDRESS_TYPE[derivationPath[0]]
  const actual = btcAddressType(address)

  if (!expected || !actual || expected === actual) return null

  return (
    `Your wallet returned a ${BTC_ADDRESS_TYPE_LABEL[actual]} address for the ${BTC_ADDRESS_TYPE_LABEL[expected]} derivation path. ` +
    `Update your device's Bitcoin app to the latest version, or connect using ${BTC_ADDRESS_TYPE_LABEL[actual]} instead.`
  )
}

const BTC_ADDRESS_TYPE_LABEL = {
  taproot: 'Taproot',
  nativeSegwit: 'Native SegWit',
  nestedSegwit: 'Nested SegWit',
  legacy: 'Legacy'
} as const

export const supportedChains: Record<AppWalletOption, Chain[]> = {
  FREIGHTER: [Chain.Stellar],
  [WalletOption.BRAVE]: evmWallet.connectEVMWallet.supportedChains,
  [WalletOption.COINBASE_WEB]: evmWallet.connectEVMWallet.supportedChains,
  [WalletOption.EIP6963]: evmWallet.connectEVMWallet.supportedChains,
  [WalletOption.KEPLR]: keplrWallet.connectKeplr.supportedChains,
  [WalletOption.KEYSTORE]: keystoreWallet.connectKeystore.supportedChains,
  [WalletOption.LEAP]: keplrWallet.connectKeplr.supportedChains,
  [WalletOption.LEDGER]: ledgerWallet.connectLedger.supportedChains,
  [WalletOption.LEDGER_LIVE]: ledgerWallet.connectLedger.supportedChains,
  [WalletOption.METAMASK]: evmWallet.connectEVMWallet.supportedChains,
  [WalletOption.OKX]: okxWallet.connectOkx.supportedChains,
  [WalletOption.OKX_MOBILE]: evmWallet.connectEVMWallet.supportedChains,
  [WalletOption.PHANTOM]: phantomWallet.connectPhantom.supportedChains,
  [WalletOption.TRONLINK]: tronlinkWallet.connectTronLink.supportedChains,
  [WalletOption.TRUSTWALLET_WEB]: evmWallet.connectEVMWallet.supportedChains,
  [WalletOption.VULTISIG]: vultisigWallet.connectVultisig.supportedChains,
  [WalletOption.WALLET_SELECTOR]: [Chain.Near],
  [WalletOption.BITGET]: [],
  [WalletOption.CTRL]: [],
  [WalletOption.COINBASE_MOBILE]: [],
  [WalletOption.COSMOSTATION]: [],
  [WalletOption.EXODUS]: [],
  [WalletOption.KEEPKEY]: [],
  [WalletOption.KEEPKEY_BEX]: [],
  [WalletOption.ONEKEY]: [],
  [WalletOption.POLKADOT_JS]: [],
  [WalletOption.PASSKEYS]: [],
  [WalletOption.RADIX_WALLET]: [],
  [WalletOption.TALISMAN]: [],
  [WalletOption.TREZOR]: [],
  [WalletOption.WALLETCONNECT]: [],
  [WalletOption.XAMAN]: []
}
