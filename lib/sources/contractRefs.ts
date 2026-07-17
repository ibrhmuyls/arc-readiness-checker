// ContractRefs removed from lib/types.ts; use inline type

/**
 * Arc TESTNET contract addresses.
 *
 * Snapshot from docs.arc.io/arc/references/contract-addresses.md, verified
 * 2026-07-16. These are TESTNET addresses only.
 *
 * WARNING: mainnet addresses are not yet available.
 */

export interface ContractRefs { [key: string]: `0x${string}` }
export const CONTRACT_REFS: ContractRefs = {
  usdc: "0x3600000000000000000000000000000000000000",
  eurc: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
  usyc: "0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C",
  usycEntitlements: "0xcc205224862c7641930c87679e98999d23c26113",
  usycTeller: "0x9fdF14c5B14173D74C08Af27AebFf39240dC105A",
  cctpTokenMessengerV2: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
  cctpMessageTransmitterV2: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
  cctpTokenMinterV2: "0xb43db544E2c27092c107639Ad201b3dEfAbcF192",
  cctpMessageV2: "0xbaC0179bB358A8936169a63408C8481D582390C4",
  gatewayWallet: "0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
  gatewayMinter: "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B",
  stablefxFxEscrow: "0x867650F5eAe8df91445971f14d89fd84F0C9a9f8",
  memo: "0x5294E9927c3306DcBaDb03fe70b92e01cCede505",
  multicall3From: "0x522fAf9A91c41c443c66765030741e4AaCe147D0",
  permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  multicall3: "0xcA11bde05977b3631167028862bE2a173976CA11",
  create2Factory: "0x4e59b44847b379578588920cA78FbF26c0B4956C",
};

export const lowerSet = (obj: ContractRefs): Set<string> => {
  const out = new Set<string>();
  for (const v of Object.values(obj as Record<string, string>)) out.add(v.toLowerCase());
  return out;
};
