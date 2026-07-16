import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Methodology({ text }: { text: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Methodology</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}
