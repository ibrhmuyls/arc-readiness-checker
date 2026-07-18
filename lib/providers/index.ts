import { EVM_CHAINS } from "../registry/chains";
import type { ChainRef } from "../registry/types";
import { BlockscoutProvider } from "./blockscout";
import { EtherscanV2Provider } from "./etherscanV2";
import type { ChainDataProvider } from "./types";

/**
 * Build the set of providers for all officially supported EVM chains.
 * - Arc Testnet (rpcStatus "supported") -> Blockscout, always available.
 * - Other EVM chains (rpcStatus "partial") -> Etherscan V2, available only
 *   when ETHERSCAN_API_KEY is set server-side.
 *
 * Server-side only: reads process.env. Never import into client components.
 */
export function buildProviders(): ChainDataProvider[] {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  return EVM_CHAINS.map((chain: ChainRef) => {
    if (chain.rpcStatus === "supported" && chain.explorerKind === "blockscout") {
      return new BlockscoutProvider(chain);
    }
    return new EtherscanV2Provider(chain, apiKey);
  });
}

export { BlockscoutProvider, EtherscanV2Provider };
export type {
  ChainDataProvider,
  ChainIndex,
  IndexResult,
  RawLog,
  RawTokenTx,
  RawTx,
} from "./types";
