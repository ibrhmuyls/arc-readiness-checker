import { NextResponse } from "next/server";
import { normalizeAddress } from "@/lib/validation";
import { collectFacts } from "@/lib/analysis/analystService";
import { score } from "@/lib/analysis/scoring";
import type { ReadinessReport } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/analyze
 * Body: { address: string }
 * Validates server-side (never trusts client input), fetches only public
 * Arc Testnet sources, returns a transparent ReadinessReport. Always returns
 * JSON (never an HTML crash) even when all sources are unavailable.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const address = (body as { address?: unknown })?.address;
  if (typeof address !== "string" || address.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing wallet address." },
      { status: 400 },
    );
  }

  let normalized;
  try {
    normalized = normalizeAddress(address.trim());
  } catch {
    return NextResponse.json(
      { error: "Invalid Arc wallet address." },
      { status: 400 },
    );
  }

  try {
    const facts = await collectFacts(normalized);
    const report: ReadinessReport = score(facts);
    return NextResponse.json(report, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Analysis failed. The Arc Testnet sources may be unavailable.",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 502 },
    );
  }
}
