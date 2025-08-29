import { Psbt } from "bitcoinjs-lib";
import { Interface, TransactionRequest } from "ethers";
import { Payment as XrpPayment } from "xrpl";
import { InsufficientAllowanceError } from "../errors";
import { Network } from "../network";
import { EncodeObject } from "../signers/cosmos/proto-signing";
import { Msg, TronTx } from "./msg";

export class MsgErc20IncreaseAllowance implements Msg {
  constructor(private error: InsufficientAllowanceError) {}
  toEncodeObject(): Promise<{ msg: EncodeObject; memo: string }> {
    throw new Error(
      "toEncodeObject not implemented for MsgErc20IncreaseAllowance."
    );
  }
  async toTransactionRequest(account: {
    network: Network;
    address: string;
  }): Promise<{ tx: TransactionRequest }> {
    const iface = new Interface([
      "function approve(address spender, uint256 addedValue) public returns (bool)",
    ]);

    const data = iface.encodeFunctionData("approve", [
      this.error.spender,
      this.error.required,
    ]);

    return {
      tx: {
        to: this.error.asset.contract,
        from: account.address,
        data,
      },
    };
  }
  toPsbt(): Promise<{
    psbt: Psbt;
    fee: bigint;
    amount: bigint;
    memo: string;
    recipient: string;
  }> {
    throw new Error("toPsbt not implemented for MsgErc20IncreaseAllowance.");
  }
  toXrpPayment(): Promise<XrpPayment> {
    throw new Error(
      "toXrpPayment not implemented for MsgErc20IncreaseAllowance."
    );
  }
  toTronTx(): Promise<TronTx> {
    throw new Error(
      "toXrpPayment not implemented for MsgErc20IncreaseAllowance."
    );
  }
}
