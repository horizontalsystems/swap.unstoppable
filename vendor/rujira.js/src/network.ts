import { address } from 'bitcoinjs-lib'
import { fromBech32 } from '@cosmjs/encoding'
import { decodeBase58, ethers } from 'ethers'

export enum Network {
  Avalanche = 'AVAX',
  Base = 'BASE',
  Bitcoin = 'BTC',
  BitcoinCash = 'BCH',
  Bsc = 'BSC',
  Dogecoin = 'DOGE',
  Ethereum = 'ETH',
  Gaia = 'GAIA',
  Kujira = 'KUJI',
  Litecoin = 'LTC',
  Monero = 'XMR',
  Noble = 'NOBLE',
  Osmo = 'OSMO',
  Solana = 'SOL',
  Thorchain = 'THOR',
  Xrp = 'XRP',
  Terra = 'TERRA',
  Terra2 = 'TERRA2',
  Tron = 'TRON'
}

export const gasToken = (n: Network): { symbol: string; decimals: number } => {
  switch (n) {
    case Network.Avalanche:
      return { symbol: 'AVAX', decimals: 18 }
    case Network.Base:
      return { symbol: 'ETH', decimals: 18 }
    case Network.Bitcoin:
      return { symbol: 'BTC', decimals: 8 }
    case Network.BitcoinCash:
      return { symbol: 'BCH', decimals: 8 }
    case Network.Bsc:
      return { symbol: 'BNB', decimals: 18 }
    case Network.Dogecoin:
      return { symbol: 'DOGE', decimals: 8 }
    case Network.Ethereum:
      return { symbol: 'ETH', decimals: 18 }
    case Network.Gaia:
      return { symbol: 'ATOM', decimals: 6 }
    case Network.Kujira:
      return { symbol: 'KUJI', decimals: 6 }
    case Network.Litecoin:
      return { symbol: 'LTC', decimals: 8 }
    case Network.Monero:
      return { symbol: 'XMR', decimals: 12 }
    case Network.Noble:
      return { symbol: 'USDC', decimals: 6 }
    case Network.Osmo:
      return { symbol: 'OSMO', decimals: 6 }
    case Network.Solana:
      return { symbol: 'SOL', decimals: 9 }
    case Network.Thorchain:
      return { symbol: 'RUNE', decimals: 8 }
    case Network.Terra:
      return { symbol: 'LUNA', decimals: 6 }
    case Network.Terra2:
      return { symbol: 'LUNA', decimals: 6 }
    case Network.Tron:
      return { symbol: 'TRX', decimals: 6 }
    case Network.Xrp:
      return { symbol: 'XRP', decimals: 6 }
  }
}

export const networkTxLink = ({ network, txHash }: { network: Network; txHash: string }) => {
  switch (network) {
    case Network.Avalanche:
      return `https://snowtrace.io/tx/${txHash}`
    case Network.Base:
      return `https://basescan.org/tx/${txHash}`
    case Network.Bitcoin:
      return `https://www.blockchain.com/explorer/transactions/btc/${txHash}`
    case Network.BitcoinCash:
      return `https://blockchair.com/bitcoin-cash/transaction/${txHash}`
    case Network.Bsc:
      return `https://bscscan.com/tx/${txHash}`
    case Network.Dogecoin:
      return `https://dogechain.info/tx/${txHash}`
    case Network.Ethereum:
      return `https://etherscan.io/tx/${txHash}`
    case Network.Gaia:
      return `https://www.mintscan.io/cosmos/tx/${txHash}`
    case Network.Kujira:
      return `https://chainsco.pe/kujira/tx/${txHash}`
    case Network.Litecoin:
      return `https://blockchair.com/litecoin/transaction/${txHash}`
    case Network.Monero:
      return `https://xmrchain.net/tx/${txHash}`
    case Network.Noble:
      return `https://www.mintscan.io/noble/tx/${txHash}`
    case Network.Osmo:
      return `https://www.mintscan.io/osmosis/tx/${txHash}`
    case Network.Solana:
      return `https://solscan.io/tx/${txHash}`
    case Network.Thorchain:
      return `https://thorchain.net/tx/${txHash}`
    case Network.Xrp:
      return `https://xrpscan.com/ledger/${txHash}`
    case Network.Terra:
      return `https://finder.terra.money/classic/tx/${txHash}`
    case Network.Terra2:
      return `https://www.mintscan.io/terra/tx/${txHash}`
    case Network.Tron:
      return `https://tronscan.org/#/transaction/${txHash}`
  }
}

export const networkLabel = (n: Network): string => {
  switch (n) {
    case Network.Avalanche:
      return 'Avalanche'
    case Network.Base:
      return 'Base'
    case Network.Bitcoin:
      return 'Bitcoin'
    case Network.BitcoinCash:
      return 'Bitcoin Cash'
    case Network.Bsc:
      return 'BNB Chain'
    case Network.Dogecoin:
      return 'Dogecoin'
    case Network.Ethereum:
      return 'Ethereum'
    case Network.Gaia:
      return 'Cosmos Hub'
    case Network.Kujira:
      return 'Kujira'
    case Network.Litecoin:
      return 'Litecoin'
    case Network.Monero:
      return 'Monero'
    case Network.Noble:
      return 'Noble'
    case Network.Osmo:
      return 'Osmosis'
    case Network.Solana:
      return 'Solana'
    case Network.Thorchain:
      return 'THORChain'
    case Network.Xrp:
      return 'XRP'
    case Network.Terra:
      return 'Terra Classic'
    case Network.Terra2:
      return 'Terra'
    case Network.Tron:
      return 'Tron'
  }
}

