# Alpha Alerts — independent Edge intelligence authorization (candidate)

**State:** SOURCE-READY / isolated GitHub branch. **NOT DEPLOYED.**
**Production baseline:** `8e0f3f2f0247a66d0d2d755213318ba787fbc795`
**Production Supabase Edge function:** `alpha-insights` version 3 (unchanged as of review).

## Directly verified

- Live `alpha-insights` source differed from the production GitHub commit in only one signed publisher SHA constant.
- Candidate pins that exact deployed SHA: `8bcde2636e21a3c31ad9ee83ec300261038a49f957e6593e22af2b6516018c9c`.
- Removing the candidate's import, owner/subscriber entitlement gate, and narrower `read` parameter type reproduces the deployed function **byte for byte**.
- The archive's protected `owner_user_id` exists, and an `auth.users` row has that ID. This check does not rely on editable user metadata.
- The app's existing `alphaAccess` relies on `backend /me` for subscriber entitlement, and the backend returns `email`, `role`, `plan`, and `is_active`.
- Existing public data and signed ingestion paths are unchanged.

## Changes

1. `supabase/functions/alpha-insights/tier-auth.ts`: independently authorizes owner via private `alpha_v4_archive.owner_user_id`. Subscriber access independently calls the existing membership service `/me` using the authenticated bearer, requires `is_active=true`, approved plan, non-admin role, and a matching authenticated email.
2. `supabase/functions/alpha-insights/index.ts`: invokes the tier check **before** reading the snapshot. Fail-closed 403 for denied entitlement, 503 for unavailable checks. Preserves gateway validation, Supabase Auth validation, signer public key, public read route, ingestion logic, and current publisher fingerprint.
3. `hub-frontend/qa/alpha-edge-tier-auth.test.mjs`: eight local test cases.

## Test evidence

Ran under Node.js 22.16.0 with built-in TS type-stripping, plus strict TypeScript compilation. Results: **8/8 tests PASS, TypeScript PASS**.

Test coverage:
- Exact owner identity; non-owner rejected.
- Missing or broken archive ownership check fails closed.
- Active subscriber with approved plan accepted.
- Inactive, unknown plan, admin, identity mismatch, malformed profile rejected.
- Upstream 401/403 denied, 5xx/network outage unavailable.
- Missing/malformed membership service configuration unavailable.
- Valid trusted backend URL path prefix handled.
- Unknown view, invalid user ID, missing email rejected.

Command from repository root:

```bash
node --experimental-strip-types --test hub-frontend/qa/alpha-edge-tier-auth.test.mjs
```

Type-check helper:

```bash
tsc --pretty false --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --lib ES2022,DOM --strict supabase/functions/alpha-insights/tier-auth.ts
```

## REQUIRED BEFORE PRODUCTION RELEASE

1. Obtain explicit approval for production Edge Function deployment.
2. In the **Supabase Edge Functions** environment, configure server-side `ALPHA_MEMBERSHIP_API_BASE` to the **same HTTPS base URL** currently used by `NEXT_PUBLIC_API_BASE` (or fallback `NEXT_PUBLIC_API_URL`) in production Vercel. Include its trusted path prefix if applicable. Never configure this from caller-supplied headers or URLs.
3. Confirm the currently deployed `alpha-insights` fingerprint is still the value above. If the VPS publisher rotated, reconcile from the latest live function **before** any redeploy.
4. Deploy the function and its imported `tier-auth.ts` as one atomic function update. Preserve `verify_jwt=false` because signed ingest and public read are intentionally available without a user JWT; private views explicitly verify the session and gateway.
5. Test **real accounts** end to end: valid owner returns full data, unrelated signed-in user is forbidden, entitled subscriber gets only delayed aggregates, inactive user forbidden, anon forbidden, backend unavailable returns 503, public Top 3 unchanged, signed publisher continues accepting fresh updates.
6. Check fresh logs for unauthorized access, increased latency, or subscriber false negatives. Preserve the previous Edge function source/version as rollback.

## Remaining verification limits

- Local tests use mocked backend and private database responses; they do not prove target-region network routing or real authenticated browser behavior.
- No `ALPHA_MEMBERSHIP_API_BASE` secret/configuration was written, and no Edge Function was redeployed.
- Default `main` is historical; do not merge this patch into stale main and assume it is live. Review against the production release branch.
