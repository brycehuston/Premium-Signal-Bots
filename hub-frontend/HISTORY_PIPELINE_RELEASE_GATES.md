# Alpha Alerts Server-Side Historical Intelligence — Staging Candidate

**Status:** SOURCE-READY / SYNTHETIC-TESTED. **NOT BACKFILLED, NOT PRODUCTION READY.**

## Grounded evidence (Nov 10, 2026)

- Supabase project `ennbnofvmnkcuhftzlhr` has only four public feed-related tables; no historical event store exists in public schema.
- Public Ed25519 state is stale (last signed November 7, 2026 08:01:57 UTC). The live publisher still needs authorized review of its source hash pin. This is a separate public-feed problem.
- Current production VPS canonical alert CSV is **pre-Telegram**, not delivery proof. Upstream `alpha_trend_alerts.py` does capture `TelegramDeliveryResult` metadata and `delivery_status=DELIVERED` after a successful API response, but an event-keyed append-only receipt writer has not been independently verified in the current runtime.
- User-supplied prior owner-audit: 2,088 canonical unique event IDs, 2,023 unique feature IDs, 2,020 overlaps, 1 duplicate feature ID, 1,584 outcomes, and 524 24h identity-matched candidates. **0 independently proven delivery receipts** in that audit.
- Connected SentinelX identity `alpha-prod` returns Permission denied for the private telemetry paths and journal access. No sudo workaround or permission mutation has been attempted.

## Included staging implementation

1. `scripts/build_validated_history.py`: local-only CSV reconciliation of pre-send canonical + feature + **separate direct Telegram API delivery receipt** + optional outcome. Quarantines duplicates and inconsistent IDs/mints/lanes/timestamps; rejects Elite/wrong-chat/no-delivery; excludes secrets and message content. Writes sanitized staging JSON only when at least one receipt has been independently witnessed. No network/upload.
2. `sql/STAGED_alpha_history_schema.sql`: two private-by-grants tables in `public`, RLS enabled, no anon/authenticated access; service role accesses only via a server-side authenticated API. **Do not apply to prod without owner authorization and security review.**
3. `app/api/history/route.ts`: authenticates the caller's Supabase access token, checks backend `/me` active plan/role, then queries only eligible server-side records with server-only credentials. No browser-to-service-key exposure. 5,000-event response guard; marks partial counts when truncated.
4. `app/dashboard/history/page.tsx`: dedicated signed-in history view with real date, lane distribution, call-time market caps, 24h/7d/30d/all; no importer or sample figures. Explicit distinction between observed peak and realized P&L. Shows "not yet available" until provenance and storage gates pass.
5. `scripts/import_validated_history.py`: bounded, idempotent REST upsert tool with dry-run default, exact destination check, reviewed provenance and explicit owner release flag. Never automatically writes the production database.
6. 25 synthetic + static safety tests. No fabricated live test results.

## Required proof before real backfill

- Owner-approved, read-only access to the actual production producer source and relevant CSVs (or owner-executed aggregate-only auditor), to validate where post-send features are written.
- Establish a durable, event-keyed **direct Telegram API response** receipt record: event ID, mint, normalized lane, UTC timestamp, reviewed approved public chat identity, positive returned message ID, and success status. It must be written only after Telegram API confirmation, atomically/idempotently, and must not expose Elite channel messages. A candidate/features CSV is *not* automatically this proof.
- Compare receipts to canonical/features by exact event ID, mint, lane and timestamp. Verify duplicates, missing data, timestamp normalization, and public/Elite separation. Review a random sample of actual message identifiers under owner access (never in public API output).
- Prove observations/price-path event joins separately. Outcome `DONE` can provide an *observed maximum*, not an actual trade fill or realized P&L. Partial/pending outcomes remain unavailable.
- Review staging schema & API permissions (RLS, no table grants, token verification, existing backend entitlement enforcement), then obtain **explicit owner approval** before any production DB DDL, key provisioning, backfill, service changes, or publisher restart.
- Provision server-only `ALPHA_HISTORY_SERVICE_ROLE_KEY`, and verified backend API `ALPHA_HISTORY_BACKEND_URL` if not already set. Never enter secrets in chat or frontend assets.
- Re-run tests, validate negative authorization and cross-account access, run small staging backfill with exact count parity and checksum, check 24h UTC vs Pacific UI conversions, then deploy preview and accept visually before any production change.

## Non-goals

- No production VPS changes, service restart, public-publisher SHA bypass, or Telegram sends.
- No fabricated score, return, win-rate, or subscriber history.
- No reliance on six-row public snapshot for private historical analytics.
- No removal of the currently functioning legacy dashboard importer until replacement is proven on real authenticated sessions; `/dashboard/history` is a safe preview candidate.