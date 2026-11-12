# Alpha Alerts V2: brand and Solana support
- Owner Lane Flow, subscriber intelligence, and Alpha Command use the existing
  `/alpha-lane-v4-logo.png`, Sora wordmark, and gold ALPHA ALERTS typography.
- Public receiving key: `EmZrEA6awqWqo5pzbwX3ZRpyE9sNT42LZ6LBvU6bM4M5`.
  Base58-decoded length is 32 bytes (syntactically valid Solana public key).
  Supports showing one receiving address for native SOL and Solana-network
  USDC SPL transfers, subject to wallet owner and token-account verification.
- Override with NEXT_PUBLIC_SUPPORT_SOLANA_ADDRESS. The current
  NEXT_PUBLIC_SUPPORT_CRYPTO_ENABLED=true release gate is NOT bypassed.
  No production payment collection was activated. Transfers are irreversible;
  sending USDC on other networks is unsupported.

## Locked preview baseline — 2026-11-12
- User-reported **WORKING** in the protected feature-branch preview:
  https://premium-signal-bots-dt58d8isx-bryces-projects-429ee43a.vercel.app/support
- Vercel READY deployment: `dpl_8NxSNygqMDW3dSCVHsVpTKTAky6U` at commit
  `eac631b32bbb827aedd72541bc79d49c43ed0eea`.
- `NEXT_PUBLIC_SUPPORT_CRYPTO_ENABLED=true` is configured **only for Preview**
  and Git branch `feature/alpha-alerts-levelup-v2-20261112` in project
  `prj_25UVwvTEAJ6kxv8TFRwl5bMnGL3K` (env record `FaMmHwr40aSKyKdF`).
- Preserve the on-page approved receiving key, QR code, SOL/USDC tabs, and copy
  affordance. Browser regression checks cover the wallet, its copy action, and
  changing SOL/USDC without changing the recipient.
- **Do not change production feature flags, Stripe URLs, checkout, Supabase
  schema or entitlements without separate approval.** The live site is not
  included in this verified preview baseline.
- This records UI behavior, not cryptographic proof of wallet custody or a
  successful SOL/USDC on-chain receipt. The user must control the recipient
  before accepting transfers.
- Rollback: the prior known-good preview is Vercel deployment
  `dpl_8NxSNygqMDW3dSCVHsVpTKTAky6U`; revert candidate-only changes in
  the PR without touching the production release branch.
