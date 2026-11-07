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
