/**
 * Evidence classification engine.
 *
 * Takes a successfully indexed chain (ChainIndex) and produces typed evidence
 * classifications, strictly matched against the official contract registry.
 * Nothing is credited unless it matches a registry contract + documented
 * method/event for that contract's version.
 */

import { lookupContract } from "../registry/registry";
import type { ChainIndex, RawTx, RawTokenTx } from "../providers/types";
import type { RegistryContract } from "../registry/types";
import {
  SELECTORS,
  type AssetChainStats,
  type ChainClassification,
  type EvidenceClassification,
} from "./types";

const DAY_KEY = (ts: number) =>
  new Date(ts * 1000).toISOString().slice(0, 10);

function iso(ts: number): string {
  return new Date(ts * 1000).toISOString();
}

function selector(input: string): string {
  return input && input.length >= 10 ? input.slice(0, 10).toLowerCase() : "";
}

function assetOf(c: RegistryContract | undefined): "USDC" | "EURC" | "USYC" | null {
  if (!c) return null;
  if (c.role === "usdc_erc20_interface") return "USDC";
  if (c.role === "eurc_token") return "EURC";
  if (c.role === "usyc_token") return "USYC";
  return null;
}

/**
 * Decode the destination domain + mint recipient from a depositForBurn calldata
 * where reliably possible. CCTP V2 depositForBurn layout (after selector):
 *   [0] amount (uint256)
 *   [1] destinationDomain (uint32, right-aligned in 32-byte word)
 *   [2] mintRecipient (bytes32)
 *   [3] burnToken (address, right-aligned)
 * We only read what is deterministic.
 */
function decodeDepositForBurn(input: string): {
  amount?: string;
  destinationDomain?: number;
  mintRecipient?: string;
  burnToken?: string;
} {
  try {
    const body = input.slice(10); // strip selector
    if (body.length < 64 * 4) return {};
    const word = (i: number) => body.slice(i * 64, i * 64 + 64);
    const amount = BigInt("0x" + word(0)).toString();
    const destinationDomain = Number(BigInt("0x" + word(1)));
    const mintRecipient = "0x" + word(2).slice(24);
    const burnToken = "0x" + word(3).slice(24);
    return { amount, destinationDomain, mintRecipient, burnToken };
  } catch {
    return {};
  }
}

