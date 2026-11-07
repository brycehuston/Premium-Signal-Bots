# Alpha Alerts V5 — current state and acceptance contract
**As inspected 2026-11-07.** This file records a development checkpoint, not a release.

## CURRENT — DIRECTLY VERIFIED
- Production `alphaalerts.dev` remains Vercel deployment `dpl_AdutAuNzh85XX82KNSuxA2wBKULj` at commit `28026d169f4dae35ed60e4259e316b3730f6cdac`.
- Draft PR #8 on `feature/alpha-lane-intelligence-dashboard-v4` is not merged. Never merge this mixed frontend/backend branch blindly.
- `/dashboard` still loads private Lane Flow V4 data from browser IndexedDB after the first manually imported archive. That is NOT automatic subscriber analytics.
- The inspected Supabase `public` schema has four public-feed configuration/state tables, with RLS enabled, but no historical analytics event/outcome tables.
- The VPS `alpha-alerts-public-feed.service` repeatedly exits with status 1; its timer remains enabled. Last inspected signed snapshot: 2026-11-07 08:01:57 UTC, six approved public records. Supabase's public GET correctly rejects snapshots over 20 minutes old.
- The existing signed feed publishes only six approved/confirmed delayed rows (three recent and three weekly reserves), not complete user history.
- **Publisher root cause CONFIRMED 2026-11-07 via owner-provided sudo journalctl traceback:** `source_verified()` raises `ValueError("sender source changed: abort publishing pending code review")` at line 28 of `/home/ubuntu/.alphaalerts/website_feed/publish_confirmed_csv_ed25519.py`. The pinned `EXPECTED_SOURCE_SHA256` does not match the running sender's bytes. This is an intentional fail-closed safety guard, not a known Supabase failure. Do NOT update the fingerprint or bypass `source_verified()` before reviewing the actual sender diff and verifying post-Telegram-confirmation CSV logging. Current sender fingerprint and precise code diff remain UNKNOWN.
- The frontend preview uses real Focus/Vibe/Notes images; the requested complete laptop hero artwork and logo replacement are NOT verified on the website.

## TARGET — USER APPROVED
1. Every entitled signed-in subscriber immediately sees automatically loaded market history. No subscriber file uploads or stale sample/demo data.
2. Rolling 24h, 7d, 30d and historical lane distribution, repeats and outcomes. Exits are explicitly labeled as ACTUAL FILLS, MODELED EXITS or OBSERVED PEAKS; never substitute peak for P&L.
3. Top 3 public alerts show only delayed, signed, delivered, public-approved events. When none exist within 24h, fall back to the bounded seven-day reserve. No stale-data bypass.
4. Premium compact Alpha Grind laptop hero, authentic logo, scroll-based story, and screenshot-supported Choose Your Vibe section.
5. Clean dark charcoal surfaces, no permanent icon rail, clear return navigation.

## KNOWN-GOOD / ROLLBACK
- Keep the production deployment above until owner acceptance.
- Preserve six-lane scoring, existing sender, private telemetry, signing keys, checkout safety, and historical source data.
- Do not deploy backend code by merging draft PR #8; backend auto-deploy behavior must be checked first.

## V5 SECURITY PATCH — STAGED, NOT RELEASED
- `backend/identity.py`: canonical signed Supabase subject and top-level email; user-editable metadata cannot identify an account.
- `backend/main.py`: link existing accounts only by Supabase subject; reject matching-email legacy account collisions; do not fall back to legacy auth after valid Supabase JWT validation.
- `backend/test_identity.py`: five validation regression tests passed locally. Full integration login, account migration, and negative authorization tests have NOT been executed.
- **Compatibility gate:** legacy accounts sharing an email but not yet linked by Supabase ID may now need an owner-verified migration. Audit and reconcile these before any backend release.

