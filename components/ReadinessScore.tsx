import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function scoreColor(score: number): string {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

export function ReadinessScore({
  score,
  network,
}: {
  score: number;
  network: string;
}) {
  return (
    <Card className="text-center">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Overall Readiness
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-6xl font-bold ${scoreColor(score)}`}>{score}</div>
        <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
          out of 100 · {network}
        </p>
      </CardContent>
    </Card>
  );
}
