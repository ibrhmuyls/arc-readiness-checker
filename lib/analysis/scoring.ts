import type { Address, CategoryScore, RawFacts, WalletSummary, ArcProfile } from "../types";
import { lowerSet } from "../sources/contractRefs";
import { NETWORK_LABEL } from "../config";

const DAY = 24 * 60 * 60;

/**
 * Arc Ecosystem Readiness Score.
 *
 * Categories are Arc-specific: they measure participation in the stablecoin-
 * native, cross-chain, settlement, and builder ecosystem — not generic EVM
 * activity. If a category's evidence is absent it is marked insufficient-data
 * rather than zero. Disabled categories never influence the score.
 */
export function score(facts: RawFacts) {
  const { address, sources, contractRefs } = facts;

  const legacy = sources.explorerLegacy.ok ? sources.explorerLegacy.data : null;
  const v2 = sources.explorerV2.ok ? sources.explorerV2.data : null;
  const rpc = sources.rpc.ok ? sources.rpc.data : null;

  const txs = legacy?.txs ?? [];
  const tokenTxs = legacy?.tokenTxs ?? [];

  const nowSec = Math.floor(Date.now() / 1000);

  const successfulTxs = txs.filter((t) => t.isError === "0");
  const failedTxs = txs.filter((t) => t.isError === "1");
  const totalTx = txs.length;

  const stableSet = lowerSet(contractRefs.stablecoins);
  const bridgeSet = lowerSet(contractRefs.bridge);
  const builderSet = lowerSet(contractRefs.builder);

  const usdcTokenTxs = tokenTxs.filter((t) => t.contractAddress.toLowerCase() === "0x3600000000000000000000000000000000000000").length;
  const eurcTokenTxs = tokenTxs.filter((t) => t.contractAddress.toLowerCase() === "0x89b50855aa3be2f677cd6303cec089b5f319d72a").length;
  const usycTokenTxs = tokenTxs.filter((t) => t.contractAddress.toLowerCase() === "0xe9185f0c5f296ed1797aae4238d26ccabeadb86c").length;

  const stablecoinTransfers = tokenTxs.filter((t) => stableSet.has(t.contractAddress.toLowerCase())).length;

  const bridgeInteractions =
    txs.filter((t) => t.to && bridgeSet.has(t.to.toLowerCase())).length +
    tokenTxs.filter((t) => bridgeSet.has(t.contractAddress.toLowerCase())).length;

  const developerToolInteractions =
    txs.filter((t) => t.to && builderSet.has(t.to.toLowerCase())).length +
    tokenTxs.filter((t) => builderSet.has(t.contractAddress.toLowerCase())).length;

  const contractDeployments = txs.filter((t) => t.to === null && t.input && t.input.length > 2).length;

  // Duration of activity span (first to last successful txn).
  const firstSuccess = successfulTxs[successfulTxs.length - 1] ?? null;
  const lastSuccess = successfulTxs[0] ?? null;
  const activitySpanDays =
    firstSuccess && lastSuccess
      ? Math.max(1, Math.round((lastSuccess.timeStamp - firstSuccess.timeStamp) / DAY))
      : 0;

  const summary: WalletSummary = {
    firstSeenBlock: lastSuccess?.blockNumber ?? null,
    firstSeenTime: lastSuccess?.timeStamp ?? null,
    totalTransactions: totalTx,
    successfulTransactions: successfulTxs.length,
    failedTransactions: failedTxs.length,
    stablecoinTransfers,
    usdcTransfers: usdcTokenTxs,
    eurcTransfers: eurcTokenTxs,
    usycTransfers: usycTokenTxs,
    bridgeInteractions,
    developerToolInteractions,
    contractDeployments,
    nativeBalanceUsdc: rpc ? rpc.balanceWei : null,
    isContract: null,
  };

  const categories = [
    scoreStablecoinReadiness(stablecoinTransfers, usdcTokenTxs, eurcTokenTxs, usycTokenTxs),
    scoreSettlementReadiness(successfulTxs.length, failedTxs.length, activitySpanDays),
    scoreCrosschainReadiness(bridgeInteractions),
    scoreFinancialUsage(stablecoinTransfers, bridgeInteractions, txs),
    scoreBuilderReadiness(developerToolInteractions, contractDeployments, txs),
    multichainDisabled(),
  ];

  const scored = categories.filter((c) => c.status === "scored");
  const earned = scored.reduce((s, c) => s + c.points, 0);
  const maxEarned = scored.reduce((s, c) => s + c.maxPoints, 0);
  const overall = maxEarned > 0 ? Math.round((earned / maxEarned) * 100) : 0;

  const dataCompleteness =
    sources.explorerLegacy.ok && sources.rpc.ok
      ? "full"
      : sources.explorerLegacy.ok || sources.rpc.ok
        ? "partial"
        : "unavailable";

  const profile = deriveArcProfile(categories, summary);

  const recommendations = deriveRecommendations(categories, summary);

  return {
    address,
    network: NETWORK_LABEL,
    overallScore: overall,
    dataCompleteness,
    categories,
    profile,
    summary,
    recommendations,
    methodology: overallMethodology(),
    dataSources: dataSourcesList(),
    limitations: [
      "Only public Arc Testnet endpoints are used.",
      "Cross-chain history is limited to direct contract interactions.",
      "App Kit / StableFX usage is inferred from on-chain interactions with known addresses.",
      "No mainnet data is available; this score applies only to Arc Testnet.",
    ],
    generatedAt: Date.now(),
  };
}

