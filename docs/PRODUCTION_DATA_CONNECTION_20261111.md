# Alpha Alerts production-data connection — exact release plan

Status: **READ-ONLY SOURCE VERIFIED / PRIVATE PIPELINE NOT RELEASED**.
Source of truth: the existing Alpha Alerts production VPS. Do not replace the sender or upload raw private archives to the public GitHub repository.

## Observed source and trust boundaries

- Active source: `/home/ubuntu/worktrees/alpha-alerts-live-v196-20261101/alpha_trend_alerts.py`.
- Reviewed production source fingerprint (2026-11-11): `6dfd39df0db8a64cf15a5e4806a99edbd6d474538f581845aee54d93514631af`.
- The current sender writes `logs/TREND_token_alerts.csv` after the Telegram send succeeds. That ordering is established in current source; it is **not** independently sufficient to prove the intended public Telegram channel.
- The older public-feed publisher has a stale `EXPECTED_SOURCE_SHA256` and fails closed. Review the complete source diff and recipient identity evidence before changing its fingerprint. Never disable integrity verification.
- `logs/TREND_outcomes.csv` and `reports/runtime/TREND_price_snapshots.csv` contain outcomes/observations with different semantics. Do not compute market-cap multiples by blindly dividing `max_market_cap_usd` by `entry_market_cap`.
- The currently deployed Supabase project has only signed public feed storage. No historical dashboard store or `alpha-insights` Edge Function is deployed.

## Minimal verified-data pipeline

1. **Local read-only exporter on VPS**: read a consistent CSV snapshot; verify producer fingerprint and post-send ordering; validate timestamps and lane IDs, quarantine duplicate/ambiguous event IDs; derive daily/hourly counts in America/Vancouver and a 24-hour-delayed subscriber cohort. Transfer aggregate-only values—no mints, raw Telegram content, message links, credentials, user IDs, or private channel identities. Do not imply scanner counts are delivered trade executions.
2. **Private Supabase storage**: add a dedicated aggregate snapshot table, keyed by schema version and snapshot window, with RLS enabled and revoked `anon`/`authenticated` table grants; only the service role can write. Append-only timestamped snapshots. Independent key/Edge Function verification on every upload. Do not put service keys in `NEXT_PUBLIC_` variables.
3. **Edge Function `alpha-insights`**: authenticated and server-authorized owner response returns the existing `OwnerLaneDashboard` archive schema from stored aggregates; subscriber response is a separate pre-computed >=24h delayed dataset with no first-mint details; public response is a separate approved, signed Top-3 feed only. Do not take `view=owner` at face value; reauthorize against Supabase user and existing backend `/me` on every call. The Next.js routes repeat entitlement checks and use `Cache-Control: private, no-store`.
4. **Publisher schedule**: after dry-run validation, write only a sanitized signed snapshot every 5–15 minutes. Do not restart the trading bot, alter trade decisions or replace the existing public feed publisher in the same change.
5. **Real public top-three**: require a trusted successful Telegram API response to the *public* channel, exact event/mint/lane/time joins, canonical first alert market cap, independently observed peak market cap after the call, and a consistent computed multiplier. If no current 24-hour cohort, choose the latest fully verified prior cohort; show its original date and HISTORICAL status. Never substitute old highest-score alerts or an estimated peak.
6. **Acceptance before production**: verify exact schema under read-only test SQL, validate publisher hash pins, prove no tokens/mints/raw messages cross into subscriber/public response, test unauthenticated/expired/member/owner access and delayed cutoffs, test homepage at 360/390/768/1440px, confirm historical timestamp fallback and last-updated labels, verify rollback deployment and data preservation. Keep current production live until this is proven.

## Known implementation references

- Website preview branch: `feature/stacked-historical-top-movers-20261111`.
- Frontend routes: `hub-frontend/app/api/intelligence/access/route.ts`, `hub-frontend/app/api/intelligence/data/route.ts`, `hub-frontend/app/api/public/top-movers/route.ts`.
- Original V4 UI: `hub-frontend/app/dashboard/OwnerLaneDashboard.tsx`.
- Subscriber UI: `hub-frontend/app/dashboard/SubscriberDashboard.tsx`.
- Earlier staged, unmerged history work: `feature/alpha-lane-intelligence-dashboard-v4`, especially `hub-frontend/HISTORY_PIPELINE_RELEASE_GATES.md`; it is not production-validated and must not be merged wholesale.
- Owner authorization requires `ALPHA_OWNER_USER_ID`; no second sign-in flow is needed, but it must identify precisely one owner. Existing `/me` plan/role authorization must remain enforced.
- No automatic data connection is operational until the publisher, protected store, and Edge Function are actually deployed and smoke-tested.

## Hard stop

Production database DDL, publishing to external storage, provisioning service keys, changing the public-feed integrity pin, or restarting production services require the production release gate. Ordinary read-only inspection, local staging, source changes on a feature branch, and preview validation may proceed independently.
