// Centralized, env-driven configuration.
// Today all Arc Testnet sources are public; no keys are required.
// The seam exists so a future authenticated source stays server-only.

export const config = {
  rpcUrl: process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.network",
  explorerBase:
    process.env.ARC_EXPLORER_BASE ?? "https://testnet.arcscan.app",
  cacheTtlSeconds: Number(process.env.ARC_CACHE_TTL_SECONDS ?? "60"),
  // Explorer legacy API returns at most 10k rows per request.
  maxRows: 10000,
} as const;

export const NETWORK_LABEL = "Arc Testnet" as const;
