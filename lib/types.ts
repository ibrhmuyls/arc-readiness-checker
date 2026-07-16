// Core domain types for the ARC Readiness Checker.
// Everything downstream (sources -> scoring -> UI) is typed against these.

export type Address = `0x${string}`;

/** Result wrapper so a failing source never throws to the route. */
export type SourceResult<T> =
  | { ok: true; data: T; latencyMs: number }
  | { ok: false; error: string; degraded: boolean };

export type RawTx = {
  hash: string;
  blockNumber: number;
  timeStamp: number; // unix seconds
  from: string;
  to: string | null;
  input: string;
  gasUsed: number;
  isError: "0" | "1";
};

export type RawTokenTx = {
  hash: string;
  blockNumber: number;
  timeStamp: number;
  from: string;
  to: string;
  contractAddress: string;
  tokenSymbol: string | null;
  value: string;
};

export type RawFacts = {
  address: Address;
  fetchedAt: number;
  sources: {
    rpc: SourceResult<{ balanceWei: string; txCount: number; chainId: string }>;
    explorerLegacy: SourceResult<{ txs: RawTx[]; tokenTxs: RawTokenTx[] }>;
    explorerV2: SourceResult<{ txCount: number; tokenTransferCount: number }>;
  };
  contractRefs: ContractRefs;
};

export type ContractRefs = {
  stablecoins: Address[];
  bridge: Address[]; // CCTP + Gateway
  defi: Address[]; // Multicall3, Permit2, StableFX, Memo
};

export type CategoryScore = {
  id: string;
  label: string;
  points: number;
  maxPoints: number;
  status: "scored" | "insufficient-data" | "disabled";
  reasoning: string;
};

export type WalletSummary = {
  firstSeenBlock: number | null;
  firstSeenTime: number | null;
  totalTransactions: number;
  stablecoinTransfers: number;
  bridgeInteractions: number;
  contractInteractions: number;
  nativeBalanceUsdc: string | null;
  isContract: boolean | null;
};

export type DataSourceRef = {
  name: string;
  url: string;
};

export type ReadinessReport = {
  address: Address;
  network: "Arc Testnet";
  overallScore: number; // 0..100
  dataCompleteness: "full" | "partial" | "unavailable";
  categories: CategoryScore[];
  summary: WalletSummary;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  methodology: string;
  dataSources: DataSourceRef[];
  generatedAt: number;
};

export class AddressValidationError extends Error {}
