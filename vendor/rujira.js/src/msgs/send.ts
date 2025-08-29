import { Psbt } from "bitcoinjs-lib";
import { Buffer } from "buffer";
import { getAddress, Interface, TransactionRequest } from "ethers";
import { TronWeb } from "tronweb";
import { Payment as XrpPayment } from "xrpl";
import { InboundAddress } from "../accounts";
import { Asset } from "../asset";
import { IncorrectNetworkError } from "../errors";
import { Network } from "../network";
import { EncodeObject } from "../signers/cosmos/proto-signing";
import { MsgSend as CosmosMsgSend } from "../signers/cosmos/types/cosmos/bank/v1beta1/tx";
import { PsbtFactory, Utxo } from "../signers/utxo";
import { ERC20Allowance, Msg, TronTx } from "./msg";

const EVM_NATIVE = "0x0000000000000000000000000000000000000000";

/**
 * MsgSend abstracts layer 1 sends & direct MsgSend on THORChain
 */
export class MsgSend implements Msg {
  constructor(
    protected asset: Asset,
    protected amount: bigint,
    protected recipient: string,
    protected memo: string = ""
  ) {}

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
    this.checkNetwork(account.network);

    const fac = new PsbtFactory();
    if (!inboundAddress)
      throw new Error(`Inbound Address required for ${account.network}`);
    const base = await fac.buildPbst(
      account,
      utxos,
      this.amount,
      this.recipient,
      inboundAddress.gasRate,
      this.toMemo()
    );

    return {
      ...base,
      amount: this.amount,
      memo: this.toMemo(),
      recipient: this.recipient,
    };
  }

  async toEncodeObject(account: {
    network: Network;
    address: string;
  }): Promise<{ msg: EncodeObject; memo: string }> {
    this.checkNetwork(account.network);

    return {
      msg: {
        typeUrl: CosmosMsgSend.typeUrl,
        value: {
          fromAddress: account.address,
          amount: [
            {
              denom: this.asset.variants?.native?.denom,
              amount: this.amount.toString(),
            },
          ],
          toAddress: this.recipient,
        },
      },
      memo: this.toMemo(),
    };
  }

  async toTransactionRequest(account: {
    network: Network;
    address: string;
  }): Promise<{ tx: TransactionRequest; erc20?: ERC20Allowance }> {
    this.checkNetwork(account.network);

    const asset = assetAddress(this.asset.asset);
    if (asset === EVM_NATIVE) {
      return {
        tx: {
          to: this.recipient,
          value: this.amount,
        },
      };
    }

    const iface = new Interface([
      "function transfer(address to, uint256 value) public returns (bool)",
    ]);

    const data = iface.encodeFunctionData("transfer", [
      this.recipient,
      this.amount,
    ]);

    return {
      tx: {
        to: assetAddress(this.asset.asset),
        data,
      },
    };
  }

  async toXrpPayment(
    account: { network: Network; address: string },
    inboundAddress?: InboundAddress
  ): Promise<XrpPayment> {
    const MemoData = this.toMemo()
      ? Buffer.from(this.toMemo(), "utf8").toString("hex")
      : undefined;
    return {
      TransactionType: "Payment",
      Account: account.address,
      Destination: this.recipient,
      Amount: this.amount.toString(),
      Fee: ((inboundAddress?.gasRate || 0n) / 100n).toString(),
      Memos: MemoData ? [{ Memo: { MemoData } }] : [],
    };
  }

  async toTronTx(
    tronWeb: TronWeb,
    account: { network: Network; address: string }
  ): Promise<TronTx> {
    this.checkNetwork(account.network);

    return tronWeb.transactionBuilder.sendTrx(
      this.recipient,
      Number(this.amount),
      account.address
    );
  }

  toMemo(): string {
    return this.memo;
  }

  checkNetwork(network: Network) {
    if (this.asset.type === "SECURED" && network === Network.Thorchain) return;
    if (this.asset.chain !== network) {
      throw new IncorrectNetworkError(network, this.asset.chain);
    }
  }
}

const assetAddress = (asset: string): string => {
  const raw = asset.split("-").at(1)?.replace("0X", "0x");
  return raw ? getAddress(raw) : EVM_NATIVE;
};
