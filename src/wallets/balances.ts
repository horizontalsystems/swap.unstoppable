import axios from 'axios'
import { ethers } from 'ethers'
import { gasToken, Network } from 'rujira.js'

interface BalanceProviderProps {
  network: Network
  address: string
  asset: string
}

const networkUrls: Record<Network, string> = {
  [Network.Ethereum]: process.env.NEXT_PUBLIC_ETH_RPC || '',
  [Network.Bsc]: process.env.NEXT_PUBLIC_BSC_RPC || '',
  [Network.Avalanche]: process.env.NEXT_PUBLIC_AVAX_RPC || '',
  [Network.Base]: process.env.NEXT_PUBLIC_BASE_RPC || '',
  [Network.Bitcoin]: 'https://blockstream.info/api',
  [Network.BitcoinCash]: 'https://api.fullstack.cash/v5/electrumx/balance',
  [Network.Litecoin]: 'https://api.blockchair.com',
  [Network.Dogecoin]: 'https://dogechain.info',
  [Network.Osmo]: 'https://lcd-osmosis.blockapsis.com',
  [Network.Gaia]: 'https://cosmos-api.polkachu.com',
  [Network.Kujira]: 'https://kujira-api.polkachu.com',
  [Network.Thorchain]: 'https://thornode.ninerealms.com',
  [Network.Noble]: 'https://noble-api.polkachu.com',
  [Network.Xrp]: 'https://data.ripple.com',
  [Network.Tron]: 'https://api.trongrid.io',
  [Network.Terra]: 'https://terra-classic-lcd.publicnode.com',
  [Network.Terra2]: 'https://phoenix-lcd.terra.dev'
}

class BalanceProvider {
  private readonly network: Network
  private readonly url: string

  constructor(network: Network, url: string) {
    this.network = network
    this.url = url
  }

  async getNativeBalance(address: string): Promise<bigint> {
    switch (this.network) {
      case Network.Ethereum:
      case Network.Bsc:
      case Network.Avalanche:
      case Network.Base: {
        const provider = new ethers.JsonRpcProvider(this.url)
        const balance = await provider.getBalance(address)
        return balance / BigInt(1e10)
      }
      case Network.Bitcoin: {
        const res = await axios.get(`${this.url}/address/${address}`)
        return BigInt(res.data.chain_stats.funded_txo_sum) - BigInt(res.data.chain_stats.spent_txo_sum)
      }
      case Network.Litecoin: {
        // const res = await axios.get(`${this.url}/litecoin/dashboards/address//${address}`)
        // return parseFloat(res.data.data.confirmed_balance).toString()
        return 0n
      }
      case Network.Dogecoin: {
        // const res = await axios.get(`${this.url}/api/v1/address/balance/${address}`)
        // return parseFloat(res.data.data.confirmed_balance).toString()
        return 0n
      }
      case Network.BitcoinCash: {
        const res = await axios.get(`${this.url}/${address}`)
        return res.data.balance.confirmed
      }
      case Network.Xrp: {
        // const res = await axios.get(`${this.url}/v1/accounts/${address}/balances`)
        // const balance = res.data.balances.find((b: any) => b.currency === 'XRP')
        // return balance ? balance.value : '0'
        return 0n
      }
      case Network.Tron: {
        // const res = await axios.get(`${this.url}/${address}`)
        // const balance = res.data[0].balance
        // return (balance / 1e6).toString()
        return 0n
      }
      case Network.Osmo:
      case Network.Gaia:
      case Network.Kujira:
      case Network.Thorchain:
      case Network.Noble:
      case Network.Terra:
      case Network.Terra2: {
        // const res = await axios.get(`${this.url}/cosmos/bank/v1beta1/balances/${address}`)
        // if (res.data.balances && res.data.balances.length > 0) {
        //   return (Number(res.data.balances[0].amount) / 1e6).toString()
        // }
        return 0n
      }
    }
  }

  async getTokenBalance(address: string, assetId: string): Promise<bigint> {
    if (
      this.network === Network.Ethereum ||
      this.network === Network.Bsc ||
      this.network === Network.Avalanche ||
      this.network === Network.Base
    ) {
      const [, contractAddress] = assetId.split('-')
      const tokenAddress = ethers.getAddress(contractAddress.toLowerCase())
      const provider = new ethers.JsonRpcProvider(this.url)
      const abi = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)']
      const contract = new ethers.Contract(tokenAddress, abi, provider)
      const balance = await contract.balanceOf(address.toLowerCase())
      const decimals = await contract.decimals()
      return (BigInt(balance) * BigInt(1e8)) / 10n ** decimals
    } else if (this.network === Network.Thorchain) {
      const data = await axios.get(`${this.url}/cosmos/bank/v1beta1/balances/${address}`).then(res => res.data)
      const balance = data?.balances?.find((i: any) => i.denom.toUpperCase() === assetId)
      return BigInt(balance?.amount || 0)
    } else {
      return 0n // todo: Handle other blockchains
    }
  }

  async getBalance(address: string, asset: string): Promise<bigint> {
    const [chain, assetId] = asset.split('.')

    if (
      chain === this.network &&
      this.network !== Network.Thorchain &&
      assetId.toUpperCase() === gasToken(this.network).symbol
    ) {
      return await this.getNativeBalance(address)
    } else {
      return await this.getTokenBalance(address, assetId)
    }
  }
}

export class BalanceFetcher {
  static getProvider(network: Network, url: string): BalanceProvider {
    return new BalanceProvider(network, url)
  }

  static async fetch(input: BalanceProviderProps): Promise<bigint> {
    const provider = BalanceFetcher.getProvider(input.network, networkUrls[input.network])
    return provider.getBalance(input.address, input.asset)
  }
}
