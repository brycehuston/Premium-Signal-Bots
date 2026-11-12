# Alpha Alerts — Production Edge v4 Release Evidence

**Date:** 2026-11-12 UTC
**State:** **DEPLOYED** to Supabase `alpha-insights` v4. **Real-user owner/subscriber positive acceptance remains UNKNOWN.**
**Release authorization:** Explicitly approved in Alpha Apps chat.
**PR:** https://github.com/brycehuston/Premium-Signal-Bots/pull/22
**Production Vercel commit unchanged:** `8e0f3f2f0247a66d0d2d755213318ba787fbc795` (do not blindly merge to main).

## Exact deployed artifact

- Supabase project: `ennbnofvmnkcuhftzlhr`
- Function: `alpha-insights` (version **4**, ACTIVE, `verify_jwt=false` retained)
- Function bundle SHA256: `d114deebce583462c6f057a9baee44a3079eb0d0a6e91b7831d4bedeb68511ca`
- Confirmed the uploaded/deployed `index.ts` and `tier-auth.ts` bytes match the GitHub candidate.
- Publisher signed-ingest source SHA: `8bcde2636e21a3c31ad9ee83ec300261038a49f957e6593e22af2b6516018c9c` (matches previous live v3 and current database).
- Independent owner authorization: authenticated user ID must match the service-role-readable protected `alpha_v4_archive.owner_user_id`.
- Independent subscriber authorization: authenticated email must match active, approved-plan, non-admin `/me` profile.
- Missing/invalid authorization and backend outages fail closed.
- Public view, Ed25519 ingestion, existing gateway credential and data schema unchanged.

## Runtime backend configuration

The connected Supabase tool can deploy Edge Functions but cannot set Edge secrets; **no Supabase Edge secret was created**.
The candidate uses `ALPHA_MEMBERSHIP_API_BASE` when configured, otherwise the **non-secret, already publicly configured Vercel membership backend origin**: `https://premium-signal-bots.onrender.com`. This fallback was unit- and handler-tested and does not expose credentials. The Render service is managed separately.

## Independent checks

- GitHub CI before deployment: **16/16** Edge helper + full-handler mock tests, strict TypeScript, responsive / owner auto-sync QA and cinematic QA all pass. Latest responsive run `43270335985`; cinematic `43270336249`.
- Post-deploy source and Edge function metadata confirmed v4 ACTIVE, correct files, correct signer fingerprint.
- Real GitHub-hosted HTTPS smoke on 2026-11-12 around 17:36 UTC: **7/7 PASS** (workflow `43271238197`):
  - Edge `view=public` HTTP 200, `verified`.
  - Owner anonymous HTTP 403.
  - Owner forged gateway HTTP 403.
  - Subscriber anonymous HTTP 403.
  - Website `/api/intelligence/data` anonymous HTTP 401.
  - Website `/api/intelligence/access` anonymous HTTP 401.
  - Website `/api/public/top-movers` HTTP 200, `verified`.
- Signed publisher continued producing snapshots **after v4 deployed**: 17:35:09, then 17:40:13 UTC, latest at 17:40:37 verification age **0.40 min**, 3,951 events.
- Subscriber snapshot still declares 24h delay.
- Historical 3,303 rows preserved; authenticated direct SELECT remains denied.
- No Vercel production site deployment, database write or destructive operation was involved in the Edge v4 release.

## Consequential external dependency concern

Expanded production smoke workflow `43271429919`: the above seven checks PASS again, but public Render backend `/health` and `/me` each timed out twice at 12s from GitHub Actions, and the job correctly FAILS. Render showed one running instance, low CPU/memory, and four HTTP 499 client-disconnect responses around 17:40 UTC. Earlier Render logs contain successful authenticated `/me` HTTP 200 requests, so the problem may be intermittent or origin-specific. There is insufficient evidence to assert all real users are impacted, but subscriber positive acceptance **cannot be certified** until resolved.

**Do not roll back the Edge v4 security fix solely because a previously existing external membership service is intermittently unreachable:** the frontend already depends on this same membership service, and v3 would reopen the owner-tier authorization weakness. Remediate the Render dependency independently after verifying its runtime health and obtaining authorization for any production Render mutation.

## Rollback protection

The **exact pre-upgrade v3 function source** is preserved at
`supabase/security/rollback/alpha-insights-v3-pre-pr22.ts` on branch
`security/alpha-edge-tier-authorization-20261112`.
The backup was byte-compared with deployed v3 immediately before upgrading.

If and only if v4 itself causes a verified critical regression:
1. Fetch the backup source from the branch above; do not use the outdated `main` file.
2. Call the Supabase `deploy_edge_function` operation on project `ennbnofvmnkcuhftzlhr`, name `alpha-insights`, one file `index.ts` with backup contents, entrypoint `index.ts`, `verify_jwt=false`.
3. Confirm function version increments, publisher SHA stays `8bcde2636e21a3c31ad9ee83ec300261038a49f957e6593e22af2b6516018c9c`, signed publisher resumes and public Top 3 works.
4. **Warning:** Restoring v3 removes independent owner/subscriber authorization; prioritize correcting v4's actual regression.

## Explicit unknowns

Real authenticated owner positive access, real paid subscriber positive access, subscriber 24h delay with a true session, backend reachability from Supabase Edge region, and actual owner UI acceptance were not proven by these tests. They must not be reported as PASS.
