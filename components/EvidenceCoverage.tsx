import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EvidenceCoverageBreakdownItem } from "@/lib/types";

export function EvidenceCoverageCard({
  breakdown,
}: {
  breakdown: {
    components: EvidenceCoverageBreakdownItem[];
    overall: number;
  };
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evidence Coverage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{breakdown.overall}/100</div>
        <div className="mt-3 space-y-2">
          {breakdown.components.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium">{item.value}/100</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
