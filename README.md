# ARC Readiness Checker

> Community-built readiness report for wallets on the **Arc ecosystem**
> (Arc Testnet). **Not affiliated with Arc Network.** Complements the official
> Arc explorer — it explains *what your on-chain history means for your
> preparedness*, instead of just listing raw transactions.

## What it does

You enter an Arc (EVM) wallet address. The app reads **public Arc Testnet**
on-chain data and produces a transparent **Readiness Report**:

- Overall Readiness Score (0–100) with visible math
- Score Breakdown (per category, with reasoning)
- Wallet Summary
- Strengths / Weaknesses
- Recommended next steps
- Methodology + Data Sources (with links)

## Important honesty notes

- **Arc is testnet-only.** Every result applies to **Arc Testnet** and never
  implies mainnet readiness. No mainnet data is assumed or fabricated.
- The **Multi-chain Activity** category is **disabled** until a public Arc
  cross-chain read source exists. It is shown as *"Coming when public data
  becomes available"* rather than given a fake score.
- The score is computed transparently from real data. See
  [`docs/SCORING.md`](docs/SCORING.md).

## Data sources

Only public, unauthenticated Arc Testnet sources are used:

- Arc Testnet RPC (`rpc.testnet.arc.network`)
- Arc Testnet Explorer API (`testnet.arcscan.app/api`)
- Arc contract-address reference (`docs.arc.io/.../contract-addresses.md`)

Full inventory in [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md).

## Tech stack

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · viem (address
validation). Deploys directly to Vercel.

## Local development

```bash
npm install
cp .env.example .env.local   # optional; sources are public, no keys needed
npm run dev
```

```bash
npm run typecheck   # tsc --noEmit
npm test            # vitest unit tests for the scoring engine
npm run build       # production build (Vercel-equivalent)
```

## Deploy to Vercel

Push to GitHub and import the repo in Vercel. No environment variables are
required — the default public Arc Testnet endpoints are used. To override them,
set `ARC_RPC_URL` / `ARC_EXPLORER_BASE` from `.env.example`.

## Project layout

```
app/            Next.js App Router (landing + /analyze results + /api/analyze)
components/     Reusable UI (ui/ shadcn primitives + feature components)
lib/            types, validation, config, cache, sources/, analysis/
docs/           DATA_SOURCES, PRODUCT_SPEC, ARCHITECTURE, SCORING
```

See [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) for the product rationale and
explicit non-goals (no explorer, portfolio, price, or trading dashboard).
