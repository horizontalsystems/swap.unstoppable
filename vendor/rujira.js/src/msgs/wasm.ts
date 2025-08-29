import { Psbt } from "bitcoinjs-lib";
import { TransactionRequest } from "ethers";
import { Payment as XrpPayment } from "xrpl";
import { Network } from "../network";
import { EncodeObject } from "../signers/cosmos/proto-signing";
import { Coin } from "../signers/cosmos/types/cosmos/base/v1beta1/coin";
import {
  MsgInstantiateContract,
  MsgStoreCode,
} from "../signers/cosmos/types/cosmwasm/wasm/v1/tx";
import { Msg, TronTx } from "./msg";

export class MsgStore implements Msg {
  constructor(private wasmByteCode: Uint8Array) {}
  toTransactionRequest(): Promise<{ tx: TransactionRequest }> {
    throw new Error("Method not implemented.");
  }
  toPsbt(): Promise<{
    psbt: Psbt;
    fee: bigint;
    amount: bigint;
    memo: string;
    recipient: string;
  }> {
    throw new Error("Method not implemented.");
  }

  async toEncodeObject(account: {
    address: string;
    network: Network;
  }): Promise<{ msg: EncodeObject; memo: string }> {
    if (account.network !== Network.Thorchain)
      throw new Error(`MsgStoreCode only available on Rujira`);

    return {
      msg: {
        typeUrl: MsgStoreCode.typeUrl,
        value: MsgStoreCode.fromPartial({
          sender: account.address,
          wasmByteCode: this.wasmByteCode,
        }),
      },
      memo: "",
    };
  }
  toXrpPayment(): Promise<XrpPayment> {
    throw new Error("toXrpPayment not implemented for MsgStore.");
  }
  toTronTx(): Promise<TronTx> {
    throw new Error("toXrpPayment not implemented for MsgStore.");
  }
}

const defaultEncoder = <T>(x: T) => Buffer.from(JSON.stringify(x));

export class MsgInstantiate<T> implements Msg {
  constructor(
    private codeId: bigint,
    private msg: T,
    private label: string,
    private funds?: Coin[],
    private admin?: string,

    private encoder: (v: T) => Uint8Array = defaultEncoder
  ) {}
  toTransactionRequest(): Promise<{ tx: TransactionRequest }> {
    throw new Error("Method not implemented.");
  }
  toPsbt(): Promise<{
    psbt: Psbt;
    fee: bigint;
    amount: bigint;
    memo: string;
    recipient: string;
  }> {
    throw new Error("Method not implemented.");
  }

  async toEncodeObject(account: {
    address: string;
    network: Network;
  }): Promise<{ msg: EncodeObject; memo: string }> {
    if (account.network !== Network.Thorchain)
      throw new Error(`MsgInstantiateContract only available on Rujira`);

    return {
      msg: {
        typeUrl: MsgInstantiateContract.typeUrl,
        value: MsgInstantiateContract.fromPartial({
          sender: account.address,
          codeId: this.codeId,
          msg: this.encoder(this.msg),
          funds: this.funds,
          label: this.label,
          admin: this.admin,
        }),
      },
      memo: "",
    };
  }
  toXrpPayment(): Promise<XrpPayment> {
    throw new Error("toXrpPayment not implemented for MsgInstantiate.");
  }
  toTronTx(): Promise<TronTx> {
    throw new Error("toXrpPayment not implemented for MsgInstantiate.");
  }
}
