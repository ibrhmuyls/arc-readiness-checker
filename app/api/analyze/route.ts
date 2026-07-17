import { NextResponse } from "next/server";
import { normalizeAddress } from "@/lib/validation";
import { collectFacts } from "@/lib/analysis/analystService";
import { score } from "@/lib/analysis/scoring";
import type { CircleFootprintReport } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/analyze
 * Body: { address: string }
 *
 * Validates server-side (never trusts client input), fetches only public
 * Arc Testnet sources, returns a CircleFootprintReport.
 * Always returns JSON (never an HTML crash) even when all sources are unavailable.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body.", details: null as unknown as string },
      { status: 400 }
    );
  }

  const address = (body as { address?: unknown })?.address;
  if (typeof address !== "string" || address.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing wallet address.", details: null as unknown as string },
      { status: 400 }
    );
  }

  let normalized;
  try {
    normalized = normalizeAddress(address.trim());
  } catch {
    return NextResponse.json(
      { error: "Invalid Arc wallet address.", details: null as unknown as string },
      { status: 400 }
    );
  }

  try {
    const facts = await collectFacts(normalized);
    const report: CircleFootprintReport = score(facts);
    return NextResponse.json(report, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Analysis failed. The Arc Testnet sources may be unavailable.",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 502 }
    );
  }
}
