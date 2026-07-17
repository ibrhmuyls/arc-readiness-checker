"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { WalletInput } from "@/components/WalletInput";
import { AnalyzeButton } from "@/components/AnalyzeButton";
import { isArcAddress } from "@/lib/validation";

export default function HomePage() {
  const [address, setAddress] = React.useState("");
  const router = useRouter();
  const valid = address.trim().length > 0 && isArcAddress(address.trim());

  return (
    <div className="mx-auto max-w-2xl px-4 py-24">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Circle Ecosystem Footprint</h1>
        <p className="mt-2 text-muted-foreground">
          Understand how an EVM address actually uses Arc and Circle infrastructure.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          This is an independent analysis tool. It does not determine airdrop eligibility, rewards, allowlists,
          account status, compliance status, or any official Circle / Arc qualification. Results are based only
          on publicly observable onchain evidence.
        </p>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) router.push(`/analyze?address=${encodeURIComponent(address.trim())}`);
        }}
      >
        <WalletInput
          value={address}
          onChange={(v) => setAddress(v)}
          onSubmit={() => {}}
          disabled={false}
        />
        <AnalyzeButton address={address} onClick={() => { if (valid) router.push(`/analyze?address=${encodeURIComponent(address.trim())}`); }} loading={false} />
      </form>

      <div className="mt-6 text-center text-xs text-muted-foreground">
        Read-only, independent analysis of observable Arc activity, USDC usage, Circle cross-chain flows,
        and officially attributable product interactions.
      </div>
    </div>
  );
}
