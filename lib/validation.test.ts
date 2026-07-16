import { describe, it, expect } from "vitest";
import { isArcAddress, normalizeAddress } from "./validation";

describe("address validation", () => {
  it("accepts a valid checksummed address", () => {
    expect(isArcAddress("0x5294E9927c3306DcBaDb03fe70b92e01cCede505")).toBe(true);
  });

  it("accepts a valid all-lowercase address", () => {
    expect(isArcAddress("0x5294e9927c3306dcbadb03fe70b92e01ccede505")).toBe(true);
  });

  it("rejects malformed input", () => {
    expect(isArcAddress("0x123")).toBe(false);
    expect(isArcAddress("not-an-address")).toBe(false);
    expect(isArcAddress("")).toBe(false);
  });

  it("normalizes to checksummed form", () => {
    const n = normalizeAddress("0x5294e9927c3306dcbadb03fe70b92e01ccede505");
    expect(n).toBe("0x5294E9927c3306DcBaDb03fe70b92e01cCede505");
  });

  it("throws on invalid address normalization", () => {
    expect(() => normalizeAddress("0xzzz")).toThrow();
  });
});
