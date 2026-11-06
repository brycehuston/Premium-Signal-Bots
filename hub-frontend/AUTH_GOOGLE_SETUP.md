# Alpha Alerts — authentication restoration (Google + email)

Status: **draft / not deployed to production**. November 6, 2026.
Scope: restore existing Supabase login and establish a reliable dashboard handoff. No redesign or dashboard replacement.

## Verified source issues and fixes

1. Before: `/login` initiated Google OAuth with PKCE, but `/auth/callback/page.tsx` only called `getSession()`. It never called `exchangeCodeForSession(code)`, so an OAuth redirect could finish without a session.
   Now: a Next.js route handler at `/auth/callback` exchanges the code and writes auth cookies on the redirect response. It only redirects internally to `/dashboard`, avoiding open redirects.
2. Before: Google `signInWithOAuth` errors were ignored and the UI had no explanatory state when Supabase environment variables were missing.
   Now: errors display inline, and absent configuration is clearly reported. Email signup explains when account confirmation may be required.
3. Before: initial `getSession()` failures could leave the login page loading indefinitely.
   Now: the provider catches session lookup errors and exits the spinner.
4. Before: `backend/supabase_auth.py` required JWT `kid` before checking legacy HS256. Some verified HS256 tokens do not include `kid`.
   Now: explicitly configured HS256 secrets validate legacy tokens first, and asymmetric tokens require a recognized `kid` and signing algorithm. Signature, audience and configured issuer checks remain intact.

## Activation required in the administrator's own accounts

1. **Vercel** > Projects > Premium Signal Bots > Settings > Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: your actual Supabase project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: your public anon/publishable compatible key (NOT a service-role key).
   - `NEXT_PUBLIC_API_BASE` (or `NEXT_PUBLIC_API_URL`): your existing backend API URL, to load `/me` and dashboard data after authentication.
   Configure preview and production environments separately, and redeploy after environment changes.
2. **Supabase** > Authentication > URL Configuration:
   - Site URL: `https://alphaalerts.dev`.
   - Redirect allowlist: `https://alphaalerts.dev/auth/callback`, `http://localhost:3000/auth/callback`.
   - For preview testing, add only the **needed** Vercel preview redirect wildcard; avoid `*` across arbitrary domains.
3. **Google Auth Platform** (Google Cloud) > Clients: create or inspect the Web OAuth Client. Add your actual app origin under Authorized JavaScript origins. For Authorized redirect URIs, **copy the exact Supabase callback URL displayed under Supabase > Authentication > Sign In / Providers > Google**; this is the Supabase `/auth/v1/callback`, NOT the app's `/auth/callback` route.
4. **Supabase** > Authentication > Sign In / Providers > Google: enable Google and configure the OAuth client ID and client secret inside Supabase. Never commit or send either secret to chat. Leave unsupported providers disabled until explicitly configured.
5. **Supabase** > Authentication > Sign In / Providers > Email: confirm email/password is enabled if needed.
6. **Backend**: ensure its `SUPABASE_ISSUER`, `SUPABASE_AUDIENCE`, and JWT signing configuration correspond to the same Supabase project. The backend must verify tokens; no bypass or fallback identity was added.

## Acceptance checks (not yet completed in a real configured environment)

- [ ] Missing Supabase env shows an explicit configuration warning rather than a blank screen.
- [ ] Google OAuth login returns to `/dashboard` with an established session, no URL code leftover.
- [ ] Invalid OAuth code displays an error and returns to `/login`.
- [ ] Email/password works; when enabled, email signup completes or requests verification clearly.
- [ ] `/me` returns the correct authenticated user and entitlements; guest requests remain unauthorized.
- [ ] Sign out prevents reuse of the previous browser session and clears cached dashboard state.
- [ ] Safari / Chrome and mobile redirects tested.
- [ ] Preview/production URLs, cookies, provider settings and backend audience/issuer checked end-to-end.
- [ ] Existing dashboard page preserved unchanged, pending approved dashboard design.

## Security release gates

- No production merge, provider changes, privilege changes, paid services or secret transfers were made.
- The site currently pins Next.js `15.4.10` and has a separate security-update release gate.
- A Vercel build is necessary but does not prove successful real OAuth or the backend's access permissions.
- The user-provided gold/silver/blue-accented Alpha mark remains a design reference; it has not been substituted into the current production header.
