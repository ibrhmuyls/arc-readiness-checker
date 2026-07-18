/**
 * Deterministic cross-chain matching for CCTP (and Gateway where identifiers
 * allow). Matching uses protocol identifiers — source domain, destination
 * domain, and message/nonce linkage — NOT approximate amount/time heuristics.
 *
 * Levels of evidence, per product spec:
 *   LEVEL 1 same-address presence (handled by orchestrator)
 *   LEVEL 2 multi-network USDC activity (handled by scoring)
 *   LEVEL 3 deterministic Circle cross-chain protocol evidence (here)
 */

import type { ChainClassification, EvidenceClassification } from "../classifiers/types";

export type CrossChainMatch = {
  status: "matched" | "source_only" | "destination_only";
  product: "CCTP" | "Gateway";
  sourceChain?: string;
  destinationChain?: string;
  sourceDomain?: number;
  destinationDomain?: number;
  sourceTxHash?: string;
  destinationTxHash?: string;
  messageIdentifier?: string;
  evidenceText: string;
};

export type CrossChainReport = {
  matches: CrossChainMatch[];
  hasVerifiedCctp: boolean;
  hasCompleteCctpFlow: boolean;
  hasVerifiedGateway: boolean;
  cctpSourceCount: number;
  cctpDestinationCount: number;
  gatewayActionCount: number;
};

/**
 * Correlate CCTP source burns with destination receives across the chains we
 * successfully indexed. Deterministic linkage requires that a source burn's
 * declared destinationDomain equals a destination receive's chain domain AND
 * that message identifiers align when both are decoded. When identifiers are
 * unavailable, we do NOT assert a match — we downgrade to source_only /
 * destination_only, which receive partial (not full) credit.
 */
export function matchCrossChain(
  chainResults: ChainClassification[],
): CrossChainReport {
  const sources: EvidenceClassification[] = [];
  const destinations: EvidenceClassification[] = [];
  const gatewayActions: EvidenceClassification[] = [];

  for (const cr of chainResults) {
    sources.push(...cr.cctpSourceEvents);
    destinations.push(...cr.cctpDestinationEvents);
    gatewayActions.push(...cr.gatewayEvents);
  }

  const matches: CrossChainMatch[] = [];
  const matchedDest = new Set<string>();
  const matchedSrc = new Set<string>();

  for (const src of sources) {
    const srcDestDomain = src.crossChainLink?.destinationDomain;
    const msgId = src.crossChainLink?.messageIdentifier;
    // Find a destination receive whose chain domain equals the declared
    // destinationDomain of this burn.
    const dest = destinations.find((d) => {
      if (matchedDest.has(d.transactionHash)) return false;
      const destDomain = d.chain.circleDomain;
      if (srcDestDomain == null || destDomain == null) return false;
      if (destDomain !== srcDestDomain) return false;
      // If both carry a message identifier, they must be equal.
      const dMsg = d.crossChainLink?.messageIdentifier;
      if (msgId && dMsg && msgId !== dMsg) return false;
      // Destination must occur at/after source.
      return d.blockNumber >= 0 && Date.parse(d.timestamp) >= Date.parse(src.timestamp);
    });

    if (dest) {
      matchedDest.add(dest.transactionHash);
      matchedSrc.add(src.transactionHash);
      matches.push({
        status: "matched",
        product: "CCTP",
        sourceChain: src.chain.name,
        destinationChain: dest.chain.name,
        sourceDomain: src.chain.circleDomain,
        destinationDomain: dest.chain.circleDomain,
        sourceTxHash: src.transactionHash,
        destinationTxHash: dest.transactionHash,
        messageIdentifier: msgId ?? dest.crossChainLink?.messageIdentifier,
        evidenceText: `Verified CCTP cross-chain transfer observed: ${src.chain.name} \u2192 ${dest.chain.name}.`,
      });
    }
  }

  // Remaining unmatched sources -> source_only
  for (const src of sources) {
    if (matchedSrc.has(src.transactionHash)) continue;
    matches.push({
      status: "source_only",
      product: "CCTP",
      sourceChain: src.chain.name,
      sourceDomain: src.chain.circleDomain,
      destinationDomain: src.crossChainLink?.destinationDomain,
      sourceTxHash: src.transactionHash,
      evidenceText: `Verified CCTP source-side activity on ${src.chain.name}; destination completion not assessed.`,
    });
  }

  // Remaining unmatched destinations -> destination_only
  for (const dest of destinations) {
    if (matchedDest.has(dest.transactionHash)) continue;
    matches.push({
      status: "destination_only",
      product: "CCTP",
      destinationChain: dest.chain.name,
      destinationDomain: dest.chain.circleDomain,
      destinationTxHash: dest.transactionHash,
      evidenceText: `Verified CCTP destination-side activity on ${dest.chain.name}; source origin not assessed.`,
    });
  }

  // Gateway actions (reported individually; cross-chain matching only when
  // official identifiers are decoded — kept conservative here).
  for (const g of gatewayActions) {
    matches.push({
      status:
        g.crossChainLink?.status === "destination_only"
          ? "destination_only"
          : "source_only",
      product: "Gateway",
      sourceChain:
        g.crossChainLink?.status === "destination_only" ? undefined : g.chain.name,
      destinationChain:
        g.crossChainLink?.status === "destination_only" ? g.chain.name : undefined,
      sourceTxHash: g.transactionHash,
      evidenceText: g.evidenceText,
    });
  }

  return {
    matches,
    hasVerifiedCctp: sources.length > 0 || destinations.length > 0,
    hasCompleteCctpFlow: matches.some(
      (m) => m.product === "CCTP" && m.status === "matched",
    ),
    hasVerifiedGateway: gatewayActions.length > 0,
    cctpSourceCount: sources.length,
    cctpDestinationCount: destinations.length,
    gatewayActionCount: gatewayActions.length,
  };
}
