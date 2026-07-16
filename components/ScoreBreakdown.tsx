import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CategoryScore } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ScoreBreakdown({
  categories,
}: {
  categories: CategoryScore[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Score Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((c) => (
          <div key={c.id}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{c.label}</span>
              <span className="text-muted-foreground">
                {c.status === "disabled"
                  ? "—"
                  : c.status === "insufficient-data"
                    ? "n/a"
                    : `${c.points}/${c.maxPoints}`}
              </span>
            </div>
            {c.status === "scored" && (
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${c.maxPoints ? (c.points / c.maxPoints) * 100 : 0}%`,
                  }}
                />
              </div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">{c.reasoning}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function categoryBadge(status: CategoryScore["status"]) {
  return cn(
    "ml-2 rounded px-1.5 py-0.5 text-[10px] uppercase",
    status === "disabled" && "bg-muted text-muted-foreground",
    status === "insufficient-data" && "bg-amber-500/20 text-amber-300",
    status === "scored" && "bg-emerald-500/20 text-emerald-300",
  );
}
