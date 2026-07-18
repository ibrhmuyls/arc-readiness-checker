/**
 * Registry version 2.0.0 — Circle Ecosystem Footprint.
 *
 * All contract addresses below were verified on 2026-07-17 from the official
 * Circle developer docs and Arc docs (.md canonical versions). Each record
 * links to its authoritative source. Do NOT edit an address without bumping the
 * version and adding a changelog entry.
 *
 * Verified official sources (retrieved 2026-07-17):
 * - https://developers.circle.com/cctp/concepts/supported-chains-and-domains
 * - https://developers.circle.com/cctp/references/contract-addresses
 * - https://developers.circle.com/gateway/references/supported-blockchains
 * - https://developers.circle.com/gateway/references/contract-addresses
 * - https://developers.circle.com/stablecoins/usdc-contract-addresses
 * - https://developers.circle.com/stablecoins/eurc-contract-addresses
 * - https://docs.arc.io/arc/references/contract-addresses
 * - https://docs.arc.io/arc/references/connect-to-arc
 */

import { CHAINS, CHAIN_LIST } from "./chains";
import type {
  Address,
  OfficialSource,
  ProductCapability,
  RegistryContract,
  RegistryVersion,
} from "./types";

const RETRIEVED = "2026-07-17";

// ---- Official source records ----
const SRC = {
  cctpChains: {
    url: "https://developers.circle.com/cctp/concepts/supported-chains-and-domains",
    title: "CCTP — Supported chains and domains",
    publisher: "Circle",
    retrievedAt: RETRIEVED,
  } as OfficialSource,
  cctpContracts: {
    url: "https://developers.circle.com/cctp/references/contract-addresses",
    title: "CCTP — Contract addresses",
    publisher: "Circle",
    retrievedAt: RETRIEVED,
  } as OfficialSource,
  gwChains: {
    url: "https://developers.circle.com/gateway/references/supported-blockchains",
    title: "Gateway — Supported blockchains",
    publisher: "Circle",
    retrievedAt: RETRIEVED,
  } as OfficialSource,
  gwContracts: {
    url: "https://developers.circle.com/gateway/references/contract-addresses",
    title: "Gateway — Contract addresses",
    publisher: "Circle",
    retrievedAt: RETRIEVED,
  } as OfficialSource,
  usdc: {
    url: "https://developers.circle.com/stablecoins/usdc-contract-addresses",
    title: "USDC — Contract addresses",
    publisher: "Circle",
    retrievedAt: RETRIEVED,
  } as OfficialSource,
  eurc: {
    url: "https://developers.circle.com/stablecoins/eurc-contract-addresses",
    title: "EURC — Contract addresses",
    publisher: "Circle",
    retrievedAt: RETRIEVED,
  } as OfficialSource,
  arcContracts: {
    url: "https://docs.arc.io/arc/references/contract-addresses",
    title: "Arc — Contract addresses",
    publisher: "Arc",
    retrievedAt: RETRIEVED,
  } as OfficialSource,
  arcConnect: {
    url: "https://docs.arc.io/arc/references/connect-to-arc",
    title: "Arc — Connect to Arc (network configuration)",
    publisher: "Arc",
    retrievedAt: RETRIEVED,
  } as OfficialSource,
};

export const OFFICIAL_SOURCES: OfficialSource[] = Object.values(SRC);

// ---- CCTP V2 shared EVM addresses (same across most chains per docs) ----
const CCTP_V2 = {
  tokenMessengerMainnet: "0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d" as Address,
  messageTransmitterMainnet: "0x81D40F21F12A8F0E3252Bccb954D722d4c464B64" as Address,
  tokenMinterMainnet: "0xfd78EE919681417d192449715b2594ab58f5D002" as Address,
  messageMainnet: "0xec546b6B005471ECf012e5aF77FBeC07e0FD8f78" as Address,
  // Testnet addresses (shared across testnets incl. Arc Testnet)
  tokenMessengerTestnet: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA" as Address,
  messageTransmitterTestnet: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275" as Address,
  tokenMinterTestnet: "0xb43db544E2c27092c107639Ad201b3dEfAbcF192" as Address,
  messageTestnet: "0xbaC0179bB358A8936169a63408C8481D582390C4" as Address,
};

const GATEWAY = {
  walletMainnet: "0x77777777Dcc4d5A8B6E418Fd04D8997ef11000eE" as Address,
  minterMainnet: "0x2222222d7164433c4C09B0b0D809a9b52C04C205" as Address,
  walletTestnet: "0x0077777d7EBA4688BDeF3E311b846F25870A19B9" as Address,
  minterTestnet: "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B" as Address,
};

