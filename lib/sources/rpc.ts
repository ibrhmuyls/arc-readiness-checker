import { config } from "../config";
import type { Address, SourceResult } from "../types";

type RpcData = { balanceWei: string; txCount: number; chainId: string };

async function rpcCall(method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(config.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    // Server-side only; no Next caching for raw RPC.
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`RPC ${res.status}`);
  const json = (await res.json()) as { result?: string; error?: unknown };
  if (json.error) throw new Error(`RPC error ${JSON.stringify(json.error)}`);
  return json.result;
}

export async function fetchRpc(
  address: Address,
): Promise<SourceResult<RpcData>> {
  const start = Date.now();
  try {
    const [balanceWei, txCount, chainId] = await Promise.all([
      rpcCall("eth_getBalance", [address, "latest"]) as Promise<string>,
      rpcCall("eth_getTransactionCount", [address, "latest"]) as Promise<string>,
      rpcCall("eth_chainId", []) as Promise<string>,
    ]);
    return {
      ok: true,
      latencyMs: Date.now() - start,
      data: {
        balanceWei: BigInt(balanceWei ?? "0x0").toString(),
        txCount: Number(BigInt(txCount ?? "0x0")),
        chainId,
      },
    };
  } catch (err) {
    return {
      ok: false,
      degraded: true,
      error: err instanceof Error ? err.message : "rpc failure",
    };
  }
}
