# ALPHA ALERTS — CROSS-PAGE PRODUCT + VISUAL ALIGNMENT AUDIT
**Review:** 2026-11-12; read-only against production website source `8e0f3f2f0247a66d0d2d755213318ba787fbc795`.
**New approved target:** `hub-frontend/docs/ALPHA_APPROVED_MEMBER_EXPERIENCE_20261112.md`.
**Source of truth:** Live Vercel production commit / existing Supabase Edge security v4 / approved Home Top 3 and Lane Flow visuals; Alpha Apps design spec (`ALPHA_MASTER_DESIGN_SYSTEM.md`, `alpha-design-tokens.json`, provided in project).
**Risk posture:** No production site edit, no membership/entitlement change, no checkout activation.

## Scope and evidence

- Source-inspected Home, Pricing, Login, Dashboard access router, Subscriber, Owner, Account, Apps, Support, shared Header, root layout, CSS and plan definitions.
- Browser automation built from current production source on isolated design branch. 30 route/viewport observations across `/`, `/pricing`, `/login`, `/dashboard`, `/apps`, `/support` at **320, 390, 768, 1024, 1440 CSS pixels**. Original run `43287020311`, refined run `43287442780`.
- Both completed runs: **30/30 HTTP 200**, **0 document-level horizontal scrolling**, and refined audit **0 controls outside the viewport after excluding the intentionally horizontally scrollable Apps gallery**.
- **Final settled-state audit run [43287716521](https://github.com/brycehuston/Premium-Signal-Bots/actions/runs/43287716521) PASS:** 30/30 HTTP 200, zero document horizontal scroll, zero unintended outside-viewport controls, equal Home Top 3 card widths at every tested breakpoint (87/110/105/144/165px at 320/390/768/1024/1440 respectively). Gallery uses intentional horizontal scrolling. Login and signed-out dashboard screenshots now capture resolved states instead of spinners, and home hero is fully rendered. Screenshots plus geometry JSON are in GitHub Actions artifact `alpha-design-audit-evidence` (artifact 13974574419), expiring 2026-11-19 UTC. Representative desktop/mobile contact sheets reviewed visually. Initial screenshots containing transient loading frames were discarded as QA timing noise.
- Desktop 1440 pricing grid: three equal columns, `~331px` per card; row heights `~630–631px`. Existing CSS grid already aligns **outer** card boxes; *inner* header, icon, price and action structures differ.
- At 390px first pricing card begins around Y=649 and each card varies about 545–650px tall; at 320px first card begins around Y=701. This is a first-screen economy issue, not evidence of horizontal overflow.
- Desktop marketing header inner starts X=144 (wrapper), pricing cards X=196: an additional 52px total inset including wrapper padding. Header brand text begins ~X=176, so price cards are 20px farther inward; this is from nested `max-w-6xl` padding in the root and pricing page.

## Findings by priority

### P0-UX-01 — Authenticated users have no unified account dashboard (CONFIRMED SOURCE)
`hub-frontend/app/login/page.tsx:20-28` redirects to `/dashboard`; `hub-frontend/app/dashboard/page.tsx:6-26` renders the private Owner/Subscriber dashboards only when server entitlement returns the corresponding role. Everyone else gets a membership-required state instead of a real account console.
**Target:** everyone with a valid Supabase Auth session opens **Alpha Command** with truthful account, membership and preview state. Private intelligence remains separately permissioned. Backend outage must be STATUS UNAVAILABLE, not FREE.

### P0-UX-02 — Approved 10-minute preview does not exist (TARGET GAP, NOT REGRESSION)
No durable per-account preview expiry is implemented. Current security-protected Edge owner/subscriber endpoint cannot be reused by simply hiding private data in the UI.
**Target:** server-authorized, user-triggered, single-use 10-minute window; delayed aggregate-only data; resume-safe expiry and no refresh / sign-out resets; expiration retains dashboard access. Separate approval required for any production schema/entitlement mutations.

### P1-VIS-03 — Six pricing cards do not use one visual component hierarchy (CONFIRMED SOURCE + SCREENSHOT)
`hub-frontend/app/pricing/page.tsx:50-111` UpcomingLaneCard uses 40px outlined SVG, badge, subtitle/summary, then `PRICING TBA` and padded fixed-height flex layout (`min-h-[440px]`). Existing lane cards at `:459-603` use circular **emoji**, immediate price, seven-item bullet list and request-access CTA in a separate component.
Desktop cards have equal outer boxes (measured 331px wide, 630px tall) but different inner title/price/action baselines. Genesis title wraps differently from Early and Trend in the inspected desktop screenshot. **Visually confirmed:** the Early diagonal “COMING SOON” ribbon cuts through and partially obscures the benefit text; this is a real legibility/overlap defect at desktop and mobile. Replace it with a compact unobstructed availability chip while keeping the Early plan disabled.
**Target:** *one* normalized lane card shell for all six: identical icon size / title band / descriptor / price band / benefit stack / status + action footer, with lane-specific semantic accents and the six approved emojis. Preserve disabled checkout for unavailable lanes.

### P1-VIS-04 — Pricing first screen delays actual products (MEASURED)
At 1440×900 the six-card grid begins around Y=627; at 390×900 begins Y=649; at 320×900 begins Y=701. The page has a 104px desktop heading, two near-duplicate explanatory paragraphs, billing switch, separate section heading and large inter-section spacing (`hub-frontend/app/pricing/page.tsx:399-464`).
**Target:** collapse redundant copy; reduce excess vertical whitespace; keep the premium visual feel but move the first lane cards significantly higher. The site footer/ticker should not visually obscure primary pricing content.

### P1-VIS-05 — Layout tokens and navigation shells drift across pages (CONFIRMED SOURCE)
- Website root/header `max-w-6xl`, variable `16/24/32px` gutters (`app/layout.tsx:60-68`, `components/Header.tsx:28`).
- Pricing nests another `max-w-6xl px-4 sm:px-5` inside root (`app/pricing/page.tsx:399`), causing double inset.
- Approved Lane Flow intentionally uses full-width `1320px` max, neutral charcoal and its own header (`app/dashboard/intelligence.css:85-155`). This broad width is **approved**, not a defect. But it hides global Header/Footer via `body:has(.ai-shell)` selectors (`:64-69`), creating divergent navigation compared with public, subscriber and account views.
- Global website radius tokens `--radius-card:20px`, `--radius-control:14px` (`app/globals.css:47-49`), versus Lane Flow card radius `12px` and Alpha desktop apps 10–13px. Different component roles are legitimate; unlabelled differences in the *same role* are not.
**Target:** shared web tokens + shared header/account navigation with documented **public 1152px** and **intelligence 1320px** layout variants. Do not shrink the approved Lane Flow or reintroduce its removed icon rail.

### P1-PRODUCT-06 — Legacy account language misrepresents access and Alpha-X (CONFIRMED SOURCE)
`hub-frontend/app/dashboard/account/page.tsx:416-472` shows numeric `Signal Tier`; `:544` says “Unlock Tier 5”, which is unsupported by the current three-plan backend scheme; `:599-625` says Alpha-X “In Build” despite approved “Developed · Private access closed”. Raw console logs occupy a large standard member area.
**Target:** plan name + verified enabled lanes + accurate membership state; remove generic numbered tier copy, restrict diagnostics to relevant authorized controls, give Alpha-X a tasteful noninteractive private status.

### P1-PRODUCT-07 — Prices and availability don't match the newly approved target (CONFIRMED TARGET GAP)
`hub-frontend/lib/plans.ts` currently defines Early $69/$599 (⚡), Trend $59/$499 (📈), Runner $49/$399 (🏃) and the original 3-lane bundle $149/$1299; `app/pricing/page.tsx:90-91` reports `PRICING TBA` for Genesis, Strict, Reclaim.
**Target (approved, NOT YET LIVE):** Genesis 💠 $59/$499, Strict 🛡️ $49/$399, Reclaim 🔄 $69/$599, future all-six Alpha Complete $199/$1699, with existing prices untouched and honest unavailable status. Never enable payment/checkout from display-only price data.

### P1-PRODUCT-08 — Alpha-X product hierarchy is diluted (CONFIRMED SOURCE)
`app/pricing/page.tsx:700-900` introduces Alpha Pulse/Apex/Nexus before Alpha-X and repeats Alpha-X as a centered bottom banner. `dashboard/account/page.tsx:597-628` shows a generic bot card. Approved flagship direction: lead with one premium wide Alpha-X presentation; quieter supporting systems. **Keep no live-trading/profit claims, no customer controls or imaginary telemetry.**

### P1-VIS-09 — Microcopy readability and visual rhythm (CONFIRMED SOURCE; SUBJECTIVE IMPACT)
Home Top 3 uses some `8–10px` labels at mobile widths (`components/HomePage.tsx:809-840`); Lane Flow small annotations run `9–11px` (`app/dashboard/intelligence.css:26-40`). The Alpha design system permits 8–11px for nonessential tracked *chrome* but ordinary explanatory copy should remain readable on mobile.
**Target:** treat 8–9px as secondary microcaps only; use 11–14px for meaningful card descriptions, 13–15px for body, validate contrast/legibility without changing approved compact Top 3 dimensions.

### P1-UX-10 — Sign-in and state messaging need consolidation (SOURCE VERIFIED)
Login's Google/email form is functional in source and redirects automatically; there is no visible forgot-password recovery CTA in `app/login/page.tsx`. Separate auth, membership and dashboard systems can display different terminology for the same user.
**Target:** shared signed-in navigation, one obvious path to dashboard/account and onboarding, password recovery, same status vocabulary everywhere; no invented renewal or connection indicators.

### P2-MAINT-11 — Styling and marketing copy duplication (CONFIRMED SOURCE)
`app/dashboard/intelligence.css` has an early rail-based layout and later approved overrides to remove it; `app/globals.css` contains 1,833 lines, `app/apps/apps.module.css` 878, and Pricing 907 JSX lines. Heavy duplicated radii, spacing and colors increase regression risk.
**Target:** extract shared role-based tokens and six-lane pricing configuration **after** design acceptance. Avoid a wholesale CSS rewrite; preserve exact approved visuals.

## Protected good state — must not redesign

- Homepage Top 3: three equal compact neutral-charcoal cards, centered content, #1 gold/#2 cyan/#3 violet, subtle underglow and separate stats strip.
- Full-width Lane Flow: max 1320px, dark neutral panels, no left icon rail, concise Owner/Account/Sign Out header, retained chart/filter/history data.
- Website's Manrope body / Sora display are established site-specific typography; desktop Alpha Apps Segoe/Bahnschrift system is **reference DNA**, not an automatic webfont replacement.
- Public/lane semantic color is intentional, not a reason to add broad glowing background gradients.
- Alpha-X, Pulse, Apex, Nexus status must be truthful and security/checkout boundaries retained.
- Payment remains manual/access-request only; no new checkout or active paid entitlement is implied.

## Design alignment specification (PROPOSED IMPLEMENTATION TARGET)

| Role | Target |
|---|---|
| Public page max content | 1152px (keep) |
| Full-width intelligence max content | 1320px (keep) |
| Gutter inside each surface | one consistent responsive 16 / 24 / 32px sequence, *not nested repeated* |
| Website webfonts | Manrope body + Sora display; preserve |
| Canvas / surfaces | Near-black `#09090b`; charcoal `#101115` / `#16171b` |
| Accent / borders | Gold `#e7bc67`; neutral 1px hairline; lane accent only at icon/small boundary |
| Card / panel radii | Define semantic roles: ordinary card approx 11–12px; large hero approx 16px; controls 8–10px; chips/pills per role. Exceptions require visual justification |
| Pricing cards | identical 40px icon box, consistent title/price/benefit/action vertical anchor; 1/2/3 columns responsive |
| Spacing rhythm | consistent 4/8/12/16/24/32px multiples, intentional section-size variants |
| Form controls | >=40–44px touch target, visible keyboard focus and error/empty/success states |
| Motion | restrained, predictable, reduced-motion aware |
| Member dashboard | first-screen plan/status, preview/entitlement, lane access and clear primary action; operator logs secondary |

## Acceptance plan (QA required after implementation)

**P0:** new free/owner/subscriber/inactive/unavailable/preview-eligible/preview-active/preview-expired scenarios tested with authoritative server entitlements; no data leakage; 10 min expiry survives tab/device/logout; paid 24h delay intact; owner history auto-sync intact.

**P1 visual:** screenshots at 320/390/768/1024/1440 and owner/subscriber/free; no overlapping controls or horizontal body scroll; stable navbar, title and content gutter; 6 lane icon/title/price/CTA anchors aligned; Alpha-X hierarchy visibly premium without fake functionality.

**Regression:** Home Top 3 and owner Lane Flow pixel geometry compared with known-good; live publisher stays fresh; existing customer prices + restrictions preserved; reduced motion, focus-visible and contrast checked.

**Evidence limitations:** Screenshot review confirmed Home/Pricing/Login/free (signed-out) Dashboard/Apps/Support first-screen composition at desktop/mobile under synthetic local source; it does not prove real owner/subscriber production screens. Product/entitlement changes have not been implemented. Screenshot audits can only certify visually observed states, not live paid flows.
