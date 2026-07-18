/**
 * Test fixtures — compact, explicit on-chain evidence for each required
 * scenario. These are synthetic-but-realistic transaction shapes matched
 * against the official registry. No fabricated metrics; only the events listed
 * here are fed to the classifier so assertions are deterministic.
 *
 * Addresses used:
 *   ME   = 0x1111111111111111111111111111111111111111 (the analyzed wallet)
 *   OTHER= 0x2222222222222222222222222222222222222222 (counterparty)
 */

import type { ChainIndex, RawTx, RawTokenTx } from "../providers/types";
import { ARC_TESTNET, CHAINS } from "../registry/chains";
import { REGISTRY } from "../registry/registry";

export const ME = "0x1111111111111111111111111111111111111111";
export const OTHER = "0x2222222222222222222222222222222222222222";

/** Resolve a real registry contract address for a chain+role (no duplication). */
export function addr(chainKey: keyof typeof CHAINS, role: string): string {
  const chain = CHAINS[chainKey];
  const c = REGISTRY.contracts.find(
    (x) => x.chain.chainId === chain.chainId && x.role === role,
  );
  if (!c) throw new Error(`no registry contract for ${chainKey}/${role}`);
  return c.address;
}

type TxSpec = {
  hash: string;
  ts: number; // unix seconds
  block: number;
  from: string;
  to: string;
  input?: string;
  value?: string;
  isError?: "0" | "1";
  created?: string; // contractAddress for creations
};

type TokSpec = {
  hash: string;
  ts: number;
  block: number;
  from: string;
  to: string;
  token: string; // contract address
  value?: string;
};

export function makeIndex(
  chainKey: keyof typeof CHAINS,
  txs: TxSpec[],
  toks: TokSpec[] = [],
): ChainIndex {
  const chain = CHAINS[chainKey];
  const rawTxs: RawTx[] = txs.map((t) => ({
    hash: t.hash,
    blockNumber: t.block,
    timeStamp: t.ts,
    from: t.from,
    to: t.to,
    input: t.input ?? "0x",
    value: t.value ?? "0",
    gasUsed: 21000,
    isError: t.isError ?? "0",
    contractAddress: t.created,
  }));
  const rawToks: RawTokenTx[] = toks.map((t) => ({
    hash: t.hash,
    blockNumber: t.block,
    timeStamp: t.ts,
    from: t.from,
    to: t.to,
    contractAddress: t.token,
    tokenSymbol: t.token === CHAINS["arc-testnet"].nativeGasContract ? "USDC" : null,
    value: t.value ?? "0",
  }));
  return { chain, txs: rawTxs, tokenTxs: rawToks, logs: [], logsAvailable: false };
}

// ---- selectors / calldata helpers ----
const ZERO32 = "0".repeat(64);
function pad40(hex: string): string {
  return hex.toLowerCase().replace(/^0x/, "").padStart(64, "0");
}

export function depositForBurn(to: string, burnToken: string, destDomain = 6): string {
  // selector + amount(0) + destDomain + mintRecipient + burnToken
  return (
    "0x6fd3504e" +
    ZERO32 +
    pad40("0x" + destDomain.toString(16)) +
    pad40(to) +
    pad40(burnToken)
  );
}

export function receiveMessage(): string {
  return "0x57ecfd28" + ZERO32.repeat(3);
}

export function gatewayDeposit(): string {
  return "0xb6b55f25" + ZERO32;
}

export function approve(): string {
  return "0x095ea7b3" + ZERO32 + pad40(OTHER);
}

export const ARC_NATIVE_GAS = ARC_TESTNET.nativeGasContract!;
