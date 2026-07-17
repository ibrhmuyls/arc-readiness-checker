import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CategoryScore } from "@/lib/types";

export function ScoreBreakdown({ categories }: { categories: CategoryScore[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((category) => (
          <div key={category.id} className="space-y-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{category.label}</div>
                <div className="text-xs text-muted-foreground">{category.description}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{category.score}/{category.maxScore}</div>
                <div className="text-xs text-muted-foreground">{category.status}</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">{category.summary}</div>
            {category.evidence?.length > 0 && (
              <div className="rounded-md bg-muted/50 p-2 text-xs">
                <div className="font-medium">Evidence</div>
                <ul className="list-disc pl-4">
                  {category.evidence.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {category.notObserved?.length > 0 && (
              <div className="rounded-md bg-muted/50 p-2 text-xs">
                <div className="font-medium">Not observed</div>
                <ul className="list-disc pl-4">
                  {category.notObserved.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
