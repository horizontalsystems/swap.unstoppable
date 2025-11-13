import { Chain, getEIP6963Wallets, NetworkDerivationPath, WalletOption } from '@swapkit/core'
import { EVMPlugin } from '@swapkit/plugins/evm'
import { NearPlugin } from '@swapkit/plugins/near'
import { RadixPlugin } from '@swapkit/plugins/radix'
import { SolanaPlugin } from '@swapkit/plugins/solana'
import { MayachainPlugin, ThorchainPlugin } from '@swapkit/plugins/thorchain'

import { bitgetWallet } from '@swapkit/wallets/bitget'
import { coinbaseWallet } from '@swapkit/wallets/coinbase'
import { ctrlWallet } from '@swapkit/wallets/ctrl'
import { evmWallet } from '@swapkit/wallets/evm-extensions'
import { exodusWallet } from '@swapkit/wallets/exodus'
import { keepkeyWallet } from '@swapkit/wallets/keepkey'
import { keepkeyBexWallet } from '@swapkit/wallets/keepkey-bex'
import { keplrWallet } from '@swapkit/wallets/keplr'
import { keystoreWallet } from '@swapkit/wallets/keystore'
import { ledgerWallet } from '@swapkit/wallets/ledger'
import { okxWallet } from '@swapkit/wallets/okx'
import { onekeyWallet } from '@swapkit/wallets/onekey'
import { phantomWallet } from '@swapkit/wallets/phantom'
import { polkadotWallet } from '@swapkit/wallets/polkadotjs'
import { radixWallet } from '@swapkit/wallets/radix'
import { talismanWallet } from '@swapkit/wallets/talisman'
import { trezorWallet } from '@swapkit/wallets/trezor'
import { tronlinkWallet } from '@swapkit/wallets/tronlink'
import { vultisigWallet } from '@swapkit/wallets/vultisig'
import { walletconnectWallet } from '@swapkit/wallets/walletconnect'
import { walletSelectorWallet } from '@swapkit/wallets/near-wallet-selector'
import { xamanWallet } from '@swapkit/wallets/xaman'
import { cosmostationWallet } from '@swapkit/wallets/cosmostation'
import { SwapKit } from '@/lib/swapkit'

const defaultPlugins = {
  ...EVMPlugin,
  ...MayachainPlugin,
  ...ThorchainPlugin,
  ...RadixPlugin,
  ...SolanaPlugin,
  ...NearPlugin
}

const defaultWallets = {
  ...bitgetWallet,
  ...coinbaseWallet,
  ...cosmostationWallet,
  ...ctrlWallet,
  ...evmWallet,
  ...exodusWallet,
  ...keepkeyBexWallet,
  ...keepkeyWallet,
  ...keplrWallet,
  ...keystoreWallet,
  ...ledgerWallet,
  ...okxWallet,
  ...onekeyWallet,
  ...phantomWallet,
  ...polkadotWallet,
  ...radixWallet,
  ...talismanWallet,
  ...trezorWallet,
  ...tronlinkWallet,
  ...vultisigWallet,
  ...walletconnectWallet,
  ...walletSelectorWallet,
  ...xamanWallet
}

function createSwapKit(config: Parameters<typeof SwapKit>[0] = {}) {
  return SwapKit({ ...config, plugins: defaultPlugins, wallets: defaultWallets })
}

let instance: ReturnType<typeof createSwapKit> | undefined = undefined

export function getSwapKit() {
  if (instance) return instance

  instance = createSwapKit({
    config: {
      apiKeys: {
        blockchair: process.env.NEXT_PUBLIC_BLOCKCHAIR_API_KEY,
        swapKit: process.env.NEXT_PUBLIC_SWAP_KIT_API_KEY
      },
      rpcUrls: {
        [Chain.Ethereum]: ['https://eth.drpc.org', 'https://eth.llamarpc.com', 'https://ethereum-rpc.publicnode.com']
      }
    }
  })

  return instance
}

