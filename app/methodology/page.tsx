import Link from "next/link";
import { OFFICIAL_SOURCES, REGISTRY } from "@/lib/registry/registry";
import { EVM_CHAINS, ARC_CHAIN_ID } from "@/lib/registry/chains";
import { validateRegistry } from "@/lib/registry/validate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function MethodologyPage() {
  const validation = validateRegistry();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Methodology & Registry Sources</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Circle Ecosystem Footprint is a read-only, evidence-first analyzer. Every
        classification is matched against an official contract registry; no
        product claim is inferred from generic transfers, gas, or tooling.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Registry version {REGISTRY.version}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Contracts registered: {validation.totalContracts} · Active:{" "}
            {validation.activeContracts} · Validation OK:{" "}
            {validation.ok ? "yes" : "no (see issues)"}.
          </p>
          <p className="text-xs text-muted-foreground">
            Registry generated: {new Date(REGISTRY.generatedAt).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Supported networks</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {EVM_CHAINS.map((c) => (
              <li key={c.name} className="flex items-center justify-between">
                <span>
                  {c.name}{" "}
                  <span className="text-xs text-muted-foreground">
                    (chainId {c.chainId}, Circle domain {c.circleDomain})
                  </span>
                </span>
                <span
                  className={
                    c.chainId === ARC_CHAIN_ID
                      ? "text-emerald-400"
                      : "text-amber-300"
                  }
                >
                  {c.rpcStatus === "supported"
                    ? "Live (public)"
                    : "Gated (API key)"}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Official sources</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5 text-sm">
            {OFFICIAL_SOURCES.map((s) => (
              <li key={s.url}>
                <a
                  className="text-primary underline"
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {s.title}
                </a>{" "}
                <span className="text-xs text-muted-foreground">
                  — retrieved {new Date(s.retrievedAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Scoring principles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Four independent outputs: Circle Ecosystem Activity (0–100), Arc
            Footprint (0–100 or “No verified Arc footprint observed”), Evidence
            Coverage (0–100 + band), and Confidence (Low/Moderate/High).
          </p>
          <p>
            Hard caps prevent overclaims: fewer than 5 relevant txs caps the
            global score at 35; fewer than 10 at 50; ordinary single-chain USDC
            transfers cap at 45; multi-chain presence without CCTP/Gateway caps
            at 60; multi-network USDC without protocol events caps at 70; scores
            above 85 require sustained, multi-product activity with deterministic
            cross-chain linkage.
          </p>
          <p>
            Cross-chain correlation uses protocol identifiers (source/destination
            domain, message linkage), never approximate amount/time heuristics.
            Networks that could not be queried are marked “Not assessed” and
            never scored as “no activity.”
          </p>
        </CardContent>
      </Card>

      <div className="mt-6 text-xs">
        <Link className="underline" href="/">
          Back to analyzer
        </Link>
      </div>
    </main>
  );
}