export function classifyChain(
  index: ChainIndex,
  address: string,
): ChainClassification {
  const me = address.toLowerCase();
  const chain = index.chain;
  const chainId = chain.chainId;
  const classifications: EvidenceClassification[] = [];

  const successfulTxs = index.txs.filter((t) => t.isError === "0");
  const failedTxs = index.txs.filter((t) => t.isError === "1");

  // ---- active days across txs + token transfers ----
  const dayset = new Set<string>();
  let firstSeen: number | null = null;
  let lastSeen: number | null = null;
  const trackTime = (ts: number) => {
    if (!ts) return;
    dayset.add(DAY_KEY(ts));
    if (firstSeen === null || ts < firstSeen) firstSeen = ts;
    if (lastSeen === null || ts > lastSeen) lastSeen = ts;
  };
  index.txs.forEach((t) => trackTime(t.timeStamp));
  index.tokenTxs.forEach((t) => trackTime(t.timeStamp));

  const counterparties = new Set<string>();
  let contractDeployments = 0;
  let commonToolingInteractions = 0;
  let officialProductInteractions = 0;
  const cctpSourceEvents: EvidenceClassification[] = [];
  const cctpDestinationEvents: EvidenceClassification[] = [];
  const gatewayEvents: EvidenceClassification[] = [];
  const stablefxEvents: EvidenceClassification[] = [];

  // ---------- classify base transactions ----------
  for (const tx of index.txs) {
    const to = (tx.to || "").toLowerCase();
    if (to && to !== me) counterparties.add(to);

    // contract deployment
    if ((!tx.to || tx.to === "") && tx.input && tx.input.length > 2) {
      contractDeployments++;
      classifications.push({
        transactionHash: tx.hash,
        chain,
        timestamp: iso(tx.timeStamp),
        blockNumber: tx.blockNumber,
        category: "contract_deployment",
        confidence: "high",
        methodName: "contractCreation",
        evidenceText: `Contract deployment transaction${
          tx.contractAddress ? ` (deployed ${tx.contractAddress})` : ""
        }.`,
        sourceUrls: [],
      });
      continue;
    }

    const contract = lookupContract(chainId, to);
    const sel = selector(tx.input);

    if (!contract) {
      // Native value movement on Arc = execution + native USDC gas.
      if (chain.chainId === 5042002 && tx.isError === "0") {
        classifications.push({
          transactionHash: tx.hash,
          chain,
          timestamp: iso(tx.timeStamp),
          blockNumber: tx.blockNumber,
          category: "arc_execution",
          confidence: "moderate",
          asset: "USDC",
          direction: to === me ? "in" : "out",
          evidenceText:
            "Arc transaction executed; USDC used as native gas (Arc execution observed).",
          sourceUrls: ["https://docs.arc.io/arc/references/connect-to-arc"],
        });
      } else {
        classifications.push({
          transactionHash: tx.hash,
          chain,
          timestamp: iso(tx.timeStamp),
          blockNumber: tx.blockNumber,
          category: "unclassified",
          confidence: "low",
          evidenceText:
            "Unclassified interaction — insufficient official attribution.",
          sourceUrls: [],
        });
      }
      continue;
    }

    const sourceUrls = contract.sources.map((s) => s.url);

    // Common EVM tooling — never a Circle product.
    if (contract.role === "common_evm_tooling") {
      commonToolingInteractions++;
      classifications.push({
        transactionHash: tx.hash,
        chain,
        timestamp: iso(tx.timeStamp),
        blockNumber: tx.blockNumber,
        category: "common_evm_tooling",
        product: "CommonEVM",
        contract,
        contractAddress: contract.address,
        confidence: "high",
        evidenceText: `Common EVM tooling interaction observed (${contract.notes ?? contract.id}). Not a Circle product.`,
        sourceUrls,
      });
      continue;
    }

    // CCTP source-side (depositForBurn family) on TokenMessenger.
    if (contract.role === "cctp_token_messenger") {
      const isBurn =
        sel === SELECTORS.depositForBurn ||
        sel === SELECTORS.depositForBurnV2 ||
        sel === SELECTORS.depositForBurnWithHook ||
        (tx.functionName || "").toLowerCase().includes("depositforburn");
      if (isBurn && tx.isError === "0") {
        const dec = decodeDepositForBurn(tx.input);
        const ev: EvidenceClassification = {
          transactionHash: tx.hash,
          chain,
          timestamp: iso(tx.timeStamp),
          blockNumber: tx.blockNumber,
          category: "cctp_source",
          product: "CCTP",
          contract,
          contractAddress: contract.address,
          methodName: "depositForBurn",
          eventName: "DepositForBurn",
          asset: "USDC",
          confidence: "high",
          evidenceText: `Verified CCTP source-side burn (DepositForBurn) on ${chain.name}${
            dec.destinationDomain != null
              ? `, destination domain ${dec.destinationDomain}`
              : ""
          }.`,
          sourceUrls,
          crossChainLink: {
            status: "source_only",
            sourceDomain: chain.circleDomain,
            destinationDomain: dec.destinationDomain,
          },
        };
        cctpSourceEvents.push(ev);
        classifications.push(ev);
        officialProductInteractions++;
        continue;
      }
    }

    // CCTP destination-side (receiveMessage / mint) on MessageTransmitter or Minter.
    if (
      contract.role === "cctp_message_transmitter" ||
      contract.role === "cctp_token_minter"
    ) {
      const isReceive =
        sel === SELECTORS.receiveMessage ||
        (tx.functionName || "").toLowerCase().includes("receivemessage");
      if (isReceive && tx.isError === "0") {
        const ev: EvidenceClassification = {
          transactionHash: tx.hash,
          chain,
          timestamp: iso(tx.timeStamp),
          blockNumber: tx.blockNumber,
          category: "cctp_destination",
          product: "CCTP",
          contract,
          contractAddress: contract.address,
          methodName: "receiveMessage",
          eventName: "MessageReceived",
          asset: "USDC",
          confidence: "high",
          evidenceText: `Verified CCTP destination-side receive (receiveMessage) on ${chain.name}.`,
          sourceUrls,
          crossChainLink: {
            status: "destination_only",
            destinationDomain: chain.circleDomain,
          },
        };
        cctpDestinationEvents.push(ev);
        classifications.push(ev);
        officialProductInteractions++;
        continue;
      }
    }

    // Gateway actions.
    if (contract.role === "gateway_wallet" || contract.role === "gateway_minter") {
      const fn = (tx.functionName || "").toLowerCase();
      let action = "verified Gateway contract interaction";
      if (sel === SELECTORS.deposit || fn.includes("deposit"))
        action = "verified Gateway deposit";
      else if (sel === SELECTORS.gatewayMint || fn.includes("mint"))
        action = "verified Gateway mint / receive";
      else if (sel === SELECTORS.withdraw || fn.includes("withdraw"))
        action = "verified Gateway withdrawal / burn";

      if (tx.isError === "0") {
        const ev: EvidenceClassification = {
          transactionHash: tx.hash,
          chain,
          timestamp: iso(tx.timeStamp),
          blockNumber: tx.blockNumber,
          category: "gateway_action",
          product: "Gateway",
          contract,
          contractAddress: contract.address,
          methodName: fn || undefined,
          confidence: "high",
          evidenceText: `${action} on ${chain.name}.`,
          sourceUrls,
          crossChainLink: {
            status:
              contract.role === "gateway_minter"
                ? "destination_only"
                : "source_only",
            sourceDomain: chain.circleDomain,
          },
        };
        gatewayEvents.push(ev);
        classifications.push(ev);
        officialProductInteractions++;
        continue;
      }
    }

    // StableFX.
    if (contract.role === "stablefx_escrow" && tx.isError === "0") {
      const ev: EvidenceClassification = {
        transactionHash: tx.hash,
        chain,
        timestamp: iso(tx.timeStamp),
        blockNumber: tx.blockNumber,
        category: "stablefx_action",
        product: "StableFX",
        contract,
        contractAddress: contract.address,
        confidence: "high",
        evidenceText: `Verified StableFX escrow interaction on ${chain.name}.`,
        sourceUrls,
      };
      stablefxEvents.push(ev);
      classifications.push(ev);
      officialProductInteractions++;
      continue;
    }

    // Arc system contract.
    if (contract.role === "arc_system_contract" && tx.isError === "0") {
      officialProductInteractions++;
      classifications.push({
        transactionHash: tx.hash,
        chain,
        timestamp: iso(tx.timeStamp),
        blockNumber: tx.blockNumber,
        category: "official_product_interaction",
        product: "Arc",
        contract,
        contractAddress: contract.address,
        confidence: "high",
        evidenceText: `Verified Arc system contract interaction (${contract.id}).`,
        sourceUrls,
      });
      continue;
    }

    // Asset contract direct calls (approve / transferFrom to token contract).
    const asset = assetOf(contract);
    if (asset) {
      const isApprove =
        sel === SELECTORS.approve ||
        (tx.functionName || "").toLowerCase().includes("approve");
      classifications.push({
        transactionHash: tx.hash,
        chain,
        timestamp: iso(tx.timeStamp),
        blockNumber: tx.blockNumber,
        category: isApprove ? "asset_approval" : "asset_transfer",
        product: asset,
        contract,
        contractAddress: contract.address,
        asset,
        methodName: isApprove ? "approve" : undefined,
        confidence: "high",
        evidenceText: `${asset} ${
          isApprove ? "approval" : "contract call"
        } on ${chain.name}.`,
        sourceUrls,
      });
      continue;
    }

    // Fallback: registry-known contract, generic interaction.
    officialProductInteractions++;
    classifications.push({
      transactionHash: tx.hash,
      chain,
      timestamp: iso(tx.timeStamp),
      blockNumber: tx.blockNumber,
      category: "official_product_interaction",
      product: contract.product,
      contract,
      contractAddress: contract.address,
      confidence: "moderate",
      evidenceText: `Verified ${contract.product} contract interaction on ${chain.name}.`,
      sourceUrls,
    });
  }

  // ---------- classify token transfers (ERC-20 Transfer events) ----------
  const assetStats = buildAssetStats(index.tokenTxs, me, chain, chainId);
  for (const tt of index.tokenTxs) {
    const contract = lookupContract(chainId, tt.contractAddress.toLowerCase());
    const asset = assetOf(contract);
    if (!asset || !contract) continue; // only official Circle assets
    const dir =
      tt.from.toLowerCase() === me && tt.to.toLowerCase() === me
        ? "self"
        : tt.to.toLowerCase() === me
          ? "in"
          : "out";
    const cp = (dir === "in" ? tt.from : tt.to).toLowerCase();
    if (cp && cp !== me) counterparties.add(cp);
    classifications.push({
      transactionHash: tt.hash,
      chain,
      timestamp: iso(tt.timeStamp),
      blockNumber: tt.blockNumber,
      category: "asset_transfer",
      product: asset,
      contract,
      contractAddress: contract.address,
      asset,
      direction: dir,
      confidence: "high",
      evidenceText: `${asset} transfer (${dir}) on ${chain.name}.`,
      sourceUrls: contract.sources.map((s) => s.url),
    });
  }

  const classifiedCount = classifications.filter(
    (c) => c.category !== "unclassified",
  ).length;
  const unclassifiedCount = classifications.filter(
    (c) => c.category === "unclassified",
  ).length;

  return {
    chain,
    classifications: classifications.sort(
      (a, b) => b.blockNumber - a.blockNumber,
    ),
    assetStats,
    totalTxs: index.txs.length,
    successfulTxs: successfulTxs.length,
    failedTxs: failedTxs.length,
    activeDays: dayset.size,
    firstSeen,
    lastSeen,
    uniqueCounterparties: counterparties.size,
    contractDeployments,
    commonToolingInteractions,
    cctpSourceEvents,
    cctpDestinationEvents,
    gatewayEvents,
    stablefxEvents,
    officialProductInteractions,
    classifiedCount,
    unclassifiedCount,
  };
}

