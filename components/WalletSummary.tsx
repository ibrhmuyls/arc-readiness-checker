import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WalletSummary } from "@/lib/types";

function fmt(n: number | null): string {
  return n == null ? "—" : n.toLocaleString();
}

function fmtDate(unix: number | null): string {
  if (!unix) return "—";
  return new Date(unix * 1000).toLocaleDateString();
}

export function WalletSummaryCard({
  summary,
}: {
  summary: WalletSummary;
}) {
  const rows: [string, string][] = [
    ["First seen", fmtDate(summary.firstSeenTime)],
    ["First block", fmt(summary.firstSeenBlock)],
    ["Total transactions", fmt(summary.totalTransactions)],
    ["Stablecoin transfers", fmt(summary.stablecoinTransfers)],
    ["Bridge interactions", fmt(summary.bridgeInteractions)],
    ["Contract interactions", fmt(summary.contractInteractions)],
    ["Contract account", summary.isContract == null ? "—" : summary.isContract ? "Yes" : "No"],
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="divide-y divide-border">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2 text-sm">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-mono">{v}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