// ---- Official ABI event signatures (versioned) ----
const CCTP_V2_EVENTS = [
  // DepositForBurn(uint64 nonce indexed?, ...) — CCTP V2 uses non-indexed nonce
  "DepositForBurn",
  "MintAndWithdraw",
  "MessageSent",
  "MessageReceived",
];

const GATEWAY_EVENTS = [
  "Deposit",
  "Withdraw",
  "WithdrawalRequested",
  "AttestationUsed",
  "GatewayMint",
];

// USDC mainnet token addresses (native issuance) per Circle docs.
const USDC_MAINNET: Record<string, Address> = {
  ethereum: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  avalanche: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  optimism: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  arbitrum: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  polygon: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  unichain: "0x078D782b760474a361dDA0AF3839290b0EF57AD6",
  linea: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff",
  sonic: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894",
  worldchain: "0x79A02482A880bCe3F13E09da970dC34dB4cD24D1",
};

// EURC mainnet token addresses per Circle docs.
const EURC_MAINNET: Record<string, Address> = {
  ethereum: "0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c",
  avalanche: "0xC891EB4cbdEFf6e073e859e987815Ed1505c2ACD",
  base: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42",
  worldchain: "0x1C60ba0A0eD1019e8Eb035E6daF4155A5cE2380B",
};

function contract(
  c: Omit<RegistryContract, "lastVerifiedAt"> & { lastVerifiedAt?: string },
): RegistryContract {
  return { lastVerifiedAt: RETRIEVED, ...c };
}

