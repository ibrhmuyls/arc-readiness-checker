import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Methodology() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Methodology</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          This tool analyzes only publicly observable Arc Testnet data. It does not access private data,
          off-chain services, or perform wallet connections.
        </p>
        <p>
          Scores are conservative. Missing data reduces confidence; it does not artificially increase scores.
          A wallet with a few transactions may receive a low activity score and low confidence.
        </p>
        <p>
          Registry attribution is limited to official docs.arc.io contract addresses. Activity outside those
          contracts is noted as unclassified rather than invented.
        </p>
      </CardContent>
    </Card>
  );
}
