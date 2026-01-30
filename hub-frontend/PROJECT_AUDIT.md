# PROJECT AUDIT - AlphaAlerts Pro (2026-01-30)

Scope: `hub-frontend` (Next.js App Router). Focused on premium feel, performance, SEO readiness, and safe analytics integration.

---

## Phase 1 - Inventory (No Changes)

### 1) Routes / Pages (App Router)
- `/` (marketing homepage)
- `/pricing`
- `/pay/[slug]`
- `/waitlist`
- `/contact`
- `/safety`
- `/privacy`
- `/terms`
- `/login` (Clerk)
- `/register` (Clerk)
- `/dashboard` (authenticated)
- `/billing` (authenticated)
- `/stage-1`, `/stage-2`, `/stage-3` (workflow visualizations)
- `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`
- `/_not-found`

API routes in `app/api`: none

### 2) Key Marketing Components
- Header / navigation: `components/Header.tsx`
- Home hero + workflow + FAQ + roadmap: `components/HomePage.tsx`
- Charts: `components/HeroChart.tsx`, `components/BtcMiniChart.tsx`
- Pricing UI + bundle confetti: `app/pricing/page.tsx`
- FAQ: `components/HomePage.tsx` (FAQ section)
- Workflow pages: `app/stage-1|2|3/page.tsx` + `app/_components/StaticHtmlPage.tsx`
- Waitlist form: `app/waitlist/page.tsx`
- Auth: `app/login/page.tsx`, `app/register/page.tsx` (Clerk)
- Dashboard: `app/dashboard/page.tsx`

### 3) Third-Party Services / APIs
- Clerk Auth (`@clerk/nextjs`)
- CoinGecko price API (ticker)
- Alternative.me Fear/Greed index
- Binance WebSocket + REST (BTC chart)
- Telegram + X (outbound links)
- Framer Motion (animations)
- Sonner (toasts)

### 4) Environment Variables
Used in code:
- `NEXT_PUBLIC_BRAND` (brand text)
- `NEXT_PUBLIC_SITE_URL` (canonical URLs, metadata, sitemap/robots)
- `NEXT_PUBLIC_API_BASE` / `NEXT_PUBLIC_API_URL` (API base; now both accepted)
- `NEXT_PUBLIC_TELEGRAM_URL` (social links)
- `NEXT_PUBLIC_X_URL` (social links)
- `NEXT_PUBLIC_SOLANA_ADDRESS` (pay page)
- Clerk: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
- Analytics (new): `NEXT_PUBLIC_GA_ID`

Present but unused:
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (unused in app)

---

## Phase 2 - Automated Checks (Run Them)

### Typecheck
- `npx tsc --noEmit` ? PASS

### Lint
- `npx next lint` ?? Not configured. Command prompts for setup:
  - "How would you like to configure ESLint?" (Strict/Base/Cancel)
  - Fix: run `npx next lint` and choose a config (recommended: Strict), then re-run.

### Build
- `npm run build` ? PASS (provided by user)
  - Next.js 15.4.10
  - Build output routes and sizes are clean; first-load JS ~99.9 kB shared.

### Tests
- No test scripts found in `package.json`.

### Bundle Analyze
- No bundle analyzer configured.
  - Recommendation: add `@next/bundle-analyzer` and a script (optional).

### Lighthouse-Style Checks (Best Effort)
- Full Lighthouse run not possible here (no browser). Best-effort audit performed via code inspection:
  - Performance risks: heavy client homepage, multiple motion effects, live charts, ticker fetches.
  - Accessibility: mostly good; added missing H1 on Contact.
  - SEO: metadata mostly good; added FAQ schema for homepage and cleaned sitemap.

---

## Phase 3 - UX + Responsive Audit (All Devices)

### Issues Found + Fixes
1) **Workflow pages overlapped by bottom ticker on small screens**
   - Where: `/stage-1`, `/stage-2`, `/stage-3` on mobile.
   - Fix: Hide ticker on stage pages to keep full viewport for the diagram.
   - File: `components/BottomTickerBar.tsx`

2) **Contact page missing an H1**
   - Where: `/contact`
   - Fix: Added a screen-reader-only `<h1>`.
   - File: `app/contact/page.tsx`

3) **Reduced motion still allowed auto-hero swap**
   - Where: Homepage hero auto-switch
   - Fix: Disable auto-switch when `prefers-reduced-motion` is enabled.
   - File: `components/HomePage.tsx`

