/**
 * Scenario tests for Circle Ecosystem Footprint.
 *
 * These exercise the pure pipeline (classify -> crosschain -> score -> report)
 * with explicit fixtures. No network. They cover the required product spec
 * scenarios plus the conservative caps. Contract addresses are resolved from
 * the official registry (addr helper) so they stay in sync.
 */

import { describe, it, expect } from "vitest";
import { classifyChain } from "../classifiers/classify";
import { matchCrossChain } from "../crosschain/match";
import { computeScores } from "../scoring/score";
import { buildReport } from "../report/build";
import { REGISTRY } from "../registry/registry";
import { EVM_CHAINS } from "../registry/chains";
import type { ChainClassification } from "../classifiers/types";
import {
  ME,
  OTHER,
  makeIndex,
  depositForBurn,
  receiveMessage,
  gatewayDeposit,
  approve,
  ARC_NATIVE_GAS,
  addr,
} from "./fixtures";

function run(address: string, indexes: ReturnType<typeof makeIndex>[]) {
  const chainResults: ChainClassification[] = indexes.map((i) =>
    classifyChain(i, address),
  );
  const crossChain = matchCrossChain(chainResults);
  const scoring = computeScores({
    chainResults,
    notAssessedCount: EVM_CHAINS.length - chainResults.length,
    eligibleChainCount: EVM_CHAINS.length,
    crossChain,
  });
  const report = buildReport({
    address,
    chainResults,
    notAssessed: [],
    crossChain,
    scoring,
    eligibleChainCount: EVM_CHAINS.length,
  });
  return { chainResults, crossChain, scoring, report };
}

const ARC_USDC = ARC_NATIVE_GAS;
const BASE_USDC = addr("base", "usdc_erc20_interface");

describe("SCENARIO 1 — Verified full CCTP flow (source + destination, multi-chain)", () => {
  it("classifies depositForBurn on Base + receiveMessage on Arbitrum", () => {
    const base = makeIndex("base", [
      {
        hash: "0xb1",
        ts: 1_700_000_000,
        block: 1000,
        from: ME,
        to: addr("base", "cctp_token_messenger"),
        input: depositForBurn(OTHER, BASE_USDC, 3), // dest domain 3 = Arbitrum
      },
    ]);
    const arb = makeIndex("arbitrum", [
      {
        hash: "0xa1",
        ts: 1_700_010_000,
        block: 2000,
        from: ME,
        to: addr("arbitrum", "cctp_message_transmitter"),
        input: receiveMessage(),
      },
    ]);
    const { crossChain, report } = run(ME, [base, arb]);
    expect(crossChain.cctpSourceCount).toBe(1);
    expect(crossChain.cctpDestinationCount).toBe(1);
    expect(crossChain.hasVerifiedCctp).toBe(true);
    expect(report.primaryProfile).toMatch(/CCTP/);
    expect(report.circleEcosystemActivityScore).toBeGreaterThan(0);
  });
});

describe("SCENARIO 2 — Verified Gateway action", () => {
  it("classifies a Gateway deposit on Ethereum", () => {
    const eth = makeIndex("ethereum", [
      {
        hash: "0xe1",
        ts: 1_700_000_000,
        block: 18_000_000,
        from: ME,
        to: addr("ethereum", "gateway_wallet"),
        input: gatewayDeposit(),
      },
    ]);
    const { crossChain, report } = run(ME, [eth]);
    expect(crossChain.hasVerifiedGateway).toBe(true);
    expect(report.primaryProfile).toMatch(/Gateway/);
  });
});

describe("SCENARIO 3 — Contract deployer with NO Circle interaction", () => {
  it("flags deployment but does NOT attribute to Circle", () => {
    const arc = makeIndex("arc-testnet", [
      {
        hash: "0xd1",
        ts: 1_700_000_000,
        block: 500,
        from: ME,
        to: "",
        created: "0x9999999999999999999999999999999999999999",
        input: "0x60806040",
      },
    ]);
    const { report } = run(ME, [arc]);
    expect(report.primaryProfile).toBe("Arc Ecosystem Explorer");
    expect(report.ecosystemMap.find((n) => n.product === "CCTP")?.state).toBe(
      "no_verified_evidence",
    );
  });
});

