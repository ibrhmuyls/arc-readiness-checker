import { describe, it, expect } from "vitest";
import { score } from "./scoring";
import type { RawFacts } from "../types";
import { CONTRACT_REFS } from "../sources/contractRefs";

const ADDR = "0x3600000000000000000000000000000000000000" as const;

function baseFacts(overrides: Partial<RawFacts> = {}): RawFacts {
  return {
    address: ADDR,
    fetchedAt: Date.now(),
    sources: {
      rpc: {
        ok: true,
        latencyMs: 1,
        data: { balanceWei: "1000000000000000000", txCount: 5, chainId: "0x4cef52" },
      },
      explorerLegacy: { ok: true, latencyMs: 1, data: { txs: [], tokenTxs: [] } },
      explorerV2: { ok: true, latencyMs: 1, data: { txCount: 0, tokenTransferCount: 0 } },
    },
    contractRefs: CONTRACT_REFS,
    ...overrides,
  };
}

function tx(block: number, ts: number, to: string | null, input = "0x") {
  return {
    hash: "0x" + "a".repeat(64),
    blockNumber: block,
    timeStamp: ts,
    from: "0x" + "1".repeat(40),
    to,
    input,
    gasUsed: 21000,
    isError: "0" as const,
  };
}

describe("scoring engine", () => {
  it("returns 0 overall for an empty wallet", () => {
    const r = score(baseFacts());
    expect(r.overallScore).toBe(0);
    expect(r.dataCompleteness).toBe("full");
  });

  it("never scores the disabled multi-chain category", () => {
    const r = score(baseFacts());
    const mc = r.categories.find((c) => c.id === "multichain");
    expect(mc?.status).toBe("disabled");
    expect(mc?.maxPoints).toBe(0);
  });

  it("rewards stablecoin usage from token transfers", () => {
    const usdc = CONTRACT_REFS.stablecoins[0];
    const facts = baseFacts({
      sources: {
        ...baseFacts().sources,
        explorerLegacy: {
          ok: true,
          latencyMs: 1,
          data: {
            txs: [],
            tokenTxs: [
              {
                hash: "0x" + "b".repeat(64),
                blockNumber: 1,
                timeStamp: Math.floor(Date.now() / 1000),
                from: "0x" + "1".repeat(40),
                to: "0x" + "2".repeat(40),
                contractAddress: usdc,
                tokenSymbol: "USDC",
                value: "1000000",
              },
            ],
          },
        },
      },
    });
    const r = score(facts);
    const stable = r.categories.find((c) => c.id === "stablecoins");
    expect(stable?.points).toBeGreaterThan(0);
    expect(r.strengths.join(" ")).toMatch(/stablecoin/i);
  });

  it("marks categories insufficient-data when explorer is down", () => {
    const facts = baseFacts({
      sources: {
        rpc: { ok: false, degraded: true, error: "x" },
        explorerLegacy: { ok: false, degraded: true, error: "x" },
        explorerV2: { ok: false, degraded: true, error: "x" },
      },
    });
    const r = score(facts);
    expect(r.dataCompleteness).toBe("unavailable");
    expect(r.overallScore).toBe(0);
  });

  it("computes consistency from successful vs total txs", () => {
    const now = Math.floor(Date.now() / 1000);
    const facts = baseFacts({
      sources: {
        ...baseFacts().sources,
        explorerLegacy: {
          ok: true,
          latencyMs: 1,
          data: {
            txs: [
              tx(1, now, "0x" + "3".repeat(40), "0x1234"),
              { ...tx(2, now, "0x" + "3".repeat(40), "0x1234"), isError: "1" as const },
            ],
            tokenTxs: [],
          },
        },
      },
    });
    const r = score(facts);
    const consistency = r.categories.find((c) => c.id === "consistency");
    expect(consistency?.points).toBe(8); // 1/2 * 15 = 7.5 -> 8 (round half up)
  });
});