4) **Encoding artifacts in safety ranges**
   - Where: `/safety` numeric ranges (e.g., “30–50k”) showed mojibake in some encodings
   - Fix: Normalized to ASCII ranges and escaped `>=` string.
   - File: `app/safety/page.tsx`

5) **Emoji/arrow mojibake in plan labels**
   - Where: pricing plan emojis and bundle arrow text
   - Fix: Corrected UTF-8 symbols so UI renders properly.
   - File: `lib/plans.ts`

### Screenshot Descriptions (text-only)
- Mobile Stage pages: bottom ticker visually sits on top of the diagram footer; fixed by hiding the ticker for `/stage-*` routes.
- Safety page cards: numeric ranges showed broken characters (mojibake) in text labels; replaced with clean ASCII ranges.

---

## Phase 4 - Performance Audit + Fixes

### Findings
- Homepage is a large client component with several intervals and animations.
- Live ticker and charts add background work (fetch + WebSocket).

### Fixes Applied
- Reduced-motion global override to stop heavy animations when requested.
- Disabled hero auto-switch for reduced motion.
- Disabled ticker fetch/render on `/stage-*` routes.

Files:
- `app/globals.css`
- `components/HomePage.tsx`
- `components/BottomTickerBar.tsx`

---

## Phase 5 - SEO + Content Completeness

### Findings
- Metadata exists for most pages.
- Homepage FAQ lacked JSON-LD.
- Noindex workflow pages were still in sitemap.

### Fixes Applied
- Added homepage FAQ schema JSON-LD (FAQPage).
- Removed `/stage-*` routes from sitemap.
- Added missing H1 in contact page.

Files:
- `components/HomeFaqStructuredData.tsx`
- `app/page.tsx`
- `app/sitemap.ts`
- `app/contact/page.tsx`

---

## Phase 6 - Tracking + Analytics (No Guessing)

### Findings
- No analytics installed.

### Fixes Applied
- Added GA4-compatible loader (optional via `NEXT_PUBLIC_GA_ID`).
- Added safe event tracking utility.
- Instrumented required events:
  - `signup_click` (register page load)
  - `pricing_view` (pricing page load)
  - `plan_select` (pricing CTA click)
  - `checkout_start` (pay page load)
  - `waitlist_submit` (successful waitlist submission)
  - `telegram_access_click` (contact + ticker)
  - `dashboard_view` (dashboard load)

Files:
- `components/AnalyticsProvider.tsx`
- `components/AnalyticsEvent.tsx`
- `components/TrackedButton.tsx`
- `lib/analytics.ts`
- `app/layout.tsx`
- `app/pricing/page.tsx`
- `app/pay/[slug]/page.tsx`
- `app/register/page.tsx`
- `app/waitlist/page.tsx`
- `components/BottomTickerBar.tsx`
- `app/contact/page.tsx`
- `app/dashboard/page.tsx`

---

## Phase 7 - Security + Reliability

### Findings
- No Next.js API routes (rate limiting not applicable here).
- Public env vars are used appropriately; secret keys are not referenced in client code.
- Forms have minimal client validation only.

### Fixes Applied
- Added global error boundary for cleaner 500 behavior.
- Unified API base fallback and added safe error messages when missing.

Files:
- `app/error.tsx`
- `lib/api.ts`
- `app/billing/page.tsx`
- `app/waitlist/page.tsx`
- `app/dashboard/page.tsx`

---

## Phase 8 - Final Report + TODOs

### Remaining Recommendations
- Configure ESLint (`npx next lint`) and commit the config.
- Add tests (at least smoke tests for pricing/pay/waitlist flows).
- Consider excluding `/pay/*` from indexing or adding `noindex` depending on business intent.
- Consider adding a bundle analyzer for periodic performance checks.
- If analytics will be used, ensure consent/opt-out based on jurisdiction.

---

## Files Changed Summary
- Added analytics infrastructure and events.
- Added FAQ schema and sitemap cleanup.
- Added reduced-motion global handling and fixed hero auto switch.
- Added error boundary and API base fallback.
- Cleaned mojibake in safety/pricing text.
- Added `.env.example`.

---

## Verification Commands
From `hub-frontend`:
- `npx tsc --noEmit`
- `npx next lint` (choose Strict)
- `npm run build`

EOF
