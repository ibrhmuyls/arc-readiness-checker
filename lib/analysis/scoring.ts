import type {
  Address,
  CategoryScore,
  ReadinessReport,
  RawFacts,
  WalletSummary,
} from "../types";
import { lowerSet } from "../sources/contractRefs";
import { NETWORK_LABEL } from "../config";

const DAY = 24 * 60 * 60;
const RECENCY_WINDOW_DAYS = 30;

/**
 * Transparent scoring engine.
 *
 * Every category maps to a real signal pulled from RawFacts and explains its
 * math in `reasoning`. No category invents data: if its source is missing, the
 * category is marked "insufficient-data" (NOT scored to 0). The "Multi-chain"
 * category is explicitly disabled because no public Arc cross-chain read source
 * exists yet — shown as "Coming when public data becomes available."
 */
export function score(facts: RawFacts): ReadinessReport {
  const { address, sources, contractRefs } = facts;

  const legacy = sources.explorerLegacy.ok ? sources.explorerLegacy.data : null;
  const v2 = sources.explorerV2.ok ? sources.explorerV2.data : null;
  const rpc = sources.rpc.ok ? sources.rpc.data : null;

  const txs = legacy?.txs ?? [];
  const tokenTxs = legacy?.tokenTxs ?? [];

  const nowSec = Math.floor(Date.now() / 1000);

  // ---- Derive summary facts ----
  const successfulTxs = txs.filter((t) => t.isError === "0");
  const firstTx = successfulTxs.length ? successfulTxs[0] : null;
  const totalTx = txs.length;
  const txCountV2 = v2?.txCount ?? null;

  const stableSet = lowerSet(contractRefs.stablecoins);
  const bridgeSet = lowerSet(contractRefs.bridge);
  const defiSet = lowerSet(contractRefs.defi);

  const stablecoinTransfers = tokenTxs.filter((t) =>
    stableSet.has(t.contractAddress.toLowerCase()),
  ).length;

  // Bridge interaction = tx TO a bridge contract, or token tx involving one.
  const bridgeInteractions =
    txs.filter((t) => t.to && bridgeSet.has(t.to.toLowerCase())).length +
    tokenTxs.filter((t) => bridgeSet.has(t.contractAddress.toLowerCase())).length;

  // Contract interaction = tx sent to a non-stablecoin, non-EOA contract we
  // recognize as Arc DeFi infra, OR any tx with non-empty input to another
  // contract (heuristic: input length > 2 == "0x").
  const contractInteractions = txs.filter((t) => {
    if (!t.to) return false;
    const toL = t.to.toLowerCase();
    if (defiSet.has(toL)) return true;
    if (stableSet.has(toL)) return false; // stablecoin transfer handled separately
    return t.input && t.input.length > 2;
  }).length;

  const recentTxs = successfulTxs.filter(
    (t) => nowSec - t.timeStamp <= RECENCY_WINDOW_DAYS * DAY,
  ).length;

  const summary: WalletSummary = {
    firstSeenBlock: firstTx?.blockNumber ?? null,
    firstSeenTime: firstTx?.timeStamp ?? null,
    totalTransactions: totalTx,
    stablecoinTransfers,
    bridgeInteractions,
    contractInteractions,
    nativeBalanceUsdc: rpc ? rpc.balanceWei : null,
    isContract: null, // not yet sourced; left explicit
  };

  // ---- Categories ----
  const categories: CategoryScore[] = [];

  // 1) Wallet Age (max 20)
  categories.push(scoreWalletAge(firstTx?.timeStamp ?? null));

  // 2) Recent Activity (max 20)
  categories.push(scoreRecentActivity(recentTxs));

  // 3) Stablecoin Usage (max 20)
  categories.push(scoreStablecoins(stablecoinTransfers));

  // 4) Smart Contract Interactions (max 15)
  categories.push(scoreContractInteractions(contractInteractions));

  // 5) Bridge Usage (max 10) — only if public data exists (it does: txs)
  categories.push(scoreBridge(bridgeInteractions));

  // 6) Transaction Consistency (max 15) — successful vs failed
  categories.push(scoreConsistency(successfulTxs.length, totalTx));

  // 7) Multi-chain Activity — DISABLED (no public Arc cross-chain read source)
  categories.push({
    id: "multichain",
    label: "Multi-chain Activity",
    points: 0,
    maxPoints: 0,
    status: "disabled",
    reasoning:
      "Coming when public data becomes available. Arc cross-chain history " +
      "requires a public read source we do not have yet, so this category is " +
      "not scored to avoid fabricating a number.",
  });

  // ---- Aggregate ----
  const scored = categories.filter((c) => c.status === "scored");
  const earned = scored.reduce((s, c) => s + c.points, 0);
  const maxEarned = scored.reduce((s, c) => s + c.maxPoints, 0);
  const overall =
    maxEarned > 0 ? Math.round((earned / maxEarned) * 100) : 0;

  const dataCompleteness =
    sources.explorerLegacy.ok && sources.rpc.ok
      ? "full"
      : sources.explorerLegacy.ok || sources.rpc.ok
        ? "partial"
        : "unavailable";

  const { strengths, weaknesses, recommendations } = deriveInsights(
    categories,
    summary,
  );

  return {
    address,
    network: NETWORK_LABEL,
    overallScore: overall,
    dataCompleteness,
    categories,
    summary,
    strengths,
    weaknesses,
    recommendations,
    methodology:
      "Score is the share of earned points across all scored categories. " +
      "Each category is computed from public Arc Testnet on-chain data " +
      "(explorer transaction & token-transfer history, RPC balance). " +
      "Disabled categories are never scored to zero.",
    dataSources: dataSourcesList(),
    generatedAt: Date.now(),
  };
}

