import type { Address, CategoryScore, RawFacts, WalletSummary, ArcProfile, CircleFootprintReport, ConfidenceLevel } from "../types";

const DAY = 86400;

function uniqueDays(txs: RawFacts["txs"], tokenTxs: RawFacts["tokenTxs"]): number {
  const all = [...txs, ...tokenTxs];
  const days = new Set(all.map((t) => new Date(t.timeStamp * 1000).toISOString().slice(0, 10)));
  return days.size;
}

function isOk(src: unknown): boolean {
  if (!src || typeof src !== "object" || !("ok" in src)) return false;
  try {
    return (src as { ok: boolean }).ok === true;
  } catch {
    return false;
  }
}

function nativeUsdcAmount(rpc: RawFacts["rpc"]): string | null {
  const rpcObj = rpc as Record<string, unknown> | null;
  if (!rpcObj || rpcObj.ok !== true) return null;
  const data = rpcObj.data as Record<string, unknown> | null;
  if (!data) return null;
  return typeof data.balance === "string" ? data.balance : null;
}

const OFFICIAL_CIRCLE_STABLECOINS = new Set([
  "0x3600000000000000000000000000000000000000",
  "0x89b50855aa3be2f677cd6303cec089b5f319d72a",
  "0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C",
]);

const OFFICIAL_NETWORKS = new Set([
  "ethereum",
  "base",
  "arbitrum",
  "optimism",
  "polygon",
  "avalanche",
  "solana",
  "arc",
]);

function stableDiversity(tokenTxs: RawFacts["tokenTxs"]): number {
  const coins = new Set<string>();
  for (const t of tokenTxs) {
    const c = t.contractAddress.toLowerCase();
    if (!c) continue;
    if (c === "0x3600000000000000000000000000000000000000") coins.add("USDC");
    else if (c === "0x89b50855aa3be2f677cd6303cec089b5f319d72a") coins.add("EURC");
    else if (c === "0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C") coins.add("USYC");
  }
  return coins.size;
}

function onlyOfficialCircleTokenTxs(tokenTxs: RawFacts["tokenTxs"]): RawFacts["tokenTxs"] {
  return tokenTxs.filter((t) => OFFICIAL_CIRCLE_STABLECOINS.has(t.contractAddress.toLowerCase()));
}

