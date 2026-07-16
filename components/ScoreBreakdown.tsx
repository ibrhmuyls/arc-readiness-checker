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
        <CardTitle>Category Scores</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {categories.map((c) => (
          <div key={c.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.label}</span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] uppercase",
                      c.status === "disabled" && "bg-muted text-muted-foreground",
                      c.status === "insufficient-data" && "bg-amber-500/20 text-amber-300",
                      c.status === "scored" && "bg-emerald-500/20 text-emerald-300",
                    )}
                  >
                    {c.status === "scored" ? "scored" : c.status === "insufficient-data" ? "insufficient data" : "coming soon"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
              </div>
              <span className="text-sm font-mono text-muted-foreground">
                {c.status === "disabled"
                  ? "—"
                  : c.status === "insufficient-data"
                    ? "n/a"
                    : `${c.points}/${c.maxPoints}`}
              </span>
            </div>

            {c.status === "scored" && (
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${c.maxPoints ? (c.points / c.maxPoints) * 100 : 0}%`,
                  }}
                />
              </div>
            )}

            <p className="mt-2 text-xs text-muted-foreground">{c.reasoning}</p>
            <p className="mt-1 text-[11px] text-muted-foreground/70">
              Source: {c.source}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/70">
              Limitation: {c.limitations}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
