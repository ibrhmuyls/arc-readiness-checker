import type { Address, RawFacts } from "../types";
import { fetchRpc } from "../sources/rpc";
import { fetchExplorerLegacy } from "../sources/explorerLegacy";
import { fetchExplorerV2 } from "../sources/explorerV2";
import { CONTRACT_REFS } from "../sources/contractRefs";

/**
 * Orchestrates all public Arc Testnet sources into a single RawFacts object.
 * Each source is isolated: a failing source returns {ok:false} and does not
 * break the others. The scoring engine later decides what to do with gaps.
 */
export async function collectFacts(address: Address): Promise<RawFacts> {
  const [rpc, explorerLegacy, explorerV2] = await Promise.all([
    fetchRpc(address),
    fetchExplorerLegacy(address),
    fetchExplorerV2(address),
  ]);

  return {
    address,
    fetchedAt: Date.now(),
    sources: { rpc, explorerLegacy, explorerV2 },
    contractRefs: CONTRACT_REFS,
  };
}
