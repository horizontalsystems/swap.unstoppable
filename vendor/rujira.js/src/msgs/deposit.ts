import { fromBech32 } from "@cosmjs/encoding";
import { Psbt } from "bitcoinjs-lib";
import { Buffer } from "buffer";
import { getAddress, TransactionRequest } from "ethers";
import { TronWeb } from "tronweb";
import { Payment as XrpPayment } from "xrpl";
import { InboundAddress } from "../accounts";
import { Asset } from "../asset";
import { IncorrectNetworkError } from "../errors";
import { Network } from "../network";
import { EncodeObject } from "../signers/cosmos/proto-signing";
import { MsgSend } from "../signers/cosmos/types/cosmos/bank/v1beta1/tx";
import { MsgDeposit as MsgDepositBase } from "../signers/cosmos/types/thorchain/types/msg_deposit";
import { evmRouter } from "../signers/evm";
import { PsbtFactory, Utxo } from "../signers/utxo";
import { ERC20Allowance, Msg, TronTx } from "./msg";

const EVM_NATIVE = "0x0000000000000000000000000000000000000000";

/**
 * MsgDeposit abstracts layer 1 deposits & direct MsgDeposit on THORChain
 */
export class MsgDeposit implements Msg {
  protected amount: bigint;
  constructor(
    protected asset: Asset,
    amount: bigint
  ) {
    // Adjust the 8dp input to the decimals of the source asset
    this.amount =
      (amount * 10n ** BigInt(asset?.metadata.decimals || 0)) / 10n ** 8n;
  }

  async toPsbt(
    account: {
      network: Network;
      address: string;
    },
    utxos: Utxo[],
    inboundAddress?: InboundAddress
  ): Promise<{
    psbt: Psbt;
    fee: bigint;
    amount: bigint;
    memo: string;
    recipient: string;
  }> {
    if (this.asset.chain !== account.network) {
      throw new IncorrectNetworkError(account.network, this.asset.chain);
    }

    const fac = new PsbtFactory();
    if (!inboundAddress)
      throw new Error(`Inbound Address required for ${account.network}`);
    const base = await fac.buildPbst(
      account,
      utxos,
      this.amount,
      inboundAddress.address,
      inboundAddress.gasRate,
      this.toMemo()
    );

    return {
      ...base,
      memo: this.toMemo(),
      recipient: inboundAddress.address,
    };
  }

  async toEncodeObject(
    account: {
      network: Network;
      address: string;
    },
    inboundAddress?: InboundAddress
  ): Promise<{ msg: EncodeObject; memo: string }> {
    if (this.asset.type === "SECURED") {
      if (account.network !== Network.Thorchain) {
        throw new IncorrectNetworkError(account.network, Network.Thorchain);
      }
    } else {
      if (this.asset.chain !== account.network) {
        throw new IncorrectNetworkError(account.network, this.asset.chain);
      }
    }
    // the current implementation of MsgSend -> MsgDeposit calls `common.NewAsset(coin.Denom)`
    // to translate the sent denoms to THORChain asset notation.
    // The x/ prefix currently breaks the chain decoding check, so we need to encode
    // the message as a MsgDeposit instead of MsgSend.

    if (
      account.network === Network.Thorchain &&
      this.asset.variants?.native?.denom.startsWith("x/")
    ) {
      return {
        msg: this.toMsgDeposit(account.address),
        memo: this.toMemo(),
      };
    }

    return {
      msg: {
        typeUrl: MsgSend.typeUrl,
        value: {
          ...this.sendValue(account.address, inboundAddress),
          toAddress: inboundAddress?.address,
        },
      },
      memo: this.toMemo(),
    };
  }

  sendValue(fromAddress: string, inboundAddress?: InboundAddress) {
    const amount =
      inboundAddress?.dustThreshold &&
      this.amount < inboundAddress.dustThreshold
        ? inboundAddress.dustThreshold
        : this.amount;

    return {
      fromAddress,
      amount: [
        {
          denom: this.asset.variants?.native?.denom,
          amount: amount.toString(),
        },
      ],
    };
  }

