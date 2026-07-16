import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export function StrengthsWeaknesses({
  strengths,
  weaknesses,
}: {
  strengths: string[];
  weaknesses: string[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" /> Strengths
          </CardTitle>
        </CardHeader>
        <CardContent>
          {strengths.length ? (
            <ul className="space-y-2 text-sm">
              {strengths.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-emerald-400">+</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No strengths identified yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" /> Weaknesses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weaknesses.length ? (
            <ul className="space-y-2 text-sm">
              {weaknesses.map((w, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-amber-400">!</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No notable weaknesses.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
