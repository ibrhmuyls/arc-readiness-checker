import { describe, it, expect } from "vitest";
import { score } from "./scoring";
import type { RawFacts, RawTx, RawTokenTx } from "../types";

const ADDR = "0x36F750d29139075920CD24D05371ac2e079711F0" as const;

function baseFacts(now: number): RawFacts {
  return {
    address: ADDR,
    txs: [] as RawTx[],
    tokenTxs: [] as RawTokenTx[],
    explorerLegacy: { ok: true, data: { txs: [] as RawTx[], tokenTxs: [] as RawTokenTx[] }, latencyMs: 10 },
    explorerV2: { ok: true, data: { txs: [] as RawTx[], tokenTxs: [] as RawTokenTx[] }, latencyMs: 10 },
    rpc: { ok: true, data: { balance: "0", blockNumber: 1 }, latencyMs: 10 },
    sources: {
      explorerLegacy: { ok: true, data: null, latencyMs: 1, error: "", degraded: false },
      explorerV2: { ok: true, data: null, latencyMs: 1, error: "", degraded: false },
      rpc: { ok: true, data: null, latencyMs: 1, error: "", degraded: false },
    },
    fetchedAt: now,
  };
}

describe("scoring", () => {
  it("returns CircleFootprintReport with no activity", () => {
    const report = score(baseFacts(Math.floor(Date.now() / 1000)));
    expect(report.address).toBe(ADDR);
    expect(report.network).toBe("Arc Testnet");
    expect(report.verifiedCircleActivityScore).toBe(0);
    expect(report.evidenceCoverageScore).toBeGreaterThanOrEqual(0);
    expect(report.primaryProfile).toBe("No Verified Arc Footprint Yet");
    expect(report.categories).toHaveLength(7);
    expect(report.limitations.length).toBeGreaterThan(0);
  });

  it("returns Low confidence and insufficient-data evidence when evidence is thin", () => {
    const now = Math.floor(Date.now() / 1000);
    const facts: RawFacts = {
      address: ADDR,
      txs: [
        { hash: "0x1", blockNumber: 1, timeStamp: now, from: ADDR, to: "0x2", input: "0x", gasUsed: 100, isError: "0" },
      ],
      tokenTxs: [] as RawTokenTx[],
      explorerLegacy: { ok: false, degraded: true, error: "down" },
      explorerV2: { ok: false, degraded: true, error: "down" },
      rpc: { ok: false, degraded: true, error: "down" },
      sources: {
        explorerLegacy: { ok: false, error: "down", degraded: true },
        explorerV2: { ok: false, error: "down", degraded: true },
        rpc: { ok: false, error: "down", degraded: true },
      },
      fetchedAt: now,
    };
    const report = score(facts);
    expect(report.confidenceLevel).toBe("Low");
    const evidence = report.categories.find((c) => c.id === "evidence");
    expect(evidence?.status).toBe("insufficient-data");
  });

  it("attributes verified Circle product interactions when registry matches", () => {
    const now = Math.floor(Date.now() / 1000);
    const facts = baseFacts(now);
    facts.txs = [
      { hash: "0x1", blockNumber: 1, timeStamp: now, from: ADDR, to: "0x867650F5eAe8df91445971f14d89fd84F0C9a9f8", input: "0x", gasUsed: 100, isError: "0" },
    ];
    const report = score(facts);
    const circleProducts = report.categories.find((c) => c.id === "circle-products");
    expect(circleProducts?.status).toBe("scored");
    expect(circleProducts?.score).toBeGreaterThan(0);
  });
});
