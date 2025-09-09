import { AccountData, ChainInfo, Keplr } from '@keplr-wallet/types'
import { Account, Decimal, InboundAddress, Msg, Network, signers, Simulation, TxResult } from 'rujira.js'
import { CosmosClient } from 'rujira.js/src/signers/cosmos'
import { AminoTypes, OfflineAminoSigner } from 'rujira.js/src/signers/cosmos/amino'
import { OfflineDirectSigner } from 'rujira.js/src/signers/cosmos/proto-signing'
import { Comet38Client } from 'rujira.js/src/signers/cosmos/rpc/comet38'
import { HttpBatchClient } from 'rujira.js/src/signers/cosmos/rpc/rpcclients'
import { MsgSend } from 'rujira.js/src/signers/cosmos/types/cosmos/bank/v1beta1/tx'
import { MsgDeposit } from 'rujira.js/src/signers/cosmos/types/thorchain/types/msg_deposit'
import * as config from '../config'
import { Providers, WalletProvider } from '../types'

export interface CosmosContext {
  chain: ChainInfo
  client: CosmosClient
  gasPrice: signers.cosmos.GasPrice
}

export class CosmosAdapter implements WalletProvider<CosmosContext> {
  onChange?: ((cb: () => void) => void) | undefined

  constructor(private k: () => Keplr | undefined) {}

  isAvailable(): boolean {
    const k = this.k()
    if (!k) return false
    if ('isOkxWallet' in k) return false
    return true
  }

  public async getAccounts(): Promise<
    {
      context: CosmosContext
      account: { address: string; network: Network }
    }[]
  > {
    const k = this.k()
    if (!k) throw new Error(`Keplr unavailable`)

    return Promise.allSettled(
      getConfigs().map(async chain => {
        await k.experimentalSuggestChain(chain)
        await k.enable(chain.chainId)
        const signer = await k.getOfflineSignerAuto(chain.chainId)
        const accounts = await signer.getAccounts()
        const cmClient = Comet38Client.create(new HttpBatchClient(chain.rpc))
        return accounts.map(createCosmosContext(cmClient, signers.cosmos.castSigner(signer), chain))
      })
    ).then(res => {
      return res.reduce(
        (
          a: {
            context: CosmosContext
            account: { address: string; network: Network }
          }[],
          v
        ) => (v.status === 'fulfilled' ? [...v.value, ...a] : a),
        []
      )
    })
  }

  public async simulate(
    context: CosmosContext,
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

  public async signAndBroadcast(
    context: CosmosContext,
    account: Account<keyof Providers>,
    _simulation: Simulation,
    msg: Msg,
    inboundAddress?: InboundAddress
  ): Promise<TxResult> {
    const encoded = await msg.toEncodeObject(account, inboundAddress)

    const res = await context.client.signAndBroadcast(account.address, [encoded.msg], 'auto', encoded.memo)
    signers.cosmos.assertIsDeliverTxSuccess(res)
    return {
      network: account.network,
      address: account.address,
      txHash: res.transactionHash,
      deposited: msg.toDeposit ? msg.toDeposit() : undefined
    }
  }
}

export const getGasPrice = (c: ChainInfo): signers.cosmos.GasPrice => ({
  denom: c.feeCurrencies[0].coinDenom,
  amount: Decimal.fromUserInput(c.feeCurrencies[0].gasPriceStep?.average.toString() || '0', 18)
})

export const getNetwork = (c: ChainInfo): Network => {
  switch (c.chainName) {
    case 'Kujira':
      return Network.Kujira
    case 'Cosmos Hub':
      return Network.Gaia
    case 'Noble':
      return Network.Noble
    case 'Osmosis':
      return Network.Osmo
    case 'THORChain':
    case 'THORChain Stagenet':
    case 'THORChain Devnet':
      return Network.Thorchain
    default:
      throw new Error(`No Network for chain ${c.chainName}`)
  }
}

export const getConfigs = (): ChainInfo[] => {
  switch (process.env.NEXT_PUBLIC_MODE) {
    case 'main':
    case 'stage':
    case 'dev':
      return config[process.env.NEXT_PUBLIC_MODE]
    default:
      throw new Error(`Invalid mode ${process.env.NEXT_PUBLIC_MODE}`)
  }
}

export const createCosmosContext =
  (
    cmClient: Comet38Client,
    signer: OfflineDirectSigner | OfflineAminoSigner,
    chain: ChainInfo,
    options?: signers.cosmos.CosmosClientOptions
  ) =>
  (y: AccountData) => {
    const gasPrice = getGasPrice(chain)
    return {
      account: {
        address: y.address,
        network: getNetwork(chain)
      },
      context: {
        chain,
        gasPrice,
        client: CosmosClient.createWithSigner(cmClient, signer, {
          gasPrice,
          aminoTypes: new AminoTypes({
            ...signers.cosmos.createDefaultAminoConverters(),
            ...signers.cosmos.createThorchainAminoConverters(chain.chainId === 'thorchain-1' ? 'thor' : 'sthor')
          }),
          ...options
        })
      }
    }
  }