## HIGHEST-VALUE DATA IMPLEMENTATION — NOT YET PRESENT
- Trace confirmed delivered event IDs to append-only server-side event storage; preserve receipt and timestamp provenance.
- Add server-side account entitlement checks using the existing authoritative backend, NOT user-supplied profile metadata.
- Share one verified historical dataset among entitled users; keep account settings and private research scoped separately.
- Backfill with source/row reconciliation, idempotent upserts, bounded freshness, retention, and explicit clock units.
- Derive 24h windows from event timestamps, not calendar-day buckets. Display Pacific Time independently of UTC storage.
- Keep exits and return metrics unavailable until independently validated price paths, entry model, fees, slippage and wick ordering exist.
- Test unauthorized/cross-account access, first-appearance dedup, alert repeats, missing outcomes, data freshness, page load and rollback.
- Use a staging schema and explicit approval gate before production Supabase mutations or publisher changes.

## OTHER PREVIEW WORK — STAGED
- `/apps`: real-image horizontal color gallery showing five genuine Alpha Focus captures without fabricated Vibe/Notes color options.
- The gallery is below the existing product showcase, not inside the uncluttered hero.

## NEXT BLOCKERS
1. Read-only inspection of production publisher stderr/traceback as the authorized service owner; fix via reviewed source changes, then request controlled production release permission.
2. Obtain the canonical private V4 dataset/telemetry and a secure target schema for staging; connect authenticated retrieval before removing the prototype importer.
3. Run actual user-session auth QA and browser visual QA at 320, 375, 768, 1280 and 1920 widths. Do not claim release readiness on builds alone.

## VERIFIED SOURCE-DRIFT RECOVERY PROCEDURE
1. From the production host as the authorized owner, read only the sender and pinned fingerprint. Record the current SHA-256, `git status`, last source commits and the diff from the approved version. Do not read/export the private Ed25519 signer.
2. Inspect and test the `if not delivered` -> `_telegram_delivery_metadata` -> `_log_alert_csv(...raise_on_error=True)` ordering and actual delivery-confirmation semantics. An unchanged string sequence alone is NOT proof of equivalent behavior.
3. Only after independent review, propose the minimal publisher-only SHA pin update (if appropriate). Do not change the running sender for the website's convenience.
4. Owner approval required before production publisher modification/restart. First run the publisher's dry-run mode; then one controlled service attempt, confirm fresh signed Supabase state, API `verified` result and homepage Top 3. Preserve 30-minute publication delay and 20-minute snapshot-freshness checks.
5. In parallel, inspect real CSV fields and data coverage before designing registered historical ingestion; the six-row signed public snapshot cannot populate subscriber historical analytics.


## ALPHA ALERTS MAIN HANDOFF RECONCILIATION — 2026-11-07

