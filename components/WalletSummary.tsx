import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WalletSummary } from "@/lib/types";

function fmt(n: number | null): string {
  return n == null ? "—" : n.toLocaleString();
}

function fmtDate(unix: number | null): string {
  if (!unix) return "—";
  return new Date(unix * 1000).toLocaleDateString();
}

function fmtUsdc(wei: string | null): string {
  if (!wei) return "—";
  // Native USDC uses 18 decimals on Arc.
  const units = Number(wei) / 1e18;
  return `${units.toLocaleString(undefined, { maximumFractionDigits: 6 })} USDC`;
}

export function WalletSummaryCard({
  summary,
}: {
  summary: WalletSummary;
}) {
  const arcNative = [
    ["First seen", fmtDate(summary.firstSeenTime)],
    ["Native USDC balance", fmtUsdc(summary.nativeBalanceUsdc)],
    ["Total transactions", fmt(summary.totalTransactions)],
    ["Successful / failed", `${fmt(summary.successfulTransactions)} / ${fmt(summary.failedTransactions)}`],
    ["Stablecoin transfers", fmt(summary.stablecoinTransfers)],
    ["USDC / EURC / USYC", `${fmt(summary.usdcTransfers)} / ${fmt(summary.eurcTransfers)} / ${fmt(summary.usycTransfers)}`],
    ["Bridge interactions", fmt(summary.bridgeInteractions)],
    ["Developer-tool interactions", fmt(summary.developerToolInteractions)],
    ["Contract deployments", fmt(summary.contractDeployments)],
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="divide-y divide-border">
          {arcNative.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-2 text-sm">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-mono text-right">{v}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
