import { supportedChains } from '@/lib/wallets'
import { Chain, okxMobileEnabled, WalletOption } from '@uswap/core'
import { getChainConfig } from '@uswap/helpers'

export enum WalletType {
  browser,
  hardware
}

export type WalletParams = {
  key: string
  type: WalletType
  label: string
  option: WalletOption
  link: string
  supportedChains: Chain[]
}

export const ALL_CHAINS = [
  Chain.Arbitrum,
  Chain.Avalanche,
  Chain.Base,
  Chain.BinanceSmartChain,
  Chain.Bitcoin,
  Chain.BitcoinCash,
  Chain.Cosmos,
  Chain.Dash,
  Chain.Dogecoin,
  Chain.Ethereum,
  Chain.Litecoin,
  Chain.Maya,
  Chain.Near,
  Chain.Polygon,
  Chain.Solana,
  Chain.THORChain,
  Chain.Tron,
  Chain.Zcash
]

export const COMING_SOON_CHAINS = ['XMR']

export const WALLETS: WalletParams[] = [
  {
    key: 'metamask',
    label: 'MetaMask',
    type: WalletType.browser,
    option: WalletOption.METAMASK,
    link: 'https://metamask.io',
    supportedChains: supportedChains[WalletOption.METAMASK]
  },
  {
    key: 'vultisig',
    type: WalletType.browser,
    label: 'Vultisig',
    option: WalletOption.VULTISIG,
    link: 'https://vultisig.com',
    supportedChains: supportedChains[WalletOption.VULTISIG]
  },
  {
    key: 'phantom',
    type: WalletType.browser,
    label: 'Phantom',
    option: WalletOption.PHANTOM,
    link: 'https://phantom.app',
    supportedChains: supportedChains[WalletOption.PHANTOM]
  },
  {
    key: 'ctrl',
    type: WalletType.browser,
    label: 'Ctrl',
    option: WalletOption.CTRL,
    link: 'https://ctrl.xyz',
    supportedChains: supportedChains[WalletOption.CTRL]
  },
  {
    key: 'keplr',
    type: WalletType.browser,
    label: 'Keplr',
    option: WalletOption.KEPLR,
    link: 'https://www.keplr.app',
    supportedChains: supportedChains[WalletOption.KEPLR]
  },
  {
    key: 'okx',
    type: WalletType.browser,
    label: 'OKX',
    option: WalletOption.OKX,
    link: 'https://web3.okx.com',
    supportedChains: supportedChains[WalletOption.OKX]
  },
  {
    key: 'tronlink',
    type: WalletType.browser,
    label: 'TronLink',
    option: WalletOption.TRONLINK,
    link: 'https://www.tronlink.org',
    supportedChains: supportedChains[WalletOption.TRONLINK]
  },
  {
    key: 'ledger',
    type: WalletType.hardware,
    label: 'Ledger',
    option: WalletOption.LEDGER,
    link: 'https://www.ledger.com',
    supportedChains: supportedChains[WalletOption.LEDGER]
  },
  {
    key: 'keystore',
    type: WalletType.hardware,
    label: 'Keystore',
    option: WalletOption.KEYSTORE,
    link: 'https://www.keystore.com',
    supportedChains: supportedChains[WalletOption.KEYSTORE]
  }
]

export const wallet = (option: WalletOption) => {
  return WALLETS.find(w => w.option === option)
}

export const isWalletAvailable = (option: WalletOption) => {
  // prettier-ignore
  switch (option) {
    case WalletOption.METAMASK: return window?.ethereum && !window.ethereum?.isBraveWallet
    case WalletOption.VULTISIG: return window?.vultisig
    case WalletOption.PHANTOM: return window?.phantom
    case WalletOption.CTRL: return window?.xfi || window?.ethereum?.__XDEFI
    case WalletOption.KEPLR: return window?.keplr
    case WalletOption.OKX: return window?.okxwallet
    case WalletOption.TRONLINK: return window?.tronLink || window?.tronWeb
    case WalletOption.LEDGER:
    case WalletOption.KEYSTORE: return true

    case WalletOption.BRAVE:
      return window?.ethereum?.isBraveWallet
    case WalletOption.TRUSTWALLET_WEB:
      return window?.ethereum?.isTrust || window?.trustwallet
    case WalletOption.COINBASE_WEB:
      return ((window?.ethereum?.overrideIsMetaMask && window?.ethereum?.selectedProvider?.isCoinbaseWallet) || window?.coinbaseWalletExtension)
    case WalletOption.OKX_MOBILE:
      return okxMobileEnabled()
    case WalletOption.BITGET:
      return window?.bitkeep?.ethereum
    case WalletOption.ONEKEY:
      return window?.$onekey?.ethereum

    default:
      return false
  }
}

export const chainLabel = (c: Chain | string): string => {
  switch (c) {
    case Chain.BinanceSmartChain:
      return 'BNB Chain'
    case Chain.BitcoinCash:
      return 'Bitcoin Cash'
    case 'XMR':
      return 'Monero'
    default:
      return getChainConfig(c as Chain).name
  }
}
