import { Psbt } from "bitcoinjs-lib";
import { TransactionRequest } from "ethers";
import { Payment as XrpPayment } from "xrpl";
import { Network } from "../network";
import { EncodeObject } from "../signers/cosmos/proto-signing";
import { MsgTransfer } from "../signers/cosmos/types/ibc/applications/transfer/v1/tx";
import { Msg, TronTx } from "./msg";

export class MsgIbcTransfer implements Msg {
  constructor(
    private msg: Omit<
      MsgTransfer,
      "sender" | "timeoutHeight" | "timeoutTimestamp" | "sourcePort"
    >
  ) {}
  toPsbt(): Promise<{
    psbt: Psbt;
    fee: bigint;
    amount: bigint;
    memo: string;
    recipient: string;
  }> {
    throw new Error("toPsbt not implemented.");
  }

  async toEncodeObject(account: {
    network: Network;
    address: string;
  }): Promise<{ msg: EncodeObject; memo: string }> {
    const value: MsgTransfer = {
      sender: account.address,
      timeoutTimestamp: BigInt(new Date().getTime() + 5 * 60 * 1000) * 1000000n,
      sourcePort: "transfer",
      timeoutHeight: {
        revisionHeight: 0n,
        revisionNumber: 0n,
      },
      ...this.msg,
    };
    const msg = {
      typeUrl: MsgTransfer.typeUrl,
      value,
    };
    return { msg, memo: "" };
  }

  toTransactionRequest(): Promise<{ tx: TransactionRequest }> {
    throw new Error(`TransactionRequest not supported`);
  }
  toXrpPayment(): Promise<XrpPayment> {
    throw new Error("toXrpPayment not implemented for MsgIbcTransfer.");
  }
  toTronTx(): Promise<TronTx> {
    throw new Error("toXrpPayment not implemented for MsgIbcTransfer.");
  }
  toMemo(): string {
    throw new Error(`toMemo not implemented`);
  }
}
