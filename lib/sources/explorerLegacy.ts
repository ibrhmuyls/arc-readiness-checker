import { config } from "../config";
import { cached } from "../cache";
import type {
  Address,
  RawTokenTx,
  RawTx,
  SourceResult,
} from "../types";

type LegacyData = { txs: RawTx[]; tokenTxs: RawTokenTx[] };

const LEGACY_BASE = `${config.explorerBase}/api`;

interface LegacyTxRow {
  hash: string;
  blockNumber: string;
  timeStamp: string;
  from: string;
  to: string | null;
  input: string;
  gasUsed: string;
  isError: "0" | "1";
}

interface LegacyTokenRow {
  hash: string;
  blockNumber: string;
  timeStamp: string;
  from: string;
  to: string;
  contractAddress: string;
  tokenSymbol: string | null;
  value: string;
}

async function getRows<T>(
  params: Record<string, string>,
): Promise<T[]> {
  const url = new URL(LEGACY_BASE);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: config.cacheTtlSeconds },
  } as RequestInit & { next?: { revalidate?: number } });
  if (!res.ok) throw new Error(`explorer ${res.status}`);
  const json = (await res.json()) as {
    message: string;
    result: T[] | string;
  };
  if (json.message !== "OK" || !Array.isArray(json.result)) {
    return [];
  }
  return json.result as T[];
}

export async function fetchExplorerLegacy(
  address: Address,
): Promise<SourceResult<LegacyData>> {
  const start = Date.now();
  try {
    const [txRows, tokenRows] = await Promise.all([
      cached(`leg-tx-${address}`, config.cacheTtlSeconds, () =>
        getRows<LegacyTxRow>({
          module: "account",
          action: "txlist",
          address,
          page: "1",
          offset: String(config.maxRows),
          sort: "asc",
        }),
      ),
      cached(`leg-tok-${address}`, config.cacheTtlSeconds, () =>
        getRows<LegacyTokenRow>({
          module: "account",
          action: "tokentx",
          address,
          page: "1",
          offset: String(config.maxRows),
          sort: "asc",
        }),
      ),
    ]);

    const txs: RawTx[] = txRows.map((r) => ({
      hash: r.hash,
      blockNumber: Number(r.blockNumber),
      timeStamp: Number(r.timeStamp),
      from: r.from,
      to: r.to ?? "",
      input: r.input,
      gasUsed: Number(r.gasUsed),
      isError: r.isError,
    }));

    const tokenTxs: RawTokenTx[] = tokenRows.map((r) => ({
      hash: r.hash,
      blockNumber: Number(r.blockNumber),
      timeStamp: Number(r.timeStamp),
      from: r.from,
      to: r.to ?? "",
      contractAddress: r.contractAddress,
      tokenSymbol: r.tokenSymbol,
      value: r.value,
    }));

    return {
      ok: true,
      latencyMs: Date.now() - start,
      data: { txs, tokenTxs },
    };
  } catch (err) {
    return {
      ok: false,
      degraded: true,
      error: err instanceof Error ? err.message : "explorer failure",
    };
  }
}