// ================= CONTRACTS =================
const CONTRACTS: RegistryContract[] = [
  // ---------- Arc Testnet: assets ----------
  contract({
    id: "arc-usdc",
    product: "USDC",
    chain: CHAINS["arc-testnet"],
    address: "0x3600000000000000000000000000000000000000",
    addressType: "native_asset_interface",
    role: "usdc_erc20_interface",
    abiVersion: "erc20",
    supportedEvents: ["Transfer", "Approval"],
    supportedMethods: ["transfer", "transferFrom", "approve"],
    status: "active",
    sources: [SRC.arcContracts, SRC.usdc],
    notes:
      "USDC is Arc's native gas asset (18 decimals native, 6 decimals via ERC-20 interface). ERC-20 interface is optional.",
  }),
  contract({
    id: "arc-eurc",
    product: "EURC",
    chain: CHAINS["arc-testnet"],
    address: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
    addressType: "contract",
    role: "eurc_token",
    abiVersion: "erc20",
    supportedEvents: ["Transfer", "Approval"],
    status: "active",
    sources: [SRC.arcContracts, SRC.eurc],
    notes: "6 decimals.",
  }),
  contract({
    id: "arc-usyc",
    product: "USYC",
    chain: CHAINS["arc-testnet"],
    address: "0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C",
    addressType: "contract",
    role: "usyc_token",
    abiVersion: "erc20",
    supportedEvents: ["Transfer", "Approval"],
    status: "active",
    sources: [SRC.arcContracts],
    notes: "Yield-bearing, permissioned. Requires allowlisting. 6 decimals.",
  }),
  contract({
    id: "arc-usyc-entitlements",
    product: "USYC",
    chain: CHAINS["arc-testnet"],
    address: "0xcc205224862c7641930c87679e98999d23c26113",
    addressType: "contract",
    role: "usyc_entitlements",
    supportedEvents: [],
    status: "active",
    sources: [SRC.arcContracts],
    notes: "Allowlist/entitlement control for USYC.",
  }),
  contract({
    id: "arc-usyc-teller",
    product: "USYC",
    chain: CHAINS["arc-testnet"],
    address: "0x9fdF14c5B14173D74C08Af27AebFf39240dC105A",
    addressType: "contract",
    role: "usyc_teller",
    supportedEvents: [],
    status: "active",
    sources: [SRC.arcContracts],
    notes: "Mint/redeem testnet USYC from testnet USDC once allowlisted.",
  }),

  // ---------- Arc Testnet: CCTP V2 ----------
  contract({
    id: "arc-cctp-tokenmessenger",
    product: "CCTP",
    productVersion: "v2",
    chain: CHAINS["arc-testnet"],
    address: CCTP_V2.tokenMessengerTestnet,
    addressType: "contract",
    role: "cctp_token_messenger",
    abiVersion: "cctp-v2",
    supportedEvents: CCTP_V2_EVENTS,
    supportedMethods: ["depositForBurn", "depositForBurnWithHook"],
    status: "active",
    sources: [SRC.arcContracts, SRC.cctpContracts],
    notes: "CCTP domain 26. Emits DepositForBurn on source-side burns.",
  }),
  contract({
    id: "arc-cctp-messagetransmitter",
    product: "CCTP",
    productVersion: "v2",
    chain: CHAINS["arc-testnet"],
    address: CCTP_V2.messageTransmitterTestnet,
    addressType: "contract",
    role: "cctp_message_transmitter",
    abiVersion: "cctp-v2",
    supportedEvents: ["MessageSent", "MessageReceived"],
    supportedMethods: ["receiveMessage", "sendMessage"],
    status: "active",
    sources: [SRC.arcContracts, SRC.cctpContracts],
  }),
  contract({
    id: "arc-cctp-tokenminter",
    product: "CCTP",
    productVersion: "v2",
    chain: CHAINS["arc-testnet"],
    address: CCTP_V2.tokenMinterTestnet,
    addressType: "contract",
    role: "cctp_token_minter",
    abiVersion: "cctp-v2",
    supportedEvents: ["MintAndWithdraw"],
    status: "active",
    sources: [SRC.arcContracts, SRC.cctpContracts],
  }),
  contract({
    id: "arc-cctp-message",
    product: "CCTP",
    productVersion: "v2",
    chain: CHAINS["arc-testnet"],
    address: CCTP_V2.messageTestnet,
    addressType: "contract",
    role: "cctp_message",
    abiVersion: "cctp-v2",
    supportedEvents: [],
    status: "active",
    sources: [SRC.arcContracts, SRC.cctpContracts],
    notes: "Message body library; not typically called directly by wallets.",
  }),

  // ---------- Arc Testnet: Gateway ----------
  contract({
    id: "arc-gateway-wallet",
    product: "Gateway",
    chain: CHAINS["arc-testnet"],
    address: GATEWAY.walletTestnet,
    addressType: "contract",
    role: "gateway_wallet",
    abiVersion: "gateway-v1",
    supportedEvents: ["Deposit", "Withdraw", "WithdrawalRequested"],
    supportedMethods: ["deposit", "withdraw"],
    status: "active",
    sources: [SRC.arcContracts, SRC.gwContracts],
  }),
  contract({
    id: "arc-gateway-minter",
    product: "Gateway",
    chain: CHAINS["arc-testnet"],
    address: GATEWAY.minterTestnet,
    addressType: "contract",
    role: "gateway_minter",
    abiVersion: "gateway-v1",
    supportedEvents: ["GatewayMint", "AttestationUsed"],
    supportedMethods: ["gatewayMint"],
    status: "active",
    sources: [SRC.arcContracts, SRC.gwContracts],
  }),

  // ---------- Arc Testnet: StableFX ----------
  contract({
    id: "arc-stablefx-escrow",
    product: "StableFX",
    chain: CHAINS["arc-testnet"],
    address: "0x867650F5eAe8df91445971f14d89fd84F0C9a9f8",
    addressType: "contract",
    role: "stablefx_escrow",
    supportedEvents: [],
    status: "active",
    sources: [SRC.arcContracts],
    notes: "Escrow contract for RFQ-based stablecoin FX settlement on Arc.",
  }),

  // ---------- Arc Testnet: transaction extensions (Arc system) ----------
  contract({
    id: "arc-memo",
    product: "Arc",
    chain: CHAINS["arc-testnet"],
    address: "0x5294E9927c3306DcBaDb03fe70b92e01cCede505",
    addressType: "system_contract",
    role: "arc_system_contract",
    supportedEvents: ["Memo"],
    status: "active",
    sources: [SRC.arcContracts],
    notes: "Attaches memo metadata; emits Memo events with a sequential index.",
  }),
  contract({
    id: "arc-multicall3from",
    product: "Arc",
    chain: CHAINS["arc-testnet"],
    address: "0x522fAf9A91c41c443c66765030741e4AaCe147D0",
    addressType: "system_contract",
    role: "arc_system_contract",
    supportedEvents: [],
    status: "active",
    sources: [SRC.arcContracts],
    notes: "Batches calls while preserving original msg.sender via CallFrom.",
  }),

  // ---------- Arc Testnet: common EVM tooling (NOT Circle products) ----------
  contract({
    id: "arc-create2-factory",
    product: "CommonEVM",
    chain: CHAINS["arc-testnet"],
    address: "0x4e59b44847b379578588920cA78FbF26c0B4956C",
    addressType: "contract",
    role: "common_evm_tooling",
    supportedEvents: [],
    status: "active",
    sources: [SRC.arcContracts],
    notes: "Arachnid CREATE2 factory. Common EVM tooling, not a Circle product.",
  }),
  contract({
    id: "arc-multicall3",
    product: "CommonEVM",
    chain: CHAINS["arc-testnet"],
    address: "0xcA11bde05977b3631167028862bE2a173976CA11",
    addressType: "contract",
    role: "common_evm_tooling",
    supportedEvents: [],
    status: "active",
    sources: [SRC.arcContracts],
    notes: "Multicall3. Common EVM tooling, not a Circle product.",
  }),
  contract({
    id: "arc-permit2",
    product: "CommonEVM",
    chain: CHAINS["arc-testnet"],
    address: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    addressType: "contract",
    role: "common_evm_tooling",
    supportedEvents: ["Approval", "Permit"],
    status: "active",
    sources: [SRC.arcContracts],
    notes: "Uniswap Permit2. Common EVM tooling, not a Circle product.",
  }),
];

