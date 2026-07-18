/**
 * Registry validation — an internal admin/developer report that verifies the
 * loaded registry is internally consistent and every record is source-linked.
 */

import { REGISTRY } from "./registry";
import type {
  RegistryContract,
  RegistryValidationIssue,
  RegistryValidationReport,
} from "./types";

export function validateRegistry(
  contracts: RegistryContract[] = REGISTRY.contracts,
): RegistryValidationReport {
  const issues: RegistryValidationIssue[] = [];
  const missingSources: string[] = [];
  const seen = new Map<string, string>();
  const duplicateAddressChainPairs: string[] = [];

  let active = 0;
  let deprecated = 0;
  let unverified = 0;

  for (const c of contracts) {
    if (c.status === "active") active++;
    else if (c.status === "deprecated") deprecated++;
    else if (c.status === "unverified") unverified++;

    // Every record must carry at least one official source.
    if (!c.sources || c.sources.length === 0) {
      missingSources.push(c.id);
      issues.push({
        level: "error",
        contractId: c.id,
        message: "Contract has no official source link.",
      });
    } else {
      for (const s of c.sources) {
        const isOfficial =
          s.url.startsWith("https://developers.circle.com/") ||
          s.url.startsWith("https://www.circle.com/") ||
          s.url.startsWith("https://docs.arc.io/");
        if (!isOfficial) {
          issues.push({
            level: "error",
            contractId: c.id,
            message: `Non-official source URL: ${s.url}`,
          });
        }
      }
    }

    // Address shape check.
    if (!/^0x[0-9a-fA-F]{40}$/.test(c.address)) {
      issues.push({
        level: "error",
        contractId: c.id,
        message: `Malformed EVM address: ${c.address}`,
      });
    }

    // Duplicate address+chain detection (never silently overwrite).
    const key = `${c.chain.chainId}:${c.address.toLowerCase()}`;
    if (seen.has(key)) {
      duplicateAddressChainPairs.push(`${key} (${seen.get(key)} & ${c.id})`);
      issues.push({
        level: "warning",
        contractId: c.id,
        message: `Duplicate address+chain with ${seen.get(key)}.`,
      });
    } else {
      seen.set(key, c.id);
    }

    // Unverified contracts must be excluded from scoring — flag as warning.
    if (c.status === "unverified") {
      issues.push({
        level: "warning",
        contractId: c.id,
        message: "Unverified contract — excluded from scoring.",
      });
    }
  }

  const ok = issues.every((i) => i.level !== "error");

  return {
    version: REGISTRY.version,
    checkedAt: new Date().toISOString(),
    totalContracts: contracts.length,
    activeContracts: active,
    deprecatedContracts: deprecated,
    unverifiedContracts: unverified,
    duplicateAddressChainPairs,
    missingSources,
    issues,
    ok,
  };
}
