"use client";

import * as React from "react";
import Link from "next/link";
import { WalletInput } from "@/components/WalletInput";
import { AnalyzeButton } from "@/components/AnalyzeButton";
import { isArcAddress } from "@/lib/validation";

export default function HomePage() {
  const [address, setAddress] = React.useState("");
  const valid = address.trim().length > 0 && isArcAddress(address.trim());

  return (
    <div className="mx-auto max-w-2xl px-4 py-24">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-semibold">Circle Ecosystem Footprint</h1>
        <p className="mt-3 text-muted-foreground">
          See the verifiable onchain footprint of an address across Arc and Circle infrastructure.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Independent read-only analysis. Not eligibility, rewards, or an official Circle / Arc qualification.
        </p>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) window.location.href = `/analyze?address=${encodeURIComponent(address.trim())}`;
        }}
      >
        <WalletInput
          value={address}
          onChange={(v) => setAddress(v)}
          onSubmit={() => {}}
          disabled={false}
        />
        <AnalyzeButton address={address} onClick={() => { if (valid) window.location.href = `/analyze?address=${encodeURIComponent(address.trim())}`; }} loading={false} />
      </form>

      <div className="mt-8 rounded-lg border bg-muted/40 p-4 text-left text-xs text-muted-foreground">
        <p className="mb-2 font-medium text-foreground">What this tool shows</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Verified USDC, EURC, and USYC activity on Arc Testnet</li>
          <li>Verified CCTP and Gateway cross-chain interactions</li>
          <li>Observed Arc interaction patterns and developer-primitive usage</li>
          <li>Evidence-backed footprint categories, not speculative scores</li>
        </ul>
      </div>

      <div className="mt-6 flex justify-center gap-6 text-xs text-muted-foreground">
        <Link className="underline" href="/methodology">Methodology</Link>
        <Link className="underline" href="#data-sources">Data Sources</Link>
      </div>
    </div>
  );
}
