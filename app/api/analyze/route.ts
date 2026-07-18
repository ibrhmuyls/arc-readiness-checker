import { NextResponse } from "next/server";
import { normalizeAddress } from "@/lib/validation";
import { analyzeAddress } from "@/lib/report/analyze";
import type { FootprintReport } from "@/lib/report/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/analyze
 * Body: { address: string }
 *
 * Validates server-side (never trusts client input), indexes all officially
 * supported EVM networks, and returns a FootprintReport. "Not assessed"
 * networks never become "no activity". Always returns JSON.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body.", details: null as unknown as string },
      { status: 400 },
    );
  }

  const address = (body as { address?: unknown })?.address;
  if (typeof address !== "string" || address.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing wallet address.", details: null as unknown as string },
      { status: 400 },
    );
  }

  let normalized;
  try {
    normalized = normalizeAddress(address.trim());
  } catch {
    return NextResponse.json(
      { error: "Invalid EVM wallet address.", details: null as unknown as string },
      { status: 400 },
    );
  }

  try {
    const report: FootprintReport = await analyzeAddress(normalized);
    return NextResponse.json(report, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          "Analysis failed. Some onchain sources may be temporarily unavailable.",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 502 },
    );
  }
}
