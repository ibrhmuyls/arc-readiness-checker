/**
 * Official Arc Testnet / Circle contract registry.
 *
 * Every entry is sourced from an official public page and stamped.
 * Do NOT edit without updating sourceUrl and verifiedAt.
 *
 * Sources:
 * - https://docs.arc.io/arc/references/contract-addresses.md (verified 2026-07-16)
 * - https://docs.arc.io/arc/references/evm-differences.md (verified 2026-07-16)
 */

export type ContractRole =
  | "stablecoin"
  | "bridge-token-messenger"
  | "bridge-message-transmitter"
  | "bridge-minter"
  | "bridge-wallet"
  | "fx-escrow"
  | "developer-primitive"
  | "permissioned"
  | "other";

export type ProductModule =
  | "arc"
  | "usdc"
  | "eurc"
  | "usyc"
  | "cctp"
  | "gateway"
  | "stablefx"
  | "developer-tools"
  | "unknown";

export interface RegistryEntry {
  product: ProductModule;
  name: string;
  chainId: number;
  address: `0x${string}`;
  role: ContractRole;
  sourceUrl: string;
  verifiedAt: string;
  status: "active" | "deprecated" | "unknown";
  notes?: string;
}

export const CONTRACT_REGISTRY: RegistryEntry[] = [
  {
    product: "usdc",
    name: "USDC (ERC-20 interface)",
    chainId: 421614,
    address: "0x3600000000000000000000000000000000000000",
    role: "stablecoin",
    sourceUrl: "https://docs.arc.io/arc/references/contract-addresses.md",
    verifiedAt: "2026-07-16",
    status: "active",
    notes: "Native USDC uses 18 decimals for gas; ERC-20 interface uses 6 decimals.",
  },
  {
    product: "eurc",
    name: "EURC",
    chainId: 421614,
    address: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
    role: "stablecoin",
    sourceUrl: "https://docs.arc.io/arc/references/contract-addresses.md",
    verifiedAt: "2026-07-16",
    status: "active",
    notes: "6 decimals.",
  },
  {
    product: "usyc",
    name: "USYC",
    chainId: 421614,
    address: "0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C",
    role: "stablecoin",
    sourceUrl: "https://docs.arc.io/arc/references/contract-addresses.md",
    verifiedAt: "2026-07-16",
    status: "active",
    notes: "6 decimals. Permissioned token; requires allowlisting on Arc Testnet.",
  },
  {
    product: "usyc",
    name: "USYC Entitlements",
    chainId: 421614,
    address: "0xcc205224862c7641930c87679e98999d23c26113",
    role: "permissioned",
    sourceUrl: "https://docs.arc.io/arc/references/contract-addresses.md",
    verifiedAt: "2026-07-16",
    status: "active",
    notes: "Allowlist/access control for USYC.",
  },
  {
    product: "usyc",
    name: "USYC Teller (testnet)",
    chainId: 421614,
    address: "0x9fdF14c5B14173D74C08Af27AebFf39240dC105A",
    role: "other",
    sourceUrl: "https://docs.arc.io/arc/references/contract-addresses.md",
    verifiedAt: "2026-07-16",
    status: "active",
    notes: "Mint/redeem testnet USYC <=> USDC once allowlisted.",
  },
  {
    product: "cctp",
    name: "CCTP TokenMessengerV2",
    chainId: 421614,
    address: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    role: "bridge-token-messenger",
    sourceUrl: "https://docs.arc.io/arc/references/contract-addresses.md",
    verifiedAt: "2026-07-16",
    status: "active",
    notes: "CCTP domain 26 on Arc Testnet.",
  },
  {
    product: "cctp",
    name: "CCTP MessageTransmitterV2",
    chainId: 421614,
    address: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    role: "bridge-message-transmitter",
    sourceUrl: "https://docs.arc.io/arc/references/contract-addresses.md",
    verifiedAt: "2026-07-16",
    status: "active",
  },
  {
    product: "cctp",
    name: "CCTP TokenMinterV2",
    chainId: 421614,
    address: "0xb43db544E2c27092c107639Ad201b3dEfAbcF192",
    role: "bridge-minter",
    sourceUrl: "https://docs.arc.io/arc/references/contract-addresses.md",
    verifiedAt: "2026-07-16",
    status: "active",
  },
  {
    product: "cctp",
    name: "CCTP MessageV2",
    chainId: 421614,
    address: "0xbaC0179bB358A8936169a63408C8481D582390C4",
    role: "other",
    sourceUrl: "https://docs.arc.io/arc/references/contract-addresses.md",
    verifiedAt: "2026-07-16",
    status: "active",
    notes: "Message body contract for attestation. Not directly called by typical wallets.",
  },
  {
    product: "gateway",
    name: "GatewayWallet",
    chainId: 421614,
    address: "0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
    role: "bridge-wallet",
    sourceUrl: "https://docs.arc.io/arc/references/contract-addresses.md",
    verifiedAt: "2026-07-16",
    status: "active",
  },
  {
    product: "gateway",
    name: "GatewayMinter",
    chainId: 421614,
    address: "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B",
    role: "bridge-minter",
    sourceUrl: "https://docs.arc.io/arc/references/contract-addresses.md",
    verifiedAt: "2026-07-16",
    status: "active",
  },
  {
    product: "stablefx",
    name: "StableFX FxEscrow",
    chainId: 421614,
    address: "0x867650F5eAe8df91445971f14d89fd84F0C9a9f8",
    role: "fx-escrow",
    sourceUrl: "https://docs.arc.io/arc/references/contract-addresses.md",
    verifiedAt: "2026-07-16",
    status: "active",
    notes: "Settlement escrow for RFQ-based stablecoin swaps.",
  },
  {
    product: "developer-tools",
    name: "Memo",
    chainId: 421614,
    address: "0x5294E9927c3306DcBaDb03fe70b92e01cCede505",
    role: "developer-primitive",
    sourceUrl: "https://docs.arc.io/arc/references/contract-addresses.md",
    verifiedAt: "2026-07-16",
    status: "active",
  },
  {
    product: "developer-tools",
    name: "Multicall3From",
    chainId: 421614,
    address: "0x522fAf9A91c41c443c66765030741e4AaCe147D0",
    role: "developer-primitive",
    sourceUrl: "https://docs.arc.io/arc/references/contract-addresses.md",
    verifiedAt: "2026-07-16",
    status: "active",
  },
  {
    product: "developer-tools",
    name: "Permit2",
    chainId: 421614,
    address: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    role: "developer-primitive",
    sourceUrl: "https://docs.arc.io/arc/references/contract-addresses.md",
    verifiedAt: "2026-07-16",
    status: "active",
    notes: "Required for StableFX allowance.",
  },
  {
    product: "developer-tools",
    name: "Multicall3",
    chainId: 421614,
    address: "0xcA11bde05977b3631167028862bE2a173976CA11",
    role: "developer-primitive",
    sourceUrl: "https://docs.arc.io/arc/references/contract-addresses.md",
    verifiedAt: "2026-07-16",
    status: "active",
  },
  {
    product: "developer-tools",
    name: "CREATE2 Factory (Arachnid)",
    chainId: 421614,
    address: "0x4e59b44847b379578588920cA78FbF26c0B4956C",
    role: "developer-primitive",
    sourceUrl: "https://docs.arc.io/arc/references/contract-addresses.md",
    verifiedAt: "2026-07-16",
    status: "active",
  },
];

export const ARC_CHAIN_ID = 421614;
export const ARC_NETWORK_LABEL = "Arc Testnet";
export const EXPLORER_BASE = "https://testnet.arcscan.app";
export const RPC_URL = "https://rpc.testnet.arc.network";
export const CACHE_TTL_SECONDS = 60;
export const MAX_ROWS = 100;
export const EXPLORER_LEGACY_BASE = `${EXPLORER_BASE}/api`;
export const NETWORK_LABEL = ARC_NETWORK_LABEL;

export const stablecoinSet = new Set(
  CONTRACT_REGISTRY.filter((e) => e.role === "stablecoin").map((e) => e.address.toLowerCase())
);
export const bridgeSet = new Set(
  CONTRACT_REGISTRY.filter((e) =>
    ["bridge-token-messenger", "bridge-message-transmitter", "bridge-minter", "bridge-wallet"].includes(e.role)
  ).map((e) => e.address.toLowerCase())
);
export const developerToolSet = new Set(
  CONTRACT_REGISTRY.filter((e) => e.role === "developer-primitive").map((e) => e.address.toLowerCase())
);
export const registryByAddress = new Map(
  CONTRACT_REGISTRY.map((e) => [e.address.toLowerCase(), e])
);
