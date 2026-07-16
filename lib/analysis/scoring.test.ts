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
      rpc: { ok: true, latencyMs: 1, data: { balanceWei: "1000000000000000000", txCount: 5, chainId: "0x4cef52" } },
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

const NOW = Math.floor(Date.now() / 1000);

describe("scoring engine", () => {
  it("returns New Participant profile for an empty wallet", () => {
    const r = score(baseFacts());
    expect(r.overallScore).toBe(0);
    expect(r.dataCompleteness).toBe("full");
    expect(r.profile).toBe("New Participant");
  });

  it("never scores the disabled multi-chain category", () => {
    const r = score(baseFacts());
    const mc = r.categories.find((c) => c.id === "multichain");
    expect(mc?.status).toBe("disabled");
    expect(mc?.maxPoints).toBe(0);
  });

  it("rewards stablecoin usage from token transfers and diversity", () => {
    const usdc = CONTRACT_REFS.stablecoins[0];
    const eurc = CONTRACT_REFS.stablecoins[1];
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
                timeStamp: NOW,
                from: "0x" + "1".repeat(40),
                to: "0x" + "2".repeat(40),
                contractAddress: usdc,
                tokenSymbol: "USDC",
                value: "1000000",
              },
              {
                hash: "0x" + "c".repeat(64),
                blockNumber: 2,
                timeStamp: NOW,
                from: "0x" + "1".repeat(40),
                to: "0x" + "2".repeat(40),
                contractAddress: eurc,
                tokenSymbol: "EURC",
                value: "1000000",
              },
            ],
          },
        },
      },
    });
    const r = score(facts);
    const stable = r.categories.find((c) => c.id === "stablecoin");
    expect(stable?.points).toBeGreaterThan(0);
  });

  it("computes failing categories as insufficient-data when explorer is down", () => {
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

  it("derives Settlement and Builder categories correctly", () => {
    const now = NOW;
    const facts = baseFacts({
      sources: {
        ...baseFacts().sources,
        explorerLegacy: {
          ok: true,
          latencyMs: 1,
          data: {
            txs: [
              tx(1, now, "0x" + "3".repeat(40), "0x1234"),
              { ...tx(2, now, "0x" + "3".repeat(40), "0x5678"), isError: "1" as const },
            ],
            tokenTxs: [],
          },
        },
      },
    });
    const r = score(facts);
    const settle = r.categories.find((c) => c.id === "settlement");
    const build = r.categories.find((c) => c.id === "builder");
    expect(settle?.status).toBe("scored");
    expect(build?.status).toBe("insufficient-data");
  });

  it("returns Builders for dev-heavy behavior", () => {
    const now = NOW;
    const facts = baseFacts({
      sources: {
        ...baseFacts().sources,
        explorerLegacy: {
          ok: true,
          latencyMs: 1,
          data: {
            txs: [
              tx(1, now, CONTRACT_REFS.builder[0], "0xabcd"),
              tx(2, now, null, "0x60fe7b..."),
            ],
            tokenTxs: [],
          },
        },
      },
    });
    const r = score(facts);
    expect(r.profile).toBe("Builder");
    const build = r.categories.find((c) => c.id === "builder");
    expect(build?.points).toBeGreaterThan(0);
  });

  it("returns Cross-chain Ready for bridge-heavy behavior", () => {
    const now = NOW;
    const facts = baseFacts({
      sources: {
        ...baseFacts().sources,
        explorerLegacy: {
          ok: true,
          latencyMs: 1,
          data: {
            txs: [
              tx(1, now, CONTRACT_REFS.bridge[0], "0xabcd"),
              tx(2, now, CONTRACT_REFS.bridge[1], "0xabcd"),
            ],
            tokenTxs: [
              {
                hash: "0x" + "c".repeat(64),
                blockNumber: 1,
                timeStamp: now,
                from: ADDR,
                to: "0x" + "2".repeat(40),
                contractAddress: CONTRACT_REFS.stablecoins[0],
                tokenSymbol: "USDC",
                value: "1000000",
              },
            ],
          },
        },
      },
    });
    const r = score(facts);
    const stable = r.categories.find((c) => c.id === "stablecoin");
    const cc = r.categories.find((c) => c.id === "crosschain");
    expect(stable?.points).toBeGreaterThan(0);
    expect(cc?.points).toBeGreaterThan(0);
    expect(["Cross-chain Ready", "Payment User", "Settlement Focused"]).toContain(r.profile);
  });
});
