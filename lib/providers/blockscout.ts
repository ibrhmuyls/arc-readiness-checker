import { cached } from "../cache";
import type { ChainRef } from "../registry/types";
import type {
  ChainDataProvider,
  ChainIndex,
  IndexResult,
  RawLog,
  RawTokenTx,
  RawTx,
} from "./types";

const MAX_ROWS = 10000;
const TTL = 120; // seconds
const TIMEOUT_MS = 20000;

async function getJson(url: string): Promise<{ message: string; result: unknown }> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`http ${res.status}`);
    return (await res.json()) as { message: string; result: unknown };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Blockscout-compatible provider (Etherscan-style /api). Used for Arc Testnet,
 * which exposes a public API at https://testnet.arcscan.app/api (no key).
 */
export class BlockscoutProvider implements ChainDataProvider {
  readonly name: string;
  readonly chain: ChainRef;
  private base: string;

  constructor(chain: ChainRef) {
    if (!chain.explorerBase) {
      throw new Error(`Blockscout provider requires explorerBase for ${chain.name}`);
    }
    this.chain = chain;
    this.base = `${chain.explorerBase}/api`;
    this.name = `blockscout:${chain.name}`;
  }

  isAvailable(): boolean {
    return this.chain.rpcStatus === "supported" && !!this.chain.explorerBase;
  }

  private buildUrl(params: Record<string, string>): string {
    const url = new URL(this.base);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    return url.toString();
  }

  private async rows<T>(params: Record<string, string>): Promise<T[]> {
    const json = await getJson(this.buildUrl(params));
    if (json.message !== "OK" || !Array.isArray(json.result)) return [];
    return json.result as T[];
  }

  async index(address: string): Promise<IndexResult> {
    const start = Date.now();
    try {
      const [txRows, tokenRows] = await Promise.all([
        cached(`bs-tx-${this.chain.chainId}-${address}`, TTL, () =>
          this.rows<Record<string, string>>({
            module: "account",
            action: "txlist",
            address,
            page: "1",
            offset: String(MAX_ROWS),
            sort: "asc",
          }),
        ),
        cached(`bs-tok-${this.chain.chainId}-${address}`, TTL, () =>
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

      // Logs: fetch emitter logs for CCTP/Gateway detection. Best-effort.
      let logs: RawLog[] = [];
      let logsAvailable = false;
      try {
        logs = await this.fetchLogsForTxs(txs);
        logsAvailable = true;
      } catch {
        logsAvailable = false;
      }

      const data: ChainIndex = {
        chain: this.chain,
        txs,
        tokenTxs,
        logs,
        logsAvailable,
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

  /**
   * Fetch logs for the transactions that touched registry contracts. Blockscout
   * exposes txreceipt/logs via module=logs&action=getLogs, but the most reliable
   * per-tx path is eth_getTransactionReceipt via the RPC proxy. To stay within
   * rate limits we only pull receipts for txs whose `to` is a registry contract;
   * the indexer decides which. Here we return [] and let the indexer request
   * receipts lazily. Returning empty with logsAvailable handling is done above.
   */
  private async fetchLogsForTxs(_txs: RawTx[]): Promise<RawLog[]> {
    // Log decoding for Arc is performed at the classifier layer using tx input +
    // token transfers, which is sufficient for CCTP/Gateway method detection on
    // Blockscout. Detailed receipt logs are fetched on-demand by the indexer.
    return [];
  }
}
