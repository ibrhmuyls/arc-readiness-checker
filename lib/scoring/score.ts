/**
 * Scoring engine — evidence-first, conservative, cap-enforced.
 *
 * Produces four INDEPENDENT top-level outputs:
 *   1. Circle Ecosystem Activity Score (0-100, global)
 *   2. Arc Footprint Score (0-100, Arc-only, or null label)
 *   3. Evidence Coverage (0-100 + band)
 *   4. Confidence (Low / Moderate / High) — computed independently
 *
 * All hard caps from the product spec are enforced explicitly and every applied
 * cap is recorded so the UI/report can show it.
 */

import type { ChainClassification } from "../classifiers/types";
import type { CrossChainReport } from "../crosschain/match";
import { ARC_CHAIN_ID } from "../registry/chains";
import type {
  ConfidenceLevel,
  CoverageBand,
  SubScore,
} from "../report/types";

export type ScoringInput = {
  chainResults: ChainClassification[]; // successfully indexed only
  notAssessedCount: number; // chains that couldn't be queried
  eligibleChainCount: number; // total officially supported chains considered
  crossChain: CrossChainReport;
};

export type ScoringOutput = {
  globalScore: number;
  globalSubscores: SubScore[];
  arcScore: number | null;
  arcLabel: string;
  arcSubscores: SubScore[];
  coverageScore: number;
  coverageBand: CoverageBand;
  coverageSubscores: SubScore[];
  confidence: ConfidenceLevel;
  caps: string[];
  totalRelevantTxs: number;
  totalActiveDays: number;
  officialAttributionRatio: number;
  multiNetworkUsdc: boolean;
  sameAddressNetworks: string[];
};

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

function sum(ns: number[]): number {
  return ns.reduce((a, b) => a + b, 0);
}

/** Union of active-day date strings across all chains. */
function totalActiveDays(chainResults: ChainClassification[]): number {
  // activeDays per chain are counts, not sets; approximate union by max + spread.
  // To stay deterministic we take the max single-chain active days and add
  // distinct extra days from other chains conservatively (0.5 weight rounded).
  if (chainResults.length === 0) return 0;
  const perChain = chainResults.map((c) => c.activeDays);
  const maxDays = Math.max(...perChain);
  const others = sum(perChain) - maxDays;
  return Math.round(maxDays + others * 0.5);
}

