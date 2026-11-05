# Alpha Alerts pricing and manual checkout — release gate

Status: **draft only**, Nov 5 2026. Do not merge or enable collecting funds without the owner's explicit production approval.

## Evidence-driven findings

1. The existing `app/pay/[slug]/page.tsx` rendered a hard-coded fallback Solana address when `NEXT_PUBLIC_SOLANA_ADDRESS` was absent. An unchecked fallback is not a verified owner-controlled receiver. It must not be shown as an instruction to transfer money.
2. `lib/plans.ts` prices and titles the Early, Trend and Runner offers and a three-lane bundle. `app/pricing/page.tsx` labels Early `COMING SOON`, but the old server payment route accepted both direct Early and Bundle URLs. The bundle claims Early access and therefore cannot be treated as available while Early is unverified.
3. Stage 2/3 workflow includes six **illustrative lanes**, not evidence that Genesis, Strict and Reclaim subscriptions are for sale.

## Applied in this draft PR

- `lib/checkoutSafety.ts`: server-side fail-closed checkout gate, Base58 32-byte validation, no hard-coded wallet, opt-in via `ALPHA_MANUAL_CHECKOUT_ENABLED=true`.
- Require an operator-verified **server-only** `ALPHA_MANUAL_CHECKOUT_RECEIVER`; no `NEXT_PUBLIC_` receiver.
- Early and Bundle direct payment URLs show **Checkout unavailable** and cannot present transfer instructions or submit payment claims.
- Pricing page visibly disables Bundle, makes Early natively disabled, and labels Genesis/Strict/Reclaim as **unpriced preview lanes** with no checkout links. All existing numeric prices are retained as references; no invented products or discounts.
- All checkout pages marked `robots: noindex, nofollow`; unavailable pages do not have subscription CTA metadata.
- Removed orphaned bundle confetti code while retaining established payment card layout and site styling.

## Verification

Source checks and pure JS test cases of the exact extracted Base58 validator:
- Two known syntactically valid Solana public keys: accepted
- A previously hard-coded example receiver address: accepted *syntactically* (NOT an ownership verification)
- All-zero address, invalid alphabet, too-short, too-long, empty input: rejected
- Total 10/10 validator cases passed in Code Mode sandbox.

Server activation remains **disabled by default**; user must verify the receiver is theirs in a test wallet and confirm a transfer before setting any flag. Presence of an address and its Base58 validity **do not prove ownership**.

## Production acceptance (not completed)

- [ ] Independent identity/ownership confirmation of the recipient, including a harmless transaction on Solana.
- [ ] Confirm which channels exist, invite delivery, renewal policy, refunds and support handling.
- [ ] Confirm entitlement matrix and whether Early should be sold; decide how the historical Bundle should be reconciled.
- [ ] Native real checkout browser E2E and verified receipt/fulfilment.
- [ ] Security scan, dependency update, cross-branch conflict resolution with concurrent PRs.
- [ ] Explicit owner approval for any production payment changes; no real funds or wallets touched in this draft.

## Operator config (server-side only)

```text
ALPHA_MANUAL_CHECKOUT_ENABLED=true
ALPHA_MANUAL_CHECKOUT_RECEIVER=<verified receiving address>
```

Do not set these from this review. Set them only inside protected Vercel server environment configuration after verified ownership, test flow, and approval. Never put a private key in the repository or any environment variable.
