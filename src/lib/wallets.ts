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
  ...xamanWallet
}

function createSwapKit(config: Parameters<typeof SwapKit>[0] = {}) {
  return SwapKit({ ...config, plugins: defaultPlugins, wallets: defaultWallets })
}

let swapKit: ReturnType<typeof createSwapKit> | undefined = undefined

export function getSwapKit() {
  if (swapKit) {
    return swapKit
  }

  swapKit = createSwapKit({
    config: {
      apiKeys: {
        swapKit: process.env.NEXT_PUBLIC_SWAP_KIT_API_KEY
      }
    }
  })

  return swapKit
}

export async function connectWallet(option: WalletOption, chains: Chain[], config?: any): Promise<boolean> {
  if (!swapKit) swapKit = getSwapKit()

  switch (option) {
    case WalletOption.METAMASK:
      const metamask = getEIP6963Wallets().providers.find(p => p.info.name === 'MetaMask')
      return swapKit.connectEVMWallet([Chain.Ethereum], WalletOption.METAMASK, metamask?.provider)
    case WalletOption.COINBASE_WEB:
    case WalletOption.TRUSTWALLET_WEB:
      return swapKit.connectEVMWallet(chains)
    case WalletOption.COSMOSTATION:
      return swapKit.connectCosmostation(chains)
    case WalletOption.PHANTOM:
      return swapKit.connectPhantom(chains)
    case WalletOption.KEPLR:
      return swapKit.connectKeplr([Chain.THORChain])
    case WalletOption.WALLETCONNECT:
      return swapKit.connectWalletconnect(chains)
    case WalletOption.COINBASE_MOBILE:
      return swapKit.connectCoinbaseWallet(chains)
    case WalletOption.BITGET:
      return swapKit.connectBitget(chains)
    case WalletOption.CTRL:
      return swapKit.connectCtrl([Chain.Ethereum])
    case WalletOption.KEEPKEY:
      return swapKit.connectKeepkey(chains)
    case WalletOption.KEEPKEY_BEX:
      return swapKit.connectKeepkeyBex?.(chains)
    case WalletOption.ONEKEY:
      return swapKit.connectOnekeyWallet?.(chains)
    case WalletOption.OKX:
    case WalletOption.OKX_MOBILE:
      return swapKit.connectOkx(chains)
    case WalletOption.POLKADOT_JS:
      return swapKit.connectPolkadotJs(chains)
    case WalletOption.RADIX_WALLET:
      return swapKit.connectRadixWallet(chains)
    case WalletOption.TALISMAN:
      return swapKit.connectTalisman(chains)
    case WalletOption.VULTISIG:
      return swapKit.connectVultisig(chains)
    case WalletOption.LEDGER: {
      for (let i = 0; i < chains.length; i += 1) {
        const chain = chains[i]
        await swapKit.connectLedger([chain], config?.derivationPath)
      }
      return true
    }
    case WalletOption.TREZOR: {
      const [chain] = chains
      if (!chain) throw new Error('Chain is required for Trezor')
      return swapKit.connectTrezor(chains, NetworkDerivationPath[chain])
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
  if (!swapKit) swapKit = getSwapKit()

  const connected = await connectWallet(option, chains, config)
  if (!connected) return []

  return chains
    .map(chain => {
      const address = swapKit?.getAddress(chain)
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
  [WalletOption.XAMAN]: xamanWallet.connectXaman.supportedChains
}