export function score(facts: RawFacts): CircleFootprintReport {
  const { address, txs, tokenTxs, explorerLegacy, explorerV2, rpc } = facts;
  const successfulTxs = txs.filter((t) => t.isError === "0");
  const failedTxs = txs.filter((t) => t.isError !== "0");
  const activeDays = Math.max(1, uniqueDays(txs, tokenTxs));
  const days = activeDays;
  const meu = address.toLowerCase();

  const officialTokenTxs = onlyOfficialCircleTokenTxs(tokenTxs);
  const usdcTxs = officialTokenTxs.filter((t) => t.contractAddress.toLowerCase() === "0x3600000000000000000000000000000000000000");
  const eurcTxs = officialTokenTxs.filter((t) => t.contractAddress.toLowerCase() === "0x89b50855aa3be2f677cd6303cec089b5f319d72a");
  const usycTxs = officialTokenTxs.filter((t) => t.contractAddress.toLowerCase() === "0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C");
  const totalStablecoinTransfers = officialTokenTxs.length;

  const bridgeInteractions =
    txs.filter((t) => {
      const to = t.to?.toLowerCase();
      return to === "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa" || to === "0x0077777d7eba4688bdef3e311b846f25870a19b9";
    }).length +
    tokenTxs.filter((t) => {
      const c = t.contractAddress.toLowerCase();
      return c === "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa" || c === "0x0077777d7eba4688bdef3e311b846f25870a19b9";
    }).length;

  const developerToolInteractions =
    txs.filter((t) => {
      const to = t.to?.toLowerCase();
      return !!to && [
        "0x5294e9927c3306dcbadb03fe70b92e01ccede505",
        "0x522faf9a91c41c443c66765030741e4aace147d0",
        "0x000000000022d473030f116ddee9f6b43ac78ba3",
        "0xca11bde05977b3631167028862be2a173976ca11",
        "0x4e59b44847b379578588920ca78fbf26c0b4956c",
      ].includes(to);
    }).length;

  const contractDeployments = txs.filter((t) => t.to === "" && t.input && t.input.length > 2).length;

  const firstSuccess = successfulTxs.length > 0 ? successfulTxs[successfulTxs.length - 1] : officialTokenTxs.length > 0 ? officialTokenTxs[officialTokenTxs.length - 1] : null;
  const lastSuccess = successfulTxs.length > 0 ? successfulTxs[0] : officialTokenTxs.length > 0 ? officialTokenTxs[0] : null;

  const counterparties = new Set(
    txs.filter((t) => t.to && t.isError === "0").map((t) => t.to!.toLowerCase()).filter((addr) => addr !== meu)
  ).size;

  const summary: WalletSummary = {
    firstSeenTime: firstSuccess?.timeStamp ?? null,
    lastSeenTime: lastSuccess?.timeStamp ?? null,
    activeDays,
    totalTransactions: txs.length,
    successfulTransactions: successfulTxs.length,
    failedTransactions: failedTxs.length,
    stablecoinTransfers: totalStablecoinTransfers,
    usdcTransfers: usdcTxs.length,
    eurcTransfers: eurcTxs.length,
    usycTransfers: usycTxs.length,
    bridgeInteractions,
    developerToolInteractions,
    contractDeployments,
    nativeBalanceUsdc: nativeUsdcAmount(rpc),
    uniqueCounterparties: counterparties,
    inboundTransfers: tokenTxs.filter((t) => t.to.toLowerCase() === meu).length,
    outboundTransfers: tokenTxs.filter((t) => t.from.toLowerCase() === meu).length,
  };

  const sourcesOk = isOk(explorerLegacy) || isOk(explorerV2);
  const rpcOk = isOk(rpc);

  const categories: CategoryScore[] = [
    scoreCircleStablecoinAdoption(officialTokenTxs, usdcTxs, eurcTxs, usycTxs, activeDays, counterparties, sourcesOk, rpcOk),
    scoreArcParticipation(txs, officialTokenTxs, successfulTxs.length, failedTxs.length, activeDays, counterparties, sourcesOk, rpcOk),
    scoreCircleInfrastructure(txs, officialTokenTxs, bridgeInteractions, developerToolInteractions, sourcesOk, rpcOk),
    scoreCrossChainStablecoinExperience(bridgeInteractions, sourcesOk, rpcOk),
    scoreSettlementBehaviour(txs, officialTokenTxs, successfulTxs.length, failedTxs.length, activeDays, counterparties, sourcesOk, rpcOk),
    scoreDeveloperParticipation(txs, contractDeployments, developerToolInteractions, sourcesOk, rpcOk),
    scoreEvidenceQuality(txs.length, officialTokenTxs.length, activeDays, sourcesOk, rpcOk),
  ];

  const weights: Record<string, number> = {
    "circle-stablecoin-adoption": 0.30,
    "arc-participation": 0.25,
    "circle-infrastructure": 0.15,
    "cross-chain-stablecoin-experience": 0.10,
    "settlement-behaviour": 0.10,
    "developer-participation": 0.05,
    "evidence-quality": 0.05,
  };

  const scored = categories.filter((c) => c.status === "scored");
  const empty = txs.length === 0 && officialTokenTxs.length === 0;
  const overall = empty
    ? 0
    : scored.reduce((sum, c) => sum + (c.score / c.maxScore) * (weights[c.id] ?? 0) * 100, 0) / scored.reduce((s, c) => s + (weights[c.id] ?? 0), 0);

  const confidenceLevel: ConfidenceLevel = deriveConfidence(activeDays, txs.length, categories);

  return {
    address,
    network: "Arc Testnet",
    scoreLabel: "Arc Participation Assessment",
    scoreValue: Math.round(Math.max(0, Math.min(100, overall || 0))),
    confidenceLabel: "Evidence Confidence",
    confidenceValue: categories.find((c) => c.id === "evidence-quality")?.score ?? 0,
    confidenceLevel,
    primaryProfile: deriveProfile(successfulTxs.length, bridgeInteractions, contractDeployments, totalStablecoinTransfers, usdcTxs.length, eurcTxs.length, usycTxs.length, days),
    secondaryTags: [],
    categories,
    evidenceTimeline: [],
    summary,
    methodology: "Assessment is computed from weighted verified on-chain evidence only. Non-observed evidence is reported as insufficient or not assessed.",
    limitations: [
      "Current evidence collection is limited to Arc Testnet; other supported networks are not yet active sources.",
      "Off-chain product usage is not observable.",
      "This tool does not determine eligibility, rewards, compliance, reputation, identity, intent, or wealth.",
      "Products without reliable public onchain attribution are reported as not observed.",
    ],
    registrySources: [
      "https://docs.arc.io/arc/references/contract-addresses.md",
      "https://docs.arc.io/arc/references/evm-differences.md",
      "https://developers.circle.com/",
      "https://www.circle.com/",
    ],
    lastUpdated: Date.now(),
  };
}

