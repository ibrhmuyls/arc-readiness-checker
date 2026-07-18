/**
 * Profile classification + report assembly. Produces one evidence-aware primary
 * profile plus factual tags, never exceeding the evidence.
 */

import type { ChainClassification } from "../classifiers/types";
import type { CrossChainReport } from "../crosschain/match";
import type { ScoringOutput } from "../scoring/score";
import { ARC_CHAIN_ID } from "../registry/chains";
import { OFFICIAL_SOURCES, REGISTRY } from "../registry/registry";
import type {
  EcosystemNode,
  EcosystemNodeState,
  FootprintReport,
  NetworkStatus,
  PrimaryProfile,
} from "./types";

export type BuildReportInput = {
  address: string;
  chainResults: ChainClassification[];
  notAssessed: { chainName: string; chainId?: number; reason: string; explorerBase?: string }[];
  crossChain: CrossChainReport;
  scoring: ScoringOutput;
  eligibleChainCount: number;
};

const NOT_PROVABLE_PRODUCTS = [
  "Circle Wallets APIs (developer-controlled & user-controlled)",
  "Circle Payments Network",
  "Circle Mint / off-chain payment APIs",
  "Circle Compliance Engine",
  "Circle account services & identity systems",
];

function deriveProfile(
  input: BuildReportInput,
): { profile: PrimaryProfile; tags: string[]; level: 0 | 1 | 2 | 3; levelLabel: string } {
  const { chainResults, crossChain, scoring } = input;
  const tags: string[] = [];

  const arc = chainResults.find((c) => c.chain.chainId === ARC_CHAIN_ID);
  const hasAnyIndexed = chainResults.length > 0;
  const anyActivity = chainResults.some(
    (c) => c.totalTxs > 0 || c.assetStats.length > 0,
  );

  const usdcChains = chainResults.filter((c) =>
    c.assetStats.some((s) => s.asset === "USDC" && s.transferCount > 0),
  );
  const multiNetworkUsdc = usdcChains.length >= 2;
  const hasArcAsset = arc?.assetStats.some((s) => s.transferCount > 0) ?? false;
  const arcDeploy = (arc?.contractDeployments ?? 0) > 0;
  const arcProduct =
    (arc?.officialProductInteractions ?? 0) > 0 ||
    (arc?.stablefxEvents.length ?? 0) > 0;

  // ---- cross-chain level ----
  let level: 0 | 1 | 2 | 3 = 0;
  let levelLabel = "No cross-network evidence";
  if (crossChain.hasVerifiedCctp || crossChain.hasVerifiedGateway) {
    level = 3;
    levelLabel = "Verified Circle cross-chain protocol activity";
  } else if (multiNetworkUsdc) {
    level = 2;
    levelLabel = "Multi-network USDC activity observed";
  } else if (scoring.sameAddressNetworks.length >= 2) {
    level = 1;
    levelLabel = "Same-address activity observed across supported EVM networks";
  }

  // ---- tags (factual only) ----
  if (arc && (arc.totalTxs > 0 || hasArcAsset)) tags.push("Arc activity observed");
  if (hasArcAsset) tags.push("USDC transfer activity observed");
  if (scoring.sameAddressNetworks.length >= 2) {
    tags.push(
      `Same-address activity observed across ${scoring.sameAddressNetworks.length} supported networks`,
    );
  }
  if (arcDeploy) tags.push("Contract deployment observed");
  if ((arc?.commonToolingInteractions ?? 0) > 0)
    tags.push("Common EVM tooling interaction observed");
  crossChain.matches
    .filter((m) => m.status === "matched" && m.product === "CCTP")
    .forEach((m) =>
      tags.push(`${m.sourceChain} \u2192 ${m.destinationChain} verified CCTP flow`),
    );
  if (crossChain.hasVerifiedGateway) tags.push("Verified Gateway activity observed");

  // ---- primary profile (most specific supported by evidence) ----
  let profile: PrimaryProfile;
  if (!hasAnyIndexed) {
    profile = "Not Assessed";
  } else if (!anyActivity) {
    profile = "No Verified Circle Footprint Yet";
  } else if (
    crossChain.hasCompleteCctpFlow ||
    (crossChain.hasVerifiedCctp && scoring.globalScore >= 60)
  ) {
    // sustained multi-product?
    const products = new Set(
      chainResults.flatMap((c) =>
        c.classifications.map((x) => x.product).filter(Boolean),
      ),
    );
    if (
      scoring.totalActiveDays >= 14 &&
      products.size >= 3 &&
      (crossChain.hasCompleteCctpFlow && crossChain.hasVerifiedGateway)
    ) {
      profile = "Sustained Verified Circle Ecosystem Activity";
    } else if (products.size >= 2 && crossChain.hasVerifiedGateway) {
      profile = "Multi-Product Circle Ecosystem User";
    } else {
      profile = "Verified CCTP User";
    }
  } else if (crossChain.hasVerifiedCctp) {
    profile = "Verified CCTP User";
  } else if (crossChain.hasVerifiedGateway) {
    profile = "Verified Gateway User";
  } else if (arcProduct) {
    profile = "Arc Application User";
  } else if (arcDeploy) {
    profile = "Arc Ecosystem Explorer";
  } else if (multiNetworkUsdc) {
    profile = "Early Multi-Network USDC Activity";
  } else if (usdcChains.length === 1 && (usdcChains[0].assetStats.reduce((a, s) => a + s.transferCount, 0) >= 6) && scoring.totalActiveDays >= 3) {
    profile = "Recurring USDC Activity";
  } else if (hasArcAsset || usdcChains.length > 0) {
    profile = "Limited Circle Asset Activity";
  } else {
    profile = "No Verified Circle Footprint Yet";
  }

  return { profile, tags: [...new Set(tags)], level, levelLabel };
}

