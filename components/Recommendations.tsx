import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

export function Recommendations({
  recommendations,
}: {
  recommendations: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" /> Recommended Next Steps
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recommendations.length ? (
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">
            This wallet is well prepared for the Arc ecosystem. Keep exploring!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
