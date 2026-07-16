import { isAddress as viemIsAddress, getAddress } from "viem";
import type { Address } from "./types";

/**
 * Validate an Arc (EVM) address. Arc is EVM-compatible, so standard EIP-55
 * checksum validation applies. Returns the checksummed form on success.
 */
export function isArcAddress(value: string): value is Address {
  return viemIsAddress(value);
}

export function normalizeAddress(value: string): Address {
  if (!viemIsAddress(value)) {
    throw new Error("Invalid Arc wallet address");
  }
  return getAddress(value) as Address;
}

export const ADDRESS_ERROR_MESSAGE =
  "Enter a valid Arc wallet address (0x…, 40 hex characters).";
