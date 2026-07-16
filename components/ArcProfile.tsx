"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ArcProfile } from "@/lib/types";

const PROFILE_META: Record<
  ArcProfile,
  { title: string; description: string; accent: string }
> = {
  "Stablecoin Native User": {
    title: "Stablecoin Native User",
    description:
      "This wallet consistently uses Arc's native stablecoins (USDC/EURC/USYC) as its primary on-chain asset.",
    accent: "text-emerald-300",
  },
  "Settlement Focused": {
    title: "Settlement Focused",
    description:
      "This wallet participates reliably in Arc settlement activity, with consistent transaction behavior.",
    accent: "text-sky-300",
  },
  "Cross-chain Ready": {
    title: "Cross-chain Ready",
    description:
      "This wallet interacts with Arc's cross-chain infrastructure (CCTP / Gateway), indicating familiarity with multi-chain flows.",
    accent: "text-violet-300",
  },
  "Financial User": {
    title: "Financial User",
    description:
      "This wallet shows payment, treasury, or FX-like patterns using stablecoins and known Arc financial primitives.",
    accent: "text-amber-300",
  },
  Builder: {
    title: "Builder",
    description:
      "This wallet demonstrates developer activity: contract deployments and developer-tool interactions.",
    accent: "text-cyan-300",
  },
  "Infrastructure User": {
    title: "Infrastructure User",
    description:
      "This wallet uses Arc infrastructure primitives (Multicall3, Permit2, StableFX, Memo).",
    accent: "text-indigo-300",
  },
  "Payment User": {
    title: "Payment User",
    description:
      "This wallet appears to use Arc for recurring payment-like behavior, with bridge and stablecoin activity.",
    accent: "text-teal-300",
  },
  "Low Activity": {
    title: "Low Activity",
    description:
      "This wallet has minimal Arc Testnet activity and does not yet show a clear behavioral profile.",
    accent: "text-muted-foreground",
  },
  "New Participant": {
    title: "New Participant",
    description:
      "No measurable Arc Testnet activity found. This wallet has not yet participated in the Arc ecosystem.",
    accent: "text-muted-foreground",
  },
  "Institutional-like": {
    title: "Institutional-like",
    description:
      "This wallet exhibits behavior consistent with institutional or treasury-style activity (e.g., USYC, repeated structured transfers).",
    accent: "text-rose-300",
  },
};

export function ArcProfileCard({ profile }: { profile: ArcProfile }) {
  const meta = PROFILE_META[profile] ?? PROFILE_META["Low Activity"];
  return (
    <Card>
      <CardHeader>
        <CardTitle className={cn("text-base font-semibold", meta.accent)}>
          {meta.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{meta.description}</p>
      </CardContent>
    </Card>
  );
}
