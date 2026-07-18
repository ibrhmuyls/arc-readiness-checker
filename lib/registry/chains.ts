/**
 * Chain definitions — verified from official Circle & Arc documentation.
 *
 * Sources:
 * - CCTP supported chains & domains:
 *   https://developers.circle.com/cctp/concepts/supported-chains-and-domains
 * - Gateway supported blockchains:
 *   https://developers.circle.com/gateway/references/supported-blockchains
 * - Arc network configuration:
 *   https://docs.arc.io/arc/references/connect-to-arc
 *
 * IMPORTANT: Circle "domain" identifiers are NOT chain IDs. Arc Testnet's
 * chainId is 5042002 (verified via https://rpc.testnet.arc.network eth_chainId
 * => 0x4cef52 => 5042002). An earlier version of this app incorrectly used
 * 421614 (Arbitrum Sepolia). Fixed.
 */

import type { ChainRef } from "./types";

/**
 * rpcStatus reflects what THIS deployment can currently query without a key.
 * Arc Testnet exposes a public Blockscout API + public RPC -> "supported".
 * Other chains are "partial": they become queryable only when an
 * Etherscan-V2-compatible API key is provided server-side (ETHERSCAN_API_KEY).
 * Without a key they are reported as "Not assessed", never "No activity".
 */

export const CHAINS: Record<string, ChainRef> = {
  // ---- Arc ----
  "arc-testnet": {
    caip2: "eip155:5042002",
    chainId: 5042002,
    name: "Arc Testnet",
    family: "evm",
    circleDomain: 26,
    rpcStatus: "supported",
    testnet: true,
    explorerBase: "https://testnet.arcscan.app",
    explorerKind: "blockscout",
    nativeGasContract: "0x3600000000000000000000000000000000000000",
  },

  // ---- Circle-supported EVM mainnets (Etherscan V2 multichain) ----
  ethereum: {
    caip2: "eip155:1",
    chainId: 1,
    name: "Ethereum",
    family: "evm",
    circleDomain: 0,
    rpcStatus: "partial",
    explorerBase: "https://etherscan.io",
    explorerKind: "etherscan",
  },
  avalanche: {
    caip2: "eip155:43114",
    chainId: 43114,
    name: "Avalanche",
    family: "evm",
    circleDomain: 1,
    rpcStatus: "partial",
    explorerBase: "https://snowscan.xyz",
    explorerKind: "etherscan",
  },
  optimism: {
    caip2: "eip155:10",
    chainId: 10,
    name: "OP Mainnet",
    family: "evm",
    circleDomain: 2,
    rpcStatus: "partial",
    explorerBase: "https://optimistic.etherscan.io",
    explorerKind: "etherscan",
  },
  arbitrum: {
    caip2: "eip155:42161",
    chainId: 42161,
    name: "Arbitrum",
    family: "evm",
    circleDomain: 3,
    rpcStatus: "partial",
    explorerBase: "https://arbiscan.io",
    explorerKind: "etherscan",
  },
  base: {
    caip2: "eip155:8453",
    chainId: 8453,
    name: "Base",
    family: "evm",
    circleDomain: 6,
    rpcStatus: "partial",
    explorerBase: "https://basescan.org",
    explorerKind: "etherscan",
  },
  polygon: {
    caip2: "eip155:137",
    chainId: 137,
    name: "Polygon PoS",
    family: "evm",
    circleDomain: 7,
    rpcStatus: "partial",
    explorerBase: "https://polygonscan.com",
    explorerKind: "etherscan",
  },
  unichain: {
    caip2: "eip155:130",
    chainId: 130,
    name: "Unichain",
    family: "evm",
    circleDomain: 10,
    rpcStatus: "partial",
    explorerBase: "https://uniscan.xyz",
    explorerKind: "etherscan",
  },
  linea: {
    caip2: "eip155:59144",
    chainId: 59144,
    name: "Linea",
    family: "evm",
    circleDomain: 11,
    rpcStatus: "partial",
    explorerBase: "https://lineascan.build",
    explorerKind: "etherscan",
  },
  sonic: {
    caip2: "eip155:146",
    chainId: 146,
    name: "Sonic",
    family: "evm",
    circleDomain: 13,
    rpcStatus: "partial",
    explorerBase: "https://sonicscan.org",
    explorerKind: "etherscan",
  },
  worldchain: {
    caip2: "eip155:480",
    chainId: 480,
    name: "World Chain",
    family: "evm",
    circleDomain: 14,
    rpcStatus: "partial",
    explorerBase: "https://worldscan.org",
    explorerKind: "etherscan",
  },
};

export const CHAIN_LIST: ChainRef[] = Object.values(CHAINS);

/** Chains that are always indexable in this deployment (no key needed). */
export const ALWAYS_INDEXABLE = CHAIN_LIST.filter(
  (c) => c.rpcStatus === "supported",
);

/** All officially supported EVM chains this app can consider. */
export const EVM_CHAINS = CHAIN_LIST.filter((c) => c.family === "evm");

export function chainByDomain(domain: number): ChainRef | undefined {
  return CHAIN_LIST.find((c) => c.circleDomain === domain);
}

export function chainById(chainId: number): ChainRef | undefined {
  return CHAIN_LIST.find((c) => c.chainId === chainId);
}

export const ARC_TESTNET = CHAINS["arc-testnet"];
export const ARC_CHAIN_ID = 5042002;
