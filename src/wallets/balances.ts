import axios from 'axios'
import { ethers } from 'ethers'
import { gasToken, Network } from 'rujira.js'

interface BalanceProviderProps {
  network: Network
  address: string
  assets: string[]
}

const networkUrls: Record<Network, string> = {
  [Network.Ethereum]: process.env.NEXT_PUBLIC_ETH_RPC || '',
  [Network.Bsc]: process.env.NEXT_PUBLIC_BSC_RPC || '',
  [Network.Avalanche]: process.env.NEXT_PUBLIC_AVAX_RPC || '',
  [Network.Base]: process.env.NEXT_PUBLIC_BASE_RPC || '',
  [Network.Bitcoin]: 'https://blockstream.info/api',
  [Network.BitcoinCash]: 'https://rest.bitcoin.com/v2',
  [Network.Litecoin]: 'https://sochain.com/api/v2',
  [Network.Dogecoin]: 'https://sochain.com/api/v2',
  [Network.Osmo]: 'https://lcd-osmosis.blockapsis.com',
  [Network.Gaia]: 'https://lcd-cosmoshub.blockapsis.com',
  [Network.Kujira]: 'https://lcd-kujira.blockapsis.com',
  [Network.Thorchain]: 'https://thornode.ninerealms.com',
  [Network.Noble]: 'https://lcd-noble.blockapsis.com',
  [Network.Xrp]: 'https://data.ripple.com/v2/accounts',
  [Network.Terra]: 'https://lcd-terra.classic.money',
  [Network.Terra2]: 'https://lcd-terra2.classic.money'
}

class BalanceProvider {
  private readonly network: Network
  private readonly url: string

  constructor(network: Network, url: string) {
    this.network = network
    this.url = url
  }

  async getNativeBalance(address: string): Promise<string> {
    try {
      switch (this.network) {
        case Network.Ethereum:
        case Network.Bsc:
        case Network.Avalanche:
        case Network.Base: {
          const provider = new ethers.JsonRpcProvider(this.url)
          const balance = await provider.getBalance(address)
          return ethers.formatEther(balance)
        }
        case Network.Bitcoin: {
          const res = await axios.get(`${this.url}/address/${address}`)
          return (res.data.chain_stats.funded_txo_sum / 1e8).toString()
        }
        case Network.Litecoin:
        case Network.Dogecoin: {
          const res = await axios.get(`https://sochain.com/api/v2/get_address_balance/${this.network}/${address}`)
          return parseFloat(res.data.data.confirmed_balance).toString()
        }
        case Network.BitcoinCash: {
          const res = await axios.get(`${this.url}/address/details/${address}`)
          return res.data.balance.toString()
        }
        case Network.Xrp: {
          const res = await axios.get(`${this.url}/${address}/balances`)
          const balance = res.data.balances.find((b: any) => b.currency === 'XRP')
          return balance ? balance.value : '0'
        }
        case Network.Osmo:
        case Network.Gaia:
        case Network.Kujira:
        case Network.Thorchain:
        case Network.Noble:
        case Network.Terra:
        case Network.Terra2: {
          const res = await axios.get(`${this.url}/cosmos/bank/v1beta1/balances/${address}`)
          if (res.data.balances && res.data.balances.length > 0) {
            return (Number(res.data.balances[0].amount) / 1e6).toString()
          }
          return '0'
        }
        default:
          return '0'
      }
    } catch {
      return '0'
    }
  }

  async getTokenBalance(address: string, token: string): Promise<string> {
    if (
      this.network === Network.Ethereum ||
      this.network === Network.Bsc ||
      this.network === Network.Avalanche ||
      this.network === Network.Base
    ) {
      try {
        const tokenAddress = ethers.getAddress(token)
        const provider = new ethers.JsonRpcProvider(this.url)
        const abi = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)']
        const contract = new ethers.Contract(tokenAddress, abi, provider)
        const balance = await contract.balanceOf(address)
        const decimals = await contract.decimals()
        return ethers.formatUnits(balance, decimals)
      } catch {
        return '0.0'
      }
    } else {
      return '0.0'
    }
  }

  async getBalances(address: string, assets: string[]): Promise<Record<string, string>> {
    const balances: Record<string, string> = {}
    for (const item of assets) {
      const [chain, asset] = item.split('.')
      const [, contract] = asset.split('-')

      if (chain === this.network && asset.toUpperCase() === gasToken(this.network).symbol) {
        balances[item] = await this.getNativeBalance(address)
      } else {
        balances[item] = await this.getTokenBalance(address, contract)
      }
    }

    return balances
  }
}

export class BalanceFetcher {
  static getProvider(network: Network, url: string): BalanceProvider {
    return new BalanceProvider(network, url)
  }

  static async fetch(input: BalanceProviderProps): Promise<Record<string, string>> {
    const provider = BalanceFetcher.getProvider(input.network, networkUrls[input.network])
    return provider.getBalances(input.address, input.assets)
  }
}
