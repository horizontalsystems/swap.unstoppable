import { TronWeb } from 'tronweb'
import { Account, InboundAddress, Msg, Network, Simulation, TxResult } from 'rujira.js'
import { Providers, WalletProvider } from '../types'

interface TronLink {
  request: (v: { method: string }) => Promise<any>
  tronWeb: TronWeb
}

declare global {
  interface Window {
    tronLink?: TronLink
  }
}
export type TronlinkContext = TronLink

const BANDWIDTH_PRICE_SUN_PER_BYTE = 1

class Tronlink implements WalletProvider<TronlinkContext> {
  private tron: () => TronLink | undefined

  constructor(tron: () => TronLink | undefined) {
    this.tron = tron
  }
  async getAccounts(): Promise<
    {
      context: TronlinkContext
      account: { address: string; network: Network }
    }[]
  > {
    const t = this.tron()
    if (!t) throw new Error(`TronLink not found`)
    await t.request({ method: 'tron_requestAccounts' })
    if (!t.tronWeb.defaultAddress.base58) throw new Error(`No account found on TronLink`)

    return [
      {
        context: t,
        account: {
          address: t.tronWeb.defaultAddress.base58,
          network: Network.Tron
        }
      }
    ]
  }
  async simulate(
    context: TronlinkContext,
    account: Account<keyof Providers>,
    msg: Msg,
    inboundAddress?: InboundAddress
  ): Promise<Simulation> {
    const tx = msg.toTronTx(context.tronWeb, account, inboundAddress)
    const txSizeBytes = JSON.stringify(tx).length
    const bandwidth = await context.tronWeb.trx.getBandwidth(account.address)

    const bandwidthRequired = Math.max(0, txSizeBytes - bandwidth)
    const bwCostSun = bandwidthRequired * BANDWIDTH_PRICE_SUN_PER_BYTE

    return {
      symbol: 'TRX',
      decimals: 6,
      amount: BigInt(bwCostSun),
      gas: BigInt(bwCostSun)
    }
  }
  async signAndBroadcast(
    context: TronlinkContext,
    account: Account<keyof Providers>,
    _simulation: Simulation,
    msg: Msg,
    inboundAddress?: InboundAddress
  ): Promise<TxResult> {
    const tx = await msg.toTronTx(context.tronWeb, account, inboundAddress)
    const signed = await context.tronWeb.trx.sign(tx)
    const res = await context.tronWeb.trx.sendRawTransaction(signed)
    return {
      network: Network.Tron,
      address: account.address,
      txHash: res.txid,
      deposited: msg.toDeposit?.()
    }
  }
  onChange?: ((cb: () => void) => void) | undefined
  isAvailable() {
    return !!this.tron()
  }
}

const provider = () => new Tronlink(() => window.tronLink)
export default provider
