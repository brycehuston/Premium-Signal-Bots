# Alpha Alerts — verified Top 3 window selection (2026-11-07)

## Selection contract
1. Accept only signature-verified `confirmed-telegram-delivery` receipts, with `delivery_status=DELIVERED` and `approved_for_public=true`.
2. Enforce **at least 30 minutes** delay from Telegram delivery; no unapproved/Elite events, mints, chats, private message IDs, candidate logs, fabricated prices or backtest outcomes.
3. In the *last 24 hours* (rolling UTC), rank native score 0–10 descending and break ties by later delivery time, display at most 3.
4. If **no** eligible 24h receipts exist, rank eligible delivered receipts up to 7 days old, same method. Label the card `VERIFIED · 7 DAYS`; never call historical receipts today's alerts.
5. If the signed source is missing, older than 20 minutes, invalid, or has no eligible delivered receipts, **fail closed** with no cards. Never substitute old private archives or synthetic winners.
6. Ed25519 verification is duplicated on the Supabase Edge endpoint and public Next.js API. Private signing key stays on the VPS. No account-level database data exposed.
7. Approved publish job must refresh the signed seven-day snapshot around every two minutes; a missing publisher is still a **blocker** to showing genuine tokens.

## Presentation / availability
- Hero order: alert reel first, BTC chart second; retain manual selection.
- Six lane accents, in exact Stage 2 reading order: Early #A3CE64; Genesis #A78BFA; Trend #CDD7E2; Strict #D97777; Reclaim #4BB8D1; Runner #D8B879.
- Stage 2 uses 3×2 desktop layout, two-column mobile with internal scroll; Stage 3 shows corresponding six routing labels and colors.
- Pricing retains pre-existing Trend ($59/$499), Runner ($49/$399), Early ($69/$599, coming soon) and Bundle ($149/$1299) *displayed* figures. Genesis/Strict/Reclaim are unpriced lane descriptions, **not** new checkouts.
- Alpha Apex: research/paper description only. Alpha Nexus: Coming Soon with no checkout or promised features.
- Historical V4 archive remains privately imported/saved in the signed-in user's own browser, never a public feed source.

## Release evidence
- 15 offline publisher/bridge tests and 17 source contract assertions passed.
- Supabase `alpha-public-daily-feed` Edge function V3 deployed with seven-day row window. No alert data was published.
- Next.js pinned to 15.5.29; all route builds/HTTP checks need to pass at the exact release commit.
- Browser-native visual QA at desktop/mobile widths cannot be claimed from CSS inspection or a green build alone.
- Production VPS sender and private Telegram forwarder remain unchanged pending public source approval. The forwarder routes to the Elite supergroup; do **not** use that destination for public-feed publishing.