function buildEcosystemMap(
  chainResults: ChainClassification[],
  crossChain: CrossChainReport,
  anyIndexed: boolean,
): EcosystemNode[] {
  const arc = chainResults.find((c) => c.chain.chainId === ARC_CHAIN_ID);
  const usdcActivity = chainResults.some((c) =>
    c.assetStats.some((s) => s.asset === "USDC" && s.transferCount > 0),
  );
  const eurcActivity = chainResults.some((c) =>
    c.assetStats.some((s) => s.asset === "EURC" && s.transferCount > 0),
  );
  const usycActivity = chainResults.some((c) =>
    c.assetStats.some((s) => s.asset === "USYC" && s.transferCount > 0),
  );

  const node = (
    product: string,
    state: EcosystemNodeState,
    detail: string,
  ): EcosystemNode => ({ product, state, detail });

  const na = (): EcosystemNodeState => (anyIndexed ? "no_verified_evidence" : "not_assessed");

  // Arc node: distinguish gas execution from adoption.
  let arcState: EcosystemNodeState = na();
  let arcDetail = anyIndexed ? "No verified Arc evidence observed." : "Arc not assessed.";
  if (arc) {
    if (arc.officialProductInteractions > 0 || arc.stablefxEvents.length > 0) {
      arcState = "verified_protocol_interaction";
      arcDetail = "Verified Arc product interaction observed.";
    } else if (arc.assetStats.some((s) => s.transferCount > 0)) {
      arcState = "verified_asset_activity";
      arcDetail = "Arc stablecoin transfer activity observed.";
    } else if (arc.successfulTxs > 0) {
      arcState = "arc_gas_execution";
      arcDetail = "Arc execution observed; USDC used as native gas.";
    }
  }

  return [
    node("Arc", arcState, arcDetail),
    node(
      "USDC",
      usdcActivity ? "verified_asset_activity" : na(),
      usdcActivity ? "Verified USDC transfer activity observed." : arcDetail && anyIndexed ? "No verified USDC evidence observed." : "USDC not assessed.",
    ),
    node(
      "EURC",
      eurcActivity ? "verified_asset_activity" : na(),
      eurcActivity ? "Verified EURC activity observed." : anyIndexed ? "No verified EURC evidence observed." : "EURC not assessed.",
    ),
    node(
      "USYC",
      usycActivity ? "verified_asset_activity" : na(),
      usycActivity ? "Verified USYC activity observed." : anyIndexed ? "No verified USYC evidence observed." : "USYC not assessed.",
    ),
    node(
      "CCTP",
      crossChain.hasVerifiedCctp ? "verified_protocol_interaction" : na(),
      crossChain.hasVerifiedCctp
        ? `${crossChain.cctpSourceCount} source + ${crossChain.cctpDestinationCount} destination CCTP event(s).`
        : anyIndexed ? "No verified CCTP evidence observed." : "CCTP not assessed.",
    ),
    node(
      "Gateway",
      crossChain.hasVerifiedGateway ? "verified_protocol_interaction" : na(),
      crossChain.hasVerifiedGateway
        ? `${crossChain.gatewayActionCount} verified Gateway action(s).`
        : anyIndexed ? "No verified Gateway evidence observed." : "Gateway not assessed.",
    ),
    node(
      "StableFX",
      chainResults.some((c) => c.stablefxEvents.length > 0)
        ? "verified_protocol_interaction"
        : na(),
      chainResults.some((c) => c.stablefxEvents.length > 0)
        ? "Verified StableFX interaction observed."
        : anyIndexed ? "No verified StableFX evidence observed." : "StableFX not assessed.",
    ),
    node(
      "Circle Wallets / Payments APIs",
      "cannot_infer",
      "Cannot be determined from public wallet data alone.",
    ),
  ];
}

