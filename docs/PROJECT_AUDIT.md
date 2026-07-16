# ARC Readiness Checker — Project Audit

> Produced before any modifications.
> Purpose: find fake, generic, duplicated, misleading, or Arc-incoherent work.

---

## 1. Fake / Invented Content

| Item | Location | Issue |
|------|----------|-------|
| "Wallet Age" category | scoring.ts, SCORING.md | Generic blockchain metric. No Arc-specific meaning. |
| "Recent Activity" category | scoring.ts, SCORING.md | Measures raw transaction count, not readiness for Arc. |
| "Smart Contract Interactions" | scoring.ts, SCORING.md | Heuristic is "any non-trivial input" — inflates score for generic contract calls unrelated to Arc primitives. |
| Strengths/Weaknesses | scoring.ts, SCORING.md, components | Generic labels. Should be "Arc Profile." |
| Recommendations strings | scoring.ts | Generic ("make another transaction"). Should be Arc-specific. |
| Methodology string | scoring.ts, Methodology.tsx | Generic description. No Arc context. |
| "Wallet Summary" section | components/WalletSummary.tsx | Mixes raw stats with some useful ones. Not Arc-focused. |
| Profile/categorical labels | README | Terms like "readiness" are fine, but no Arc-ecosystem profile taxonomy. |

## 2. Duplicated / Explorer-like Functionality

| Item | Issue |
|------|-------|
| Wallet Summary block (first seen, total txns, contract flag) | Replicates explorer address page fields without interpretation. |
| Raw txns + token txns data path | Not displayed beautifully, but data-plane duplicates explorer capabilities. |
| Data Sources list | Lists endpoints. Useful, but currently mirrors a "links" section rather than mapping source→category. |

## 3. Generic Blockchain Metrics (to remove or replace)

- **Wallet Age** → replace with Arc-specific settlement history.
- **Raw Transaction Count** → remove; replace with "settlement frequency" and "stablecoin transfer behavior."
- **Generic Activity Score** → remove; replace with category scores tied to Arc mission.
- **Portfolio-style information** → none in code yet, but Wallet Summary drifts in this direction.

## 4. Arc-Incoherent Terminology

- "Smart Contract Interactions" should say "Builder Readiness" or "App-Kit/DeFi interactions."
- "Transaction Consistency" should say "Settlement Reliability."
- "Bridge Usage" is fine but should map to CCTP/Gateway explicitly.
- Landing page: "How ready is this wallet for the Arc ecosystem?" — fine.
- Subheading: "Enter a wallet address. We analyze public Arc Testnet activity..." — should mention stablecoin-native model.

## 5. UX / Accessibility Problems

| Issue | Component |
|-------|-----------|
| No ARIA labels on form controls | WalletInput.tsx, AnalyzeButton.tsx |
| Loading state has no progress indication | LoadingState.tsx |
| Error state lacks detailed context | ErrorState.tsx |
| No empty/initial state illustration | N/A |
| Focus management on navigate → not handled | page.tsx |
| No skip-to-content / landmark roles | layout.tsx |
| Score color contrast not verified | ReadinessScore.tsx |
| Mobile touch target sizing not verified | All buttons |

## 6. Performance Issues

| Issue | Location |
|-------|----------|
| No dynamic imports for heavy components | analyze/page.tsx imports all subcomponents eagerly |
| No React.memo / useMemo for category bars | ScoreBreakdown.tsx |
| In-memory cache is not shared across server instances | cache.ts (per-instance only) |
| Fetch calls no timeout | lib/sources/*.ts |
| No retry / backoff | lib/sources/*.ts |

## 7. Security Notes

| Issue | Location |
|-------|----------|
| fetch() can hang indefinitely | lib/sources/rpc.ts, explorerLegacy.ts, explorerV2.ts |
| Node runtime on API route is fine, but no rate limiting | app/api/analyze/route.ts |
| XSS: interleaved dynamic strings in UI | All components (React auto-escapes JSX text; markdown-style rendering is absent so lower risk) |
| No CSP header | next.config.mjs |
| No request size limit on body parser | route.ts (default Next body parser is 1MB; OK but not explicit) |

## 8. Dead / Unused Code

| Item | Location |
|-------|----------|
| `isContract: null` in WalletSummary but never populated | types.ts, scoring.ts, WalletSummary.tsx |
| Unused `categoryBadge` export | ScoreBreakdown.tsx |
| Unused `format.ts` reference in ARCHITECTURE.md | docs/ARCHITECTURE.md |
| `Memo`/`Multicall3From` in contractRefs but not exposed as Arc capability categories | contractRefs.ts |

## 9. Misleading / Missing Arc Context

- No mention of **USDC as native gas token** in landing/overview.
- No mention of **CCTP / Gateway bridge** as Arc-native capabilities.
- No mention of **App Kit** (Bridge/Swap/Send/Unified Balance).
- No mention of **StableFX** (FX settlement).
- No mention of **ERC-8004** onchain identity / **ERC-8183** jobs — potential future categories.
- No mention of **deterministic sub-second finality** as a readiness signal.
- No mention of **opt-in privacy** as a feature.
- No acknowledgment of **no volatile native token** (USDC-only gas) as an ecosystem characteristic.

## 10. Design Strengths to Preserve

- Dark minimal theme is on-brand for a financial/infrastructure tool.
- shadcn/ui consistency keeps UI polished.
- Strong layering (landing → results) is clean.
- Source failure isolation in analystService is correct architecture.
- Transparent scoring math is the right philosophy.

---

## Audit Verdict

The project is structurally sound (types, sources, API route, components) but thematically generic. It reads like an "EVM wallet activity scorer" rather than an "Arc Ecosystem Readiness Checker."

The work ahead is:
1. Define Arc-ecosystem-specific scoring categories with real measurability.
2. Replace generic categories with stablecoin, settlement, cross-chain, financial, and builder categories.
3. Replace generic strengths/weaknesses with Arc Profile taxonomy.
4. Rewrite recommendations to be Arc-specific.
5. Add explicit source→category mapping transparency.
6. Strengthen UI/accessibility and remove dead code.
7. Keep all pre-existing engineering guardrails (no invented data, testnet-only, graceful degradation).