/* ---------- Categories ---------- */

function scoreStablecoinReadiness(
  total: number,
  usdc: number,
  eurc: number,
  usyc: number,
): CategoryScore {
  const max = 25;
  const diversity = [usdc > 0, eurc > 0, usyc > 0].filter(Boolean).length;
  // Weighted: total volume matters, but diversity is a strong Arc-specific signal.
  const points = Math.min(max, total === 0 ? 0 : 8 + Math.min(10, total * 2) + diversity * 3);
  const hasAny = total > 0;
  return {
    id: "stablecoin",
    label: "Stablecoin Readiness",
    description: "How actively the wallet uses Arc's native stablecoins (USDC, EURC, USYC).",
    points,
    maxPoints: max,
    status: "scored",
    reasoning: hasAny
      ? `${total} detected stablecoin transfer(s) across ${diversity} token(s) (USDC ${usdc}, EURC ${eurc}, USYC ${usyc}).`
      : "No stablecoin transfers detected.",
    source: "testnet.arcscan.app/api?module=account&action=tokentx",
    limitations: "Only ERC-20 transfers are visible; native-interface transfers are inferred from system Transfer logs, not used here to avoid double-counting.",
  };
}

function scoreSettlementReadiness(success: number, failed: number, spanDays: number): CategoryScore {
  const max = 25;
  if (success === 0) {
    return {
      id: "settlement",
      label: "Settlement Readiness",
      description: "How reliably the wallet participates as a settlement actor on Arc.",
      points: 0,
      maxPoints: max,
      status: "insufficient-data",
      reasoning: "No successful transactions found.",
      source: "testnet.arcscan.app/api?module=account&action=txlist",
      limitations: "Success is inferred from isError='0'; on-chain revert semantics may not match every application-level failure.",
    };
  }
  const successRatio = success / (success + failed);
  const spanScore = Math.min(8, spanDays === 0 ? 0 : 3 + Math.min(5, spanDays));
  const points = Math.round(successRatio * (max - spanScore)) + spanScore;
  return {
    id: "settlement",
    label: "Settlement Readiness",
    description: "How reliably the wallet participates as a settlement actor on Arc.",
    points: Math.min(max, points),
    maxPoints: max,
    status: "scored",
    reasoning: `${success} successful, ${failed} failed transaction(s). Activity spans ~${spanDays} day(s) with ${Math.round(successRatio * 100)}% success rate.`,
    source: "testnet.arcscan.app/api + rpc.testnet.arc.network",
    limitations: "Span is approximated from first/last successful transactions; internal txs or failed-but-included txs may extend effective activity.",
  };
}

