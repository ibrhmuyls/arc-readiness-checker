/**
 * Typed, versioned, source-linked registry schema.
 *
 * Every record carries the official source URL + retrieval timestamp that
 * authorizes it. Classifier logic must never hardcode product addresses;
 * it resolves everything through this registry.
 */

export type Address = `0x${string}`;

export type ChainFamily = "evm" | "solana" | "stellar" | "starknet" | "other";

export type RpcStatus = "supported" | "partial" | "unavailable";

export type ChainRef = {
  /** CAIP-2 identifier, e.g. "eip155:1". */
  caip2: string;
  chainId?: number;
  name: string;
  family: ChainFamily;
  /** Circle CCTP/Gateway numeric domain identifier (not a chain ID). */
  circleDomain?: number;
  /** Whether this app can currently query the chain for a public address. */
  rpcStatus: RpcStatus;
  /** Whether this chain is a testnet. */
  testnet?: boolean;
  /** Correct block explorer base for address/tx links. */
  explorerBase?: string;
  /** Explorer URL kind so link builders format addr/tx paths correctly. */
  explorerKind?: "etherscan" | "blockscout" | "other";
  /** ERC-20 USDC interface address on this chain, if officially listed. */
  nativeGasContract?: string;
};

export type OfficialSource = {
  url: string;
  title: string;
  publisher: "Circle" | "Arc";
  retrievedAt: string;
  contentHash?: string;
};

export type ContractRole =
  | "usdc_erc20_interface"
  | "eurc_token"
  | "usyc_token"
  | "usyc_entitlements"
  | "usyc_teller"
  | "cctp_token_messenger"
  | "cctp_message_transmitter"
  | "cctp_token_minter"
  | "cctp_message"
  | "gateway_wallet"
  | "gateway_minter"
  | "stablefx_escrow"
  | "arc_system_contract"
  | "circle_product_contract"
  | "common_evm_tooling"
  | "other_verified_role";

export type RegistryProduct =
  | "Arc"
  | "USDC"
  | "EURC"
  | "USYC"
  | "CCTP"
  | "Gateway"
  | "StableFX"
  | "CommonEVM"
  | "Other";

export type ContractStatus = "active" | "deprecated" | "unverified";

export type RegistryContract = {
  id: string;
  product: RegistryProduct;
  productVersion?: string;
  chain: ChainRef;
  address: Address;
  addressType: "contract" | "native_asset_interface" | "system_contract";
  role: ContractRole;
  abiVersion?: string;
  supportedEvents: string[];
  supportedMethods?: string[];
  activeFrom?: string;
  deprecatedAt?: string;
  status: ContractStatus;
  sources: OfficialSource[];
  lastVerifiedAt: string;
  notes?: string;
};

export type ProductCapabilityKind =
  | "asset_transfer"
  | "cctp_send"
  | "cctp_receive"
  | "gateway_deposit"
  | "gateway_receive"
  | "gateway_withdraw"
  | "stablefx_settlement"
  | "other";

export type CapabilityStatus = "supported" | "not_supported" | "not_assessed";

export type ProductCapability = {
  product: string;
  chain: ChainRef;
  capability: ProductCapabilityKind;
  status: CapabilityStatus;
  sources: OfficialSource[];
  lastVerifiedAt: string;
  notes?: string;
};

export type RegistryVersion = {
  version: string;
  generatedAt: string;
  officialSources: OfficialSource[];
  chains: ChainRef[];
  contracts: RegistryContract[];
  capabilities: ProductCapability[];
  changelog: string[];
};

export type RegistryValidationIssue = {
  level: "error" | "warning";
  contractId?: string;
  message: string;
};

export type RegistryValidationReport = {
  version: string;
  checkedAt: string;
  totalContracts: number;
  activeContracts: number;
  deprecatedContracts: number;
  unverifiedContracts: number;
  duplicateAddressChainPairs: string[];
  missingSources: string[];
  issues: RegistryValidationIssue[];
  ok: boolean;
};
