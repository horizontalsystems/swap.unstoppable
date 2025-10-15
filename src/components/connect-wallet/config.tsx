import { supportedChains } from '@/lib/wallets'
import { Chain, WalletOption } from '@swapkit/core'
import { getChainConfig } from '@swapkit/helpers'

export enum WalletType {
  browser,
  hardware
}

export interface WalletProps {
  key: string
  type: WalletType
  label: string
  option: WalletOption
  link: string
  supportedChains: Chain[]
}

export const ALL_CHAINS = [
  Chain.Avalanche,
  Chain.Base,
  Chain.BinanceSmartChain,
  Chain.Bitcoin,
  Chain.BitcoinCash,
  Chain.Cosmos,
  Chain.Dogecoin,
  Chain.Ethereum,
  Chain.Litecoin,
  Chain.Tron,
  Chain.THORChain
]

export const COMING_SOON_CHAINS = [Chain.Solana]

export const WALLETS: WalletProps[] = [
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
  }
]

export const chainLabel = (c: Chain): string => {
  switch (c) {
    case Chain.BinanceSmartChain:
      return 'BNB Chain'
    default:
      return getChainConfig(c).name
  }
}

export const wallet = (option: WalletOption): WalletProps | undefined => WALLETS.find(w => w.option === option)
