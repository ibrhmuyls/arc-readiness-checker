# ARC Readiness Checker — Scoring Principles

> Arc-specific categories only. No generic EVM metrics.

---

## Overall score

```
overall = round( earned / maxEarnable * 100 )
```

where `earned` / `maxEarnable` sum only over categories with `status: "scored"`.
Disabled categories contribute 0 to both and never drag the score down.

---

## Categories

| # | Category | Max | Signal | Calculation |
| --- | --- | --- | --- | --- |
| 1 | Stablecoin Readiness | 25 | token transfers of USDC/EURC/USYC | 8 base if any, +2 per transfer capped at 10, +diversity bonus (3 per distinct token) |
| 2 | Settlement Readiness | 25 | successful vs failed txs + activity span | success ratio scaled by span heuristics |
| 3 | Cross-chain Readiness | 20 | txs to / token txns involving CCTP+Gateway | 6 base if any, +3 per interaction capped |
| 4 | Financial Usage | 20 | stablecoin transfers + repeated payee + memo-like input | pattern heuristics capped |
| 5 | Builder Readiness | 10 | contract deployments + developer-tool interactions | 4 base if any, +2 per interaction |
| 6 | Multi-chain Activity | 0 (disabled) | — | disabled: no public Arc cross-chain attribution source |

Max scorable = 100.

Removed generic categories: Wallet Age, Recent Activity, Raw Transaction Count, Transaction Consistency, Smart Contract Interactions (generic form).

---

## Profile taxonomy

Based on category scores, one of:

- Stablecoin Native User
- Settlement Focused
- Cross-chain Ready
- Financial User
- Builder
- Infrastructure User
- Payment User
- Low Activity
- New Participant
- Institutional-like

Profiles must be evidenced from scores; never hallucinated.

---

## Reasoning contract

Every `CategoryScore` exposes:
- `source` — exact endpoint or doc URL
- `limitations` — what is not measurable
- `reasoning` — exact figures used

Users can reproduce every number from public Arc Testnet data.

---

## Honesty rules

1. No fabricated scores.
2. No mainnet assumptions.
3. Unavailable categories are `disabled` or `insufficient-data`, never zero.
4. No invented ecosystem projects or protocols.
