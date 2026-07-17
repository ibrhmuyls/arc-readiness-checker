import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DataSources() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="text-sm space-y-1">
          <li>Arc Testnet RPC: https://rpc.testnet.arc.network</li>
          <li>ArcScan Legacy API</li>
          <li>ArcScan V2 API</li>
          <li>Official contract registry: docs.arc.io/arc/references/contract-addresses.md</li>
        </ul>
      </CardContent>
    </Card>
  );
}