// ---------- Multi-chain mainnet USDC / EURC assets ----------
for (const [key, address] of Object.entries(USDC_MAINNET)) {
  const chain = CHAINS[key];
  if (!chain) continue;
  CONTRACTS.push(
    contract({
      id: `${key}-usdc`,
      product: "USDC",
      chain,
      address,
      addressType: "contract",
      role: "usdc_erc20_interface",
      abiVersion: "erc20",
      supportedEvents: ["Transfer", "Approval"],
      supportedMethods: ["transfer", "transferFrom", "approve"],
      status: "active",
      sources: [SRC.usdc],
      notes: "Natively issued USDC (6 decimals).",
    }),
  );
}

for (const [key, address] of Object.entries(EURC_MAINNET)) {
  const chain = CHAINS[key];
  if (!chain) continue;
  CONTRACTS.push(
    contract({
      id: `${key}-eurc`,
      product: "EURC",
      chain,
      address,
      addressType: "contract",
      role: "eurc_token",
      abiVersion: "erc20",
      supportedEvents: ["Transfer", "Approval"],
      status: "active",
      sources: [SRC.eurc],
      notes: "Natively issued EURC (6 decimals).",
    }),
  );
}

// ---------- Multi-chain mainnet CCTP V2 + Gateway ----------
const CCTP_MAINNET_CHAINS = [
  "ethereum",
  "avalanche",
  "optimism",
  "arbitrum",
  "base",
  "polygon",
  "unichain",
  "linea",
  "sonic",
  "worldchain",
];
for (const key of CCTP_MAINNET_CHAINS) {
  const chain = CHAINS[key];
  if (!chain) continue;
  CONTRACTS.push(
    contract({
      id: `${key}-cctp-tokenmessenger`,
      product: "CCTP",
      productVersion: "v2",
      chain,
      address: CCTP_V2.tokenMessengerMainnet,
      addressType: "contract",
      role: "cctp_token_messenger",
      abiVersion: "cctp-v2",
      supportedEvents: CCTP_V2_EVENTS,
      supportedMethods: ["depositForBurn", "depositForBurnWithHook"],
      status: "active",
      sources: [SRC.cctpContracts],
    }),
    contract({
      id: `${key}-cctp-messagetransmitter`,
      product: "CCTP",
      productVersion: "v2",
      chain,
      address: CCTP_V2.messageTransmitterMainnet,
      addressType: "contract",
      role: "cctp_message_transmitter",
      abiVersion: "cctp-v2",
      supportedEvents: ["MessageSent", "MessageReceived"],
      supportedMethods: ["receiveMessage", "sendMessage"],
      status: "active",
      sources: [SRC.cctpContracts],
    }),
    contract({
      id: `${key}-cctp-tokenminter`,
      product: "CCTP",
      productVersion: "v2",
      chain,
      address: CCTP_V2.tokenMinterMainnet,
      addressType: "contract",
      role: "cctp_token_minter",
      abiVersion: "cctp-v2",
      supportedEvents: ["MintAndWithdraw"],
      status: "active",
      sources: [SRC.cctpContracts],
    }),
  );
}

