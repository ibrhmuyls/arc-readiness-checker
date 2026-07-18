/**
 * Analysis orchestrator — the top-level pipeline.
 *
 * address -> normalize -> build providers -> index each chain in parallel ->
 * classify each successfully indexed chain -> cross-chain match -> score ->
 * build report.
 *
 * Distinguishes "not assessed" (could not query) from "no activity"
 * (queried successfully, nothing found) at every layer.
 */

import { classifyChain } from "../classifiers/classify";
import type { ChainClassification } from "../classifiers/types";
import { matchCrossChain } from "../crosschain/match";
import { buildProviders } from "../providers";
import { EVM_CHAINS } from "../registry/chains";
import { computeScores } from "../scoring/score";
import { normalizeAddress } from "../validation";
import { buildReport } from "./build";
import type { FootprintReport } from "./types";

export async function analyzeAddress(rawAddress: string): Promise<FootprintReport> {
  const address = normalizeAddress(rawAddress);
  const providers = buildProviders();

  const results = await Promise.all(
    providers.map(async (p) => {
      if (!p.isAvailable()) {
        return {
          ok: false as const,
          notAssessed: true,
          chain: p.chain,
          reason:
            p.chain.rpcStatus === "partial"
              ? "No API key configured for this network"
              : "Provider unavailable",
        };
      }
      return p.index(address);
    }),
  );

  const chainResults: ChainClassification[] = [];
  const notAssessed: {
    chainName: string;
    chainId?: number;
    reason: string;
    explorerBase?: string;
  }[] = [];

  for (const r of results) {
    if (r.ok) {
      chainResults.push(classifyChain(r.data, address));
    } else {
      notAssessed.push({
        chainName: r.chain.name,
        chainId: r.chain.chainId,
        reason: r.reason,
        explorerBase: r.chain.explorerBase,
      });
    }
  }

  const crossChain = matchCrossChain(chainResults);

  const scoring = computeScores({
    chainResults,
    notAssessedCount: notAssessed.length,
    eligibleChainCount: EVM_CHAINS.length,
    crossChain,
  });

  return buildReport({
    address,
    chainResults,
    notAssessed,
    crossChain,
    scoring,
    eligibleChainCount: EVM_CHAINS.length,
  });
}
