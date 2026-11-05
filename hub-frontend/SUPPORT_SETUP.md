# FRUXLABS — shared support route

This review branch adds `hub-frontend/app/support` and a footer link to `/support`, plus sitemap/SEO.

## What works without payment configuration
- Branded responsive support page using the Alpha dark/gold identity.
- Three one-time suggested support amounts: USD 3 / 5 / 10.
- Crypto accordion and deliberate unavailable states.
- No account or signup is required to open the page.
- No money is collected unless a real provider is deliberately configured.

## Environment variables (set separately per Vercel environment)
- `NEXT_PUBLIC_SUPPORT_STRIPE_3_URL` — verified one-time USD $3 Stripe Payment Link
- `NEXT_PUBLIC_SUPPORT_STRIPE_5_URL` — verified one-time USD $5 Stripe Payment Link
- `NEXT_PUBLIC_SUPPORT_STRIPE_10_URL` — verified one-time USD $10 Stripe Payment Link
- `NEXT_PUBLIC_SUPPORT_STRIPE_CUSTOM_URL` — optional "customer chooses amount" Stripe Payment Link
- `NEXT_PUBLIC_SUPPORT_SOLANA_ADDRESS` — verified, dedicated, self-custodied SOL/USDC receiving wallet on Solana

Use HTTPS links on `buy.stripe.com`. Wrong or missing links are not clickable. Address validation checks Base58 syntax and 32 decoded bytes, but **cannot verify wallet ownership**. Never paste private keys, secrets, or seed phrases into any environment variable. Never reuse the paid-alert checkout address without checking ownership and separation first.

**No payment provider or wallet has been configured by this branch.**

## Integration into desktop apps
Point their existing optional SUPPORT buttons to `https://alphaalerts.dev/support` only **after** this route is deployed to the verified production domain. Open using the operating system's default browser; keep all app functionality available if the link is unavailable.

## Release gates
1. Staging build and browser QA, including mobile/reduced-motion.
2. Verify all payment-link prices and provider merchant identity, including custom amount and no subscriptions.
3. Verify self-controlled Solana receiving address and test only with explicitly approved funds.
4. Review laws, accounting, and tax handling for voluntary tips; they are not charitable donations.
5. Obtain approval before promoting to production.
