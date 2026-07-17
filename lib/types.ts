export type Address = `0x${string}`;

export type SourceResult<T> =
  | { ok: true; data: T; latencyMs: number; error?: string; degraded?: boolean }
  | { ok: false; degraded: boolean; error: string; latencyMs?: number };

export type RawTx = {
  hash: string;
  blockNumber: number;
  timeStamp: number;
  from: string;
  to: string | "";
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
  txs: RawTx[];
  tokenTxs: RawTokenTx[];
  explorerLegacy: SourceResult<{ txs: RawTx[]; tokenTxs: RawTokenTx[] }>;
  explorerV2: SourceResult<unknown>;
  rpc: SourceResult<unknown>;
  sources: {
    explorerLegacy: SourceResult<unknown>;
    explorerV2: SourceResult<unknown>;
    rpc: SourceResult<unknown>;
  };
  fetchedAt: number;
};

export type ProductModule =
  | "arc"
  | "usdc"
  | "eurc"
  | "usyc"
  | "cctp"
  | "gateway"
  | "stablefx"
  | "developer-tools"
  | "circle-wallets"
  | "circle-contracts"
  | "circle-payments-network"
  | "unknown";

export type EventClass =
  | "transfer"
  | "approval"
  | "memo"
  | "multicall"
  | "bridge-burn"
  | "bridge-mint"
  | "bridge-message"
  | "gateway-deposit"
  | "gateway-withdraw"
  | "stablefx-escrow"
  | "deployment"
  | "permit2-approval"
  | "unknown";

export type TransactionEvidence = {
  hash: string;
  timestamp: number;
  eventType: EventClass;
  productModules: ProductModule[];
  asset: string | null;
  direction: "inbound" | "outbound" | "self" | "unknown";
  counterparty: string | null;
  confidence: "high" | "medium" | "low";
  sourceUrl: string;
  explorerUrl: string;
  evidenceText: string;
};

export type WalletSummary = {
  firstSeenTime: number | null;
  lastSeenTime: number | null;
  activeDays: number;
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
  uniqueCounterparties: number;
  inboundTransfers: number;
  outboundTransfers: number;
};

export type CategoryScore = {
  id: string;
  label: string;
  description: string;
  score: number;
  maxScore: 100;
  status: "scored" | "insufficient-data" | "not-assessed" | "disabled";
  summary: string;
  evidence: string[];
  notObserved: string[];
  source: string;
  limitations: string;
  weight?: number;
  formula?: string;
};

export type ConfidenceLevel = "Low" | "Moderate" | "High";

export type FootprintProfile =
  | "No Verified Arc Footprint Yet"
  | "Limited Arc Explorer"
  | "Early Stablecoin Explorer"
  | "Recurring USDC User"
  | "Arc Application User"
  | "Circle Cross-Chain User"
  | "Arc Contract Deployer"
  | "Multi-Product Circle User"
  | "Sustained Arc Ecosystem Participant"
  | "Institutional-like Participant"
  | "Stablecoin Native"
  | "Settlement Focused"
  | "Emerging Circle User"
  | "Cross-chain Stablecoin User"
  | "Arc Developer"
  | "Early Ecosystem Participant"
  | "Low Observable Activity"
  | "Financial Infrastructure User";

export type ReadinessReport = CircleFootprintReport;

export type ArcProfile = FootprintProfile;

export type EvidenceCoverageBreakdownItem = {
  label: string;
  value: number;
};

export type CircleFootprintReport = {
  address: Address;
  network: string;
  scoreLabel: string;
  scoreValue: number;
  confidenceLabel: string;
  confidenceValue: number;
  confidenceLevel: ConfidenceLevel;
  primaryProfile: FootprintProfile;
  secondaryTags: string[];
  categories: CategoryScore[];
  evidenceTimeline: TransactionEvidence[];
  summary: WalletSummary;
  methodology: string;
  registrySources: string[];
  limitations: string[];
  lastUpdated: number;
};
