"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FootprintProfile } from "@/lib/types";

const PROFILE_META: Record<FootprintProfile, { title: string; description: string; accent: string }> = {
  "No Verified Arc Footprint Yet": {
    title: "No Verified Arc Footprint Yet",
    description: "No observable Arc Testnet activity was found for this address.",
    accent: "text-muted-foreground",
  },
  "Limited Arc Explorer": {
    title: "Limited Arc Explorer",
    description: "A small number of Arc transactions were observed, without enough spread to infer sustained usage.",
    accent: "text-yellow-400",
  },
  "Early Stablecoin Explorer": {
    title: "Early Stablecoin Explorer",
    description: "Some stablecoin transfers were observed, but not enough history for a sustained-usage conclusion.",
    accent: "text-yellow-400",
  },
  "Recurring USDC User": {
    title: "Recurring USDC User",
    description: "Recurring stablecoin activity is visible, primarily in USDC, without verified cross-chain flows.",
    accent: "text-blue-400",
  },
  "Arc Application User": {
    title: "Arc Application User",
    description: "Bridge or application-contract activity is visible, but not enough verified stablecoin breadth for a broader profile.",
    accent: "text-blue-400",
  },
  "Circle Cross-Chain User": {
    title: "Circle Cross-Chain User",
    description: "Verified CCTP/Gateway interactions and stablecoin activity were observed together.",
    accent: "text-emerald-400",
  },
  "Arc Contract Deployer": {
    title: "Arc Contract Deployer",
    description: "Contract deployment activity was observed on Arc Testnet.",
    accent: "text-purple-400",
  },
  "Multi-Product Circle User": {
    title: "Multi-Product Circle User",
    description: "Evidence spans multiple verified Circle products or primitives.",
    accent: "text-emerald-400",
  },
  "Sustained Arc Ecosystem Participant": {
    title: "Sustained Arc Ecosystem Participant",
    description: "Broad, time-distributed evidence across transactions, stablecoins, and/or products.",
    accent: "text-emerald-400",
  },
  "Institutional-like Participant": {
    title: "Institutional-like Participant",
    description: "Potentially permissioned product usage was observed. This label is descriptive, not an affiliation claim.",
    accent: "text-orange-400",
  },
};

export function ArcProfileCard({ profile }: { profile: FootprintProfile }) {
  const meta = PROFILE_META[profile] ?? PROFILE_META["No Verified Arc Footprint Yet"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Arc Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn("text-lg font-semibold", meta.accent)}>{meta.title}</div>
        <p className="mt-2 text-sm text-muted-foreground">{meta.description}</p>
      </CardContent>
    </Card>
  );
}