function scoreCrosschainReadiness(count: number): CategoryScore {
  const max = 20;
  if (count === 0) {
    return {
      id: "crosschain",
      label: "Cross-chain Readiness",
      description: "Bridge and cross-chain protocol usage via public on-chain interactions.",
      points: 0,
      maxPoints: max,
      status: "insufficient-data",
      reasoning: "No interaction with known Arc bridge contracts (CCTP / Gateway).",
      source: "testnet.arcscan.app/api + docs.arc.io/arc/references/contract-addresses.md",
      limitations: "Direct contract interactions only; cross-chain state via off-chain APIs is not available.",
    };
  }
  return {
    id: "crosschain",
    label: "Cross-chain Readiness",
    description: "Bridge and cross-chain protocol usage via public on-chain interactions.",
    points: Math.min(max, 6 + count * 3),
    maxPoints: max,
    status: "scored",
    reasoning: `${count} bridge-related interaction(s) with CCTP/Gateway contracts.`,
    source: "testnet.arcscan.app/api + docs.arc.io/arc/references/contract-addresses.md",
    limitations: "Only direct contract interactions are counted; protocol-level message status is not exposed via public APIs.",
  };
}

function scoreFinancialUsage(stableTransfers: number, bridgeTx: number, txs: RawTx[]): CategoryScore {
  const max = 20;
  // Detect structured/patterned behavior: repeated value transfers, memoized txs.
  const memoLike = txs.filter((t) => t.input && t.input !== "0x" && t.input.length > 10).length;
  const repeatedCounter = new Map<string, number>();
  for (const t of txs.filter((t) => t.to)) {
    repeatedCounter.set(t.to!, (repeatedCounter.get(t.to!) ?? 0) + 1);
  }
  const hasRepeatedPayee = [...repeatedCounter.values()].some((n) => n >= 3);

  if (stableTransfers === 0 && memoLike === 0 && !hasRepeatedPayee) {
    return {
      id: "financial",
      label: "Financial Usage",
      description: "Payment, treasury, and FX-like behavior in stablecoin workflows.",
      points: 0,
      maxPoints: max,
      status: "insufficient-data",
      reasoning: "No stablecoin transfers or repeated payment patterns detected.",
      source: "testnet.arcscan.app/api",
      limitations: "Pattern detection is heuristic-only; intent cannot be inferred from on-chain data alone.",
    };
  }

  const patternScore = hasRepeatedPayee ? 4 : 0;
  const memoScore = Math.min(4, memoLike * 2);
  const volumeScore = Math.min(max - patternScore - memoScore, stableTransfers * 2);
  const points = Math.min(max, patternScore + memoScore + volumeScore);

  return {
    id: "financial",
    label: "Financial Usage",
    description: "Payment, treasury, and FX-like behavior in stablecoin workflows.",
    points,
    maxPoints: max,
    status: "scored",
    reasoning: `${stableTransfers} stablecoin transfer(s), ${memoLike} possibly-memoized transaction(s).${hasRepeatedPayee ? " Repeated payee pattern detected." : ""}`,
    source: "testnet.arcscan.app/api",
    limitations: "Pattern detection is heuristic-only; intent cannot be inferred from on-chain data alone.",
  };
}

function scoreBuilderReadiness(devToolTx: number, deployments: number, txs: RawTx[]): CategoryScore {
  const max = 10;
  if (devToolTx === 0 && deployments === 0) {
    return {
      id: "builder",
      label: "Builder Readiness",
      description: "Developer activity: contract interactions, deployments, and tool usage.",
      points: 0,
      maxPoints: max,
      status: "insufficient-data",
      reasoning: "No known developer-tool or contract-deployment activity detected.",
      source: "testnet.arcscan.app/api + docs.arc.io/arc/references/contract-addresses.md",
      limitations: "Only interactions with a small static set of known developer contracts are detectable; custom toolchains are opaque.",
    };
  }
  return {
    id: "builder",
    label: "Builder Readiness",
    description: "Developer activity: contract interactions, deployments, and tool usage.",
    points: Math.min(max, 4 + devToolTx * 2 + deployments * 2),
    maxPoints: max,
    status: "scored",
    reasoning: `${devToolTx} developer-tool interaction(s), ${deployments} contract deployment(s) detected.`,
    source: "testnet.arcscan.app/api + docs.arc.io/arc/references/contract-addresses.md",
    limitations: "Only interactions with a small static set of known developer contracts are detectable; custom toolchains are opaque.",
  };
}

function multichainDisabled(): CategoryScore {
  return {
    id: "multichain",
    label: "Multi-chain Activity",
    description: "Activity across Arc and other chains.",
    points: 0,
    maxPoints: 0,
    status: "disabled",
    reasoning:
      "Coming when public data becomes available. Arc does not expose a public cross-chain wallet attribution source yet.",
    source: "N/A — disabled",
    limitations: "Disabled by policy; would require third-party multi-chain attribution API.",
  };
}

