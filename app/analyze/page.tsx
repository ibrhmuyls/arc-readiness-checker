import Link from "next/link";
import { normalizeAddress } from "@/lib/validation";
import { collectFacts } from "@/lib/analysis/analystService";
import { score } from "@/lib/analysis/scoring";
import type { CircleFootprintReport } from "@/lib/types";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import { WalletSummaryCard } from "@/components/WalletSummary";
import { ArcProfileCard } from "@/components/ArcProfile";
import { EvidenceCoverageCard } from "@/components/EvidenceCoverage";
import { ErrorState } from "@/components/ErrorState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function fmtTime(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleString();
}

export default async function AnalyzePage({ searchParams }: { searchParams: Promise<{ address?: string }> }) {
  const params = await searchParams;
  const rawAddress = params.address;

  if (!rawAddress) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24">
        <Card>
          <CardHeader>
            <CardTitle>Circle Ecosystem Footprint</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Independent read-only analysis. Not eligibility, rewards, or an official Circle / Arc qualification.
            </p>
            <form method="get" className="mt-4 flex gap-2">
              <input
                name="address"
                placeholder="Paste an EVM address"
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
              />
              <Button type="submit">Analyze</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  let address;
  try {
    address = normalizeAddress(rawAddress);
  } catch {
    return <ErrorState message="Invalid address format." onRetry={() => {}} />;
  }

  let report: CircleFootprintReport | null = null;
  try {
    const facts = await collectFacts(address);
    report = score(facts);
  } catch {
    return <ErrorState message="Analysis failed. Sources may be unavailable." onRetry={() => {}} />;
  }

  if (!report) {
    return <ErrorState message="Unable to analyze this address." onRetry={() => {}} />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Circle Ecosystem Footprint</h1>
          <p className="mt-1 break-all font-mono text-sm text-muted-foreground">{report.address}</p>
          <p className="mt-1 text-xs text-muted-foreground">Last updated: {new Date(report.lastUpdated).toLocaleString()}</p>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-3xl font-bold">{report.verifiedCircleActivityScore}/100</div>
          <div className="text-xs text-muted-foreground">Verified Circle Activity Score</div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Evidence Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.evidenceCoverageScore}/100</div>
            <p className="text-xs text-muted-foreground">Lower coverage reduces confidence; it does not inflate scores.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.confidenceLevel}</div>
            <p className="text-xs text-muted-foreground">Based on transaction volume, time span, and source availability.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.primaryProfile}</div>
            <p className="text-xs text-muted-foreground">Evidence-aware classification. Not a reward or rank.</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <EvidenceCoverageCard breakdown={report.evidenceCoverageBreakdown} />
      </div>

      <div className="mb-6">
        <ArcProfileCard profile={report.primaryProfile} />
      </div>

      <div className="mb-6">
        <ScoreBreakdown categories={report.categories} />
      </div>

      <div className="mb-6">
        <WalletSummaryCard summary={report.summary} />
      </div>

      <div className="mb-6 rounded-md border bg-muted/40 p-4 text-xs text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">Disclaimer</p>
        <p>
          This is an independent analysis tool. It does not determine airdrop eligibility, rewards, allowlists,
          account status, compliance status, or any official Circle / Arc qualification. Results are based only
          on publicly observable onchain evidence.
        </p>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Limitations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {report.limitations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="mt-3 text-xs text-muted-foreground">
              <Link className="underline" href="/methodology">Methodology and registry sources</Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <form method="get" className="mt-8">
        <input type="hidden" name="address" value={report.address} />
        <Button type="submit" variant="outline">Refresh analysis</Button>
      </form>
    </div>
  );
}
