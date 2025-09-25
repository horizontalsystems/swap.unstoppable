import axios from 'axios'
import { ethers } from 'ethers'
import { Network } from 'rujira.js'

export class BalanceFetcher {
  static async fetch(asset: string, address: string): Promise<bigint> {
    const [chain, symbol] = asset.split('.')
    const [, id] = symbol.split('-')

    const network = chain as Network

    switch (network) {
      case Network.Ethereum:
      case Network.Bsc:
      case Network.Avalanche:
      case Network.Base: {
        const url = evmRpcUrls[network]
        const provider = new ethers.JsonRpcProvider(url)

        if (id) {
          return this.fetchEip20Balance(provider, id, address)
        } else {
          return this.fetchEvmBalance(provider, address)
        }
      }
      case Network.Bitcoin: {
        const res = await axios.get(`https://blockchain.info/balance?active=${address}`)
        return BigInt(res.data[address].final_balance)
      }
      case Network.Litecoin:
        return this.fetchBlockchairBalance('litecoin', address)

      case Network.Dogecoin:
        return this.fetchBlockchairBalance('dogecoin', address)

      case Network.BitcoinCash:
        return this.fetchBlockchairBalance('bitcoin-cash', address)

      case Network.Xrp: {
        const res = await axios.get(`https://api.xrpscan.com/api/v1/account/${address}`)
        return BigInt(res.data.Balance) * 10n ** 2n
      }
      case Network.Gaia:
      case Network.Thorchain: {
        const res = await axios.get(`https://thornode.ninerealms.com/bank/balances/${address}`)
        const amount = res.data.result.find((i: any) => i.denom.toUpperCase() === symbol)?.amount
        return amount ? BigInt(amount) : 0n
      }
      default: {
        return 0n
      }
    }
  }

  static async fetchEvmBalance(provider: ethers.JsonRpcProvider, address: string): Promise<bigint> {
    const balance = await provider.getBalance(address)
    return balance / 10n ** 10n
  }

  static async fetchEip20Balance(
    provider: ethers.JsonRpcProvider,
    contractAddress: string,
    address: string
  ): Promise<bigint> {
    const tokenAddress = ethers.getAddress(contractAddress.toLowerCase())
    const abi = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)']
    const contract = new ethers.Contract(tokenAddress, abi, provider)
    const balance = BigInt(await contract.balanceOf(address.toLowerCase()))
    const decimals = BigInt(await contract.decimals())
    return (balance * 10n ** 8n) / 10n ** decimals
  }

  static async fetchBlockchairBalance(chain: string, address: string): Promise<bigint> {
    const res = await axios.get(
      `https://api.blockchair.com/${chain}/dashboards/address/${address}?key=${process.env.NEXT_PUBLIC_BLOCKCHAIR_API_KEY}`
    )
    return BigInt(res.data.data[address].address.balance)
  }
}

const evmRpcUrls: Partial<Record<Network, string>> = {
  [Network.Ethereum]: `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_PROJECT_ID}`,
  [Network.Bsc]: 'https://bsc-dataseed.binance.org',
  [Network.Avalanche]: 'https://api.avax.network/ext/bc/C/rpc',
  [Network.Base]: 'https://mainnet.base.org'
}