export function computeScores(input: ScoringInput): ScoringOutput {
  const { chainResults, crossChain } = input;
  const caps: string[] = [];

  // ---- rollups ----
  const relevantClassifications = chainResults.flatMap((c) =>
    c.classifications.filter((x) => x.category !== "unclassified"),
  );
  const totalRelevantTxsRaw = sum(chainResults.map((c) => c.totalTxs));
  const totalRelevantTxs = relevantClassifications.length;
  const activeDays = totalActiveDays(chainResults);

  const totalClassified = sum(chainResults.map((c) => c.classifiedCount));
  const totalAll = sum(
    chainResults.map((c) => c.classifiedCount + c.unclassifiedCount),
  );
  const officialAttributionRatio = totalAll > 0 ? totalClassified / totalAll : 0;

  // asset activity
  const usdcChains = chainResults.filter((c) =>
    c.assetStats.some((s) => s.asset === "USDC" && s.transferCount > 0),
  );
  const eurcChains = chainResults.filter((c) =>
    c.assetStats.some((s) => s.asset === "EURC" && s.transferCount > 0),
  );
  const multiNetworkUsdc = usdcChains.length >= 2;
  const sameAddressNetworks = chainResults
    .filter((c) => c.totalTxs > 0 || c.assetStats.length > 0)
    .map((c) => c.chain.name);

  const hasCircleAsset =
    usdcChains.length > 0 ||
    eurcChains.length > 0 ||
    chainResults.some((c) =>
      c.assetStats.some((s) => s.asset === "USYC" && s.transferCount > 0),
    );

  const officialProductInteractions = sum(
    chainResults.map((c) => c.officialProductInteractions),
  );
  const hasVerifiedProtocol =
    crossChain.hasVerifiedCctp ||
    crossChain.hasVerifiedGateway ||
    chainResults.some((c) => c.stablefxEvents.length > 0);

  // "official protocol interaction beyond ordinary USDC/EURC token transfers"
  const hasProtocolBeyondTransfers =
    hasVerifiedProtocol ||
    officialProductInteractions > 0;

  // ================= GLOBAL SCORE =================
  const globalSubscores: SubScore[] = [];

  // Circle Asset Activity — 20
  {
    const chainsWithAsset = usdcChains.length + eurcChains.length;
    const totalTransfers = sum(
      chainResults.flatMap((c) =>
        c.assetStats.map((s) => s.transferCount),
      ),
    );
    const counterparties = sum(
      chainResults.flatMap((c) =>
        c.assetStats.map((s) => s.uniqueCounterparties),
      ),
    );
    let s = 0;
    if (totalTransfers > 0) s += 5;
    s += Math.min(6, totalTransfers * 0.5);
    s += Math.min(5, chainsWithAsset * 2.5); // multi-network bonus
    s += Math.min(4, counterparties * 0.5);
    globalSubscores.push({
      id: "circle-asset-activity",
      label: "Circle Asset Activity",
      score: Math.round(clamp(s, 0, 20)),
      maxScore: 20,
      summary: `${totalTransfers} official Circle asset transfer(s) across ${chainsWithAsset} network(s).`,
      evidence: [
        `USDC networks: ${usdcChains.length}`,
        `EURC networks: ${eurcChains.length}`,
        `Unique counterparties: ${counterparties}`,
      ],
    });
  }

  // Verified CCTP Usage — 25
  {
    let s = 0;
    if (crossChain.cctpSourceCount > 0) s += 8;
    if (crossChain.cctpDestinationCount > 0) s += 8;
    if (crossChain.hasCompleteCctpFlow) s += 9;
    s += Math.min(
      5,
      (crossChain.cctpSourceCount + crossChain.cctpDestinationCount - 1) * 2,
    );
    globalSubscores.push({
      id: "verified-cctp",
      label: "Verified CCTP Usage",
      score: Math.round(clamp(s, 0, 25)),
      maxScore: 25,
      summary: crossChain.hasVerifiedCctp
        ? `${crossChain.cctpSourceCount} source + ${crossChain.cctpDestinationCount} destination CCTP event(s); ${crossChain.hasCompleteCctpFlow ? "deterministic flow matched" : "no complete flow matched"}.`
        : "No verified CCTP events observed.",
      evidence: crossChain.matches
        .filter((m) => m.product === "CCTP")
        .map((m) => m.evidenceText),
    });
  }

  // Verified Gateway Usage — 15
  {
    let s = 0;
    if (crossChain.gatewayActionCount > 0) s += 9;
    s += Math.min(6, (crossChain.gatewayActionCount - 1) * 3);
    globalSubscores.push({
      id: "verified-gateway",
      label: "Verified Gateway Usage",
      score: Math.round(clamp(s, 0, 15)),
      maxScore: 15,
      summary: crossChain.hasVerifiedGateway
        ? `${crossChain.gatewayActionCount} verified Gateway action(s).`
        : "No verified Gateway events observed.",
      evidence: crossChain.matches
        .filter((m) => m.product === "Gateway")
        .map((m) => m.evidenceText),
    });
  }

  // Arc Product Footprint — 15
  {
    const arc = chainResults.find((c) => c.chain.chainId === ARC_CHAIN_ID);
    let s = 0;
    if (arc) {
      const arcAsset = arc.assetStats.some((x) => x.transferCount > 0);
      const arcProduct =
        arc.officialProductInteractions > 0 ||
        arc.stablefxEvents.length > 0 ||
        arc.gatewayEvents.length > 0 ||
        arc.cctpSourceEvents.length > 0;
      if (arc.successfulTxs > 0) s += 4;
      if (arcAsset) s += 4;
      if (arcProduct) s += 7;
    }
    globalSubscores.push({
      id: "arc-product-footprint",
      label: "Arc Product Footprint",
      score: Math.round(clamp(s, 0, 15)),
      maxScore: 15,
      summary: arc
        ? `Arc activity observed (${arc.successfulTxs} successful tx).`
        : "No Arc activity indexed.",
      evidence: [],
    });
  }

  // Official Circle Contract / Product Interactions — 15
  {
    const productSet = new Set(
      relevantClassifications
        .filter((c) =>
          [
            "official_product_interaction",
            "cctp_source",
            "cctp_destination",
            "gateway_action",
            "stablefx_action",
          ].includes(c.category),
        )
        .map((c) => c.product),
    );
    let s = 0;
    if (officialProductInteractions > 0) s += 6;
    s += Math.min(6, productSet.size * 3); // product diversity
    s += Math.min(3, Math.max(0, officialProductInteractions - 1)); // recurrence
    globalSubscores.push({
      id: "official-contract-interactions",
      label: "Official Circle Contract / Product Interactions",
      score: Math.round(clamp(s, 0, 15)),
      maxScore: 15,
      summary: `${officialProductInteractions} verified official contract interaction(s) across ${productSet.size} product(s).`,
      evidence: [...productSet].filter(Boolean).map((p) => `Product: ${p}`),
    });
  }

  // Sustained Cross-Network Behaviour — 10
  {
    let s = 0;
    s += Math.min(4, activeDays * 0.2);
    s += Math.min(3, sameAddressNetworks.length * 1.5);
    if (officialProductInteractions > 0 && activeDays >= 7) s += 3;
    globalSubscores.push({
      id: "sustained-cross-network",
      label: "Sustained Cross-Network Behaviour",
      score: Math.round(clamp(s, 0, 10)),
      maxScore: 10,
      summary: `${activeDays} active day(s) across ${sameAddressNetworks.length} network(s).`,
      evidence: [],
    });
  }

  let globalScore = clamp(sum(globalSubscores.map((s) => s.score)));

  // ---- GLOBAL HARD CAPS ----
  // Minimum evidence caps
  if (totalRelevantTxs < 5) {
    if (globalScore > 35) caps.push("Fewer than 5 relevant txs: global score capped at 35.");
    globalScore = Math.min(globalScore, 35);
  } else if (totalRelevantTxs < 10) {
    if (globalScore > 50) caps.push("Fewer than 10 relevant txs: global score capped at 50.");
    globalScore = Math.min(globalScore, 50);
  }

  // Only ordinary USDC transfers on one chain: max 45
  if (
    hasCircleAsset &&
    !hasProtocolBeyondTransfers &&
    usdcChains.length <= 1 &&
    eurcChains.length === 0
  ) {
    caps.push("Only ordinary USDC transfers on one chain: ceiling 45 (no protocol evidence).");
    globalScore = Math.min(globalScore, 45);
  }

  // Same-address presence on multiple chains without CCTP/Gateway: max 60
  if (
    sameAddressNetworks.length >= 2 &&
    !crossChain.hasVerifiedCctp &&
    !crossChain.hasVerifiedGateway
  ) {
    caps.push("Multi-chain presence without CCTP/Gateway evidence: ceiling 60.");
    globalScore = Math.min(globalScore, 60);
  }

  // Multi-network USDC without verified Circle protocol events: max 70
  if (multiNetworkUsdc && !hasVerifiedProtocol) {
    caps.push("Multi-network USDC without verified Circle protocol events: ceiling 70.");
    globalScore = Math.min(globalScore, 70);
  }

  // No official Circle protocol interaction beyond ordinary transfers: max 70
  if (!hasProtocolBeyondTransfers) {
    caps.push("No official protocol interaction beyond ordinary transfers: ceiling 70.");
    globalScore = Math.min(globalScore, 70);
  }

  // Above 85 requires sustained + multi-product + deterministic linkage
  const productCategories = new Set(
    relevantClassifications.map((c) => c.product).filter(Boolean),
  );
  const qualifiesAbove85 =
    activeDays >= 14 &&
    productCategories.size >= 2 &&
    (crossChain.hasCompleteCctpFlow || crossChain.gatewayActionCount > 0);
  if (globalScore > 85 && !qualifiesAbove85) {
    caps.push("Above 85 requires sustained multi-product activity + deterministic cross-chain linkage: capped at 85.");
    globalScore = 85;
  }
  // 100 must be extremely rare
  const qualifies100 =
    activeDays >= 30 &&
    productCategories.size >= 3 &&
    crossChain.hasCompleteCctpFlow &&
    sameAddressNetworks.length >= 3;
  if (globalScore >= 100 && !qualifies100) {
    globalScore = Math.min(globalScore, 97);
  }

  globalScore = Math.round(globalScore);

  // ================= ARC SCORE =================
  const arc = chainResults.find((c) => c.chain.chainId === ARC_CHAIN_ID);
  let arcScore: number | null = null;
  let arcLabel = "No verified Arc footprint observed";
  const arcSubscores: SubScore[] = [];

  if (!arc) {
    // Arc could not be indexed OR not present. Orchestrator distinguishes.
    arcScore = null;
    arcLabel = "No verified Arc footprint observed";
  } else {
    const relevantArc = arc.successfulTxs + arc.assetStats.length;

    // Arc Execution History — 25
    const execScore = ((): SubScore => {
      const tx = arc.successfulTxs;
      const d = arc.activeDays;
      let s: number;
      if (tx <= 4) s = Math.min(8, tx * 2);
      else if (tx <= 19) s = 8 + Math.min(8, (tx - 4) * 0.5);
      else if (tx <= 49) s = d >= 7 ? 16 + Math.min(5, (tx - 20) * 0.15) : 16;
      else s = d >= 30 ? 21 + Math.min(4, (tx - 50) * 0.02) : 21;
      const ratio = arc.totalTxs > 0 ? arc.successfulTxs / arc.totalTxs : 1;
      s *= 0.7 + 0.3 * ratio;
      return {
        id: "arc-execution",
        label: "Arc Execution History",
        score: Math.round(clamp(s, 0, 25)),
        maxScore: 25,
        summary: `${tx} successful Arc tx over ${d} active day(s).`,
        evidence: [`Success ratio ${(ratio * 100).toFixed(0)}%`, `${arc.uniqueCounterparties} counterparties`],
      };
    })();
    arcSubscores.push(execScore);

    // Arc Stablecoin Usage — 25 (max 10 from ordinary transfers alone)
    const stableScore = ((): SubScore => {
      const transfers = sum(arc.assetStats.map((s) => s.transferCount));
      const appUsage =
        arc.officialProductInteractions +
        arc.stablefxEvents.length +
        arc.gatewayEvents.length +
        arc.cctpSourceEvents.length;
      let s = Math.min(10, transfers * 1.2); // transfer-only ceiling 10
      if (appUsage > 0) s += Math.min(15, 5 + appUsage * 3);
      return {
        id: "arc-stablecoin",
        label: "Arc Stablecoin Usage",
        score: Math.round(clamp(s, 0, 25)),
        maxScore: 25,
        summary: `${transfers} Arc stablecoin transfer(s); ${appUsage} application-level interaction(s).`,
        evidence: [],
        capApplied:
          appUsage === 0 && transfers > 0
            ? "Transfer-only activity capped at 10/25."
            : undefined,
      };
    })();
    arcSubscores.push(stableScore);

    // Arc Circle Product Usage — 30
    const productScore = ((): SubScore => {
      const actions =
        arc.cctpSourceEvents.length +
        arc.cctpDestinationEvents.length +
        arc.gatewayEvents.length +
        arc.stablefxEvents.length;
      const products = new Set<string>();
      arc.cctpSourceEvents.forEach(() => products.add("CCTP"));
      arc.gatewayEvents.forEach(() => products.add("Gateway"));
      arc.stablefxEvents.forEach(() => products.add("StableFX"));
      const assetOnly = actions === 0 && arc.assetStats.length > 0;
      let s: number;
      if (actions === 0) s = assetOnly ? 7 : 2;
      else if (actions === 1) s = 14;
      else s = 18 + Math.min(12, (products.size - 1) * 6 + (actions - 2) * 2);
      return {
        id: "arc-product",
        label: "Arc Circle Product Usage",
        score: Math.round(clamp(s, 0, 30)),
        maxScore: 30,
        summary: `${actions} verified Arc Circle-product action(s) across ${products.size} product(s).`,
        evidence: [...products].map((p) => `Verified ${p}`),
      };
    })();
    arcSubscores.push(productScore);

    // Arc Technical Footprint — 10
    const techScore = ((): SubScore => {
      let s = 0;
      if (arc.contractDeployments > 0) s += Math.min(7, arc.contractDeployments * 4);
      if (arc.commonToolingInteractions > 0) s += 2; // tooling is minor, not Circle
      return {
        id: "arc-technical",
        label: "Arc Technical Footprint",
        score: Math.round(clamp(s, 0, 10)),
        maxScore: 10,
        summary: `${arc.contractDeployments} deployment(s); ${arc.commonToolingInteractions} common EVM tooling interaction(s).`,
        evidence:
          arc.commonToolingInteractions > 0
            ? ["Common EVM tooling interaction observed (not Circle product)."]
            : [],
      };
    })();
    arcSubscores.push(techScore);

    // Arc Activity Quality — 10
    const qualityScore = ((): SubScore => {
      const ratio = arc.totalTxs > 0 ? arc.successfulTxs / arc.totalTxs : 1;
      let s = 0;
      s += Math.min(4, arc.activeDays * 0.4);
      s += ratio * 3;
      s += Math.min(3, arc.uniqueCounterparties * 0.5);
      return {
        id: "arc-quality",
        label: "Arc Activity Quality",
        score: Math.round(clamp(s, 0, 10)),
        maxScore: 10,
        summary: `Recurrence and execution quality over ${arc.activeDays} active day(s).`,
        evidence: [],
      };
    })();
    arcSubscores.push(qualityScore);

    arcScore = Math.round(clamp(sum(arcSubscores.map((s) => s.score))));

    if (arc.successfulTxs < 5) {
      arcLabel = "Limited Arc history";
    } else {
      arcLabel = `${arcScore}/100`;
    }
    // A few testnet transfers must never be 100.
    if (relevantArc < 20 && arcScore >= 90) {
      arcScore = 89;
      caps.push("Arc: limited history cannot reach elite Arc score.");
    }
  }

  // ================= EVIDENCE COVERAGE =================
  const coverageSubscores: SubScore[] = [];
  const indexedCount = chainResults.length;

  // Network Coverage — 25
  {
    const eligible = Math.max(1, input.eligibleChainCount);
    const s = Math.min(25, (indexedCount / eligible) * 25);
    coverageSubscores.push({
      id: "network-coverage",
      label: "Network Coverage",
      score: Math.round(s),
      maxScore: 25,
      summary: `${indexedCount} of ${eligible} eligible network(s) indexed; ${input.notAssessedCount} not assessed.`,
      evidence: [],
    });
  }
  // Historical Depth — 25
  {
    let s = 0;
    s += Math.min(13, activeDays * 0.5);
    s += Math.min(12, totalRelevantTxsRaw * 0.2);
    coverageSubscores.push({
      id: "historical-depth",
      label: "Historical Depth",
      score: Math.round(clamp(s, 0, 25)),
      maxScore: 25,
      summary: `${activeDays} active day(s); ${totalRelevantTxsRaw} indexed transaction(s).`,
      evidence: [],
    });
  }
  // Classification Completeness — 25
  {
    const s = officialAttributionRatio * 25;
    coverageSubscores.push({
      id: "classification-completeness",
      label: "Classification Completeness",
      score: Math.round(clamp(s, 0, 25)),
      maxScore: 25,
      summary: `${(officialAttributionRatio * 100).toFixed(0)}% of interactions received a reliable classification.`,
      evidence: [],
    });
  }
  // Source Reliability — 15
  {
    let s = 0;
    if (indexedCount > 0) s += 8; // registry + at least one live source
    s += Math.min(7, indexedCount * 2);
    coverageSubscores.push({
      id: "source-reliability",
      label: "Source Reliability",
      score: Math.round(clamp(s, 0, 15)),
      maxScore: 15,
      summary: `Official registry loaded; ${indexedCount} live source(s) healthy.`,
      evidence: [],
    });
  }
  // Cross-Chain Observability — 10
  {
    let s = 0;
    if (crossChain.cctpSourceCount > 0 && crossChain.cctpDestinationCount > 0) s += 6;
    else if (crossChain.hasVerifiedCctp || crossChain.hasVerifiedGateway) s += 3;
    if (indexedCount >= 2) s += 4;
    coverageSubscores.push({
      id: "cross-chain-observability",
      label: "Cross-Chain Observability",
      score: Math.round(clamp(s, 0, 10)),
      maxScore: 10,
      summary:
        indexedCount >= 2
          ? "Multiple networks indexed; source/destination correlation possible."
          : "Single network indexed; cross-chain correlation limited.",
      evidence: [],
    });
  }

  let coverageScore = Math.round(clamp(sum(coverageSubscores.map((s) => s.score))));

  // Coverage caps
  if (indexedCount <= 1) {
    if (coverageScore > 65) caps.push("Only one network indexed: coverage capped at 65.");
    coverageScore = Math.min(coverageScore, 65);
  }

  const coverageBand: CoverageBand =
    coverageScore <= 34
      ? "Limited"
      : coverageScore <= 64
        ? "Partial"
        : coverageScore <= 84
          ? "Broad"
          : "Extensive";

  // ================= CONFIDENCE =================
  const allTestnet = chainResults.every((c) => c.chain.testnet);
  let confidence: ConfidenceLevel = "Low";
  if (
    activeDays >= 30 &&
    totalRelevantTxs >= 50 &&
    indexedCount >= 2 &&
    coverageScore >= 65 &&
    officialAttributionRatio >= 0.6
  ) {
    confidence = "High";
  } else if (
    activeDays >= 7 &&
    totalRelevantTxs >= 10 &&
    coverageScore >= 35 &&
    officialAttributionRatio >= 0.4
  ) {
    confidence = "Moderate";
  } else {
    confidence = "Low";
  }

  // Confidence hard rules — never High if...
  if (confidence === "High") {
    if (activeDays < 7) confidence = "Moderate";
    if (indexedCount <= 1) {
      confidence = "Moderate";
      caps.push("Confidence: only one chain indexed — cannot be High.");
    }
    if (allTestnet) {
      confidence = "Moderate";
      caps.push("Confidence: all data from testnet — cannot be High.");
    }
    const onlyTransfers = !hasProtocolBeyondTransfers;
    if (onlyTransfers) {
      confidence = "Moderate";
      caps.push("Confidence: only ordinary transfers observed — cannot be High.");
    }
    // claimed cross-chain flow but destination unavailable
    if (crossChain.cctpSourceCount > 0 && !crossChain.hasCompleteCctpFlow) {
      confidence = "Moderate";
    }
  }
  if (activeDays < 7 && confidence !== "Low") {
    // <7 active days can't be High (spec cap)
    if (confidence === "High") confidence = "Moderate";
  }

  return {
    globalScore,
    globalSubscores,
    arcScore,
    arcLabel,
    arcSubscores,
    coverageScore,
    coverageBand,
    coverageSubscores,
    confidence,
    caps,
    totalRelevantTxs,
    totalActiveDays: activeDays,
    officialAttributionRatio,
    multiNetworkUsdc,
    sameAddressNetworks,
  };
}