  async toTransactionRequest(
    account: {
      network: Network;
      address: string;
    },
    inboundAddress?: InboundAddress
  ): Promise<{ tx: TransactionRequest; erc20?: ERC20Allowance }> {
    if (!inboundAddress?.router)
      throw new Error(
        `Inbound Address & Router required for ${account.network}`
      );

    if (this.asset.chain !== account.network) {
      throw new IncorrectNetworkError(account.network, this.asset.chain);
    }

    const contract = evmRouter(inboundAddress?.router);
    const expiration = BigInt(new Date().getTime() + 600000);
    const asset = assetAddress(this.asset.asset);

    const request = contract.depositWithExpiry(
      inboundAddress?.address,
      asset,
      inboundAddress?.dustThreshold &&
        this.amount < inboundAddress.dustThreshold
        ? inboundAddress.dustThreshold
        : this.amount,
      this.toMemo(),
      expiration
    );

    return asset === EVM_NATIVE
      ? { tx: request }
      : {
          tx: { ...request, value: 0n },
          erc20: {
            amount: this.amount,
            asset: {
              contract: asset,
              decimals: this.asset.metadata.decimals,
              symbol: this.asset.metadata.symbol,
            },
          },
        };
  }

  toMemo(): string {
    throw new Error(`toMemo not implemented`);
  }

  toDeposit(): { amount: bigint; symbol: string } {
    return {
      // Revert back to 8dp
      amount:
        (this.amount * 10n ** 8n) /
        10n ** BigInt(this.asset?.metadata.decimals || 0),
      symbol: this.asset.metadata.symbol,
    };
  }
  toMsgDeposit(address: string): {
    typeUrl: string;
    value: MsgDepositBase;
  } {
    const match = this.asset.asset.match(/([A-Z]+)[-\.](.*)/);
    if (!match) throw new Error(`Invalid Asset ${this.asset.asset}`);
    const [, chain, symbol] = match;
    const [ticker] = symbol.split("-");

    return {
      typeUrl: MsgDepositBase.typeUrl,
      value: {
        memo: this.toMemo(),
        signer: fromBech32(address).data,
        coins: [
          {
            asset: {
              chain,
              symbol,
              ticker,
              synth: false,
              trade: false,
              secured: this.asset.type === "SECURED",
            },
            decimals: 0,
            amount: this.amount.toString(),
          },
        ],
      },
    };
  }

  async toXrpPayment(
    account: { network: Network; address: string },
    inboundAddress?: InboundAddress
  ): Promise<XrpPayment> {
    if (!inboundAddress)
      throw new Error(`Inbound Address required for ${account.network}`);

    if (this.asset.chain !== account.network) {
      throw new IncorrectNetworkError(account.network, this.asset.chain);
    }

    const MemoData = this.toMemo()
      ? Buffer.from(this.toMemo(), "utf8").toString("hex")
      : undefined;
    return {
      TransactionType: "Payment",
      Account: account.address,
      Destination: inboundAddress?.address,
      Amount: this.amount.toString(),
      Fee: ((inboundAddress?.gasRate || 0n) / 100n).toString(),
      Memos: MemoData ? [{ Memo: { MemoData } }] : [],
    };
  }
  async toTronTx(
    tronWeb: TronWeb,
    account: { network: Network; address: string },
    inboundAddress?: InboundAddress
  ): Promise<TronTx> {
    if (!inboundAddress)
      throw new Error(`Inbound Address required for ${account.network}`);

    if (this.asset.chain !== account.network) {
      throw new IncorrectNetworkError(account.network, this.asset.chain);
    }

    const tx = await tronWeb.transactionBuilder.sendTrx(
      inboundAddress?.address,
      Number(this.amount),
      account.address
    );

    return tronWeb.transactionBuilder.alterTransaction(tx, {
      data: this.toMemo(),
    });
  }
}

const assetAddress = (asset: string): string => {
  const raw = asset.split("-").at(1)?.replace("0X", "0x");
  return raw ? getAddress(raw) : EVM_NATIVE;
};