export async function connectWallet(option: WalletOption, chains: Chain[], config?: any): Promise<boolean> {
  const kit = getSwapKit()
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
      return connectEach(c => kit.connectEVMWallet(c, WalletOption.METAMASK, metamask?.provider))
    case WalletOption.COINBASE_WEB:
    case WalletOption.TRUSTWALLET_WEB:
      return connectEach(c => kit.connectEVMWallet(c))
    case WalletOption.COSMOSTATION:
      return connectEach(c => kit.connectCosmostation(c))
    case WalletOption.PHANTOM:
      return connectEach(c => kit.connectPhantom(c))
    case WalletOption.KEPLR:
      return connectEach(c => kit.connectKeplr(c))
    case WalletOption.WALLETCONNECT:
      return connectEach(c => kit.connectWalletconnect(c))
    case WalletOption.COINBASE_MOBILE:
      return connectEach(c => kit.connectCoinbaseWallet(c))
    case WalletOption.BITGET:
      return connectEach(c => kit.connectBitget(c))
    case WalletOption.CTRL:
      return connectEach(c => kit.connectCtrl(c))
    case WalletOption.KEEPKEY:
      return connectEach(c => kit.connectKeepkey(c))
    case WalletOption.KEEPKEY_BEX:
      return connectEach(c => kit.connectKeepkeyBex?.(c))
    case WalletOption.ONEKEY:
      return connectEach(c => kit.connectOnekeyWallet?.(c))
    case WalletOption.OKX:
    case WalletOption.OKX_MOBILE:
      return connectEach(c => kit.connectOkx(c))
    case WalletOption.POLKADOT_JS:
      return connectEach(c => kit.connectPolkadotJs(c))
    case WalletOption.RADIX_WALLET:
      return connectEach(c => kit.connectRadixWallet(c))
    case WalletOption.TALISMAN:
      return connectEach(c => kit.connectTalisman(c))
    case WalletOption.VULTISIG:
      return connectEach(c => kit.connectVultisig(c))
    case WalletOption.KEYSTORE:
      return kit.connectKeystore(chains, config?.phrase, config?.derivationPath)
    case WalletOption.LEDGER:
      return connectEach(c => kit.connectLedger(c, config?.derivationPath))
    case WalletOption.TREZOR: {
      const [chain] = chains
      if (!chain) throw new Error('Chain is required for Trezor')
      return connectEach(c => kit.connectTrezor(c, NetworkDerivationPath[chain]))
    }
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
  const kit = getSwapKit()

  const connected = await connectWallet(option, chains, config)
  if (!connected) return []

  return chains
    .map(chain => {
      const address = kit.getAddress(chain)
      return address ? { address, network: chain, provider: option } : null
    })
    .filter(acc => acc !== null)
}

export const supportedChains: Record<WalletOption, Chain[]> = {
  [WalletOption.BITGET]: bitgetWallet.connectBitget.supportedChains,
  [WalletOption.BRAVE]: evmWallet.connectEVMWallet.supportedChains,
  [WalletOption.COINBASE_MOBILE]: coinbaseWallet.connectCoinbaseWallet.supportedChains,
  [WalletOption.COINBASE_WEB]: evmWallet.connectEVMWallet.supportedChains,
  [WalletOption.COSMOSTATION]: cosmostationWallet.connectCosmostation.supportedChains,
  [WalletOption.CTRL]: ctrlWallet.connectCtrl.supportedChains,
  [WalletOption.EIP6963]: evmWallet.connectEVMWallet.supportedChains,
  [WalletOption.EXODUS]: exodusWallet.connectExodusWallet.supportedChains,
  [WalletOption.KEEPKEY]: keepkeyWallet.connectKeepkey.supportedChains,
  [WalletOption.KEEPKEY_BEX]: keepkeyBexWallet.connectKeepkeyBex.supportedChains,
  [WalletOption.KEPLR]: keplrWallet.connectKeplr.supportedChains,
  [WalletOption.KEYSTORE]: keystoreWallet.connectKeystore.supportedChains,
  [WalletOption.LEAP]: keplrWallet.connectKeplr.supportedChains,
  [WalletOption.LEDGER]: ledgerWallet.connectLedger.supportedChains,
  [WalletOption.LEDGER_LIVE]: ledgerWallet.connectLedger.supportedChains,
  [WalletOption.METAMASK]: evmWallet.connectEVMWallet.supportedChains,
  [WalletOption.OKX]: okxWallet.connectOkx.supportedChains,
  [WalletOption.OKX_MOBILE]: evmWallet.connectEVMWallet.supportedChains,
  [WalletOption.ONEKEY]: onekeyWallet.connectOnekeyWallet.supportedChains,
  [WalletOption.PHANTOM]: phantomWallet.connectPhantom.supportedChains,
  [WalletOption.POLKADOT_JS]: polkadotWallet.connectPolkadotJs.supportedChains,
  [WalletOption.RADIX_WALLET]: radixWallet.connectRadixWallet.supportedChains,
  [WalletOption.TALISMAN]: talismanWallet.connectTalisman.supportedChains,
  [WalletOption.TREZOR]: trezorWallet.connectTrezor.supportedChains,
  [WalletOption.TRONLINK]: tronlinkWallet.connectTronLink.supportedChains,
  [WalletOption.TRUSTWALLET_WEB]: evmWallet.connectEVMWallet.supportedChains,
  [WalletOption.VULTISIG]: vultisigWallet.connectVultisig.supportedChains,
  [WalletOption.WALLETCONNECT]: walletconnectWallet.connectWalletconnect.supportedChains,
  [WalletOption.WALLET_SELECTOR]: [Chain.Near],
  [WalletOption.XAMAN]: xamanWallet.connectXaman.supportedChains
}
