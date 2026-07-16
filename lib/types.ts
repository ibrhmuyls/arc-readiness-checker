// Core domain types for the ARC Readiness Checker.
// Every source/score/UI boundary uses these types.

export type Address = `0x${string}`;

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
  bridge: Address[];
  builder: Address[]; // includes defi + developer primitives
};

export type CategoryScore = {
  id: string;
  label: string;
  description: string;
  points: number;
  maxPoints: number;
  status: "scored" | "insufficient-data" | "disabled";
  reasoning: string;
  source: string;
  limitations: string;
};

export type WalletSummary = {
  firstSeenBlock: number | null;
  firstSeenTime: number | null;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  stablecoinTransfers: number;
  usdcTransfers: number;
  eurcTransfers: number;
  usycTransfers: number;
  bridgeInteractions: number;
  developerToolInteractions: number;
  contractDeployments: number;
  nativeBalanceUsdc: string | null;
  isContract: boolean | null;
};

export type DataSourceRef = {
  name: string;
  url: string;
  usedFor: string;
};

export type ReadinessReport = {
  address: Address;
  network: "Arc Testnet";
  overallScore: number; // 0..100
  dataCompleteness: "full" | "partial" | "unavailable";
  categories: CategoryScore[];
  profile: ArcProfile;
  summary: WalletSummary;
  recommendations: string[];
  methodology: string;
  dataSources: DataSourceRef[];
  limitations: string[];
  generatedAt: number;
};

export type ArcProfile =
  | "Stablecoin Native User"
  | "Settlement Focused"
  | "Cross-chain Ready"
  | "Financial User"
  | "Builder"
  | "Infrastructure User"
  | "Payment User"
  | "Low Activity"
  | "New Participant"
  | "Institutional-like";

export class AddressValidationError extends Error {}