// Gateway mainnet chains per gw_contracts.md.
const GATEWAY_MAINNET_CHAINS = [
  "arbitrum",
  "avalanche",
  "base",
  "ethereum",
  "optimism",
  "polygon",
  "sonic",
  "unichain",
  "worldchain",
];
for (const key of GATEWAY_MAINNET_CHAINS) {
  const chain = CHAINS[key];
  if (!chain) continue;
  CONTRACTS.push(
    contract({
      id: `${key}-gateway-wallet`,
      product: "Gateway",
      chain,
      address: GATEWAY.walletMainnet,
      addressType: "contract",
      role: "gateway_wallet",
      abiVersion: "gateway-v1",
      supportedEvents: ["Deposit", "Withdraw", "WithdrawalRequested"],
      supportedMethods: ["deposit", "withdraw"],
      status: "active",
      sources: [SRC.gwContracts],
    }),
    contract({
      id: `${key}-gateway-minter`,
      product: "Gateway",
      chain,
      address: GATEWAY.minterMainnet,
      addressType: "contract",
      role: "gateway_minter",
      abiVersion: "gateway-v1",
      supportedEvents: ["GatewayMint", "AttestationUsed"],
      supportedMethods: ["gatewayMint"],
      status: "active",
      sources: [SRC.gwContracts],
    }),
  );
}

// ================= CAPABILITIES =================
function cap(
  product: string,
  chainKey: string,
  capability: ProductCapability["capability"],
  status: ProductCapability["status"],
  sources: OfficialSource[],
): ProductCapability {
  return {
    product,
    chain: CHAINS[chainKey],
    capability,
    status,
    sources,
    lastVerifiedAt: RETRIEVED,
  };
}

const CAPABILITIES: ProductCapability[] = [
  cap("CCTP", "arc-testnet", "cctp_send", "supported", [SRC.cctpChains]),
  cap("CCTP", "arc-testnet", "cctp_receive", "supported", [SRC.cctpChains]),
  cap("Gateway", "arc-testnet", "gateway_deposit", "supported", [SRC.gwChains]),
  cap("Gateway", "arc-testnet", "gateway_receive", "supported", [SRC.gwChains]),
  cap("StableFX", "arc-testnet", "stablefx_settlement", "supported", [
    SRC.arcContracts,
  ]),
  cap("USDC", "arc-testnet", "asset_transfer", "supported", [SRC.arcContracts]),
  cap("EURC", "arc-testnet", "asset_transfer", "supported", [SRC.arcContracts]),
  cap("USDC", "ethereum", "asset_transfer", "supported", [SRC.usdc]),
  cap("USDC", "base", "asset_transfer", "supported", [SRC.usdc]),
  cap("USDC", "arbitrum", "asset_transfer", "supported", [SRC.usdc]),
  cap("CCTP", "ethereum", "cctp_send", "supported", [SRC.cctpChains]),
  cap("CCTP", "base", "cctp_send", "supported", [SRC.cctpChains]),
  cap("Gateway", "ethereum", "gateway_deposit", "supported", [SRC.gwChains]),
];

export const REGISTRY: RegistryVersion = {
  version: "2.0.0",
  generatedAt: RETRIEVED,
  officialSources: OFFICIAL_SOURCES,
  chains: CHAIN_LIST,
  contracts: CONTRACTS,
  capabilities: CAPABILITIES,
  changelog: [
    "2.0.0 (2026-07-17): Complete rebuild as Circle Ecosystem Footprint. " +
      "Multi-chain registry: Arc Testnet + 10 Circle-supported EVM mainnets. " +
      "Corrected Arc Testnet chainId to 5042002 (was incorrectly 421614). " +
      "Added CCTP V2 (TokenMessenger/MessageTransmitter/TokenMinter/Message), " +
      "Gateway (Wallet/Minter), StableFX, USDC/EURC/USYC assets, Arc system " +
      "contracts, and common EVM tooling with role separation. Every record " +
      "links to an official Circle/Arc source retrieved 2026-07-17.",
    "1.x: Arc-testnet-only readiness checker (deprecated).",
  ],
};

// ---- Lookup indexes ----
export const CONTRACT_BY_ADDRESS_CHAIN = new Map<string, RegistryContract>(
  CONTRACTS.map((c) => [`${c.chain.chainId}:${c.address.toLowerCase()}`, c]),
);

export function lookupContract(
  chainId: number | undefined,
  address: string,
): RegistryContract | undefined {
  if (chainId == null) return undefined;
  return CONTRACT_BY_ADDRESS_CHAIN.get(`${chainId}:${address.toLowerCase()}`);
}

export function contractsForChain(chainId: number): RegistryContract[] {
  return CONTRACTS.filter((c) => c.chain.chainId === chainId);
}
