"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { WalletInput } from "@/components/WalletInput";
import { AnalyzeButton } from "@/components/AnalyzeButton";
import { isArcAddress } from "@/lib/validation";

export default function HomePage() {
  const router = useRouter();
  const [address, setAddress] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  function handleAnalyze() {
    if (!isArcAddress(address)) return;
    setLoading(true);
    router.push(`/analyze?address=${encodeURIComponent(address)}`);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-primary">
        Arc Testnet · Community Tool
      </p>
      <h1 className="text-3xl font-bold sm:text-4xl">
        How ready is this wallet for the Arc ecosystem?
      </h1>
      <p className="mt-4 max-w-md text-sm text-muted-foreground">
        Enter a wallet address. We analyze public Arc Testnet activity and
        produce a transparent Readiness Report. Not affiliated with Arc Network.
      </p>

      <div className="mt-10 flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <WalletInput
          value={address}
          onChange={setAddress}
          onSubmit={handleAnalyze}
          disabled={loading}
        />
        <AnalyzeButton
          address={address}
          onClick={handleAnalyze}
          loading={loading}
        />
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Data is read-only from public Arc Testnet sources. No wallet connection
        or signing required.
      </p>
    </main>
  );
}
