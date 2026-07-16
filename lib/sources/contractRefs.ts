import type { Address, ContractRefs } from "../types";

/**
 * Arc TESTNET contract addresses (snapshot from docs.arc.io/arc/references/
 * contract-addresses.md, verified 2026-07-16). Used as a static reference to
 * detect a wallet's category interactions from its on-chain history.
 *
 * NOTE: These are TESTNET addresses. If Arc ships mainnet, this table must be
 * updated before mainnet scoring is enabled. We do NOT fetch this at runtime —
 * it is build-time constant data so scoring is deterministic and offline-safe.
 */
export const CONTRACT_REFS: ContractRefs = {
  stablecoins: [
    "0x3600000000000000000000000000000000000000", // USDC (native gas, optional ERC-20)
    "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a", // EURC
    "0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C", // USYC
  ],
  bridge: [
    "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA", // CCTP TokenMessengerV2
    "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275", // CCTP MessageTransmitterV2
    "0xb43db544E2c27092c107639Ad201b3dEfAbcF192", // CCTP TokenMinterV2
    "0xbaC0179bB358A8936169a63408C8481D582390C4", // CCTP MessageV2
    "0x0077777d7EBA4688BDeF3E311b846F25870A19B9", // GatewayWallet
    "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B", // GatewayMinter
  ],
  defi: [
    "0xcA11bde05977b3631167028862bE2a173976CA11", // Multicall3
    "0x000000000022D473030F116dDEE9F6B43aC78BA3", // Permit2
    "0x867650F5eAe8df91445971f14d89fd84F0C9a9f8", // StableFX FxEscrow
    "0x5294E9927c3306DcBaDb03fe70b92e01cCede505", // Memo
  ],
};

export function lowerSet(addrs: Address[]): Set<string> {
  return new Set(addrs.map((a) => a.toLowerCase()));
}
