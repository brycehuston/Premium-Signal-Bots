# Alpha Alerts — P0 historical-event access boundary

**Status:** PROPOSED / staged only. **No production database change has been executed.**

## Directly verified on 2026-11-12

- `public.alpha_history_events`: 3,303 rows, all `approved_for_history = true`.
- RLS is enabled; `authenticated` has direct `SELECT` privilege.
- Policy `alpha_history_authenticated_read_approved` allows any signed-in, non-anonymous user to read every approved event, without owner/subscriber entitlement or delay.
- `anon` has no SELECT privilege.
- The approved access model requires public information, 24-hour delayed subscriber aggregates, and owner-only detailed intelligence.
- Primary Next.js intelligence routes use server-side authorization, and inspected frontend/backend source did not directly query this table. Other external consumers remain UNKNOWN.
- Supabase's security advisor also warns of GraphQL visibility through `authenticated` SELECT. This is a grant-discoverability finding, not proof of exfiltration.

## Proposed minimal fix

Apply `alpha_history_events_lockdown.sql` **only after explicit production approval**. It revokes `SELECT` from client roles. Service-role writers and existing data are preserved. Do not weaken RLS or publish secret keys.

## Pre-deployment gate

1. Confirm no approved client, subscriber, legacy page, integration or external consumer requires direct authenticated SELECT on this table.
2. Confirm `/api/intelligence/access`, `/api/intelligence/data`, `/api/intelligence/archive` and the public Top 3 API still work under the current release.
3. Preserve current schema/privilege metadata and a rollback method.

## Post-deployment acceptance

Execute read-only tests and require:

```sql
SELECT
  has_table_privilege('anon', 'public.alpha_history_events', 'SELECT') AS anon_select,
  has_table_privilege('authenticated', 'public.alpha_history_events', 'SELECT') AS authenticated_select,
  has_table_privilege('service_role', 'public.alpha_history_events', 'SELECT') AS service_select;
```

Expected `false, false, true`. Validate an unrelated authenticated user cannot read events through REST and GraphQL. Verify owner and subscriber flows, live publisher, public feed and latency after applying the grant change.

## Reversibility

Only if a confirmed production dependency requires rollback, the prior client privilege can be restored using the following separate statement after approval:

```sql
GRANT SELECT ON TABLE public.alpha_history_events TO authenticated;
```

This restores the previous over-broad read boundary, so prefer correcting any verified consumer dependency to use the authorized API.

## Related unresolved release blockers

- `alpha-insights` Edge Function verifies an authenticated user and server gateway, but not independently the requested owner entitlement. The Next.js proxy currently enforces role checks; add independent Edge owner authorization after reconciling deployed source.
- The deployed `alpha-insights` publisher SHA constant differs from the production-commit source. Never blindly redeploy the repository version.
- Historical archive ends 2026-10-18; live aggregate history begins 2026-11-02.
- Actual owner/subscriber browser acceptance and functional visual QA remain unverified.
- The default `main` branch is 150 commits behind production commit `8e0f3f2f`; stage changes from the release baseline, not stale `main`.
