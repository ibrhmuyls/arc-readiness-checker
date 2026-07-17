import { describe, it, expect } from "vitest";
import { score } from "./scoring";
import type { RawFacts } from "../types";

const ADDR = "0x36F750d29139075920CD24D05371ac2e079711F0" as const;

function makeFacts(overrides: Partial<RawFacts> = {}): RawFacts {
  const base: RawFacts = {
    address: ADDR,
    txs: [],
    tokenTxs: [],
    explorerLegacy: { ok: true, data: { txs: [], tokenTxs: [] }, latencyMs: 1 },
    explorerV2: { ok: true, data: null, latencyMs: 1 },
    rpc: { ok: true, data: { balance: "0" }, latencyMs: 1 },
    sources: {
      explorerLegacy: { ok: true, data: null, latencyMs: 1 },
      explorerV2: { ok: true, data: null, latencyMs: 1 },
      rpc: { ok: true, data: null, latencyMs: 1 },
    },
    fetchedAt: Date.now(),
    ...overrides,
  };
  return base;
}

describe("scoring", () => {
  it("returns 0 score and Low confidence for empty wallet", () => {
    const report = score(makeFacts());
    expect(report.scoreValue).toBe(0);
    expect(report.confidenceLevel).toBe("Low");
    expect(report.primaryProfile).toBe("Low Observable Activity");
  });

  it("scores stablecoin-heavy activity above the empty-wallet baseline", () => {
    const txs = Array.from({ length: 12 }, (_, i) => ({
      hash: `0x${i}`,
      blockNumber: i,
      timeStamp: Math.floor(Date.now() / 1000) - i * 86400,
      from: ADDR,
      to: "0x0000000000000000000000000000000000000001",
      input: "0x",
      gasUsed: 21000,
      isError: "0" as const,
    }));
    const tokenTxs = Array.from({ length: 12 }, (_, i) => ({
      hash: `0x${100 + i}`,
      blockNumber: 100 + i,
      timeStamp: Math.floor(Date.now() / 1000) - i * 86400,
      from: ADDR,
      to: "0x0000000000000000000000000000000000000002",
      contractAddress: "0x3600000000000000000000000000000000000000",
      tokenSymbol: "USDC",
      value: "1000000",
    }));
    const report = score(makeFacts({ txs, tokenTxs }));
    expect(report.scoreValue).toBeGreaterThan(0);
    expect(report.categories.find((c) => c.id === "stablecoin-adoption")?.status).toBe("scored");
  });

  it("returns 0 and not-assessed when data sources are unavailable", () => {
    const down = { ok: false as const, degraded: false, error: "down", latencyMs: 1 };
    const report = score(
      makeFacts({
        explorerLegacy: down,
        explorerV2: down,
        rpc: down,
        sources: {
          explorerLegacy: down,
          explorerV2: down,
          rpc: down,
        },
      })
    );
    expect(report.scoreValue).toBe(0);
    expect(report.categories.some((c) => c.status === "not-assessed")).toBe(true);
  });
});