function scoreCircleStablecoinAdoption(officialTokenTxs: RawFacts["tokenTxs"], usdcTxs: RawFacts["tokenTxs"], eurcTxs: RawFacts["tokenTxs"], usycTxs: RawFacts["tokenTxs"], activeDays: number, counterparties: number, sourcesOk: boolean, rpcOk: boolean): CategoryScore {
  if (!sourcesOk && !rpcOk) return disabled("Circle Stablecoin Adoption");
  if (officialTokenTxs.length === 0) {
    return {
      id: "circle-stablecoin-adoption",
      label: "Circle Stablecoin Adoption",
      description: "Verified usage of official Circle-issued stablecoins on supported networks.",
      score: 0,
      maxScore: 100,
      status: "insufficient-data",
      weight: 0.30,
      summary: "No official Circle stablecoin transfers observed.",
      evidence: [],
      notObserved: ["No official Circle stablecoin transfers observed"],
      source: "Token transfers on supported networks",
      limitations: "Only official Circle stablecoins are counted; amounts are ignored in favor of frequency, spread, and recurrence.",
      formula: "Open with any verified transfer, then increase with diversity, counterparty spread, and time span.",
      timestamp: new Date().toISOString(),
      publicSource: "https://docs.arc.io/arc/references/contract-addresses.md",
      confidence: deriveCategoryConfidence(officialTokenTxs.length, activeDays, counterparties),
    };
  }

  const diversity = stableDiversity(officialTokenTxs);
  const days = Math.max(1, activeDays);
  const score0 = scoreCircleStablecoinAdoptionValue(officialTokenTxs.length, days, counterparties, diversity);

  return {
    id: "circle-stablecoin-adoption",
    label: "Circle Stablecoin Adoption",
    description: "Verified usage of official Circle-issued stablecoins on supported networks.",
    score: score0,
    maxScore: 100,
    status: "scored",
    weight: 0.30,
    summary: buildStablecoinSummary(officialTokenTxs.length, days, counterparties, diversity, score0),
    evidence: [
      `${officialTokenTxs.length} official Circle stablecoin transfer(s)`,
      `USDC: ${usdcTxs.length}`,
      `EURC: ${eurcTxs.length}`,
      `USYC: ${usycTxs.length}`,
      `${diversity} stablecoin type(s)`,
      `${counterparties} unique counterparties`,
      `${days} active ${days === 1 ? "day" : "days"}`,
    ],
    notObserved: [],
    source: "Token transfers on supported networks",
    limitations: "Only official Circle stablecoins are counted; amounts are ignored in favor of frequency, spread, and recurrence.",
    formula: "Base score opens with verified transfer activity; increases with diversity, counterparty spread, and sustained time span.",
    timestamp: new Date().toISOString(),
    publicSource: "https://docs.arc.io/arc/references/contract-addresses.md",
    confidence: deriveCategoryConfidence(officialTokenTxs.length, activeDays, counterparties),
  };
}

