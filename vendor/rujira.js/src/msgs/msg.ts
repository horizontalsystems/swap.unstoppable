import { Psbt } from "bitcoinjs-lib";
import { TransactionRequest } from "ethers";
import { TronWeb, Trx } from "tronweb";
import { Payment as XrpPayment } from "xrpl";
import { InboundAddress } from "../accounts";
import { Network } from "../network";
import { EncodeObject } from "../signers/cosmos/proto-signing";
import { Utxo } from "../signers/utxo";

export interface ERC20Allowance {
  amount: bigint;
  asset: {
    contract: string;
    decimals: number;
    symbol: string;
  };
}

export interface UtxoTx {
  recipient: string;
  value: bigint;
  fee: bigint;
  memo: string;
}

export type TronTx = Exclude<Parameters<Trx["sign"]>[0], string>;

/**
 * A generic representation of a message type
 * This can either be encoded as a L1 with a memo, base layer with a MsgDeposit, or app layer with MsgExecuteContract
 */
export interface Msg {
  /**
   * Called from Cosmos signers for cosmos compatible networks.
   * For MsgSwap, MsgBond, etc, this will construct a MsgDeposit tx with the correct memo and funds
   * For MsgExecuteContract and app-layer interactions, this will construct a native MsgExecuteContract with the correct memo and funds
   * If this is called for any network except `Network.Thorchain`, the function should error
   * @param account
   * @param inboundAddress
   */
  toEncodeObject(
    account: {
      address: string;
      network: Network;
    },
    inboundAddress?: InboundAddress
  ): Promise<{ msg: EncodeObject; memo: string }>;

  /**
   * Called from EVM signers
   * @param account
   * @param inboundAddress
   */
  toTransactionRequest(
    account: {
      network: Network;
      address: string;
    },
    inboundAddress?: InboundAddress
  ): Promise<{ tx: TransactionRequest; erc20?: ERC20Allowance }>;

  /**
   * Called from UTXO signers.
   * @param account
   * @param inboundAddress
   */
  toPsbt(
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
  }>;

  /**
   * Called from XRP signers
   * @param account
   * @param inboundAddress
   */
  toXrpPayment(
    account: {
      network: Network;
      address: string;
    },
    inboundAddress?: InboundAddress
  ): Promise<XrpPayment>;

  /**
   * Called from TRON signers
   * @param account
   * @param inboundAddress
   */
  toTronTx(
    tronWeb: TronWeb,
    account: {
      network: Network;
      address: string;
    },
    inboundAddress?: InboundAddress
  ): Promise<TronTx>;

  toDeposit?(): { amount: bigint; symbol: string };
}
