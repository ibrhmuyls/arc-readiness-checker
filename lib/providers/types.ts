/**
 * Provider abstraction layer.
 *
 * A ChainDataProvider knows how to fetch normalized on-chain data for a single
 * EVM chain. Concrete providers (Blockscout for Arc, Etherscan V2 for the rest)
 * implement this interface so vendors can be swapped without touching indexers
 * or classifiers.
 *
 * All providers return an IndexResult that distinguishes three states:
 *   ok=true                         -> chain indexed successfully
 *   ok=false, notAssessed=true      -> could not query (no key / RPC down)
 *   ok=false, notAssessed=false     -> hard error while querying
 *
 * "not assessed" must NEVER be interpreted as "no activity".
 */

import type { ChainRef } from "../registry/types";

export type RawTx = {
  hash: string;
  blockNumber: number;
  timeStamp: number;
  from: string;
  to: string; // "" for contract creation
  input: string;
  value: string;
  gasUsed: number;
  isError: "0" | "1";
  contractAddress?: string; // set by explorer for creations
  methodId?: string;
  functionName?: string;
};

export type RawTokenTx = {
  hash: string;
  blockNumber: number;
  timeStamp: number;
  from: string;
  to: string;
  contractAddress: string;
  tokenSymbol: string | null;
  tokenDecimal?: string | null;
  value: string;
};

export type RawLog = {
  transactionHash: string;
  blockNumber: number;
  timeStamp: number;
  address: string; // emitter
  topics: string[];
  data: string;
};

export type ChainIndex = {
  chain: ChainRef;
  txs: RawTx[];
  tokenTxs: RawTokenTx[];
  logs: RawLog[];
  /** Whether logs were successfully fetched (affects cross-chain observability). */
  logsAvailable: boolean;
};

export type IndexResult =
  | { ok: true; notAssessed: false; data: ChainIndex; latencyMs: number }
  | {
      ok: false;
      notAssessed: boolean;
      chain: ChainRef;
      reason: string;
    };

export interface ChainDataProvider {
  readonly name: string;
  readonly chain: ChainRef;
  /** Whether this provider is currently usable (has creds / endpoint up). */
  isAvailable(): boolean;
  index(address: string): Promise<IndexResult>;
}