describe("SCENARIO 4 — Generic EVM tooling (Permit2)", () => {
  it("marks tooling as NOT a Circle product", () => {
    // Arc Permit2 is in the registry as common_evm_tooling
    const arcPermit2 = addr("arc-testnet", "common_evm_tooling");
    const arc = makeIndex("arc-testnet", [
      {
        hash: "0xt1",
        ts: 1_700_000_000,
        block: 900,
        from: ME,
        to: arcPermit2,
        input: approve(),
      },
    ]);
    const { chainResults } = run(ME, [arc]);
    const tooling = chainResults[0].classifications.find(
      (c) => c.category === "common_evm_tooling",
    );
    expect(tooling).toBeDefined();
    expect(tooling?.product).toBe("CommonEVM");
  });
});

describe("SCENARIO 5 — No indexed activity", () => {
  it("reports No Verified Circle Footprint Yet", () => {
    const arc = makeIndex("arc-testnet", []);
    const { report } = run(ME, [arc]);
    expect(report.primaryProfile).toBe("No Verified Circle Footprint Yet");
    expect(report.circleEcosystemActivityScore).toBe(0);
    expect(
      report.ecosystemMap.every((n) =>
        ["no_verified_evidence", "cannot_infer"].includes(n.state),
      ),
    ).toBe(true);
  });
});

describe("SCENARIO 6 — Ordinary single-chain USDC transfers only (cap 45)", () => {
  it("is capped at 45 and does not claim protocol usage", () => {
    const arc = makeIndex("arc-testnet", [], [
      {
        hash: "0xtok1",
        ts: 1_700_000_000,
        block: 10,
        from: OTHER,
        to: ME,
        token: ARC_USDC,
        value: "1000000",
      },
      {
        hash: "0xtok2",
        ts: 1_700_086_400,
        block: 20,
        from: ME,
        to: OTHER,
        token: ARC_USDC,
        value: "500000",
      },
    ]);
    const { report } = run(ME, [arc]);
    expect(report.circleEcosystemActivityScore).toBeLessThanOrEqual(45);
    expect(report.circleEcosystemActivityScore).toBeGreaterThan(0);
    expect(
      report.caps.some((c) => /ordinary USDC transfers on one chain/i.test(c)),
    ).toBe(true);
  });
});

describe("SCENARIO 7 — Multi-network USDC without protocol events (cap 70)", () => {
  it("caps at 70 and never claims CCTP/Gateway", () => {
    const arc = makeIndex("arc-testnet", [], [
      {
        hash: "0xa1",
        ts: 1_700_000_000,
        block: 10,
        from: OTHER,
        to: ME,
        token: ARC_USDC,
        value: "1000000",
      },
    ]);
    const base = makeIndex("base", [], [
      {
        hash: "0xb1",
        ts: 1_700_086_400,
        block: 20,
        from: OTHER,
        to: ME,
        token: BASE_USDC,
        value: "2000000",
      },
    ]);
    const { report } = run(ME, [arc, base]);
    expect(report.multiNetworkUsdc).toBe(true);
    expect(report.circleEcosystemActivityScore).toBeLessThanOrEqual(70);
    expect(
      report.caps.some((c) =>
        /Multi-network USDC without verified Circle protocol/i.test(c),
      ),
    ).toBe(true);
  });
});

describe("SCENARIO 8 — Registry integrity", () => {
  it("loads with correct Arc chainId and all contracts source-linked", () => {
    expect(EVM_CHAINS.find((c) => c.name === "Arc Testnet")?.chainId).toBe(
      5042002,
    );
    for (const c of REGISTRY.contracts) {
      expect(c.sources.length).toBeGreaterThan(0);
    }
    expect(REGISTRY.version).toBe("2.0.0");
  });
});

describe("SCENARIO 9 — Arc footprint null when Arc not indexed", () => {
  it("returns 'No verified Arc footprint observed' for non-Arc chains only", () => {
    const base = makeIndex("base", [], [
      {
        hash: "0xb1",
        ts: 1_700_000_000,
        block: 20,
        from: OTHER,
        to: ME,
        token: BASE_USDC,
        value: "2000000",
      },
    ]);
    const { report } = run(ME, [base]);
    expect(report.arcFootprint.value).toBeNull();
    expect(report.arcFootprint.label).toMatch(/No verified Arc footprint/i);
  });
});

describe("CONSERVATISM — confidence never High on single testnet network", () => {
  it("drops confidence to Moderate for single-chain testnet data", () => {
    const arc = makeIndex("arc-testnet", [
      {
        hash: "0xa1",
        ts: 1_700_000_000,
        block: 10,
        from: ME,
        to: addr("arc-testnet", "arc_system_contract"),
        input: "0x",
      },
    ]);
    const { report } = run(ME, [arc]);
    expect(report.confidence).not.toBe("High");
  });
});