export const networkId = (n: Network): string => {
  switch (n) {
    case Network.Avalanche:
      return '0xa86a'
    case Network.Base:
      return '0x2105'
    case Network.Bsc:
      return '0x38'
    case Network.Ethereum:
      return '0x1'
    case Network.Tron:
      return '0x2B6653DC'
    default:
      throw new Error(`Non EVM chain ${n}`)
  }
}

export const networkConfirmationTime = (n: Network): number => {
  switch (n) {
    case Network.Avalanche:
      return 2 + networkConfirmationTime(Network.Thorchain)
    case Network.Base:
      return 12 + networkConfirmationTime(Network.Thorchain)
    case Network.Bitcoin:
      return 600 + networkConfirmationTime(Network.Thorchain)
    case Network.BitcoinCash:
      return 600 + networkConfirmationTime(Network.Thorchain)
    case Network.Bsc:
      return 3 + networkConfirmationTime(Network.Thorchain)
    case Network.Dogecoin:
      return 60 + networkConfirmationTime(Network.Thorchain)
    case Network.Ethereum:
      return 12 + networkConfirmationTime(Network.Thorchain)
    case Network.Gaia:
      return 6 + networkConfirmationTime(Network.Thorchain)
    case Network.Kujira:
      return 6 + networkConfirmationTime(Network.Thorchain)
    case Network.Litecoin:
      return 150 + networkConfirmationTime(Network.Thorchain)
    case Network.Monero:
      return 120 + networkConfirmationTime(Network.Thorchain)
    case Network.Noble:
      return 6 + networkConfirmationTime(Network.Thorchain)
    case Network.Osmo:
      return 6 + networkConfirmationTime(Network.Thorchain)
    case Network.Solana:
      return 1 + networkConfirmationTime(Network.Thorchain)
    case Network.Xrp:
      return 6 + networkConfirmationTime(Network.Thorchain)
    case Network.Thorchain:
      return 6
    case Network.Terra:
      return 6 + networkConfirmationTime(Network.Thorchain)
    case Network.Terra2:
      return 6 + networkConfirmationTime(Network.Thorchain)
    case Network.Tron:
      return 3 + networkConfirmationTime(Network.Thorchain)
  }
}

/*
Simple valiaton of address format for a given chain
*/
export const validateAddress = (n: Network, str: string): boolean => {
  try {
    switch (n) {
      case Network.Avalanche:
      case Network.Base:
      case Network.Bsc:
      case Network.Ethereum:
        return ethers.isAddress(str)
      case Network.Bitcoin:
        return address.fromBech32(str).prefix === 'bc'
      case Network.Gaia:
        return fromBech32(str).prefix === 'cosmos'
      case Network.Kujira:
        return fromBech32(str).prefix === 'kujira'
      case Network.Monero:
        // Monero addresses: Standard (95 chars starting with 4), Integrated (106 chars starting with 4), Subaddress (95 chars starting with 8)
        return (
          ((str.length === 95 && (str.startsWith('4') || str.startsWith('8'))) ||
            (str.length === 106 && str.startsWith('4'))) &&
          !!decodeBase58(str)
        )
      case Network.Noble:
        return fromBech32(str).prefix === 'noble'
      case Network.Osmo:
        return fromBech32(str).prefix === 'osmo'
      case Network.Solana:
        return str.length >= 32 && str.length <= 44 && !!decodeBase58(str)
      case Network.Thorchain:
        return fromBech32(str).prefix === 'thor'
      case Network.Terra:
      case Network.Terra2:
        return fromBech32(str).prefix === 'terra'
      case Network.BitcoinCash:
        return !!decodeBase58(str)
      case Network.Dogecoin:
        return (str.startsWith('D') || str.startsWith('A')) && !!decodeBase58(str)
      case Network.Litecoin:
        return (str.startsWith('L') || str.startsWith('M')) && !!decodeBase58(str)
      case Network.Tron:
        return str.startsWith('T') && str.length === 34 && !!decodeBase58(str)
      case Network.Xrp:
        return str.startsWith('r') && !!decodeBase58(str)
    }
  } catch (error) {
    return false
  }
}

export const getChainParams = (n: Network) => {
  switch (n) {
    case Network.Bsc:
      return {
        chainName: 'Binance Smart Chain',
        chainId: '0x38',
        blockExplorerUrls: ['https://bscscan.com'],
        iconUrls: ['https://cryptologos.cc/logos/bnb-bnb-logo.svg'],
        nativeCurrency: {
          name: 'Binance Coin',
          symbol: 'BNB',
          decimals: 18
        },
        rpcUrls: [
          'https://bsc-dataseed.binance.org/',
          'https://bsc-dataseed1.defibit.io/',
          'https://bsc-dataseed1.ninicoin.io/'
        ]
      }
    case Network.Avalanche:
      return {
        chainName: 'Avalanche C-Chain',
        chainId: '0xa86a',
        blockExplorerUrls: ['https://snowtrace.io'],
        iconUrls: ['https://cryptologos.cc/logos/avalanche-avax-logo.svg'],
        nativeCurrency: {
          name: 'Avalanche',
          symbol: 'AVAX',
          decimals: 18
        },
        rpcUrls: ['https://api.avax.network/ext/bc/C/rpc']
      }
    case Network.Base:
      return {
        chainName: 'Base Mainnet',
        chainId: '0x2105',
        blockExplorerUrls: ['https://basescan.org'],
        iconUrls: ['https://cryptologos.cc/logos/base-base-logo.svg'],
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18
        },
        rpcUrls: ['https://mainnet.base.org']
      }
    default:
      throw new Error(`Unsupported network ${n}`)
  }
}
