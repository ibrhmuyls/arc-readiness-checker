import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CategoryScore } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ScoreBreakdown({ categories }: { categories: CategoryScore[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Score Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((category) => (
          <div key={category.id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div>
                <div className="font-medium">{category.label}</div>
                <div className="text-xs text-muted-foreground">{category.summary}</div>
              </div>
              <div className={cn("text-sm font-semibold", category.status === "insufficient-data" && "text-muted-foreground")}>
                {category.status === "scored" ? `${category.score}/${category.maxScore}` : category.status === "insufficient-data" ? "Insufficient data" : "Not assessed"}
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary"
                style={{
                  width: category.status === "scored" ? `${Math.round((category.score / category.maxScore) * 100)}%` : "0%",
                }}
              />
            </div>
            {category.evidence.length > 0 && (
              <div className="text-xs text-muted-foreground">Evidence: {category.evidence.join(", ")}</div>
            )}
            {category.notObserved.length > 0 && (
              <div className="text-xs text-muted-foreground">Not observed: {category.notObserved.join(", ")}</div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
