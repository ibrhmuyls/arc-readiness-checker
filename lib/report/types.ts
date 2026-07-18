import type { EvidenceClassification } from "../classifiers/types";
import type { CrossChainMatch } from "../crosschain/match";
import type { OfficialSource } from "../registry/types";

export type ConfidenceLevel = "Low" | "Moderate" | "High";

export type CoverageBand = "Limited" | "Partial" | "Broad" | "Extensive";

export type PrimaryProfile =
  | "No Verified Circle Footprint Yet"
  | "Limited Circle Asset Activity"
  | "Early Multi-Network USDC Activity"
  | "Recurring USDC Activity"
  | "Verified CCTP User"
  | "Verified Gateway User"
  | "Arc Ecosystem Explorer"
  | "Arc Application User"
  | "Multi-Product Circle Ecosystem User"
  | "Sustained Verified Circle Ecosystem Activity"
  | "Not Assessed";

export type SubScore = {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  summary: string;
  evidence: string[];
  capApplied?: string;
};

export type NetworkStatus = {
  chainName: string;
  chainId?: number;
  status: "indexed" | "not_assessed";
  reason?: string;
  txCount: number;
  activeDays: number;
  hasCircleAsset: boolean;
  hasProductInteraction: boolean;
  explorerBase?: string;
};

export type EcosystemNodeState =
  | "verified_protocol_interaction"
  | "verified_asset_activity"
  | "same_address_presence"
  | "arc_gas_execution"
  | "no_verified_evidence"
  | "not_assessed"
  | "cannot_infer";

export type EcosystemNode = {
  product: string;
  state: EcosystemNodeState;
  detail: string;
};

export type FootprintReport = {
  address: string;
  registryVersion: string;

  // Four top-level outputs
  circleEcosystemActivityScore: number; // 0-100
  arcFootprint: { value: number | null; label: string }; // null => "No verified Arc footprint observed"
  evidenceCoverage: { score: number; band: CoverageBand };
  confidence: ConfidenceLevel;

  primaryProfile: PrimaryProfile;
  tags: string[];

  // breakdowns
  globalSubscores: SubScore[];
  arcSubscores: SubScore[];
  coverageSubscores: SubScore[];

  // multichain
  networks: NetworkStatus[];
  indexedNetworkCount: number;
  sameAddressNetworks: string[];
  multiNetworkUsdc: boolean;

  // cross-chain
  crossChainMatches: CrossChainMatch[];
  crossChainLevel: 1 | 2 | 3 | 0;
  crossChainLevelLabel: string;

  // evidence
  timeline: EvidenceClassification[];
  ecosystemMap: EcosystemNode[];

  // rollups
  totalRelevantTxs: number;
  totalActiveDays: number;
  officialAttributionRatio: number; // 0-1

  // meta
  officialSources: OfficialSource[];
  limitations: string[];
  notProvableProducts: string[];
  lastUpdated: number;
  caps: string[];
};
