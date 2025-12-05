import { Chain, getEIP6963Wallets, NetworkDerivationPath, WalletOption, USwap } from '@uswap/core'
import { EVMPlugin } from '@uswap/plugins/evm'
import { NearPlugin } from '@uswap/plugins/near'
import { RadixPlugin } from '@uswap/plugins/radix'
import { SolanaPlugin } from '@uswap/plugins/solana'
import { MayachainPlugin, ThorchainPlugin } from '@uswap/plugins/thorchain'

import { ctrlWallet } from '@uswap/wallets/ctrl'
import { evmWallet } from '@uswap/wallets/evm-extensions'
import { keplrWallet } from '@uswap/wallets/keplr'
import { keystoreWallet } from '@uswap/wallets/keystore'
import { ledgerWallet } from '@uswap/wallets/ledger'
import { okxWallet } from '@uswap/wallets/okx'
import { phantomWallet } from '@uswap/wallets/phantom'
import { tronlinkWallet } from '@uswap/wallets/tronlink'
import { vultisigWallet } from '@uswap/wallets/vultisig'

import { useWalletStore } from '@/store/wallets-store'

const defaultPlugins = {
  ...EVMPlugin,
  ...MayachainPlugin,
  ...ThorchainPlugin,
  ...RadixPlugin,
  ...SolanaPlugin,
  ...NearPlugin
}


const defaultWallets = {
  ...ctrlWallet,
  ...evmWallet,
  ...keplrWallet,
  ...keystoreWallet,
  ...ledgerWallet,
  ...okxWallet,
  ...phantomWallet,
  ...tronlinkWallet,
  ...vultisigWallet,
}

function createUSwap(config: Parameters<typeof USwap>[0] = {}) {
  return USwap({
    ...config,
    plugins: defaultPlugins,
    wallets: defaultWallets,
    getActiveWallet: () => useWalletStore.getState().selected?.provider
  })
}

let instance: ReturnType<typeof createUSwap> | undefined = undefined

export function getUSwap() {
  if (instance) return instance

  instance = createUSwap({
    config: {
      apiKeys: {
        blockchair: process.env.NEXT_PUBLIC_BLOCKCHAIR_API_KEY,
        swapKit: process.env.NEXT_PUBLIC_UKIT_API_KEY
      },
      rpcUrls: {
        [Chain.Ethereum]: ['https://eth.llamarpc.com', 'https://ethereum-rpc.publicnode.com']
      },
      envs: {
        apiUrl: process.env.NEXT_PUBLIC_UKIT_API_URL
      }
    }
  })

  return instance
}

export async function connectWallet(option: WalletOption, chains: Chain[], config?: any): Promise<boolean> {
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
    case WalletOption.CTRL:
      return connectEach(c => uSwap.connectCtrl(c))
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
  option: WalletOption,
  chains: Chain[],
  config?: any
): Promise<{ address: string; network: Chain; provider: WalletOption }[]> {
  const uSwap = getUSwap()

  const connected = await connectWallet(option, chains, config)
  if (!connected) return []

  return chains
    .map(chain => {
      const address = uSwap.getAddress(chain)
      return address ? { address, network: chain, provider: option } : null
    })
    .filter(acc => acc !== null)
}

export const supportedChains: Record<WalletOption, Chain[]> = {
  [WalletOption.BRAVE]: evmWallet.connectEVMWallet.supportedChains,
  [WalletOption.COINBASE_WEB]: evmWallet.connectEVMWallet.supportedChains,
  [WalletOption.CTRL]: ctrlWallet.connectCtrl.supportedChains,
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
