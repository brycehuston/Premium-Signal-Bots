# ALPHA ALERTS — APPROVED PRODUCT / UX TARGET

**Decision status: APPROVED (user, 2026-11-12). Implementation status: NOT IMPLEMENTED.**
**Authoritative live website baseline:** Vercel production `8e0f3f2f0247a66d0d2d755213318ba787fbc795`.
**Edge security baseline:** production Supabase `alpha-insights` v4. No access controls are to be removed or weakened.
**Mode of this branch:** documentation / read-only audit. No pricing publication, entitlement change, checkout activation, or site release.

## 1. Every signed-in user receives Alpha Command

- After a successful first or subsequent sign-in, `/dashboard` is a usable **account home** for ALL authenticated users, regardless of subscription.
- Account home identifies verified status: FREE (no active paid plan), ACTIVE (entitled), TRIAL ELIGIBLE, TRIAL ACTIVE, TRIAL EXPIRED, OWNER, or STATUS UNAVAILABLE, as applicable. Do not conflate an external membership outage with FREE, inactive, or unverified payment.
- Show verified plan, enabled lane access, Telegram association (if stored), access state, login email, renewal/payment data **only when genuinely present**, support, upgrade/manage access and sign-out.
- Owner receives an explicit link to the existing detailed, automatically synced, protected Lane Flow. Paid subscriber dashboard retains the 24h delayed member intelligence.
- Preserve legitimate existing `/dashboard/account` bot-management/service functionality; consolidate navigation rather than deleting live controls.
- Remove misleading generic “Tier 5”/numbered marketing claims and needless default raw-log clutter from the new normal member home. Operator diagnostics remain accessible only where authorized.
- Authentication/access checks are server authoritative; never use editable user metadata or client-controlled cookies as entitlement proof.

## 2. One-time Lane Flow introduction

- One **user-activated** 10-minute trial per authenticated account on first eligibility; clicking “Start preview” starts a server-persisted fixed expiry timestamp, not a resetting per-tab timer.
- No arbitrary “until sign-out” free access: re-login, refresh, tab duplication and other devices do not reset expiry.
- Preview renders a real, read-only **24h+ delayed aggregate-only** interactive subset of Lane Flow. No owner-only full dataset, live/private Telegram streams, token-level rows, private V4 archive or customer trading access is exposed.
- For upgraded/entitled subscribers the paid historical dashboard remains available; the intro cannot override or downgrade subscribed access.
- Expiration leads to informative paywall section, but dashboard/account remains usable. No surprise sign-out. Show clear time remaining and limitations.
- Preview implementation needs durable server-side entitlement storage and tests. This approval does not authorize modifying production tables in the audit phase.

## 3. Six lane catalogue: approved displayed emoji and planned prices

| Lane | Emoji | Monthly | Annual | Pricing source / status |
|---|---|---:|---:|---|
| EARLY | ⚡ | $69 | $599 | Already published; current availability restrictions remain |
| GENESIS | 💠 | $59 | $499 | Newly approved planned price, not yet for sale |
| TREND | 📈 | $59 | $499 | Already published |
| STRICT | 🛡️ | $49 | $399 | Newly approved planned price, not yet for sale |
| RECLAIM | 🔄 | $69 | $599 | Newly approved planned price, not yet for sale |
| RUNNER | 🏃 | $49 | $399 | Already published |

- These six emoji are **approved** and match the previously presented set.
- Preserve existing early/trend/runner subscription amounts and current customer entitlements. Do not silently change existing plan IDs.
- Newly priced lanes must be explicitly labelled **PLANNED** / **NOT YET AVAILABLE**, no active checkout or payment instructions until fulfillment and entitlements are confirmed.
- Current three-lane bundle: **$149/month or $1299/year**; eligibility / “on hold” status stays until deliverability proven.
- Future **ALPHA COMPLETE**, all six lanes: planned **$199/month or $1699/year**; *not available to purchase*, do not replace or mutate the 3-lane legacy bundle.
- Prices are product positioning decisions, not evidence of a performance or profitability guarantee; do not imply paid service launch until operationally verified.

## 4. Flagship bot + product hierarchy

- Alpha-X is **developed**, but **not commercially available**. Show: “Developed · Private access closed” or equivalent; do not claim live production execution, publicly purchasable bot, investor returns, or release date. Waitlist is appropriate.
- Lead bot showcase with a premium Alpha-X hero. Supporting systems: Alpha Pulse, Alpha Apex, Alpha Nexus (status according to individually verified availability). No fake screenshots, metrics, or trading wins.
- Six lane cards share the same component geometry / information order; only approved lane-specific semantic accents/icons differ.
- Two distinct categories: **Alpha Lanes** = alert products; **Alpha Systems** = research/automation engines. Do not confuse the two commercially.

## 5. Locked design direction

- Premium near-black / neutral charcoal, restrained champagne/gold primary accent, cool white body, hairline borders, quiet reactive highlights; no exaggerated neon or constant motion.
- Existing approved home Top 3 (equal compact cards, centered content, gold/cyan/violet rank, separate stats strip) and approved Lane Flow dark full-width chart data/structure **remain locked**.
- Preserve desktop Alpha Apps brand DNA (gold `#e7bc67`, subdued surfaces, cap microcopy, optical spacing). Current approved website webfont stack (Manrope + Sora) remains a known site-specific choice unless visual testing supports a justified change.
- Unified brand alignment and spacing rhythm across Home, Pricing, Sign-in, Account, Intelligence, Apps, Support, and mobile. No independent dashboard shell with conflicting navigation, card radii or spacing rules.
- Semantic color only for state (ready blue/green) and lane/rank identities; don't over-color neutral panels.
- Accessibility: keyboard focus, contrast, reduced motion, readable text, no clipping/overlap, viewport widths 320/390/768/1024/1440 and landscape.

## 6. Implementation / acceptance sequencing

1. **Read-only design/UX + integrity audit** compared with production and the approved Alpha design system. Record exact file/line, severity, objective evidence and desired result; no speculative redesign or production mutation.
2. Create shared web design token & layout spec, then build account home / preview entitlement service / six aligned cards / Alpha-X showcase in isolated branch. Any new production table, payment or live entitlement change requires separate explicit approval.
3. Run synthetic scenarios: anonymous, new free, preview eligible/active/expired, subscriber active/inactive/unavailable, owner; across desktop/tablet/mobile. Ensure bearer/gateway/RLS boundaries are not weakened, and the existing publisher remains live.
4. Visual regression evidence at matched viewports; screenshots + geometry assertions; compare known-good home and Lane Flow before considering any deployment.

**APPROVED ≠ IMPLEMENTED ≠ VERIFIED ≠ RELEASED.**
