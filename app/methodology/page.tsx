import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Methodology</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This page explains what Circle Ecosystem Footprint can observe, what it cannot, and how it derives its outputs.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>What this tool observes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Public transaction and token-transfer events from onchain data sources.</p>
          <p>Interactions with official Circle and Arc contract addresses from an official registry.</p>
          <p>Time distribution, counterparty diversity, and execution outcomes where readable from explorer or RPC evidence.</p>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>What this tool cannot observe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Off-chain product usage, API calls, or private account relationships.</p>
          <p>Identity, affiliation, KYC status, wealth, intent, creditworthiness, or compliance conclusions.</p>
          <p>Airdrop eligibility, allowlist status, rewards, or any official Circle / Arc qualification.</p>
          <p>Products without reliable public onchain attribution from verified contracts.</p>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Scoring formula</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Verified Circle Activity Score is a weighted composite:</p>
          <ul className="list-disc pl-5">
            <li>Arc Native Usage: 20%</li>
            <li>USDC / Stablecoin Activity: 20%</li>
            <li>Circle Cross-Chain Usage: 20%</li>
            <li>Circle Product Interactions: 15%</li>
            <li>Sustained Financial Activity: 15%</li>
            <li>Builder / Contract Footprint: 10%</li>
            <li>Evidence Quality and Coverage: 10%</li>
          </ul>
          <p>Wallets with fewer than 5 relevant transactions cannot exceed 45/100 overall activity score. Wallets with less than 7 observed active days cannot receive High confidence.</p>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Registry sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ul className="list-disc pl-5">
            <li><Link className="underline" href="https://docs.arc.io/arc/references/contract-addresses.md">Arc contract addresses</Link></li>
            <li><Link className="underline" href="https://docs.arc.io/arc/references/evm-differences.md">Arc EVM differences</Link></li>
            <li><Link className="underline" href="https://developers.circle.com/">Circle developer docs</Link></li>
            <li><Link className="underline" href="https://www.circle.com/">Circle</Link></li>
          </ul>
        </CardContent>
      </Card>

      <div className="mt-6">
        <Button asChild variant="outline">
          <Link href="/">Back to analysis</Link>
        </Button>
      </div>
    </div>
  );
}
