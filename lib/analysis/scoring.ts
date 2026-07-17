import type { Address, CategoryScore, RawFacts, WalletSummary, ArcProfile, CircleFootprintReport, ConfidenceLevel, SourceResult } from "../types";

const DAY = 86400;

function uniqueDays(txs: RawFacts["txs"], tokenTxs: RawFacts["tokenTxs"]): number {
  const all = [...txs, ...tokenTxs];
  const days = new Set(all.map((t) => new Date(t.timeStamp * 1000).toISOString().slice(0, 10)));
  return days.size;
}

function isOk<T>(src: SourceResult<T> | SourceResult<unknown>): boolean {
  if (!src || typeof src !== "object" || !("ok" in src)) return false;
  try {
    return (src as { ok: boolean }).ok === true;
  } catch {
    return false;
  }
}

function nativeUsdcAmount(rpc: RawFacts["rpc"]): string | null {
  const rpcObj = rpc as Record<string, unknown>;
  if (!rpcObj || rpcObj.ok !== true) return null;
  const data = rpcObj.data as Record<string, unknown> | null;
  if (!data) return null;
  const balance = data.balance;
  return typeof balance === "string" ? balance : null;
}

export function score(facts: RawFacts): CircleFootprintReport {
  const { address, txs, tokenTxs, explorerLegacy, explorerV2, rpc } = facts;

  const successfulTxs = txs.filter((t) => t.isError === "0");
  const failedTxs = txs.filter((t) => t.isError !== "0");
  const activeDays = Math.max(1, uniqueDays(txs, tokenTxs));
  const days = Math.max(1, activeDays);
  const meu = address.toLowerCase();

  const usdcTxs = tokenTxs.filter((t) => t.contractAddress.toLowerCase() === "0x3600000000000000000000000000000000000000");
  const eurcTxs = tokenTxs.filter((t) => t.contractAddress.toLowerCase() === "0x89b50855aa3be2f677cd6303cec089b5f319d72a");
  const usycTxs = tokenTxs.filter((t) => t.contractAddress.toLowerCase() === "0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C");
  const totalStablecoinTransfers = tokenTxs.filter((t) =>
    [
      "0x3600000000000000000000000000000000000000",
      "0x89b50855aa3be2f677cd6303cec089b5f319d72a",
      "0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C",
    ].includes(t.contractAddress.toLowerCase())
  ).length;

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

  const firstSuccess = successfulTxs.length > 0 ? successfulTxs[successfulTxs.length - 1] : tokenTxs.length > 0 ? tokenTxs[tokenTxs.length - 1] : null;
  const lastSuccess = successfulTxs.length > 0 ? successfulTxs[0] : tokenTxs.length > 0 ? tokenTxs[0] : null;

  const uniqueCounterparties = new Set(
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
    uniqueCounterparties,
    inboundTransfers: tokenTxs.filter((t) => t.to.toLowerCase() === meu).length,
    outboundTransfers: tokenTxs.filter((t) => t.from.toLowerCase() === meu).length,
  };

  const sourcesOk = isOk(explorerLegacy) || isOk(explorerV2);
  const rpcOk = isOk(rpc);

  const categories: CategoryScore[] = [
    scoreArcNative(txs, tokenTxs, address, sourcesOk, rpcOk),
    scoreStablecoins(tokenTxs, usdcTxs, eurcTxs, usycTxs, sourcesOk, rpcOk),
    scoreCrossChain(txs, tokenTxs, address, bridgeInteractions, sourcesOk, rpcOk),
    scoreCircleProducts(txs, tokenTxs, address, sourcesOk, rpcOk),
    scoreSustainedActivity(txs, tokenTxs, firstSuccess?.timeStamp ?? null, lastSuccess?.timeStamp ?? null, activeDays, failedTxs.length, uniqueCounterparties, sourcesOk, rpcOk),
    scoreBuilderFootprint(txs, contractDeployments, developerToolInteractions, sourcesOk, rpcOk),
    scoreEvidenceQuality(txs.length, activeDays, sourcesOk, rpcOk),
  ];

  const scored = categories.filter((c) => c.status === "scored");
  const explicit = [sourcesOk, rpcOk].some(Boolean);
  const noActivity = txs.length === 0 && tokenTxs.length === 0;
  const noActivityScore = noActivity || !explicit ? 0 : null;

  const overallWeights = {
    "arc-native": 0.20,
    stablecoins: 0.20,
    "cross-chain": 0.20,
    "circle-products": 0.15,
    sustained: 0.15,
    builder: 0.10,
    evidence: 0.10,
  };

  let weightedSum = 0;
  let weightUsed = 0;
  for (const category of categories) {
    const weight = overallWeights[category.id as keyof typeof overallWeights];
    if (typeof weight !== "number") continue;
    if (category.status === "scored") {
      weightedSum += (category.score / category.maxScore) * weight * 100;
      weightUsed += weight;
    }
  }

  let overall = 0;
  if (weightUsed > 0 && noActivityScore !== 0) {
    overall = Math.round((weightedSum / weightUsed) * 100);
  }

  const lowEvidenceCap = txs.length < 5 ? Math.min(overall, 45) : overall;
  const categorizedScore = scored.length > 0 ? lowEvidenceCap : 0;
  const overallScore = noActivityScore ?? categorizedScore;

  const evidenceCoverageBreakdown = buildEvidenceCoverageBreakdown(totalStablecoinTransfers, categories, sourcesOk, rpcOk, activeDays, bridgeInteractions, contractDeployments);

  const primaryProfile = deriveProfile(successfulTxs.length, bridgeInteractions, contractDeployments, totalStablecoinTransfers, usdcTxs.length, eurcTxs.length, usycTxs.length, days);
  const confidenceLevel = deriveConfidence(activeDays, txs.length, categories);

  return {
    address,
    network: "Arc Testnet",
    verifiedCircleActivityScore: Math.max(0, Math.min(100, overallScore)),
    evidenceCoverageScore: evidenceCoverageBreakdown.overall,
    evidenceCoverageBreakdown,
    confidenceLevel,
    primaryProfile,
    secondaryTags: [],
    categories,
    evidenceTimeline: [],
    summary,
    methodology: "Scored from verified on-chain evidence only. All numbers are conservative and explainable.",
    limitations: [
      "Testnet only. No mainnet evidence used.",
      "Some categories depend on explorer coverage and may undercount.",
      "Off-chain product usage is not observable.",
      "This tool does not determine eligibility, rewards, allowlists, compliance status, or any official Circle / Arc qualification.",
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

function buildEvidenceCoverageBreakdown(
  totalStablecoinTransfers: number,
  categories: CategoryScore[],
  sourcesOk: boolean,
  rpcOk: boolean,
  activeDays: number,
  bridgeInteractions: number,
  deployments: number
): CircleFootprintReport["evidenceCoverageBreakdown"] {
  const hasArcEvidence = categories.find((c) => c.id === "arc-native")?.status === "scored";
  const hasStablecoinEvidence = totalStablecoinTransfers > 0;
  const hasCrossChainEvidence = bridgeInteractions > 0;
  const hasProductEvidence = categories.find((c) => c.id === "circle-products")?.status === "scored";
  const hasHistoricalEvidence = activeDays >= 7;
  const availableSources = [sourcesOk, rpcOk].filter(Boolean).length;

  const arcCoverage = hasArcEvidence ? 80 : 20;
  const productCoverage = hasProductEvidence ? 70 : 15;
  const historicalCoverage = activeDays >= 30 ? 90 : activeDays >= 7 ? 60 : 25;
  const crossChainCoverage = hasCrossChainEvidence ? 80 : hasStablecoinEvidence ? 35 : 20;
  const sourceCoverage = Math.min(100, availableSources * 40 + 20);

  const components = [
    { label: "Arc coverage", value: arcCoverage },
    { label: "Circle product attribution", value: productCoverage },
    { label: "Historical depth", value: historicalCoverage },
    { label: "Cross-chain coverage", value: crossChainCoverage },
    { label: "Source availability", value: sourceCoverage },
  ];

  const overall = Math.round(components.reduce((sum, item) => sum + item.value, 0) / components.length);
  return { components, overall };
}

function scoreArcNative(txs: RawFacts["txs"], tokenTxs: RawFacts["tokenTxs"], me: Address, sourcesOk: boolean, rpcOk: boolean): CategoryScore {
  if (!sourcesOk && !rpcOk) return arcDisabled("Arc Native Usage");
  const successfulTxs = txs.filter((t) => t.isError === "0");
  const failedTxs = txs.filter((t) => t.isError !== "0");
  const days = Math.max(1, uniqueDays(txs, tokenTxs));
  const uniqInteractions = new Set(
    txs.filter((t) => t.to && t.isError === "0").map((t) => t.to!.toLowerCase()).filter((addr) => addr !== me.toLowerCase())
  ).size;

  let score0 = 0;
  if (successfulTxs.length >= 50 && days >= 30 && uniqInteractions >= 5) score0 = 100;
  else if (successfulTxs.length >= 20 && days >= 7 && uniqInteractions >= 3) score0 = 75;
  else if (successfulTxs.length >= 5 && days >= 2) score0 = 50;
  else if (successfulTxs.length >= 1) score0 = 25;
  else score0 = 0;

  return {
    id: "arc-native",
    label: "Arc Native Usage",
    description: "Observed Arc-native transaction activity, spread, and interaction diversity.",
    score: score0,
    maxScore: 100,
    status: "scored",
    weight: 0.20,
    summary:
      score0 >= 75
        ? `Established Arc activity over ${days} ${days === 1 ? "day" : "days"} with ${successfulTxs.length} successful transactions.`
        : score0 >= 50
        ? `Early Arc activity detected with ${successfulTxs.length} successful transactions across ${days} ${days === 1 ? "day" : "days"}.`
        : `Limited Arc history: ${successfulTxs.length} successful transaction(s) observed.`,
    evidence: [`${successfulTxs.length} successful transactions`, `${failedTxs.length} failed transactions`, `${days} active ${days === 1 ? "day" : "days"}`, `${uniqInteractions} unique counterparties`],
    notObserved: failedTxs.length > 0 ? [`${failedTxs.length} failed transaction(s)`] : [],
    source: "Arc Testnet RPC",
    limitations: "Does not imply official qualification or affiliation.",
  };
}

function scoreStablecoins(tokenTxs: RawFacts["tokenTxs"], usdcTxs: RawFacts["tokenTxs"], eurcTxs: RawFacts["tokenTxs"], usycTxs: RawFacts["tokenTxs"], sourcesOk: boolean, rpcOk: boolean): CategoryScore {
  if (!sourcesOk && !rpcOk) return arcDisabled("USDC and Stablecoin Activity");
  const days = Math.max(1, uniqueDays([], tokenTxs));

  if (tokenTxs.length === 0) {
    return {
      id: "stablecoins",
      label: "USDC and Stablecoin Activity",
      description: "Verified use of USDC, EURC, and USYC on Arc Testnet.",
      score: 0,
      maxScore: 100,
      status: "insufficient-data",
      weight: 0.20,
      summary: "No stablecoin transfer events observed.",
      evidence: [],
      notObserved: ["No USDC/EURC/USYC transfers observed on Arc Testnet"],
      source: "Arc Testnet token transfers",
      limitations: "Does not imply ownership or balances beyond observed transfers.",
    };
  }

  const meu = tokenTxs[0].from.toLowerCase();
  const uniqCounterparties = new Set(
    tokenTxs.map((t) => (t.to.toLowerCase() === meu ? t.from : t.to)).filter((addr) => addr.toLowerCase() !== meu)
  ).size;

  let score0 = 0;
  if (tokenTxs.length >= 20 && days >= 14 && uniqCounterparties >= 5) score0 = 100;
  else if (tokenTxs.length >= 10 && days >= 7) score0 = 80;
  else if (tokenTxs.length >= 3 && days >= 2) score0 = 55;
  else score0 = 30;

  const notes: string[] = [];
  if (usdcTxs.length) notes.push(`USDC transfers: ${usdcTxs.length}`);
  if (eurcTxs.length) notes.push(`EURC transfers: ${eurcTxs.length}`);
  if (usycTxs.length) notes.push(`USYC transfers: ${usycTxs.length}`);

  return {
    id: "stablecoins",
    label: "USDC and Stablecoin Activity",
    description: "Verified use of USDC, EURC, and USYC on Arc Testnet.",
    score: score0,
    maxScore: 100,
    status: "scored",
    weight: 0.20,
    summary: score0 > 55 ? `Recurring stablecoin activity: ${tokenTxs.length} transfers across ${days} ${days === 1 ? "day" : "days"}. ${notes.join(", ")}.` : `Limited stablecoin activity: ${tokenTxs.length} transfer(s).`,
    evidence: [`${tokenTxs.length} stablecoin transfers`, `${uniqCounterparties} unique counterparties`, `${days} active ${days === 1 ? "day" : "days"}`, ...notes],
    notObserved: [],
    source: "Arc Testnet token transfers",
    limitations: "Amounts are not interpreted as value; recurrence and counterparty diversity are weighted more.",
  };
}

function scoreCrossChain(txs: RawFacts["txs"], tokenTxs: RawFacts["tokenTxs"], me: Address, bridgeCount: number, sourcesOk: boolean, rpcOk: boolean): CategoryScore {
  if (!sourcesOk && !rpcOk) return arcDisabled("Circle Cross-Chain Usage");
  if (bridgeCount === 0) {
    return {
      id: "cross-chain",
      label: "Circle Cross-Chain Usage",
      description: "CCTP and Gateway interactions with verified contracts.",
      score: 0,
      maxScore: 100,
      status: "insufficient-data",
      weight: 0.20,
      summary: "No verified Circle cross-chain activity observed.",
      evidence: [],
      notObserved: ["No CCTP/Gateway interactions detected"],
      source: "CCTP + Gateway",
      limitations: "Cross-chain attribution requires official CCTP/Gateway contract interactions.",
    };
  }
  return {
    id: "cross-chain",
    label: "Circle Cross-Chain Usage",
    description: "CCTP and Gateway interactions with verified contracts.",
    score: Math.min(100, bridgeCount * 12),
    maxScore: 100,
    status: "scored",
    weight: 0.20,
    summary: `Verified Circle bridge activity: ${bridgeCount} CCTP/Gateway interaction(s).`,
    evidence: [`${bridgeCount} CCTP/Gateway interactions`],
    notObserved: [],
    source: "CCTP + Gateway verified contracts",
    limitations: "Does not prove successful cross-chain settlement without attestation data.",
  };
}

function scoreCircleProducts(txs: RawFacts["txs"], tokenTxs: RawFacts["tokenTxs"], me: Address, sourcesOk: boolean, rpcOk: boolean): CategoryScore {
  if (!sourcesOk && !rpcOk) return arcDisabled("Circle Product Interactions");
  const products = new Set<string>();
  for (const t of txs) {
    const to = t.to?.toLowerCase();
    if (to && to !== me.toLowerCase()) products.add(to);
  }
  for (const t of tokenTxs) {
    const c = t.contractAddress.toLowerCase();
    if (c) products.add(c);
  }

  if (products.size === 0) {
    return {
      id: "circle-products",
      label: "Circle Product Interactions",
      description: "Interactions with verified Circle contracts on Arc Testnet.",
      score: 0,
      maxScore: 100,
      status: "insufficient-data",
      weight: 0.15,
      summary: "No verified Circle product interactions observed.",
      evidence: [],
      notObserved: ["No StableFX, GatewayWallet, or other verified product interactions observed"],
      source: "Official contract registry",
      limitations: "Some products may be off-chain only and not attributable from public addresses.",
    };
  }

  return {
    id: "circle-products",
    label: "Circle Product Interactions",
    description: "Interactions with verified Circle contracts on Arc Testnet.",
    score: Math.min(100, 20 + products.size * 20),
    maxScore: 100,
    status: "scored",
    weight: 0.15,
    summary: `Verified Circle product usage detected: ${products.size} product(s).`,
    evidence: [`Products observed: ${products.size}`, `Registry-backed attribution`],
    notObserved: [],
    source: "Official contract registry",
    limitations: "Does not imply off-chain API or wallet product usage.",
  };
}

function scoreSustainedActivity(txs: RawFacts["txs"], tokenTxs: RawFacts["tokenTxs"], firstSeen: number | null, lastSeen: number | null, activeDays: number, failedTx: number, uniqCounterparties: number, sourcesOk: boolean, rpcOk: boolean): CategoryScore {
  if (!sourcesOk && !rpcOk) return arcDisabled("Sustained Financial Activity");
  if (activeDays === 0) {
    return {
      id: "sustained",
      label: "Sustained Financial Activity",
      description: "Time span, recurrence, counterparties, and execution quality.",
      score: 0,
      maxScore: 100,
      status: "insufficient-data",
      weight: 0.15,
      summary: "No observed sustained financial activity.",
      evidence: [],
      notObserved: ["Insufficient time-distributed evidence"],
      source: "Transaction history",
      limitations: "Behavioral labels do not imply identity, creditworthiness, or KYC status.",
    };
  }

  const days = Math.max(1, activeDays);
  const successfulTx = txs.filter((t) => t.isError === "0").length;
  const totalTx = txs.length;
  const successRatio = totalTx > 0 ? Math.round((successfulTx / totalTx) * 100) : 0;
  const ratioScore = Math.min(25, Math.round((successRatio / 100) * 25));
  const spanScore = Math.min(35, days * 3);
  const diversityScore = Math.min(25, uniqCounterparties * 5);
  const recurrenceScore = Math.min(15, days >= 14 ? 15 : days >= 3 ? 10 : 5);

  return {
    id: "sustained",
    label: "Sustained Financial Activity",
    description: "Time span, recurrence, counterparties, and execution quality.",
    score: ratioScore + spanScore + diversityScore + recurrenceScore,
    maxScore: 100,
    status: "scored",
    weight: 0.15,
    summary: `Observed over ${days} ${days === 1 ? "day" : "days"} with ${successRatio}% successful execution and ${uniqCounterparties} counterparties.`,
    evidence: [`${days} active ${days === 1 ? "day" : "days"}`, `Successful execution: ${successRatio}%`, `${uniqCounterparties} unique counterparties`],
    notObserved: [],
    source: "Transaction history",
    limitations: "No identity, intent, or credit conclusions are drawn.",
  };
}

function scoreBuilderFootprint(txs: RawFacts["txs"], deployments: number, toolInteractions: number, sourcesOk: boolean, rpcOk: boolean): CategoryScore {
  if (!sourcesOk && !rpcOk) return arcDisabled("Builder and Contract Footprint");
  if (deployments === 0 && toolInteractions === 0) {
    return {
      id: "builder",
      label: "Builder and Contract Footprint",
      description: "Deployments and verified Arc / Circle developer-primitive interactions.",
      score: 0,
      maxScore: 100,
      status: "insufficient-data",
      weight: 0.10,
      summary: "No verified builder evidence observed.",
      evidence: [],
      notObserved: ["No contract deployments or developer-primitive interactions found"],
      source: "Explorer + RPC",
      limitations: "Verified source code availability is limited by explorer support.",
    };
  }
  return {
    id: "builder",
    label: "Builder and Contract Footprint",
    description: "Deployments and verified Arc / Circle developer-primitive interactions.",
    score: Math.min(100, deployments * 40 + toolInteractions * 15),
    maxScore: 100,
    status: "scored",
    weight: 0.10,
    summary: `${deployments} deployment(s), ${toolInteractions} developer-tool interaction(s) observed.`,
    evidence: [`${deployments} deployment(s)`, `${toolInteractions} developer-tool interactions`],
    notObserved: [],
    source: "Explorer + RPC",
    limitations: "Verified-source detection requires explorer support.",
  };
}

function scoreEvidenceQuality(totalTx: number, activeDays: number, sourcesOk: boolean, rpcOk: boolean): CategoryScore {
  const available = [sourcesOk, rpcOk].filter(Boolean).length;
  const coverage = Math.min(100, available * 40 + activeDays * 2 + totalTx);

  if (coverage < 30 || totalTx < 3 || activeDays < 2) {
    return {
      id: "evidence",
      label: "Evidence Quality and Coverage",
      description: "Amount and completeness of evidence supporting all other categories.",
      score: coverage,
      maxScore: 100,
      status: "insufficient-data",
      weight: 0.10,
      summary: "Very limited evidence available.",
      evidence: [`${totalTx} transactions`, `${activeDays} active ${activeDays === 1 ? "day" : "days"}`, `${available}/2 sources available`],
      notObserved: ["Historical depth limited", "Cross-chain coverage unavailable"],
      source: "Source availability metrics",
      limitations: "Low coverage reduces confidence; does not artificially inflate other scores.",
    };
  }

  return {
    id: "evidence",
    label: "Evidence Quality and Coverage",
    description: "Amount and completeness of evidence supporting all other categories.",
    score: coverage,
    maxScore: 100,
    status: "scored",
    weight: 0.10,
    summary: `Moderate evidence coverage across ${available} source(s).`,
    evidence: [`${totalTx} transactions`, `${activeDays} active ${activeDays === 1 ? "day" : "days"}`, `${available}/2 sources available`],
    notObserved: [],
    source: "Source availability metrics",
    limitations: "Coverage reduces confidence for categories with limited underlying transactions.",
  };
}

function arcDisabled(label: string): CategoryScore {
  return {
    id: label.toLowerCase().replace(/ /g, "-"),
    label,
    description: "Data unavailable for this category.",
    score: 0,
    maxScore: 100,
    status: "not-assessed",
    weight: undefined,
    summary: "Not assessed due to unavailable data sources.",
    evidence: [],
    notObserved: [],
    source: "N/A",
    limitations: "Category will be scored when source data becomes available.",
  };
}

function deriveProfile(txs: number, bridge: number, deployments: number, stable: number, usdc: number, eurc: number, usyc: number, days: number): ArcProfile {
  if (txs === 0 && stable === 0) return "No Verified Arc Footprint Yet";
  if (txs <= 4 && stable === 0) return "Limited Arc Explorer";
  if (stable > 0 && txs <= 10) return "Early Stablecoin Explorer";
  if (stable > 10 && bridge === 0) return "Recurring USDC User";
  if (bridge > 0 && stable > 0) return "Circle Cross-Chain User";
  if (bridge > 0 && stable === 0) return "Arc Application User";
  if (deployments > 0) return "Arc Contract Deployer";
  return "Sustained Arc Ecosystem Participant";
}

function deriveConfidence(activeDays: number, totalTx: number, categories: CategoryScore[]): ConfidenceLevel {
  if (totalTx < 5) return "Low";
  if (activeDays < 7) return "Low";
  if (activeDays >= 7 && totalTx >= 20) return "Moderate";
  if (activeDays >= 30 && totalTx >= 50) return "High";
  return "Moderate";
}
