import { Psbt } from "bitcoinjs-lib";
import { Buffer } from "buffer";
import { TransactionRequest } from "ethers";
import { Payment as XrpPayment } from "xrpl";
import { InboundAddress } from "../accounts";
import { Asset } from "../asset";
import { IncorrectNetworkError } from "../errors";
import { Network, networkLabel } from "../network";
import { EncodeObject } from "../signers/cosmos/proto-signing";
import { Coin } from "../signers/cosmos/types/cosmos/base/v1beta1/coin";
import {
  MsgExecuteContract,
  MsgMigrateContract,
} from "../signers/cosmos/types/cosmwasm/wasm/v1/tx";
import { MsgDeposit } from "./deposit";
import { Msg, TronTx } from "./msg";

const defaultEncoder = <T>(x: T) => Buffer.from(JSON.stringify(x));

export class MsgExec<T> extends MsgDeposit implements Msg {
  constructor(
    asset: Asset,
    amount: bigint,
    private contractAddress: string,
    private msg: T,
    private encoder: (v: T) => Uint8Array = defaultEncoder
  ) {
    super(asset, amount);
  }

  async toEncodeObject(
    account: { address: string; network: Network },
    inboundAddress?: InboundAddress
  ): Promise<{ msg: EncodeObject; memo: string }> {
    if (account.network === Network.Thorchain) {
      const denom = this.asset?.variants?.native?.denom;
      if (!denom)
        throw new Error(`Native denom for ${this.asset.asset} not provided`);

      return {
        msg: {
          typeUrl: MsgExecuteContract.typeUrl,
          value: {
            sender: account.address,
            contract: this.contractAddress,
            msg: this.encoder(this.msg),
            funds:
              this.amount === 0n
                ? []
                : [{ denom, amount: this.amount.toString() }],
          },
        },
        memo: "",
      };
    }

    return super.toEncodeObject(account, inboundAddress);
  }

  toMemo(): string {
    if (
      ![Network.Bitcoin, Network.Gaia, Network.Thorchain].includes(
        this.asset.chain
      )
    ) {
      throw new Error(
        `Exec memo support coming soon for ${networkLabel(this.asset.chain)}`
      );
    }

    const parts = [
      `x`,
      this.contractAddress,
      Buffer.from(this.encoder(this.msg)).toString("base64"),
    ];
    return parts.join(":");
  }
}

export class MsgExecute<T> implements Msg {
  constructor(
    private coins: Coin[],
    private contractAddress: string,
    private msg: T,
    private encoder: (v: T) => Uint8Array = defaultEncoder
  ) {}
  toTransactionRequest(account: {
    network: Network;
  }): Promise<{ tx: TransactionRequest }> {
    if (account.network !== Network.Thorchain)
      throw new IncorrectNetworkError(account.network, Network.Thorchain);

    throw new Error("toTransactionRequest not supported");
  }
  toPsbt(account: { network: Network }): Promise<{
    psbt: Psbt;
    fee: bigint;
    amount: bigint;
    memo: string;
    recipient: string;
  }> {
    if (account.network !== Network.Thorchain)
      throw new IncorrectNetworkError(account.network, Network.Thorchain);

    throw new Error("toPsbt not supported");
  }

  async toEncodeObject(account: {
    address: string;
    network: Network;
  }): Promise<{ msg: EncodeObject; memo: string }> {
    if (account.network !== Network.Thorchain)
      throw new IncorrectNetworkError(account.network, Network.Thorchain);

    const funds = this.coins
      .sort((a, b) => a.denom.localeCompare(b.denom))
      .filter((x) => x.amount !== "0");

    return {
      msg: {
        typeUrl: MsgExecuteContract.typeUrl,
        value: {
          sender: account.address,
          contract: this.contractAddress,
          msg: this.encoder(this.msg),
          funds,
        },
      },
      memo: "",
    };
  }
  toXrpPayment(): Promise<XrpPayment> {
    throw new Error("toXrpPayment not implemented for MsgExecute.");
  }
  toTronTx(): Promise<TronTx> {
    throw new Error("toXrpPayment not implemented for MsgExecute.");
  }
  toMemo(): string {
    throw new Error("toMemo not supported");
  }
}

export class MsgMigrate<T> implements Msg {
  constructor(
    private coins: Coin[],
    private contractAddress: string,
    private msg: T,
    private codeId: bigint,
    private encoder: (v: T) => Uint8Array = defaultEncoder
  ) {}
  toTransactionRequest(): Promise<{ tx: TransactionRequest }> {
    throw new Error("toTransactionRequest not supported");
  }
  toPsbt(): Promise<{
    psbt: Psbt;
    fee: bigint;
    amount: bigint;
    memo: string;
    recipient: string;
  }> {
    throw new Error("toPsbt not supported");
  }

  async toEncodeObject(account: {
    address: string;
    network: Network;
  }): Promise<{ msg: EncodeObject; memo: string }> {
    if (account.network !== Network.Thorchain)
      throw new IncorrectNetworkError(account.network, Network.Thorchain);

    return {
      msg: {
        typeUrl: MsgMigrateContract.typeUrl,
        value: {
          sender: account.address,
          contract: this.contractAddress,
          msg: this.encoder(this.msg),
          funds: this.coins,
          codeId: this.codeId,
        },
      },
      memo: "",
    };
  }
  toXrpPayment(): Promise<XrpPayment> {
    throw new Error("toXrpPayment not implemented for MsgMigrate.");
  }
  toTronTx(): Promise<TronTx> {
    throw new Error("toXrpPayment not implemented for MsgMigrate.");
  }
  toMemo(): string {
    throw new Error("toMemo not supported");
  }
}
