# SaaS Landing Audit Report

Project: hub-frontend (Next.js App Router)
Date: 2026-01-27
Scope: UI/UX, SEO, performance, conversion, accessibility

This report covers Phases 1-5 (inventory and audits) with prioritized fixes.
No code changes were made during Phases 1-5.

## Route Inventory (Phase 1)

Public marketing and flows:
- `/` — Main landing page
- `/pricing` — Plans, bundle, billing toggle, onboarding steps, ALPHA-X promo
- `/pay/[slug]` — Payment instructions and transaction submission
- `/waitlist` — Alpha-X waitlist capture form
- `/phase-1` — Static HTML fullscreen animation (Part 1)
- `/phase-2` — Static HTML fullscreen animation (Part 2)
- `/phase-3` — Static HTML fullscreen animation (Part 3)

Auth/app routes:
- `/login` — Clerk sign-in
- `/register` — Clerk sign-up
- `/dashboard` — Authenticated dashboard
- `/billing` — Billing actions

Technical routes:
- `/sitemap.xml` — Generated sitemap
- `/robots.txt` — Generated robots

Global layout:
- Sticky `Header`, footer, `BottomTickerBar`, background effects, Sonner toaster, Clerk provider

## SEO Audit (Phase 2)

### P0
- Canonical URLs missing on all pages.
  - Suggested fix: Add per-page canonical links (and `og:url`).

- Sitemap includes routes that generally should not be indexed (`/dashboard`, `/billing`, `/login`, `/register`).
  - Suggested fix: Remove auth/app routes from `app/sitemap.ts` and add relevant public pages.

### P1
- Home page lacks page-specific metadata beyond global defaults.
  - Suggested fix: Add per-page metadata for `/` with keyword-focused title/description and OG/Twitter.

- Page-level OpenGraph/Twitter cards are minimal and not page-specific.
  - Suggested fix: Add per-page OG/Twitter tags via metadata or `head.tsx`.

- No structured data (JSON-LD) detected.
  - Suggested fix: Add Organization and WebSite JSON-LD globally; consider Product and FAQPage later.

- Missing manifest/app icons beyond `favicon.ico`.
  - Suggested fix: Add `app/manifest.ts` and basic icon entries.

### P2
- Payment pages (`/pay/[slug]`) are indexable; this may or may not be desired.
  - Suggested fix: Decide whether to allow indexing; if not, add `robots: noindex` for pay routes.

## Performance + Technical Audit (Phase 3)

### P1
- Global bottom ticker performs external fetches and intervals on every route.
  - Suggested fix: Gate network activity to marketing routes only, or pause on app/auth routes.

- Static phase pages inject large HTML with multiple canvas animations and external fonts.
  - Suggested fix: Keep as-is for now, but consider `noindex` and a reduced-motion mode later.

- Large global CSS with many animation rules.
  - Suggested fix: Keep for now; consider segmenting animations to marketing routes later.

### P2
- Dependencies appear unused in the current codebase (`recharts`, `qrcode.react`).
  - Suggested fix: Confirm usage and remove if truly unused (bundle size win).

## Conversion + Trust Audit (Phase 4)

### P1
- Social proof is missing (logos, testimonials, user counts, case studies).
  - Suggested fix: Add a premium trust band near the hero or between hero and pricing CTA.

- Trust/legal signals are light (no visible privacy/terms/support links).
  - Suggested fix: Add Privacy, Terms, and Contact/Support routes and link them in the footer.

- Funnel analytics events not found.
  - Suggested fix: Track key events (view pricing, click CTA, start pay flow, submit TX, join waitlist).

### P2
- Manual USDC payment introduces friction without stronger reassurance.
  - Suggested fix: Add a compact “how we verify payments” trust block near pricing/pay CTAs.

## Accessibility + Mobile Audit (Phase 5)

### P0
- `/waitlist` inputs use placeholders only and lack explicit labels.
  - Suggested fix: Add proper `<label>` elements.

### P1
- Tiny tap targets in hero view toggles.
  - Suggested fix: Increase clickable area without changing visuals.

- Pricing subtitle uses `whitespace-nowrap`, which risks overflow on smaller screens.
  - Suggested fix: Allow wrapping while preserving styling.

### P2
- Several areas use very small (10–11px) muted text.
  - Suggested fix: Increment key body text to 12–13px where possible.

## SaaS Completeness Checklist

### Present
- Clear hero + value prop
- Pricing with plan comparison + bundle
- Checkout flow (`/pay/[slug]`)
- Waitlist flow
- Auth pages (login/register)
- Authenticated dashboard
- Robots + sitemap routes

### Missing / Recommended
- Privacy Policy
- Terms of Service
- Contact / Support page
- Security / Trust page
- FAQ section/page
- Social proof (logos/testimonials/stats band)
- Custom 404/not-found page
- Analytics funnel tracking

