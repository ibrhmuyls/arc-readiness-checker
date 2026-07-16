import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ArcProfileCard({ profile }: { profile: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Arc Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{profile}</p>
      </CardContent>
    </Card>
  );
}
