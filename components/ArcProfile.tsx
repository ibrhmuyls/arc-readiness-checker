import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FootprintProfile } from "@/lib/types";

const PROFILES: Record<FootprintProfile, { title: string; description: string; accent: string }> = {
  "No Verified Arc Footprint Yet": {
    title: "No Verified Arc Footprint Yet",
    description: "No observable on-chain evidence was found on Arc Testnet.",
    accent: "text-muted-foreground",
  },
  "Low Observable Activity": {
    title: "Low Observable Activity",
    description: "No observable on-chain evidence was found on Arc Testnet.",
    accent: "text-muted-foreground",
  },
  "Limited Arc Explorer": {
    title: "Limited Arc Explorer",
    description: "Only a small number of Arc transactions were observed.",
    accent: "text-muted-foreground",
  },
  "Early Stablecoin Explorer": {
    title: "Early Stablecoin Explorer",
    description: "Some stablecoin transfers were observed, but duration and diversity are limited.",
    accent: "text-muted-foreground",
  },
  "Emerging Circle User": {
    title: "Emerging Circle User",
    description: "Stablecoin usage is present but not yet sustained or broad enough to indicate deeper ecosystem participation.",
    accent: "text-muted-foreground",
  },
  "Early Ecosystem Participant": {
    title: "Early Ecosystem Participant",
    description: "Some Arc interaction is present, but not yet sustained or diverse.",
    accent: "text-muted-foreground",
  },
  "Recurring USDC User": {
    title: "Recurring USDC User",
    description: "Repeated USDC activity was observed over multiple days.",
    accent: "text-emerald-300",
  },
  "Stablecoin Native": {
    title: "Stablecoin Native",
    description: "Strong, sustained stablecoin usage observed across multiple active days and counterparties.",
    accent: "text-emerald-300",
  },
  "Arc Application User": {
    title: "Arc Application User",
    description: "Observed activity suggests direct use of Arc-based applications or protocol flows.",
    accent: "text-sky-300",
  },
  "Settlement Focused": {
    title: "Settlement Focused",
    description: "Observed behavior aligns with settlement-oriented transfer patterns rather than speculative activity.",
    accent: "text-sky-300",
  },
  "Cross-chain Stablecoin User": {
    title: "Cross-chain Stablecoin User",
    description: "Both stablecoin usage and verified Circle cross-chain flows were observed.",
    accent: "text-violet-300",
  },
  "Arc Developer": {
    title: "Arc Developer",
    description: "Contract deployment or developer-primitive interactions were observed.",
    accent: "text-indigo-300",
  },
  "Circle Cross-Chain User": {
    title: "Circle Cross-Chain User",
    description: "Evidence includes verified Circle cross-chain flows in addition to stablecoin usage.",
    accent: "text-violet-300",
  },
  "Arc Contract Deployer": {
    title: "Arc Contract Deployer",
    description: "Observed contract deployer activity on Arc.",
    accent: "text-indigo-300",
  },
  "Financial Infrastructure User": {
    title: "Financial Infrastructure User",
    description: "Behavior suggests use of programmable finance infrastructure rather than casual usage.",
    accent: "text-indigo-300",
  },
  "Multi-Product Circle User": {
    title: "Multi-Product Circle User",
    description: "Evidence spans multiple Circle product surfaces.",
    accent: "text-violet-300",
  },
  "Sustained Arc Ecosystem Participant": {
    title: "Sustained Arc Ecosystem Participant",
    description: "Broad, time-distributed Arc activity was observed.",
    accent: "text-emerald-300",
  },
  "Institutional-like Participant": {
    title: "Institutional-like Participant",
    description: "Observed patterns are consistent with institutionally organized settlement behavior.",
    accent: "text-indigo-300",
  },
};

export function ArcProfileCard({ profile }: { profile: FootprintProfile }) {
  const entry = PROFILES[profile] ?? PROFILES["Early Ecosystem Participant"];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-lg font-semibold ${entry.accent}`}>{entry.title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{entry.description}</p>
      </CardContent>
    </Card>
  );
}
