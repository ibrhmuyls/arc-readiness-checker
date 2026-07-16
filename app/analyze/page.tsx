import Link from "next/link";
import { normalizeAddress } from "@/lib/validation";
import { collectFacts } from "@/lib/analysis/analystService";
import { score } from "@/lib/analysis/scoring";
import { ReadinessScore } from "@/components/ReadinessScore";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import { WalletSummaryCard } from "@/components/WalletSummary";
import { StrengthsWeaknesses } from "@/components/StrengthsWeaknesses";
import { Recommendations } from "@/components/Recommendations";
import { Methodology } from "@/components/Methodology";
import { DataSources } from "@/components/DataSources";
import { ErrorState } from "@/components/ErrorState";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function completenessNote(c: string): string {
  if (c === "partial")
    return "Some data sources were unavailable; the score reflects available data only.";
  if (c === "unavailable")
    return "Could not reach Arc Testnet sources. Try again shortly.";
  return "Based on full public Arc Testnet data.";
}

export default async function AnalyzePage({
  searchParams,
}: {
  searchParams: Promise<{ address?: string }>;
}) {
  const { address } = await searchParams;

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <ErrorState
          message="No valid wallet address provided."
          onRetry={() => (window.location.href = "/")}
        />
        <div className="mt-6 text-center">
          <Link href="/">
            <Button variant="outline" size="sm">
              Back to home
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  let normalized;
  try {
    normalized = normalizeAddress(address);
  } catch {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <ErrorState
          message="Invalid Arc wallet address."
          onRetry={() => (window.location.href = "/")}
        />
      </main>
    );
  }

  let report;
  try {
    const facts = await collectFacts(normalized);
    report = score(facts);
  } catch {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <ErrorState
          message="Analysis failed. The Arc Testnet sources may be temporarily unavailable."
          onRetry={() => (window.location.href = "/analyze?address=" + encodeURIComponent(address))}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Readiness Report
        </p>
        <p className="mt-1 break-all font-mono text-sm text-muted-foreground">
          {report.address}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {completenessNote(report.dataCompleteness)}
        </p>
      </div>

      <div className="grid gap-4">
        <ReadinessScore score={report.overallScore} network={report.network} />
        <ScoreBreakdown categories={report.categories} />
        <WalletSummaryCard summary={report.summary} />
        <StrengthsWeaknesses
          strengths={report.strengths}
          weaknesses={report.weaknesses}
        />
        <Recommendations recommendations={report.recommendations} />
        <Methodology text={report.methodology} />
        <DataSources sources={report.dataSources} />
      </div>

      <div className="mt-10 text-center">
        <Link href="/">
          <Button variant="outline" size="sm">
            Analyze another wallet
          </Button>
        </Link>
      </div>
    </main>
  );
}
