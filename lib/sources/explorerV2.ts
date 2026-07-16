import { config } from "../config";
import { cached } from "../cache";
import type { Address, SourceResult } from "../types";

type V2Data = { txCount: number; tokenTransferCount: number };

interface Counters {
  transactions_count?: string;
  token_transfers_count?: string;
}

export async function fetchExplorerV2(
  address: Address,
): Promise<SourceResult<V2Data>> {
  const start = Date.now();
  try {
    const data = await cached(`v2-ctr-${address}`, config.cacheTtlSeconds, async () => {
      const url = `${config.explorerBase}/api/v2/addresses/${address}/counters`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: config.cacheTtlSeconds },
      } as RequestInit & { next?: { revalidate?: number } });
      if (!res.ok) throw new Error(`v2 ${res.status}`);
      return (await res.json()) as Counters;
    });

    return {
      ok: true,
      latencyMs: Date.now() - start,
      data: {
        txCount: Number(data.transactions_count ?? "0"),
        tokenTransferCount: Number(data.token_transfers_count ?? "0"),
      },
    };
  } catch (err) {
    return {
      ok: false,
      degraded: true,
      error: err instanceof Error ? err.message : "v2 failure",
    };
  }
}