function scoreCircleStablecoinAdoptionValue(count: number, days: number, counterparties: number, diversity: number): number {
  if (count >= 20 && days >= 14 && counterparties >= 5 && diversity >= 2) return 100;
  if (count >= 12 && days >= 7 && counterparties >= 4) return 80;
  if (count >= 6 && days >= 3 && counterparties >= 2) return 60;
  if (count >= 2) return 40;
  return 20;
}

function buildStablecoinSummary(count: number, days: number, counterparties: number, diversity: number, score: number): string {
  if (score >= 80) return `Recurring verified Circle stablecoin usage across ${days} ${days === 1 ? "day" : "days"}.`;
  if (score >= 50) return `Observed official Circle stablecoin usage: ${count} transfer(s) with ${diversity} type(s).`;
  return `Limited verified Circle stablecoin usage: ${count} transfer(s).`;
}

function scoreArcParticipation(txs: RawFacts["txs"], officialTokenTxs: RawFacts["tokenTxs"], successful: number, failed: number, activeDays: number, counterparties: number, sourcesOk: boolean, rpcOk: boolean): CategoryScore {
  if (!sourcesOk && !rpcOk) return disabled("Arc Participation");
  if (successful === 0 && officialTokenTxs.length === 0) {
    return {
      id: "arc-participation",
      label: "Arc Participation",
      description: "Verified Arc ecosystem activity, excluding spam or meaningless repetitions.",
      score: 0,
      maxScore: 100,
      status: "insufficient-data",
      weight: 0.25,
      summary: "No successful Arc transactions observed.",
      evidence: [],
      notObserved: ["No successful Arc transactions observed"],
      source: currentSourceLabel(sourcesOk, rpcOk),
      limitations: "Raw transaction count alone is not rewarded; diversity and spread are required.",
      formula: "Sustained, counterparty-diverse, and successful transaction behavior increases this score.",
      timestamp: new Date().toISOString(),
      publicSource: "https://docs.arc.io/arc/references/evm-differences.md",
      confidence: "Low",
    };
  }

  const days = Math.max(1, activeDays);
  const uniq = Math.max(1, counterparties);
  const ratio = successful / Math.max(1, successful + failed);
  const score0 = Math.min(100, Math.round((ratio * 40) + Math.min(35, days * 3) + Math.min(25, uniq * 5)));

  return {
    id: "arc-participation",
    label: "Arc Participation",
    description: "Verified Arc ecosystem activity, excluding spam or meaningless repetitions.",
    score: score0,
    maxScore: 100,
    status: "scored",
    weight: 0.25,
    summary: `Observed Arc participation across ${days} ${days === 1 ? "day" : "days"} with ${successful} successful transaction(s).`,
    evidence: [`${successful} successful transactions`, `${failed} failed transactions`, `${days} active ${days === 1 ? "day" : "days"}`, `${counterparties} unique counterparties`],
    notObserved: failed > 0 ? [`${failed} failed transaction(s)`] : [],
    source: currentSourceLabel(sourcesOk, rpcOk),
    limitations: "Raw transaction count alone is not rewarded; diversity and spread are required.",
    formula: "Sustained, counterparty-diverse, and successful transaction behavior increases this score.",
    timestamp: new Date().toISOString(),
    publicSource: "https://docs.arc.io/arc/references/evm-differences.md",
    confidence: deriveCategoryConfidence(txs.length + officialTokenTxs.length, activeDays, counterparties),
  };
}