export function buildReport(input: BuildReportInput): FootprintReport {
  const { address, chainResults, notAssessed, crossChain, scoring } = input;
  const { profile, tags, level, levelLabel } = deriveProfile(input);
  const anyIndexed = chainResults.length > 0;

  const networks: NetworkStatus[] = [
    ...chainResults.map((c) => ({
      chainName: c.chain.name,
      chainId: c.chain.chainId,
      status: "indexed" as const,
      txCount: c.totalTxs,
      activeDays: c.activeDays,
      hasCircleAsset: c.assetStats.some((s) => s.transferCount > 0),
      hasProductInteraction:
        c.officialProductInteractions > 0 ||
        c.cctpSourceEvents.length > 0 ||
        c.gatewayEvents.length > 0,
      explorerBase: c.chain.explorerBase,
    })),
    ...notAssessed.map((n) => ({
      chainName: n.chainName,
      chainId: n.chainId,
      status: "not_assessed" as const,
      reason: n.reason,
      txCount: 0,
      activeDays: 0,
      hasCircleAsset: false,
      hasProductInteraction: false,
      explorerBase: n.explorerBase,
    })),
  ];

  // Arc footprint value/label
  let arcValue: number | null = scoring.arcScore;
  let arcLabel = scoring.arcLabel;
  const arcIndexed = chainResults.some((c) => c.chain.chainId === ARC_CHAIN_ID);
  const arcNotAssessed = notAssessed.some((n) => n.chainId === ARC_CHAIN_ID);
  if (!arcIndexed) {
    arcValue = null;
    arcLabel = arcNotAssessed
      ? "Not assessed (Arc could not be indexed)"
      : "No verified Arc footprint observed";
  }

  const timeline = chainResults
    .flatMap((c) => c.classifications)
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

  const limitations = [
    "Testnet token values may not represent economic activity or value.",
    "Some RPC/indexers do not expose full historical traces or logs.",
    "Cross-chain completion can be unavailable if destination indexing is incomplete.",
    "Some Circle products are off-chain and cannot be proven from public onchain data.",
    "Public address reuse alone does not establish common ownership or identity.",
  ];
  if (scoring.confidence === "Low") {
    limitations.unshift(
      "Confidence is Low: limited history, few events, or single-network coverage.",
    );
  }
  notAssessed.forEach((n) =>
    limitations.push(`${n.chainName}: Not assessed (${n.reason}).`),
  );

  return {
    address,
    registryVersion: REGISTRY.version,
    circleEcosystemActivityScore: scoring.globalScore,
    arcFootprint: { value: arcValue, label: arcLabel },
    evidenceCoverage: { score: scoring.coverageScore, band: scoring.coverageBand },
    confidence: scoring.confidence,
    primaryProfile: profile,
    tags,
    globalSubscores: scoring.globalSubscores,
    arcSubscores: scoring.arcSubscores,
    coverageSubscores: scoring.coverageSubscores,
    networks,
    indexedNetworkCount: chainResults.length,
    sameAddressNetworks: scoring.sameAddressNetworks,
    multiNetworkUsdc: scoring.multiNetworkUsdc,
    crossChainMatches: crossChain.matches,
    crossChainLevel: level,
    crossChainLevelLabel: levelLabel,
    timeline,
    ecosystemMap: buildEcosystemMap(chainResults, crossChain, anyIndexed),
    totalRelevantTxs: scoring.totalRelevantTxs,
    totalActiveDays: scoring.totalActiveDays,
    officialAttributionRatio: scoring.officialAttributionRatio,
    officialSources: OFFICIAL_SOURCES,
    limitations,
    notProvableProducts: NOT_PROVABLE_PRODUCTS,
    lastUpdated: Date.now(),
    caps: scoring.caps,
  };
}