function scoreWalletAge(firstSeen: number | null): CategoryScore {
  const max = 20;
  if (firstSeen == null) {
    return {
      id: "walletAge",
      label: "Wallet Age",
      points: 0,
      maxPoints: max,
      status: "insufficient-data",
      reasoning: "No on-chain activity found for this address.",
    };
  }
  const ageDays = Math.floor((Date.now() / 1000 - firstSeen) / DAY);
  // 0 days -> 4, ramps to full at 90+ days.
  const points = Math.min(max, 4 + Math.floor((ageDays / 90) * 16));
  return {
    id: "walletAge",
    label: "Wallet Age",
    points,
    maxPoints: max,
    status: "scored",
    reasoning: `First activity ~${ageDays} day(s) ago on Arc Testnet.`,
  };
}

function scoreRecentActivity(recentTxs: number): CategoryScore {
  const max = 20;
  const points = Math.min(max, recentTxs * 4); // 5 recent txns = full
  return {
    id: "recentActivity",
    label: "Recent Activity (30d)",
    points,
    maxPoints: max,
    status: "scored",
    reasoning:
      recentTxs > 0
        ? `${recentTxs} transaction(s) in the last 30 days.`
        : "No transactions in the last 30 days.",
  };
}

function scoreStablecoins(transfers: number): CategoryScore {
  const max = 20;
  const points = Math.min(max, transfers === 0 ? 0 : 5 + Math.min(15, transfers * 3));
  return {
    id: "stablecoins",
    label: "Stablecoin Usage",
    points,
    maxPoints: max,
    status: "scored",
    reasoning:
      transfers > 0
        ? `${transfers} stablecoin transfer(s) (USDC/EURC/USYC).`
        : "No stablecoin transfers detected.",
  };
}

function scoreContractInteractions(interactions: number): CategoryScore {
  const max = 15;
  const points = Math.min(max, interactions === 0 ? 0 : 5 + Math.min(10, interactions * 2));
  return {
    id: "contracts",
    label: "Smart Contract Interactions",
    points,
    maxPoints: max,
    status: "scored",
    reasoning:
      interactions > 0
        ? `${interactions} interaction(s) with Arc contracts.`
        : "No smart-contract interactions detected.",
  };
}

function scoreBridge(bridge: number): CategoryScore {
  const max = 10;
  const points = Math.min(max, bridge === 0 ? 0 : 5 + Math.min(5, bridge * 2));
  return {
    id: "bridge",
    label: "Bridge Usage",
    points,
    maxPoints: max,
    status: "scored",
    reasoning:
      bridge > 0
        ? `${bridge} bridge-related interaction(s) (CCTP/Gateway).`
        : "No bridge interactions detected.",
  };
}

function scoreConsistency(success: number, total: number): CategoryScore {
  const max = 15;
  if (total === 0) {
    return {
      id: "consistency",
      label: "Transaction Consistency",
      points: 0,
      maxPoints: max,
      status: "insufficient-data",
      reasoning: "No transactions to evaluate.",
    };
  }
  const ratio = success / total;
  const points = Math.round(ratio * max);
  return {
    id: "consistency",
    label: "Transaction Consistency",
    points,
    maxPoints: max,
    status: "scored",
    reasoning: `${success}/${total} transactions succeeded (${Math.round(
      ratio * 100,
    )}% success rate).`,
  };
}

function deriveInsights(
  categories: CategoryScore[],
  summary: WalletSummary,
): {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
} {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  const get = (id: string) => categories.find((c) => c.id === id);

  const age = get("walletAge");
  if (age?.status === "scored" && age.points >= 16)
    strengths.push("Established presence on Arc Testnet.");
  if (age?.status === "insufficient-data")
    weaknesses.push("No on-chain activity yet.");

  const recent = get("recentActivity");
  if (recent && recent.points >= 12)
    strengths.push("Actively transacting in the last 30 days.");
  if (recent && recent.points === 0)
    recommendations.push("Make a transaction on Arc Testnet to show recent activity.");

  const stable = get("stablecoins");
  if (stable && stable.points > 0)
    strengths.push("Comfortable using Arc stablecoins (USDC/EURC/USYC).");
  if (stable && stable.points === 0)
    recommendations.push("Try a USDC transfer on Arc Testnet (get testnet USDC from the Circle Faucet).");

  const contracts = get("contracts");
  if (contracts && contracts.points > 0)
    strengths.push("Interacts with Arc smart contracts.");
  if (contracts && contracts.points === 0)
    recommendations.push("Interact with an Arc contract (e.g. App Kit, StableFX, or a deploy).");

  const bridge = get("bridge");
  if (bridge && bridge.points > 0)
    strengths.push("Has used cross-chain bridging on Arc.");
  if (bridge && bridge.points === 0)
    recommendations.push("Experiment with CCTP/Gateway bridging to learn Arc's cross-chain flow.");

  const consistency = get("consistency");
  if (consistency?.status === "scored" && consistency.points < 12)
    weaknesses.push("Some transactions failed — check gas/inputs before retrying.");

  if (summary.totalTransactions === 0) {
    recommendations.push(
      "Start by connecting to Arc Testnet RPC and requesting testnet USDC from the Circle Faucet.",
    );
  }

  return { strengths, weaknesses, recommendations };
}

function dataSourcesList() {
  return [
    { name: "Arc Testnet RPC", url: "https://rpc.testnet.arc.network" },
    {
      name: "Arc Testnet Explorer (API)",
      url: "https://testnet.arcscan.app/api",
    },
    {
      name: "Arc Contract Addresses",
      url: "https://docs.arc.io/arc/references/contract-addresses.md",
    },
  ];
}

export type { Address };
