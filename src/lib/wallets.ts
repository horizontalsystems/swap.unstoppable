import { Chain, getEIP6963Wallets, NetworkDerivationPath, WalletOption, USwap } from '@uswap/core'
import { EVMPlugin } from '@uswap/plugins/evm'
import { NearPlugin } from '@uswap/plugins/near'
import { RadixPlugin } from '@uswap/plugins/radix'
import { SolanaPlugin } from '@uswap/plugins/solana'
import { MayachainPlugin, ThorchainPlugin } from '@uswap/plugins/thorchain'

import { bitgetWallet } from '@uswap/wallets/bitget'
import { coinbaseWallet } from '@uswap/wallets/coinbase'
import { ctrlWallet } from '@uswap/wallets/ctrl'
import { evmWallet } from '@uswap/wallets/evm-extensions'
import { keepkeyWallet } from '@uswap/wallets/keepkey'
import { keepkeyBexWallet } from '@uswap/wallets/keepkey-bex'
import { keplrWallet } from '@uswap/wallets/keplr'
import { keystoreWallet } from '@uswap/wallets/keystore'
import { ledgerWallet } from '@uswap/wallets/ledger'
import { okxWallet } from '@uswap/wallets/okx'
import { onekeyWallet } from '@uswap/wallets/onekey'
import { passkeysWallet } from '@uswap/wallets/passkeys'
import { phantomWallet } from '@uswap/wallets/phantom'
import { polkadotWallet } from '@uswap/wallets/polkadotjs'
import { radixWallet } from '@uswap/wallets/radix'
import { talismanWallet } from '@uswap/wallets/talisman'
import { trezorWallet } from '@uswap/wallets/trezor'
import { tronlinkWallet } from '@uswap/wallets/tronlink'
import { vultisigWallet } from '@uswap/wallets/vultisig'
import { walletconnectWallet } from '@uswap/wallets/walletconnect'
import { walletSelectorWallet } from '@uswap/wallets/near-wallet-selector'
import { xamanWallet } from '@uswap/wallets/xaman'
import { cosmostationWallet } from '@uswap/wallets/cosmostation'

import { useWalletStore } from '@/store/wallets-store'

const defaultPlugins = {
  ...EVMPlugin,
  ...MayachainPlugin,
  ...ThorchainPlugin,
  ...RadixPlugin,
  ...SolanaPlugin,
  ...NearPlugin
}

const exodusWallet = { ...passkeysWallet, connectExodusWallet: passkeysWallet.connectPasskeys }

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
  ...passkeysWallet,
  ...radixWallet,
  ...talismanWallet,
  ...trezorWallet,
  ...tronlinkWallet,
  ...vultisigWallet,
  ...walletconnectWallet,
  ...walletSelectorWallet,
  ...xamanWallet
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
    case WalletOption.COINBASE_WEB:
    case WalletOption.TRUSTWALLET_WEB:
      return connectEach(c => uSwap.connectEVMWallet(c))
    case WalletOption.COSMOSTATION:
      return connectEach(c => uSwap.connectCosmostation(c))
    case WalletOption.PHANTOM:
      return connectEach(c => uSwap.connectPhantom(c))
    case WalletOption.KEPLR:
      return connectEach(c => uSwap.connectKeplr(c))
    case WalletOption.WALLETCONNECT:
      return connectEach(c => uSwap.connectWalletconnect(c))
    case WalletOption.COINBASE_MOBILE:
      return connectEach(c => uSwap.connectCoinbaseWallet(c))
    case WalletOption.BITGET:
      return connectEach(c => uSwap.connectBitget(c))
    case WalletOption.CTRL:
      return connectEach(c => uSwap.connectCtrl(c))
    case WalletOption.KEEPKEY:
      return connectEach(c => uSwap.connectKeepkey(c))
    case WalletOption.KEEPKEY_BEX:
      return connectEach(c => uSwap.connectKeepkeyBex?.(c))
    case WalletOption.ONEKEY:
      return connectEach(c => uSwap.connectOnekeyWallet?.(c))
    case WalletOption.OKX:
    case WalletOption.OKX_MOBILE:
      return connectEach(c => uSwap.connectOkx(c))
    case WalletOption.POLKADOT_JS:
      return connectEach(c => uSwap.connectPolkadotJs(c))
    case WalletOption.RADIX_WALLET:
      return connectEach(c => uSwap.connectRadixWallet(c))
    case WalletOption.TALISMAN:
      return connectEach(c => uSwap.connectTalisman(c))
    case WalletOption.VULTISIG:
      return connectEach(c => uSwap.connectVultisig(c))
    case WalletOption.KEYSTORE:
      return uSwap.connectKeystore(chains, config?.phrase, config?.derivationPath)
    case WalletOption.LEDGER:
      return connectEach(c => uSwap.connectLedger(c, config?.derivationPath))
    case WalletOption.TREZOR: {
      const [chain] = chains
      if (!chain) throw new Error('Chain is required for Trezor')
      return connectEach(c => uSwap.connectTrezor(c, NetworkDerivationPath[chain]))
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
  [WalletOption.PASSKEYS]: passkeysWallet.connectPasskeys.supportedChains,
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
