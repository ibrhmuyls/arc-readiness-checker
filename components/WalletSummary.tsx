import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WalletSummary } from "@/lib/types";

function fmt(n: number | null): string {
  return n == null ? "—" : String(n);
}

export function WalletSummaryCard({ summary }: { summary: WalletSummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <div className="text-xs text-muted-foreground">Total transactions</div>
            <div className="font-medium">{fmt(summary.totalTransactions)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Successful</div>
            <div className="font-medium">{fmt(summary.successfulTransactions)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Failed</div>
            <div className="font-medium">{fmt(summary.failedTransactions)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Active days</div>
            <div className="font-medium">{fmt(summary.activeDays)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Unique counterparties</div>
            <div className="font-medium">{fmt(summary.uniqueCounterparties)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">USDC transfers</div>
            <div className="font-medium">{fmt(summary.usdcTransfers)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">EURC transfers</div>
            <div className="font-medium">{fmt(summary.eurcTransfers)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">USYC transfers</div>
            <div className="font-medium">{fmt(summary.usycTransfers)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Bridge interactions</div>
            <div className="font-medium">{fmt(summary.bridgeInteractions)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Developer tool interactions</div>
            <div className="font-medium">{fmt(summary.developerToolInteractions)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Contract deployments</div>
            <div className="font-medium">{fmt(summary.contractDeployments)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Inbound transfers</div>
            <div className="font-medium">{fmt(summary.inboundTransfers)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Outbound transfers</div>
            <div className="font-medium">{fmt(summary.outboundTransfers)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