function scoreCircleInfrastructure(txs: RawFacts["txs"], officialTokenTxs: RawFacts["tokenTxs"], bridgeCount: number, toolInteractions: number, sourcesOk: boolean, rpcOk: boolean): CategoryScore {
  if (!sourcesOk && !rpcOk) return disabled("Circle Infrastructure Usage");
  const contractProducts = new Set<string>();
  for (const t of txs) {
    const to = t.to?.toLowerCase();
    if (to && to !== "") contractProducts.add(to);
  }
  for (const t of officialTokenTxs) {
    const c = t.contractAddress.toLowerCase();
    if (c) contractProducts.add(c);
  }

  if (bridgeCount === 0 && toolInteractions === 0 && contractProducts.size === 0) {
    return {
      id: "circle-infrastructure",
      label: "Circle Infrastructure Usage",
      description: "Verified interactions with official Circle or Arc infrastructure contracts.",
      score: 0,
      maxScore: 100,
      status: "insufficient-data",
      weight: 0.15,
      summary: "No verified Circle infrastructure interactions observed.",
      evidence: [],
      notObserved: ["No CCTP, Gateway, or verified Circle product interactions detected"],
      source: "Official contract registry + supported network",
      limitations: "Off-chain API-based products are not observable from public address data alone.",
      formula: "Verification requires an official registry match; unverified contracts are not counted.",
      timestamp: new Date().toISOString(),
      publicSource: "https://developers.circle.com/",
      confidence: "Low",
    };
  }

  const score0 = Math.min(100, 30 + contractProducts.size * 15 + toolInteractions * 15 + bridgeCount * 10);
  return {
    id: "circle-infrastructure",
    label: "Circle Infrastructure Usage",
    description: "Verified interactions with official Circle or Arc infrastructure contracts.",
    score: score0,
    maxScore: 100,
    status: "scored",
    weight: 0.15,
    summary: `Verified Circle infrastructure usage detected.`,
    evidence: [`${contractProducts.size} verified contract(s)`, `${bridgeCount} bridge interaction(s)`, `${toolInteractions} developer tool interaction(s)`],
    notObserved: [],
    source: "Official contract registry + supported network",
    limitations: "Off-chain API-based products are not observable from public address data alone.",
    formula: "Verification requires an official registry match; unverified contracts are not counted.",
    timestamp: new Date().toISOString(),
    publicSource: "https://developers.circle.com/",
    confidence: deriveCategoryConfidence(txs.length + officialTokenTxs.length, Math.max(1, 1), bridgeCount + toolInteractions + contractProducts.size > 0 ? 7 : 1),
  };
}

function scoreCrossChainStablecoinExperience(bridgeCount: number, sourcesOk: boolean, rpcOk: boolean): CategoryScore {
  if (!sourcesOk && !rpcOk) return disabled("Cross-chain Stablecoin Experience");
  if (bridgeCount === 0) {
    return {
      id: "cross-chain-stablecoin-experience",
      label: "Cross-chain Stablecoin Experience",
      description: "Only stablecoin-related cross-chain interactions using official Circle infrastructure on supported networks.",
      score: 0,
      maxScore: 100,
      status: "insufficient-data",
      weight: 0.10,
      summary: "No verified stablecoin cross-chain interactions observed.",
      evidence: [],
      notObserved: ["No CCTP or Gateway verified stablecoin interactions detected"],
      source: "CCTP + Gateway verified contracts",
      limitations: "Non-stablecoin bridging is ignored. Attribution requires official contract matches on supported networks.",
      formula: "Only verified CCTP or Gateway stablecoin flows on supported networks count.",
      timestamp: new Date().toISOString(),
      publicSource: "https://developers.circle.com/",
      confidence: "Low",
    };
  }

  return {
    id: "cross-chain-stablecoin-experience",
    label: "Cross-chain Stablecoin Experience",
    description: "Only stablecoin-related cross-chain interactions using official Circle infrastructure on supported networks.",
    score: Math.min(100, 40 + bridgeCount * 15),
    maxScore: 100,
    status: "scored",
    weight: 0.10,
    summary: `Verified stablecoin cross-chain flow(s): ${bridgeCount} interaction(s).`,
    evidence: [`${bridgeCount} verified CCTP/Gateway interaction(s)`],
    notObserved: [],
    source: "CCTP + Gateway verified contracts",
    limitations: "Non-stablecoin bridging is ignored. Attribution requires official contract matches on supported networks.",
    formula: "Only verified CCTP or Gateway stablecoin flows on supported networks count.",
    timestamp: new Date().toISOString(),
    publicSource: "https://developers.circle.com/",
    confidence: "Moderate",
  };
}

