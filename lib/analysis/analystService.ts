import type { Address, RawFacts, SourceResult, RawTx, RawTokenTx } from "../types";
import { fetchRpc } from "../sources/rpc";
import { fetchExplorerLegacy } from "../sources/explorerLegacy";
import { fetchExplorerV2 } from "../sources/explorerV2";

function safeOk<T>(src: SourceResult<T> | SourceResult<unknown>): src is { ok: true; data: T; latencyMs: number } {
  return src && typeof src === "object" && "ok" in src && src.ok === true;
}

function legacyData(src: unknown): { txs: RawFacts["txs"]; tokenTxs: RawFacts["tokenTxs"] } | null {
  if (!src || typeof src !== "object" || !("data" in src)) return null;
  const data = (src as { data: { txs?: RawFacts["txs"]; tokenTxs?: RawFacts["tokenTxs"] } }).data;
  if (!data || !Array.isArray(data.txs) || !Array.isArray(data.tokenTxs)) return null;
  return { txs: data.txs, tokenTxs: data.tokenTxs };
}

export async function collectFacts(address: Address): Promise<RawFacts> {
  const [rawRpc, rawLegacy, rawV2] = await Promise.all([
    fetchRpc(address),
    fetchExplorerLegacy(address),
    fetchExplorerV2(address),
  ]);

  const sources = {
    explorerLegacy: rawLegacy as SourceResult<unknown>,
    explorerV2: rawV2 as SourceResult<unknown>,
    rpc: rawRpc as SourceResult<unknown>,
  };

  let txs: RawFacts["txs"] = [];
  let tokenTxs: RawFacts["tokenTxs"] = [];

  const legacy = legacyData(rawLegacy);
  if (legacy) {
    txs = legacy.txs;
    tokenTxs = legacy.tokenTxs;
  }

  const v2 = legacyData(rawV2);
  if (v2 && (v2.txs.length > 0 || v2.tokenTxs.length > 0)) {
    if (v2.txs.length > 0) txs = v2.txs;
    if (v2.tokenTxs.length > 0) tokenTxs = v2.tokenTxs;
  }

  let rpcNormalized: RawFacts["rpc"];
  if (safeOk(rawRpc)) {
    const rawData = (rawRpc as { data: Record<string, unknown> }).data;
    const balance = typeof rawData.balanceWei === "string" ? rawData.balanceWei : typeof rawData.balance === "string" ? rawData.balance : "0";
    const blockNumber = typeof rawData.txCount === "number" ? rawData.txCount : typeof rawData.blockNumber === "number" ? rawData.blockNumber : 0;
    rpcNormalized = {
      ok: true,
      data: { balance, blockNumber },
      latencyMs: (rawRpc as { latencyMs: number }).latencyMs,
    };
  } else {
    rpcNormalized = {
      ok: false,
      degraded: typeof (rawRpc as { degraded?: boolean }).degraded === "boolean" ? (rawRpc as { degraded: boolean }).degraded : false,
      error: typeof (rawRpc as { error?: string }).error === "string" ? (rawRpc as { error: string }).error : "rpc failure",
    };
  }

  return {
    address,
    txs,
    tokenTxs,
    explorerLegacy: rawLegacy as RawFacts["explorerLegacy"],
    explorerV2: rawV2 as RawFacts["explorerV2"],
    rpc: rpcNormalized,
    sources,
    fetchedAt: Date.now(),
  };
}