/* ---------- Insights ---------- */

function deriveArcProfile(categories: CategoryScore[], summary: WalletSummary): ArcProfile {
  if (summary.totalTransactions === 0) return "New Participant";
  const byId = Object.fromEntries(categories.map((c) => [c.id, c]));
  const stablePoints = (byId["stablecoin"] as CategoryScore | undefined)?.points ?? 0;
  const settlePoints = (byId["settlement"] as CategoryScore | undefined)?.points ?? 0;
  const ccPoints = (byId["crosschain"] as CategoryScore | undefined)?.points ?? 0;
  const finPoints = (byId["financial"] as CategoryScore | undefined)?.points ?? 0;
  const buildPoints = (byId["builder"] as CategoryScore | undefined)?.points ?? 0;

  if (buildPoints >= 8 && settlePoints >= 15) return "Builder";
  if (ccPoints >= 12 && stablePoints >= 12) return "Cross-chain Ready";
  if (finPoints >= 12 && stablePoints >= 15) return "Financial User";
  if (stablePoints >= 18 && settlePoints >= 15) return "Stablecoin Native User";
  if (settlePoints >= 18) return "Settlement Focused";
  if (summary.contractDeployments > 0 || summary.developerToolInteractions > 0) return "Infrastructure User";
  if (summary.bridgeInteractions > 0 && stablePoints > 0) return "Payment User";
  if (stablePoints >= 8 || settlePoints >= 8) return "Settlement Focused";
  return "Low Activity";
}

function deriveRecommendations(categories: CategoryScore[], summary: WalletSummary): string[] {
  const out: string[] = [];
  const byId = Object.fromEntries(categories.map((c) => [c.id, c]));

  const stable = byId["stablecoin"] as CategoryScore | undefined;
  if (!stable || stable.points === 0) {
    out.push("Obtain Arc Testnet USDC from the Circle Faucet and make a stablecoin transfer.");
  }

  const settle = byId["settlement"] as CategoryScore | undefined;
  if (settle && settle.points < 15) {
    out.push("Build consistent settlement behavior: repeated USDC transfers improve your reliability profile.");
  }

  const cc = byId["crosschain"] as CategoryScore | undefined;
  if (cc && cc.points === 0) {
    out.push("Try CCTP or Gateway when public cross-chain data becomes available.");
  }

  const fin = byId["financial"] as CategoryScore | undefined;
  if (fin && fin.points === 0) {
    out.push("Use stablecoins for repeat transfers or Memo-tagged transactions.");
  }

  const build = byId["builder"] as CategoryScore | undefined;
  if (build && build.points === 0) {
    out.push("Interact with Arc developer primitives (Multicall3, Permit2, StableFX) or deploy a contract.");
  }

  if (out.length === 0) {
    out.push("This wallet shows strong Arc-native behavior. Keep building on Arc Testnet.");
  }

  return out;
}

/* ---------- Static strings (keeps reports reproducible) ---------- */

function overallMethodology(): string {
  return [
    "The Arc Ecosystem Readiness Score is a transparent percentage:",
    `overall = round( earned / maxEarnable * 100 )`,
    "Earned comes from 5 Arc-specific categories plus Settlement Readiness (6 total).",
    "Multi-chain Activity is disabled until a public Arc cross-chain attribution source exists.",
    "Each category is computed from public Arc Testnet on-chain data (Blockscout Explorer tx/token history + Arc RPC).",
    "A category with no measurable evidence is marked insufficient-data, not zero.",
    "Results apply only to Arc Testnet and do not imply mainnet readiness.",
  ].join(" ");
}

function dataSourcesList() {
  return [
    { name: "Arc Testnet RPC", url: "https://rpc.testnet.arc.network", usedFor: "Balance, chain sanity, block sanity" },
    { name: "Arc Testnet Explorer (Blockscout)", url: "https://testnet.arcscan.app", usedFor: "Transaction history, token transfers, timestamps" },
    { name: "Arc Contract Addresses (Testnet)", url: "https://docs.arc.io/arc/references/contract-addresses.md", usedFor: "Stablecoin, bridge, and developer contract detection" },
    { name: "Arc Documentation / llms.txt", url: "https://docs.arc.io", usedFor: "Methodology and Arc context" },
  ];
}