function scoreSettlementBehaviour(txs: RawFacts["txs"], officialTokenTxs: RawFacts["tokenTxs"], successful: number, failed: number, activeDays: number, counterparties: number, sourcesOk: boolean, rpcOk: boolean): CategoryScore {
  if (!sourcesOk && !rpcOk) return disabled("Settlement Behaviour");
  if (successful === 0) {
    return {
      id: "settlement-behaviour",
      label: "Settlement Behaviour",
      description: "Observable payment-like behaviour such as recurring transfers and consistency.",
      score: 0,
      maxScore: 100,
      status: "insufficient-data",
      weight: 0.10,
      summary: "No successful transactions observed.",
      evidence: [],
      notObserved: ["No successful transactions observed"],
      source: "Observed transaction history",
      limitations: "Pattern descriptions describe observations only; they do not imply business identity or intent.",
      formula: "Regularity, counterparty consistency, and execution quality increase this score.",
      timestamp: new Date().toISOString(),
      publicSource: "Observable transaction history",
      confidence: "Low",
    };
  }

  const days = Math.max(1, activeDays);
  const ratio = successful / Math.max(1, successful + failed);
  const score0 = Math.min(100, Math.round((ratio * 30) + Math.min(30, days * 3) + Math.min(25, counterparties * 5) + 15));

  return {
    id: "settlement-behaviour",
    label: "Settlement Behaviour",
    description: "Observable payment-like behaviour such as recurring transfers and consistency.",
    score: score0,
    maxScore: 100,
    status: "scored",
    weight: 0.10,
    summary: `Observed settlement behaviour over ${days} ${days === 1 ? "day" : "days"}.`,
    evidence: [`${successful} successful transactions`, `${days} active ${days === 1 ? "day" : "days"}`, `${counterparties} counterparties`],
    notObserved: [],
    source: "Observed transaction history",
    limitations: "Pattern descriptions describe observations only; they do not imply business identity or intent.",
    formula: "Regularity, counterparty consistency, and execution quality increase this score.",
    timestamp: new Date().toISOString(),
    publicSource: "Observable transaction history",
    confidence: deriveCategoryConfidence(txs.length + officialTokenTxs.length, activeDays, counterparties),
  };
}

function scoreDeveloperParticipation(txs: RawFacts["txs"], deployments: number, toolInteractions: number, sourcesOk: boolean, rpcOk: boolean): CategoryScore {
  if (!sourcesOk && !rpcOk) return disabled("Developer Participation");
  if (deployments === 0 && toolInteractions === 0) {
    return {
      id: "developer-participation",
      label: "Developer Participation",
      description: "Verifiable engineering activity verified through public contract or tooling interactions.",
      score: 0,
      maxScore: 100,
      status: "insufficient-data",
      weight: 0.05,
      summary: "No verified developer evidence observed.",
      evidence: [],
      notObserved: ["No contract deployments or developer-primitive interactions found"],
      source: "Explorer + RPC on supported networks",
      limitations: "Source attribution depends on explorer metadata; verified-source detection may be limited.",
      formula: "Verified deployments and matched developer-primitive interactions increase this score.",
      timestamp: new Date().toISOString(),
      publicSource: "Explorer + RPC on supported networks",
      confidence: "Low",
    };
  }

  const score0 = Math.min(100, 30 + deployments * 30 + toolInteractions * 15);
  const activeDays = Math.max(1, uniqueDays(txs, []));
  const observed = deployments + toolInteractions;
  return {
    id: "developer-participation",
    label: "Developer Participation",
    description: "Verifiable engineering activity verified through public contract or tooling interactions.",
    score: score0,
    maxScore: 100,
    status: "scored",
    weight: 0.05,
    summary: `${deployments} deployment(s) and ${toolInteractions} developer-primitive interaction(s) observed.`,
    evidence: [`${deployments} deployment(s)`, `${toolInteractions} developer-primitive interaction(s)`],
    notObserved: [],
    source: "Explorer + RPC on supported networks",
    limitations: "Source attribution depends on explorer metadata; verified-source detection may be limited.",
    formula: "Verified deployments and matched developer-primitive interactions increase this score.",
    timestamp: new Date().toISOString(),
    publicSource: "Explorer + RPC on supported networks",
    confidence: deriveCategoryConfidence(txs.length, activeDays, observed),
  };
}

