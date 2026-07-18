import Link from "next/link";
import { normalizeAddress } from "@/lib/validation";
import { analyzeAddress } from "@/lib/report/analyze";
import type { FootprintReport } from "@/lib/report/types";
import { ErrorState } from "@/components/ErrorState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function fmtTime(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleString();
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

function confidenceColor(c: string): string {
  if (c === "High") return "text-emerald-400";
  if (c === "Moderate") return "text-amber-400";
  return "text-red-400";
}

function badgeColor(state: string): string {
  switch (state) {
    case "verified_protocol_interaction":
    case "verified_asset_activity":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
    case "arc_gas_execution":
      return "border-cyan-500/40 bg-cyan-500/10 text-cyan-300";
    case "same_address_presence":
      return "border-slate-500/40 bg-slate-500/10 text-slate-300";
    case "not_assessed":
      return "border-amber-500/40 bg-amber-500/10 text-amber-300";
    case "cannot_infer":
      return "border-zinc-500/40 bg-zinc-500/10 text-zinc-400";
    default:
      return "border-zinc-600/40 bg-zinc-700/10 text-zinc-400";
  }
}

export default async function AnalyzePage({
  searchParams,
}: {
  searchParams: Promise<{ address?: string }>;
}) {
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
              Enter an EVM wallet address to analyze its publicly observable
              activity across Arc and Circle infrastructure.
            </p>
            <form method="get" className="mt-4 flex gap-2">
              <input
                name="address"
                placeholder="0x…"
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
              />
              <Button type="submit">Analyze</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  let address: string;
  try {
    address = normalizeAddress(rawAddress);
  } catch {
    return <ErrorState message="Invalid EVM address format." onRetry={() => {}} />;
  }

  let report: FootprintReport;
  try {
    report = await analyzeAddress(address);
  } catch (err) {
    return (
      <ErrorState
        message={
          err instanceof Error
            ? `Analysis failed: ${err.message}`
            : "Analysis failed. Sources may be temporarily unavailable."
        }
        onRetry={() => {}}
      />
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <DisclaimerBanner />

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">Circle Ecosystem Footprint</h1>
          <p className="mt-1 break-all font-mono text-sm text-muted-foreground">
            {report.address}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Registry {report.registryVersion} · Last updated{" "}
            {new Date(report.lastUpdated).toLocaleString()}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <div className={`text-3xl font-bold ${scoreColor(report.circleEcosystemActivityScore)}`}>
            {report.circleEcosystemActivityScore}
            <span className="text-base text-muted-foreground">/100</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Circle Ecosystem Activity Score
          </div>
        </div>
      </div>

      {/* Four outputs */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ecosystem Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${scoreColor(report.circleEcosystemActivityScore)}`}>
              {report.circleEcosystemActivityScore}
            </div>
            <p className="text-xs text-muted-foreground">Global score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Arc Footprint
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {report.arcFootprint.value === null ? (
                <span className="text-zinc-500">—</span>
              ) : (
                <span className={scoreColor(report.arcFootprint.value)}>
                  {report.arcFootprint.value}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {report.arcFootprint.label}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Evidence Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${scoreColor(report.evidenceCoverage.score)}`}>
              {report.evidenceCoverage.score}
            </div>
            <p className="text-xs text-muted-foreground">
              {report.evidenceCoverage.band} coverage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${confidenceColor(report.confidence)}`}>
              {report.confidence}
            </div>
            <p className="text-xs text-muted-foreground">
              {report.indexedNetworkCount} network(s) indexed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Primary profile + tags */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Primary Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">{report.primaryProfile}</p>
          {report.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {report.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cross-chain level */}
      {report.crossChainLevel > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Cross-Chain Evidence Level {report.crossChainLevel}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{report.crossChainLevelLabel}</p>
            {report.crossChainMatches.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {report.crossChainMatches.slice(0, 12).map((m, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    <span
                      className={
                        m.status === "matched"
                          ? "text-emerald-400"
                          : "text-amber-300"
                      }
                    >
                      [{m.status}]
                    </span>{" "}
                    {m.evidenceText}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* Subscore breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SubscoreGroup title="Circle Ecosystem Activity" subs={report.globalSubscores} />
          {report.arcSubscores.length > 0 && (
            <SubscoreGroup title="Arc Footprint" subs={report.arcSubscores} />
          )}
          <SubscoreGroup title="Evidence Coverage" subs={report.coverageSubscores} />
        </CardContent>
      </Card>

      {/* Networks table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Network Indexing Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-2">Network</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2 pr-2">Txs</th>
                  <th className="py-2 pr-2">Active days</th>
                  <th className="py-2">Circle asset</th>
                </tr>
              </thead>
              <tbody>
                {report.networks.map((n) => (
                  <tr key={n.chainName} className="border-b border-border/50">
                    <td className="py-2 pr-2 font-medium">{n.chainName}</td>
                    <td className="py-2 pr-2">
                      {n.status === "indexed" ? (
                        <span className="text-emerald-400">Indexed</span>
                      ) : (
                        <span className="text-amber-300" title={n.reason}>
                          Not assessed
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-2">{n.txCount}</td>
                    <td className="py-2 pr-2">{n.activeDays}</td>
                    <td className="py-2">{n.hasCircleAsset ? "Yes" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Ecosystem map */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Circle Ecosystem Map</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {report.ecosystemMap.map((node) => (
            <span
              key={node.product}
              className={`rounded-lg border px-3 py-2 text-xs ${badgeColor(node.state)}`}
              title={node.detail}
            >
              <span className="font-semibold">{node.product}</span>
              <span className="block text-[10px] opacity-80">{node.detail}</span>
            </span>
          ))}
        </CardContent>
      </Card>

      {/* Caps applied */}
      {report.caps.length > 0 && (
        <Card className="mb-6 border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-amber-300">Caps Applied</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
              {report.caps.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Timeline (recent evidence) */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recent Evidence ({report.timeline.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {report.timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No classified onchain evidence matched official registries.
            </p>
          ) : (
            <ul className="max-h-80 space-y-1 overflow-y-auto text-xs">
              {report.timeline.slice(0, 50).map((ev, i) => (
                <li key={i} className="flex flex-wrap gap-2 border-b border-border/40 py-1">
                  <span className="text-muted-foreground">{ev.timestamp.slice(0, 10)}</span>
                  <span className="font-medium">{ev.chain.name}</span>
                  <span>{ev.evidenceText}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Not provable */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Products Not Provable From Public Wallet Data</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
            {report.notProvableProducts.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Limitations */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Limitations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {report.limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="mt-3 text-xs">
            <Link className="underline" href="/methodology">
              Methodology and registry sources
            </Link>
          </div>
        </CardContent>
      </Card>

      <form method="get" className="mt-8">
        <input type="hidden" name="address" value={report.address} />
        <Button type="submit" variant="outline">
          Refresh analysis
        </Button>
      </form>
    </main>
  );
}

function SubscoreGroup({
  title,
  subs,
}: {
  title: string;
  subs: FootprintReport["globalSubscores"];
}) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
      <div className="space-y-2">
        {subs.map((s) => (
          <div key={s.id}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground">{s.label}</span>
              <span className="text-muted-foreground">
                {s.score}/{s.maxScore}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-muted">
              <div
                className="h-full rounded bg-primary"
                style={{ width: `${(s.score / s.maxScore) * 100}%` }}
              />
            </div>
            {s.summary && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">{s.summary}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DisclaimerBanner() {
  return (
    <div className="mb-6 rounded-md border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-100/90">
      <p className="mb-1 font-semibold">Independent analysis — not a qualification</p>
      <p>
        This is an independent analytics tool. It does not determine airdrop
        eligibility, rewards, allowlists, account status, compliance status,
        identity, affiliation, wealth, or any official Circle / Arc
        qualification. It analyzes only publicly observable onchain evidence
        associated with the supplied address.
      </p>
    </div>
  );
}
