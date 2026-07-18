import type { ChainRef, RegistryContract } from "../registry/types";

/** Method selectors (first 4 bytes of keccak256 signature). */
export const SELECTORS = {
  // ERC-20
  transfer: "0xa9059cbb",
  transferFrom: "0x23b872dd",
  approve: "0x095ea7b3",
  // CCTP V2 TokenMessenger
  depositForBurn: "0x6fd3504e", // depositForBurn(uint256,uint32,bytes32,address)
  depositForBurnV2: "0x569d3489", // V2 variant w/ hook/maxFee/minFinality
  depositForBurnWithHook: "0xc6b8477e",
  // CCTP MessageTransmitter
  receiveMessage: "0x57ecfd28",
  sendMessage: "0x0ba469bc",
  // Gateway
  deposit: "0xb6b55f25", // deposit(uint256) — GatewayWallet
  gatewayMint: "0x2c4d4d18",
  withdraw: "0x2e1a7d4d",
} as const;

export type EvidenceCategory =
  | "arc_execution"
  | "asset_transfer"
  | "asset_approval"
  | "cctp_source"
  | "cctp_destination"
  | "gateway_action"
  | "stablefx_action"
  | "official_product_interaction"
  | "contract_deployment"
  | "common_evm_tooling"
  | "unclassified";

export type CrossChainLinkStatus =
  | "matched"
  | "source_only"
  | "destination_only"
  | "not_applicable";

export type EvidenceConfidence = "low" | "moderate" | "high";

export type EvidenceClassification = {
  transactionHash: string;
  chain: ChainRef;
  timestamp: string;
  blockNumber: number;
  category: EvidenceCategory;
  product?: string;
  contract?: RegistryContract;
  contractAddress?: string;
  eventName?: string;
  methodName?: string;
  asset?: "USDC" | "EURC" | "USYC" | null;
  direction?: "in" | "out" | "self" | null;
  confidence: EvidenceConfidence;
  evidenceText: string;
  sourceUrls: string[];
  crossChainLink?: {
    status: CrossChainLinkStatus;
    counterpartTxHash?: string;
    sourceDomain?: number;
    destinationDomain?: number;
    messageIdentifier?: string;
  };
};

/** Per-asset per-chain statistics required by the spec. */
export type AssetChainStats = {
  chainName: string;
  chainId?: number;
  asset: "USDC" | "EURC" | "USYC";
  transferCount: number;
  inboundCount: number;
  outboundCount: number;
  contractInteractionCount: number;
  approvalCount: number;
  uniqueCounterparties: number;
  uniqueContracts: number;
  activeDays: number;
  firstObserved: number | null;
  lastObserved: number | null;
  selfTransferEstimate: number;
};

/** Output of classifying a single chain's index. */
export type ChainClassification = {
  chain: ChainRef;
  classifications: EvidenceClassification[];
  assetStats: AssetChainStats[];
  // rollups used by scoring
  totalTxs: number;
  successfulTxs: number;
  failedTxs: number;
  activeDays: number;
  firstSeen: number | null;
  lastSeen: number | null;
  uniqueCounterparties: number;
  contractDeployments: number;
  commonToolingInteractions: number;
  cctpSourceEvents: EvidenceClassification[];
  cctpDestinationEvents: EvidenceClassification[];
  gatewayEvents: EvidenceClassification[];
  stablefxEvents: EvidenceClassification[];
  officialProductInteractions: number;
  classifiedCount: number;
  unclassifiedCount: number;
};
