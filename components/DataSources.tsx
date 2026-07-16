import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DataSourceRef } from "@/lib/types";

export function DataSources({ sources }: { sources: DataSourceRef[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {sources.map((s) => (
            <li key={s.url} className="flex flex-col">
              <span className="font-medium">{s.name}</span>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-primary hover:underline"
              >
                {s.url}
              </a>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