function scoreEvidenceQuality(totalTxs: number, totalTokenTxs: number, activeDays: number, sourcesOk: boolean, rpcOk: boolean): CategoryScore {
  const available = [sourcesOk, rpcOk].filter(Boolean).length;
  const coverage = Math.min(100, available * 40 + activeDays * 2 + totalTxs + totalTokenTxs);
  const score0 = coverage < 30 || totalTxs < 3 || activeDays < 2 ? Math.max(0, coverage) : coverage;
  const status = coverage >= 30 && totalTxs >= 3 && activeDays >= 2 ? "scored" : "insufficient-data";

  return {
    id: "evidence-quality",
    label: "Evidence Quality",
    description: "Coverage, history length, source availability, and completeness of observable evidence.",
    score: score0,
    maxScore: 100,
    status,
    weight: 0.05,
    summary: status === "scored" ? `Moderate evidence coverage across ${available} source(s).` : "Very limited evidence available.",
    evidence: [`${totalTxs} transactions`, `${totalTokenTxs} token transfers`, `${activeDays} active ${activeDays === 1 ? "day" : "days"}`, `${available}/2 sources available`],
    notObserved: status === "insufficient-data" ? ["Historical depth limited", "Source availability insufficient"] : [],
    source: "Source availability metrics",
    limitations: "Low evidence coverage reduces confidence; it does not inflate other scores.",
    formula: "Coverage is derived from available sources, transaction volume, and active-day span.",
    timestamp: new Date().toISOString(),
    publicSource: "Observable sources used for analysis",
    confidence: status === "scored" ? deriveCategoryConfidence(totalTxs, activeDays, available) : "Low",
  };
}

function disabled(label: string): CategoryScore {
  return {
    id: label.toLowerCase().replace(/ /g, "-"),
    label,
    description: "Data unavailable for this category.",
    score: 0,
    maxScore: 100,
    status: "not-assessed",
    weight: 0,
    summary: "Not assessed due to unavailable data sources.",
    evidence: [],
    notObserved: [],
    source: "N/A",
    limitations: "Category will be assessed when source data becomes available.",
    formula: "Not assessable without data.",
    timestamp: new Date().toISOString(),
    publicSource: "N/A",
    confidence: "Low",
  };
}

function deriveProfile(txs: number, bridge: number, deployments: number, stable: number, usdc: number, eurc: number, usyc: number, days: number): ArcProfile {
  if (txs === 0 && stable === 0) return "Low Observable Activity";
  if (stable > 10 && bridge === 0) return "Stablecoin Native";
  if (stable > 0 && bridge > 0) return "Cross-chain Stablecoin User";
  if (usdc > 0 && days >= 7) return "Recurring USDC User";
  if (stable > 0 && txs <= 10) return "Emerging Circle User";
  if (deployments > 0) return "Arc Developer";
  if (bridge > 0) return "Settlement Focused";
  return "Early Ecosystem Participant";
}

function deriveConfidence(activeDays: number, totalTx: number, categories: CategoryScore[]): ConfidenceLevel {
  const scored = categories.filter((c) => c.status === "scored").length;
  if (totalTx < 5) return "Low";
  if (activeDays < 7) return "Low";
  if (scored >= 5 && activeDays >= 30 && totalTx >= 50) return "High";
  if (scored >= 3 && activeDays >= 7 && totalTx >= 20) return "Moderate";
  return "Low";
}

function deriveCategoryConfidence(totalTxs: number, activeDays: number, observedEvents: number): ConfidenceLevel {
  if (totalTxs < 5) return "Low";
  if (activeDays < 2) return "Low";
  if (totalTxs >= 20 && activeDays >= 14 && observedEvents >= 3) return "High";
  if (totalTxs >= 10 && activeDays >= 3 && observedEvents >= 2) return "Moderate";
  return "Low";
}

function currentSourceLabel(sourcesOk: boolean, rpcOk: boolean): string {
  if (sourcesOk && rpcOk) return "Explorer + RPC";
  if (sourcesOk) return "Explorer";
  if (rpcOk) return "RPC";
  return "N/A";
}
