# ARC Readiness Checker — Data Sources

> Status: researched and verified **2026-07-16**.
> **IMPORTANT:** As of this date, **Arc is available on Testnet only.** Mainnet
> does not exist yet, so no mainnet wallet data, explorer, or RPC is available.
> Every data source below is an **Arc Testnet** source. All user-facing output
> in this project must be labeled as applying to *Arc Testnet* and must never
> imply mainnet readiness. We do not fabricate mainnet data.

This document is the single source of truth for what data the Readiness Checker
may use. If a data source is not listed here, it is **not** used. Nothing here
was invented — every URL was reached and every API call below was executed and
returned live data during research.

---

## 1. Arc Testnet RPC

- **Name:** Arc Testnet JSON-RPC endpoint
- **URL:** `https://rpc.testnet.arc.network`
- **Purpose:** Low-level chain reads: `eth_chainId`, `eth_blockNumber`,
  `eth_getTransactionCount`, `eth_getBalance`, `eth_getTransactionByHash`, etc.
- **Public?** Yes.
- **Authentication required?** No. (Standard JSON-RPC `POST`.)
- **Verified live?** Yes. Returns `chainId = 0x4cef52` (5,000,018) and a current
  block number.
- **Can it support Readiness Checker?** **Yes.** Used for:
  - `eth_getTransactionCount` → non-zero means the wallet has sent at least one
    transaction (basic "has activity" signal).
  - `eth_getBalance` → native USDC balance (USDC is the native gas token on Arc).
  - `eth_chainId` / `eth_blockNumber` → network sanity check before analysis.
- **Caveats:** RPC limits historical queries (no "first transaction" lookup), so
  wallet-age and full history come from the explorer API, not raw RPC.

---

## 2. Arc Testnet Block Explorer (Blockscout)

- **Name:** Arc Testnet Explorer (Blockscout deployment)
- **URL (web):** `https://testnet.arcscan.app`
- **Purpose:** Browse blocks, transactions, addresses, tokens, contracts on Arc
  Testnet.
- **Public?** Yes.
- **Authentication required?** No.
- **Verified live?** Yes (HTTP 200, APIs return real data).
- **Can it support Readiness Checker?** **Yes — this is the primary data source.**
  The explorer exposes two API styles, both public and unauthenticated:

### 2a. Legacy Etherscan-compatible API (`/api`)

Base: `https://testnet.arcscan.app/api`

| Endpoint | Example | What it gives us |
| --- | --- | --- |
| Account normal txns | `?module=account&action=txlist&address=<addr>&page=1&offset=10000` | Full sent/received tx history (blockNumber, timestamp, from/to, input, gasUsed) |
| Token transfers | `?module=account&action=tokentx&address=<addr>&page=1&offset=10000` | ERC-20 transfers involving the wallet (USDC, EURC, USYC, etc.) |
| Block by time | `?module=block&action=getblocknobytime&timestamp=<ts>&closest=before` | Maps a unix timestamp to a block number (used to bucket "recent" activity) |

All three were executed during research and returned real data. This API is the
backbone of the scoring engine (history, tokens, timestamps).

### 2b. Blockscout v2 API (`/api/v2`)

Base: `https://testnet.arcscan.app/api/v2`

| Endpoint | Example | What it gives us |
| --- | --- | --- |
| Address counters | `/addresses/<addr>/counters` | `transactions_count`, `token_transfers_count`, `gas_usage_count` (fast aggregate counts) |
| Address summary | `/addresses/<addr>` | `coin_balance`, `is_contract`, `creation_transaction_hash`, `has_token_transfers`, `has_logs` |
| Transactions / token-transfers | `/addresses/<addr>/transactions`, `/token-transfers` | Cursor-paginated lists |

**Pagination note:** The v2 list endpoints use cursor pagination
(`next_page` token), not `page`/`offset`. The legacy API uses
`page`/`offset` and is simpler for bulk history pulls, so Phase 5 will
primarily use the legacy API, with v2 `counters` as a fast cross-check.

---

## 3. Arc Contract Addresses (reference data)

- **Name:** Arc Testnet contract addresses
- **URL:** `https://docs.arc.io/arc/references/contract-addresses.md`
- **Purpose:** Authoritative list of Arc Testnet contract addresses for
  stablecoins (USDC, EURC, USYC), cross-chain (CCTP TokenMessengerV2 /
  MessageTransmitterV2 / TokenMinterV2), Gateway (GatewayWallet /
  GatewayMinter), StableFX (FxEscrow), and common infra (Multicall3, Permit2,
  CREATE2 factory, Memo).
