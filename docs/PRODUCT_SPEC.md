# ARC Readiness Checker — Product Specification

> Status: Phase 1 (Research) companion to `docs/DATA_SOURCES.md`.
> Project is **not affiliated with Arc Network / Circle**. It is a
> community-built, educational tool that complements the official ecosystem.

---

## 1. What problem does ARC Readiness Checker solve?

Arc is a new, EVM-compatible Layer-1 built by Circle around **stablecoins as
the native asset**: USDC is the native gas token, with EURC and USYC natively
supported. It is currently available on **Arc Testnet only** (mainnet does not
exist yet), and is defined by sub-second deterministic finality, EVM
compatibility, opt-in privacy, and deep Circle integration (CCTP, Gateway,
App Kit, StableFX).

A newcomer asks a simple, reasonable question:

> **"How ready is this wallet for the Arc ecosystem?"**

Right now there is no neutral, explainable answer. The explorer can show raw
transactions, but it does not tell a human *what those transactions mean for
their readiness* — e.g. "you've used stablecoins and the bridge, but you have no
contract interactions yet." This tool closes that gap with a **transparent
Readiness Report** instead of a raw transaction table.

---

## 2. Who uses it?

- **New Arc users** who want to understand whether their wallet is set up and
  active on Arc Testnet before they build or transact seriously.
- **Builders / developers** validating that a test wallet has the expected
  activity (faucet, stablecoin transfers, contract deploys, bridge tests).
- **Community educators** who need a plain-language explanation of "what counts
  as being Arc-ready."
- **Curious explorers** comparing how two wallets differ in Arc preparedness.

It is explicitly **not** a trading, portfolio, or price tool (see §5).

---

## 3. Why does it exist if the Explorer already exists?

The official explorer answers *"what happened on-chain?"* — a flat, technical
ledger view. ARC Readiness Checker answers *"what does that history say about
my preparedness, and what should I do next?"*

| Explorer | ARC Readiness Checker |
| --- | --- |
| Lists every transaction | Scores preparedness across transparent categories |
| Raw addresses, hashes, gas | Plain-language strengths / weaknesses |
| No judgment or guidance | Concrete next-step recommendations |
| Same view for every wallet | Personalized Readiness Report |

The two are complementary: we **link back to the explorer** for every data point
(highest transparency) rather than trying to replace it. We are a lens, not a
ledger.

---

## 4. What should NOT be included?

Per the project brief and to keep scope honest:

- **No explorer** — we do not build a block/tx browser. We deep-link to the
  official explorer instead.
- **No portfolio tracker** — no token balances dashboard, no P&L.
- **No trading dashboard** — no order books, swaps UI, or execution.
- **No token price tracker** — no live price/USD valuation. (We may show a
  stablecoin *presence* flag, not a price.)
- **No generic crypto dashboard** — no multi-chain net-worth aggregation.
- **No fabricated scores** — the score is computed from real data with visible
  math (see `docs/SCORING.md`, Phase 6).
- **No mainnet claims** — Arc is testnet-only; everything is labeled "Testnet."
- **No wallet custody / signing** — read-only analysis of a public address.

---

## 5. Core user flow

1. **Landing page** — minimal, dark, single question: *"How ready is this
   wallet for the Arc ecosystem?"* with a large address input + Analyze button.
2. **Validation** — address is validated client- and server-side (checksum).
   Invalid input is rejected with a clear error; we never trust raw input.
3. **Loading state** — while data sources are queried (with graceful timeout).
4. **Error state** — if all sources fail (network down, rate-limited), we show
   a friendly error and a retry, never a crash or a fake score.
5. **Results page — Readiness Report:**
   - Overall Readiness Score (0–100)
   - Score Breakdown (per category, with points + reasoning)
   - Wallet Summary (first seen, total txns, stablecoin usage, etc.)
   - Strengths
   - Weaknesses
   - Recommendations (next steps)
   - Methodology (how the score is computed)
   - Data Sources (links to the exact endpoints used)

---

## 6. Guiding principles

- **Explainable over magical.** Every number has a reason.
- **Public data only.** Only the sources in `DATA_SOURCES.md`.
- **Honest about gaps.** Unavailable categories are disabled or labeled
  "Coming when public data becomes available."
- **Git-first, deployable.** Each phase ends clean and Vercel-deployable.
- **No secrets in the frontend.** Any server-side fetching uses environment
  variables; the browser never holds keys (none are needed today — sources are
  public — but the architecture must stay key-safe for the future).

---

## 7. Out of scope (explicit non-goals)

- Mainnet scoring (mainnet does not exist yet).
- Multi-chain readiness aggregation (no public Arc cross-chain read source yet).
- Transaction simulation or signing.
- Account abstraction / smart-wallet provisioning.
- Anything requiring private keys or authenticated user accounts.

---

## 8. Relationship to later phases

- **Phase 2 (Architecture):** defines the service layer that wraps the sources
  in §DATA_SOURCES, with per-source failure isolation.
- **Phase 6 (Scoring):** `docs/SCORING.md` maps each category below to the
  exact fields pulled from those sources.
- **Phase 5 (Data integration):** implements the client for source #1–#4, with
  caching and timeouts.