**Source:** User-supplied recovery report from Alpha Alerts Main. Its direct-VPS findings are AGENT-REPORTED here until cross-checked in the live filesystem. Separately, the GitHub source map and Phase 3 regression test were directly inspected at \`brycehuston/Alpha-Trend-V2\`, ref \`4e0efeca4d1b45847af440f516158e6bfc427450\`.

- Agent-reported live sender SHA-256: \`40b355756e6aa6b02c0b516ea39219f029d983254ec5a5bf02b3ec68f18386f8\`. Publisher still expects \`0c2bf122e3acea2471f02dde6faf420875b6f0301f84ce785fe94ff013db704a\`. Never update the pin without reviewing the full delivery contract.
- Agent-reported clean release worktree: \`/home/ubuntu/worktrees/alpha-alerts-v1925-veto-stage-20261107\`, branch \`release/v1.9.25-producer-structural-veto\`, commit \`b0d623054404b2a02721f292fb74c75fd367443d\`. v1.9.25 only changes the version label relative to its imported v1.9.24 baseline; the pre-Telegram flush predates this version bump.
- **Directly inspected upstream test:** \`tests/test_phase3_unified_patch.py\` asserts \`_canonical_csv_flushed_pre_telegram\` and no duplicate post-delivery canonical CSV write. Pre-flush was an intentional durability feature, not proof of a sender regression. **The unsafe assumption is in the website publisher:** the pre-flush CSV cannot prove Telegram delivery.
- Agent-reported recent VPS counts: canonical token CSV 2,078 rows (pre-send); alert features 2,014 rows; legacy MEV post-send log 2,014 rows; opportunities 6,330; outcomes 1,551; price snapshots 196,056; forward states 90,121. The 64-row canonical/features difference does NOT establish 64 failed deliveries.
- Agent-reported outcomes: \`DONE=79\`, \`PENDING=1461\`, \`EXPIRED_PARTIAL_DATA=11\`. Never include incomplete outcomes in completed-cohort returns or label modeled peaks as realized P&L.
- **Directly inspected upstream map:** \`docs/ALPHA_TREND_DATA_MAP.md\` maps canonical/feature \`event_id\` to outcomes \`alert_id\`, and \`opportunity_id\` to price observations. This is a schema-level map, not proof of exact live referential integrity.
- High-priority candidate: reconcile \`TREND_token_alerts.csv\` with the agent-reported post-delivery \`TREND_alert_features.csv\` on exact event ID, exact mint, normalized lane, and valid timestamps. Use \`mev_alert_log.csv\` for cross-checking only when its identity/timestamp semantics are verified. **Do not publish candidates without tracing the actual post-delivery writer contract and receipt guarantees.**
- **Directly verified access blocker:** the currently connected read-only SentinelX identity receives PermissionError for all five relevant production CSV files. Do not elevate connector permissions silently. An owner-authenticated SSH session can perform the bounded read-only reconciliation.
- **Validated local test artifact:** \`audit_delivery_lineage.py\` with eight synthetic unit tests, designed to output aggregate join counts only, never identifiers or private Telegram data. It does not sign, send, rewrite or approve any events. Stage to the repository only after reviewing the source and test artifacts; no publisher replacement is authorized.

**Decision:** Preserve scanner pre-flush, repair the signed public publisher's delivery-proof source contract, then independently implement authenticated history ETL. Keep public six-row snapshots separate from the private/full historical dataset.


## LIVE READ-ONLY RECONCILIATION — USER EXECUTED 2026-11-07

The owner ran a PowerShell-to-SSH read-only CSV identity audit on \`alpha-prod\` and supplied JSON output (USER-SUPPLIED VPS OUTPUT, not independently reproduced under the restricted agent).

| Key | Value |
|---|---:|
| canonical rows / unique IDs | 2088 / 2088 |
| feature rows / unique IDs | 2024 / 2023 |
| canonical-feature event ID overlap | 2020 |
| canonical only / features only | 68 / 3 |
| candidate event IDs with matching mint + normalized lane + valid canonical time | 2020 |
| rolling 24h identity-matched candidates / distinct mints | 524 / 280 |
| duplicate feature event IDs | 1 |
| mint mismatches / lane mismatches / canonical invalid timestamps | 0 / 0 / 0 |
| outcomes DONE / PENDING / EXPIRED_PARTIAL_DATA | 79 / 1488 / 17 |

**These are candidates, not delivery-confirmed records.** The audit deliberately returned \`telegram_delivery_independently_verified=false\`; exact cross-file identity does not prove the writer's post-send invariant.

## STAGED PUBLISHER CANDIDATE — NOT PRODUCTION APPROVED

Development source \`hub-frontend/scripts/public_feed_delivery.py\` implements strict one-to-one \`event_id\` + mint + normalized lane + exact UTC timestamp cross-checking against the feature log, disqualifies duplicated feature IDs, and fails closed on missing/unsafe schema. \`hub-frontend/scripts/publish_confirmed_csv_ed25519.py\` now requires this match before considering canonical events for the six-row public snapshot.

**The old approved sender hash remains deliberately pinned.** This code does not, and must not, make the live service publish until the source contract is independently approved, a new fingerprint reviewed, and owner authorization obtained.

Eleven isolated synthetic regression tests passed locally in the analysis environment. The real post-delivery writer ordering and feature timestamp equality have NOT yet been independently checked against the production sender; the candidate code is therefore not release-ready.

Next read-only proof: verify \`TREND_alert_features.csv\` genuinely writes only after a successful Telegram send, inspect its exact runtime timestamp field semantics, and explicitly validate \`event_id\` first-public and duplicate handling before any release.