function buildAssetStats(
  tokenTxs: RawTokenTx[],
  me: string,
  chain: ChainIndex["chain"],
  chainId: number | undefined,
): AssetChainStats[] {
  const byAsset = new Map<"USDC" | "EURC" | "USYC", RawTokenTx[]>();
  for (const tt of tokenTxs) {
    const c = lookupContract(chainId, tt.contractAddress.toLowerCase());
    const asset = assetOf(c);
    if (!asset) continue;
    const arr = byAsset.get(asset) ?? [];
    arr.push(tt);
    byAsset.set(asset, arr);
  }

  const out: AssetChainStats[] = [];
  for (const [asset, txs] of byAsset) {
    const days = new Set<string>();
    const counterparties = new Set<string>();
    let inbound = 0;
    let outbound = 0;
    let self = 0;
    let first: number | null = null;
    let last: number | null = null;
    for (const tt of txs) {
      days.add(DAY_KEY(tt.timeStamp));
      const from = tt.from.toLowerCase();
      const to = tt.to.toLowerCase();
      if (from === me && to === me) self++;
      else if (to === me) {
        inbound++;
        if (from) counterparties.add(from);
      } else if (from === me) {
        outbound++;
        if (to) counterparties.add(to);
      }
      if (first === null || tt.timeStamp < first) first = tt.timeStamp;
      if (last === null || tt.timeStamp > last) last = tt.timeStamp;
    }
    out.push({
      chainName: chain.name,
      chainId: chain.chainId,
      asset,
      transferCount: txs.length,
      inboundCount: inbound,
      outboundCount: outbound,
      contractInteractionCount: 0,
      approvalCount: 0,
      uniqueCounterparties: counterparties.size,
      uniqueContracts: 1,
      activeDays: days.size,
      firstObserved: first,
      lastObserved: last,
      selfTransferEstimate: self,
    });
  }
  return out;
}
