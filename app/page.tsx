"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ADDRESS_ERROR_MESSAGE } from "@/lib/validation";
import { WalletInput } from "@/components/WalletInput";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) {
      setError(ADDRESS_ERROR_MESSAGE);
      return;
    }
    setError(null);
    router.push(`/analyze?address=${encodeURIComponent(value.trim())}`);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Independent onchain evidence tool
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">
          Circle Ecosystem Footprint
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Independent, read-only analysis of publicly observable activity across
          Arc and verifiable Circle infrastructure.
        </p>
      </header>

      <section className="rounded-xl border border-border bg-card p-6">
        <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              EVM wallet address
            </label>
            <WalletInput value={value} onChange={setValue} />
          </div>
          <Button type="submit" className="sm:w-36">
            Analyze
          </Button>
        </form>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

        <p className="mt-4 text-xs text-muted-foreground">
          Supports Arc Testnet and other officially listed Circle EVM networks.
          No data is written to any chain.
        </p>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Feature
          title="Evidence-first"
          body="Every score derives from verifiable onchain events matched to official Circle / Arc contract registries."
        />
        <Feature
          title="Multi-chain"
          body="Arc Testnet plus Circle-supported EVM networks, with deterministic cross-chain CCTP / Gateway correlation."
        />
        <Feature
          title="Conservative by design"
          body="Unassessed networks are never scored as 'no activity'. Hard caps prevent overclaims from thin data."
        />
        <Feature
          title="Not an eligibility tool"
          body="We measure observable activity, not identity, intent, rewards, or compliance status."
        />
      </section>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}
