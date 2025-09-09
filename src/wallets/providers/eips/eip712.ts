import { ChainInfo } from '@keplr-wallet/types'
import { Eip1193Provider } from 'ethers'
import { Account, InboundAddress, Msg, Network, signers, Simulation, TxResult } from 'rujira.js'
import { Eip712Signer } from 'rujira.js/src/signers/cosmos/proto-signing'
import { Comet38Client } from 'rujira.js/src/signers/cosmos/rpc/comet38'
import { MsgSend } from 'rujira.js/src/signers/cosmos/types/cosmos/bank/v1beta1/tx'
import { MsgDeposit } from 'rujira.js/src/signers/cosmos/types/thorchain/types/msg_deposit'
import { CosmosContext, createCosmosContext } from '../cosmos'
import { Providers, WalletProvider } from '../../types'

interface Provider extends Eip1193Provider {
  on?: (event: string, cb: () => void) => any
}

export type Eip712Context = CosmosContext

export class Eip712Adapter implements WalletProvider<Eip712Context> {
  onChange?: ((cb: () => void) => void) | undefined
  disconnect?: (() => void) | undefined

  constructor(
    private e: () => Provider | undefined,
    private chainInfo: ChainInfo
  ) {}

  async getAccounts(): Promise<{ context: Eip712Context; account: { address: string; network: Network } }[]> {
    const e = this.e()
    if (!e) throw new Error(``)
    const prefix = this.chainInfo.bech32Config?.bech32PrefixAccAddr
    if (!prefix) throw new Error(`No bech32 prefix provided for ${this.chainInfo.chainId}`)
    const signer = new Eip712Signer(e, prefix, this.chainInfo.rpc)
    const cmClient = Comet38Client.connect(this.chainInfo.rpc)
    const accounts = await signer.getAccounts()
    return accounts.map(
      createCosmosContext(cmClient, signer, this.chainInfo, {
        pubkeyEncoder: signers.cosmos.encodeEthSecp256k1Pubkey
      })
    )
  }

  async simulate(
    context: Eip712Context,
    account: Account<keyof Providers>,
    msg: Msg,
    inboundAddress?: InboundAddress
  ): Promise<Simulation> {
    const encoded = await msg.toEncodeObject(account, inboundAddress)

    const simRaw = await context.client.simulate(account.address, [encoded.msg], encoded.memo)

    const sim = Math.ceil(simRaw * 1.5)

    if ([MsgSend.typeUrl, MsgDeposit.typeUrl].includes(encoded.msg.typeUrl) && account.network === Network.Thorchain)
      return {
        symbol: 'RUNE',
        decimals: 8,
        amount: 2000000n,
        gas: BigInt(sim)
      }

    return {
      symbol: context.chain.feeCurrencies[0].coinDenom,
      decimals: context.chain.feeCurrencies[0].coinDecimals,
      amount: BigInt(Math.floor(sim * context.gasPrice.amount.toFloatApproximation())),
      gas: BigInt(sim)
    }
  }

  async signAndBroadcast(
    context: Eip712Context,
    account: Account<keyof Providers>,
    _simulation: Simulation,
    msg: Msg,
    inboundAddress?: InboundAddress
  ): Promise<TxResult> {
    const encoded = await msg.toEncodeObject(account, inboundAddress)
    console.log({ encoded })

    const res = await context.client.signAndBroadcast(account.address, [encoded.msg], 'auto', encoded.memo)
    signers.cosmos.assertIsDeliverTxSuccess(res)
    return {
      network: account.network,
      address: account.address,
      txHash: res.transactionHash,
      deposited: msg.toDeposit ? msg.toDeposit() : undefined
    }
  }

  isAvailable() {
    return true
  }
}
