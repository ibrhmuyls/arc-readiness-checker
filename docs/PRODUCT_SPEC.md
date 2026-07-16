# ARC Readiness Checker — Product Specification

> Status: Phase 1 (Research) companion to `docs/DATA_SOURCES.md`.
> Project is **not affiliated with Arc Network / Circle**. It is a
> community-built, educational tool that complements the official ecosystem.

---

## 1. What problem does ARC Readiness Checker solve?

Arc is a Circle-built, EVM-compatible Layer-1 defined by **stablecoins as
the native asset**: USDC is the native gas token, with EURC and USYC natively
supported. It is available on **Arc Testnet only** (mainnet does not exist
yet), and is defined by sub-second deterministic finality, EVM compatibility,
opt-in privacy, direct CCTP/Gateway bridge integration, and App Kit
(Bridge/Swap/Send/Unified Balance).

Because it is new and testnet-only, most wallets have little or no Arc history
yet. A newcomer asks:

> **"How ready is this wallet to fully participate in the Arc ecosystem?"**

The official explorer answers *"what happened on-chain?"* — a flat ledger. This
tool answers *"what does that history say about this wallet's Arc readiness?"*
with a transparent, Arc-specific Readiness Report.

---

## 2. Who uses it?

- **New Arc users** verifying testnet readiness.
- **Builders / developers** validating test wallets.
- **Community educators** explaining Arc-native readiness.
- **Curious explorers** comparing wallets.

It is explicitly **not** a trading, portfolio, or price tool.

---

## 3. Why does it exist if the Explorer already exists?

| Explorer | ARC Readiness Checker |
| --- | --- |
| Lists every transaction | Scores Arc-specific readiness with visible math |
| Raw addresses, hashes, gas | Plain-language Arc Profile + insights |
| No judgment | Concrete Arc-native next steps |
| Same view for every wallet | Personalized Readiness Report |

We deep-link to the explorer for transparency. We are a lens, not a ledger.

---

## 4. What should NOT be included?

- No explorer UI
- No portfolio tracker
- No trading dashboard
- No token price tracker
- No multi-chain net-worth aggregation
- No mainnet claims
- No wallet custody / signing
- No invented ecosystem projects

---

## 5. Core user flow

1. **Landing** — minimal dark page: *"How ready is this wallet for the Arc ecosystem?"*
2. **Validation** — EIP-55 address check. Invalid input rejected.
3. **Loading** — reads public Arc Testnet data.
4. **Results — Readiness Report:**
   - Overall Arc Readiness Score (0–100)
   - Arc-specific category breakdown
   - Arc Profile taxonomy
   - Wallet Summary (USDC balance, per-token stats)
   - Recommendations (Arc-native)
   - Methodology + Data Sources + Limitations

---

## 6. Scoring model (Arc-native)

Categories are derived exclusively from public Arc Testnet data and reflect
Arc's stablecoin-native, settlement, cross-chain, financial, and builder
mission. Generic blockchain metrics (wallet age, raw transaction count,
generic activity score) are removed.

See `docs/SCORING.md` for exact formulas.

---

## 7. Guiding principles

- **Explainable over magical.** Every number has a reason.
- **Public data only.** Sources in `DATA_SOURCES.md`.
- **Honest about gaps.** Unavailable categories are disabled or labeled.
- **Git-first, deployable.** Clean and Vercel-ready.
- **No secrets in frontend.**

---

## 8. Out of scope

- Mainnet scoring (mainnet does not exist yet).
- Multi-chain readiness aggregation (no public Arc cross-chain source).
- Transaction simulation or signing.
- Account abstraction / smart-wallet provisioning.

