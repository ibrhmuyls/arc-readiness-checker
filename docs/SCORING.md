# ARC Readiness Checker — Scoring Principles

> Companion to `docs/ARCHITECTURE.md` (Phase 6 detail). The score is computed
> transparently from public Arc Testnet data. **No number is invented.** If a
> category's data source is unavailable, the category is marked
> `insufficient-data` and is NOT scored to zero.

---

## Overall score

```
overall = round( earned / maxEarned * 100 )
```

where `earned` / `maxEarned` sum only over categories with `status: "scored"`.
Disabled categories contribute 0 to both numerator and denominator, so they
never drag the score down falsely.

---

## Categories

| # | Category | Max | Signal (source) | How it is calculated |
| --- | --- | --- | --- | --- |
| 1 | Wallet Age | 20 | first successful tx timestamp (explorer txlist) | days since first tx; 4 pts at day 0, ramps to 20 at 90+ days |
| 2 | Recent Activity | 20 | successful txs in last 30 days (explorer txlist) | 4 pts per recent tx, capped at 20 (5 txns = full) |
| 3 | Stablecoin Usage | 20 | token transfers of USDC/EURC/USYC (explorer tokentx + contract refs) | 5 pts base if any, +3 per transfer capped at 15 |
| 4 | Smart Contract Interactions | 15 | txs to recognized Arc contracts / non-trivial input (explorer txlist + refs) | 5 pts base if any, +2 per interaction capped at 10 |
| 5 | Bridge Usage | 10 | txs to / token txs involving CCTP+Gateway (explorer + refs) | 5 pts base if any, +2 per interaction capped at 5 |
| 6 | Transaction Consistency | 15 | successful vs total txs (explorer txlist `isError`) | success ratio * 15 |
| 7 | Multi-chain Activity | 0 (disabled) | — | **Disabled**: no public Arc cross-chain read source. Shown as "Coming when public data becomes available." |

Max possible earned = 100 (categories 1–6). Multi-chain is intentionally
excluded from the denominator.

---

## Reasoning per category

Every `CategoryScore.reasoning` string states the exact figures used (e.g.
"3 stablecoin transfer(s)", "12/14 transactions succeeded (86% success rate)").
These strings are rendered verbatim in the UI under Score Breakdown, so the user
can always trace the score back to on-chain facts.

---

## Deriving strengths / weaknesses / recommendations

`deriveInsights()` maps category points to plain-language guidance:

- High Wallet Age + Recent Activity → "Established & active presence."
- Zero stablecoins → recommend a USDC transfer via the Circle Faucet.
- Zero contracts → recommend an App Kit / StableFX interaction or a deploy.
- Zero bridge → recommend trying CCTP/Gateway.
- Low consistency → flag failed transactions.
- Zero activity entirely → top recommendation is to connect + get testnet USDC.

---

## Honesty guardrails

- Disabled categories are never fabricated.
- `dataCompleteness` reflects whether the explorer + RPC answered:
  - `full` — both responded.
  - `partial` — one responded; score uses available data only.
  - `unavailable` — neither; the report still returns JSON with a clear message.
- All numbers derive from `RawFacts`, which is produced only from the verified
  sources in `docs/DATA_SOURCES.md`.
