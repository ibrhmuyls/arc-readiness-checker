# ARC Readiness Checker — Architecture

> Phase 2. Builds on `docs/DATA_SOURCES.md` and `docs/PRODUCT_SPEC.md`.
> Deploy target: **Vercel**. Framework: **Next.js (App Router) + TypeScript +
> Tailwind + shadcn/ui**. Everything is read-only analysis of public Arc Testnet
> data. No keys are required today; the architecture stays key-safe for the future.

---

## 1. High-level flow

```
Browser (Landing form)
   |  POST /api/analyze  { address }
   v
app/api/analyze/route.ts        (runtime = nodejs)
   |
   |- validateAddress(address)          <- both client + server
   |
   |- AnalystService.analyze(address)
   |     |
   |     |- SourceClient: ArcRpc          -> balance, txCount, chain sanity
   |     |- SourceClient: ExplorerLegacy  -> txlist, tokentx, timestamps
   |     |- SourceClient: ExplorerV2      -> fast counters (cross-check)
   |     +- ContractRefs (static)         -> category detection table
   |            (each client isolated; failure => {ok:false} not throw)
   |
   |- ScoringEngine.score(rawFacts)      -> categories[] + overall
   |
   +- ReadinessReport (typed)  --JSON-->  Client renders Results page
```

Principle: **the browser never calls Arc endpoints directly.** All on-chain
reads happen server-side in the API route. This (a) keeps any future keys
server-only, (b) lets us cache and rate-limit politely, and (c) centralizes
input validation and error handling.

---

## 2. Tech stack and rationale

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 15 (App Router) | Vercel-native, API routes plus UI in one deploy |
| Language | TypeScript (strict) | Type-safe scoring math, fewer runtime crashes |
| Styling | Tailwind CSS v3 + shadcn/ui | Fast, consistent, dark-mode-first minimal UI |
| Validation | `viem` `isAddress` | Correct EIP-55 checksum validation, EVM-standard |
| HTTP | native `fetch` (Next caching) | No extra dep; revalidate for cache |
| State | Server Components + URL state | Results page is a server component fed by the API |

No blockchain signing libraries, no wallets, no keys.

---

## 3. Directory structure (target)

```
arc-readiness-checker/
|- app/
|  |- layout.tsx                 # root, dark theme, fonts
|  |- globals.css                # tailwind + shadcn tokens
|  |- page.tsx                   # Landing (client form)
|  |- analyze/
|  |  |- page.tsx                # Results page (server component)
|  |- api/
|     |- analyze/
|        |- route.ts             # POST handler -> AnalystService
|- components/
|  |- ui/                        # shadcn primitives (button, card, input)
|  |- WalletInput.tsx
|  |- AnalyzeButton.tsx
|  |- LoadingState.tsx
|  |- ErrorState.tsx
|  |- ReadinessScore.tsx         # overall gauge
|  |- ScoreBreakdown.tsx         # per-category bars
|  |- WalletSummary.tsx
|  |- StrengthsWeaknesses.tsx
|  |- Recommendations.tsx
|  |- Methodology.tsx
|  |- DataSources.tsx
|- lib/
|  |- types.ts                   # Address, RawFacts, CategoryScore, ReadinessReport
|  |- validation.ts              # isArcAddress (viem wrapper + UX messages)
|  |- cache.ts                   # tiny in-memory TTL cache
|  |- sources/
|  |  |- rpc.ts                  # ArcRpc client
|  |  |- explorerLegacy.ts       # /api?module=account...
|  |  |- explorerV2.ts           # /api/v2/addresses/.../counters
|  |  |- contractRefs.ts        # static Arc Testnet addresses
|  |- analysis/
|  |  |- analystService.ts       # orchestrates sources -> RawFacts
|  |  |- scoring.ts              # ScoringEngine (Phase 6 detail)
|  |- config.ts                  # env-driven endpoints (ARC_RPC_URL etc.)
|- docs/                         # this file + DATA_SOURCES, PRODUCT_SPEC, SCORING
|- public/                       # static assets only
|- package.json
|- tsconfig.json
|- next.config.mjs
|- tailwind.config.ts
|- postcss.config.mjs
|- .env.example
```

---

## 4. Data contracts

### `RawFacts` (the normalized intermediate)
Produced by `AnalystService` from all sources. Everything else derives from it.

```ts
type RawFacts = {
  address: string;
  fetchedAt: number;
  sources: {
    rpc: SourceResult<{ balanceWei: string; txCount: number; chainId: string }>;
    explorerLegacy: SourceResult<{ txs: RawTx[]; tokenTxs: RawTokenTx[] }>;
    explorerV2: SourceResult<{ txCount: number; tokenTransferCount: number }>;
  };
  contractRefs: ContractRefs; // static, always present
};

type SourceResult<T> =
  | { ok: true; data: T; latencyMs: number }
  | { ok: false; error: string; degraded: boolean };
```

### `ReadinessReport` (API response)
```ts
type ReadinessReport = {
  address: string;
  network: "Arc Testnet";
  overallScore: number;            // 0..100
  dataCompleteness: "full" | "partial" | "unavailable";
  categories: CategoryScore[];     // each: id, label, points, maxPoints, reasoning
  summary: WalletSummary;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  methodology: string;             // short explainer
  dataSources: DataSourceRef[];    // links used
  generatedAt: number;
};
```

---

## 5. Failure isolation and graceful degradation

- Every `SourceClient` returns `SourceResult` — **never throws** to the route.
- `AnalystService` aggregates: if a source is down, mark `degraded` and
  continue. Categories that depend on a missing source are marked
  "insufficient data" (not scored to 0).
- API route response codes:
  - `200` with `dataCompleteness: full | partial`
  - `200` with `dataCompleteness: unavailable` plus a friendly message if **all**
    sources failed (we still return JSON, never an HTML crash).
  - `400` for invalid address (validated before any fetch).
- Client shows `ErrorState` on non-200 or network error, with Retry. Never a
  blank crash. React escapes all interpolated values, so on-chain strings
  (addresses, tx input) are safe from XSS because we render them as text.

---

## 6. Security

- Address validated with `viem.isAddress` on **both** client (instant UX) and
  server (authoritative). A malformed address is rejected.
- No secrets in the frontend. Endpoints live in `lib/config.ts` reading
  `process.env.ARC_RPC_URL` etc. `.env.example` documents them; `.env*` is
  git-ignored. (None required today — sources are public — but the seam exists.)
- All user-derived strings rendered via React text nodes (auto-escaped).
- API route is stateless; no session or cookie. Rate-limiting can be added at
  the Vercel edge later if needed.

---

## 7. Performance

- `next: { revalidate: 60 }` on source fetches, plus a small in-memory TTL cache
  in `lib/cache.ts`, so the explorer is not hammered for repeat lookups.
- Results page is a Server Component; heavy charts are lazy-loaded client
  components (`next/dynamic`) so the landing page stays light.
- A single reusable `CategoryBar` component renders every score row (no dup).
- Shared `format` utilities in `lib/format.ts`.

---

## 8. What is explicitly NOT built (honest scope)

- No explorer UI, no portfolio, price, or trading dashboards (per PRODUCT_SPEC 4).
- The "Multi-chain activity" category is **disabled** until a public Arc
  cross-chain read source exists; shown as "Coming when public data becomes available."
- No mainnet assumptions. `network` is hard-coded to "Arc Testnet".

See `docs/SCORING.md` (Phase 6) for exact per-category math against these types.