- **Public?** Yes.
- **Authentication required?** No.
- **Verified live?** Yes (fetched and parsed during research).
- **Can it support Readiness Checker?** **Yes — as a static reference table.**
  We hard-code these addresses (build-time constant) to detect, from a wallet's
  transaction/to-token history, whether it has interacted with:
  - **Stablecoins:** transfers of USDC / EURC / USYC (stablecoin-usage category).
  - **Bridge / cross-chain:** transactions whose `to` or token contract is a
    CCTP or Gateway address (bridge-usage category).
  - **App / DeFi primitives:** Multicall3, Permit2, StableFX FxEscrow, etc.
    (smart-contract-interaction category).
- **Caveats:** This is a snapshot of testnet addresses. If Arc ships mainnet,
  this doc will need a mainnet counterpart before mainnet scoring is enabled.

---

## 4. Arc Network Status

- **Name:** Arc status page
- **URL:** `https://status.arc.io`
- **Purpose:** Live operational status of Arc networks/services.
- **Public?** Yes.
- **Authentication required?** No.
- **Verified live?** Yes (linked from official docs).
- **Can it support Readiness Checker?** **Partial / optional.** Used only to show
  a "network is operational" context line on the results page, not for scoring.
  API shape not yet integrated; if unavailable, the status line degrades to
  "status unknown" without affecting the score.

---

## 5. Arc Developer Documentation / `llms.txt`

- **Name:** Arc docs + machine-readable index
- **URLs:** `https://docs.arc.io`, `https://docs.arc.io/llms.txt`
- **Purpose:** Human and agent-readable documentation of Arc capabilities,
  RPC setup, contract deployment, bridging, gas model, EVM differences.
- **Public?** Yes.
- **Authentication required?** No.
- **Verified live?** Yes (`llms.txt` fetched during research; it is the basis
  for the network facts cited in this repo).
- **Can it support Readiness Checker?** **No (not as a runtime data source).**
  Used only to keep methodology/README text accurate. Not queried at analysis
  time.

---

## Sources explicitly NOT used (and why)

| Source | Reason not used |
| --- | --- |
| **Arc Mainnet RPC / Explorer** | Does not exist yet. Arc is testnet-only. We will not fabricate it. Bridge/CCTP mainnet data is likewise unavailable. |
| **Arc "wallet score" / readiness API** | No such public API exists. The score is computed transparently by us from the sources above. |
| **Circle CCTP / Gateway / StableFX developer docs** (`developers.circle.com`) | Useful background, but they describe the *protocols*, not a wallet's on-chain history. We detect bridge usage from on-chain txs, not from these docs. |
| **Third-party multi-chain portfolio / attribution APIs** (e.g. Covalent, Alchemy, Etherscan mainnet) | Out of scope, require keys, and would mix non-Arc chains. "Multi-chain activity" is therefore **disabled / marked "Coming when public data becomes available"** until an Arc-endorsed cross-chain source exists. |
| **Arc MCP Server** (`docs.arc.io/ai/mcp`) | A dev tool that serves *documentation* to AI agents. It is not a wallet-data API and is not used for scoring. |
| **Faucet** (`faucet.circle.com`) | For obtaining testnet tokens; not a read source. |

---

## Data-source summary table

| # | Name | URL | Public | Auth | Supports Readiness Checker |
| --- | --- | --- | --- | --- | --- |
| 1 | Arc Testnet RPC | `https://rpc.testnet.arc.network` | Yes | No | Yes (balance, tx count, chain sanity) |
| 2 | Arc Testnet Explorer (legacy `/api`) | `https://testnet.arcscan.app/api` | Yes | No | **Yes — primary** (history, token txns, timestamps) |
| 3 | Arc Testnet Explorer (v2 `/api/v2`) | `https://testnet.arcscan.app/api/v2` | Yes | No | Yes (fast counters / summary) |
| 4 | Arc Contract Addresses | `https://docs.arc.io/arc/references/contract-addresses.md` | Yes | No | Yes (static reference for category detection) |
| 5 | Arc Status | `https://status.arc.io` | Yes | No | Optional (status line only) |
| 6 | Arc Docs / llms.txt | `https://docs.arc.io` | Yes | No | No (documentation only) |
| — | Arc Mainnet | — | — | — | **Does not exist** — not used |
| — | Third-party multi-chain APIs | — | varies | Yes | Out of scope — not used |

---

## Rules enforced by this document

1. Only sources in the "Supports" = Yes rows are queried at analysis time.
2. Every field shown to the user traces back to one of these sources.
3. If a desired category cannot be satisfied by these sources, it is either
   disabled or labeled **"Coming when public data becomes available."**
4. No mainnet data is assumed or fabricated.
