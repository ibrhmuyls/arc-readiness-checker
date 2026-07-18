import { cached } from "../cache";
import type { ChainRef } from "../registry/types";
import type {
  ChainDataProvider,
  ChainIndex,
  IndexResult,
  RawTokenTx,
  RawTx,
} from "./types";

const MAX_ROWS = 10000;
const TTL = 180;
const TIMEOUT_MS = 20000;
const V2_BASE = "https://api.etherscan.io/v2/api";

/**
 * Etherscan V2 multichain provider. A single API key works across all
 * Etherscan-family explorers via the `chainid` query param. The key is read
 * server-side only (ETHERSCAN_API_KEY) and never exposed to the client.
 *
 * When no key is present, isAvailable() returns false and the orchestrator
 * marks the chain "Not assessed" — never "No activity".
 */
export class EtherscanV2Provider implements ChainDataProvider {
  readonly name: string;
  readonly chain: ChainRef;
  private apiKey: string | undefined;

  constructor(chain: ChainRef, apiKey: string | undefined) {
    this.chain = chain;
    this.apiKey = apiKey;
    this.name = `etherscan-v2:${chain.name}`;
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.chain.chainId != null;
  }

  private buildUrl(params: Record<string, string>): string {
    const url = new URL(V2_BASE);
    url.searchParams.set("chainid", String(this.chain.chainId));
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    if (this.apiKey) url.searchParams.set("apikey", this.apiKey);
    return url.toString();
  }

  private async rows<T>(params: Record<string, string>): Promise<T[]> {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(this.buildUrl(params), {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`http ${res.status}`);
      const json = (await res.json()) as { status: string; message: string; result: unknown };
      // Etherscan returns status "0" + "No transactions found" for empty — that
      // is a SUCCESSFUL index with zero rows, not an error.
      if (json.status === "1" && Array.isArray(json.result)) return json.result as T[];
      if (
        json.status === "0" &&
        typeof json.message === "string" &&
        /no transactions found|no records found/i.test(json.message)
      ) {
        return [];
      }
      throw new Error(json.message || "etherscan error");
    } finally {
      clearTimeout(t);
    }
  }

  async index(address: string): Promise<IndexResult> {
    const start = Date.now();
    if (!this.isAvailable()) {
      return {
        ok: false,
        notAssessed: true,
        chain: this.chain,
        reason: "no ETHERSCAN_API_KEY configured",
      };
    }
    try {
      const [txRows, tokenRows] = await Promise.all([
        cached(`ev2-tx-${this.chain.chainId}-${address}`, TTL, () =>
          this.rows<Record<string, string>>({
            module: "account",
            action: "txlist",
            address,
            page: "1",
            offset: String(MAX_ROWS),
            sort: "asc",
          }),
        ),
        cached(`ev2-tok-${this.chain.chainId}-${address}`, TTL, () =>
          this.rows<Record<string, string>>({
            module: "account",
            action: "tokentx",
            address,
            page: "1",
            offset: String(MAX_ROWS),
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
        input: r.input ?? "0x",
        value: r.value ?? "0",
        gasUsed: Number(r.gasUsed ?? 0),
        isError: (r.isError === "1" ? "1" : "0") as "0" | "1",
        contractAddress: r.contractAddress || undefined,
        methodId: r.methodId,
        functionName: r.functionName,
      }));

      const tokenTxs: RawTokenTx[] = tokenRows.map((r) => ({
        hash: r.hash,
        blockNumber: Number(r.blockNumber),
        timeStamp: Number(r.timeStamp),
        from: r.from,
        to: r.to ?? "",
        contractAddress: r.contractAddress,
        tokenSymbol: r.tokenSymbol ?? null,
        tokenDecimal: r.tokenDecimal ?? null,
        value: r.value ?? "0",
      }));

      const data: ChainIndex = {
        chain: this.chain,
        txs,
        tokenTxs,
        logs: [],
        logsAvailable: false,
      };
      return { ok: true, notAssessed: false, data, latencyMs: Date.now() - start };
    } catch (err) {
      return {
        ok: false,
        notAssessed: true,
        chain: this.chain,
        reason: err instanceof Error ? err.message : "index failure",
      };
    }
  }
}
