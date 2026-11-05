# Alpha Alerts Workflow — Six-Lane Review

Scope: **preview branch only**, source based on GitHub `main`. No changes to the live trading bot or production website.

## Video-matched target
- Stage 1 source core: preserve appearance/physics, remove resize-induced particle jumps, reduce mobile rendering work.
- Stage 2 Python scanner: six visible lane reactors, 3×2 desktop and 2×3 scrollable mobile/tablet layout, color distinctions: EARLY bronze, GENESIS teal, TREND ice, STRICT soft violet, RECLAIM emerald, RUNNER champagne gold.
- Stage 3 forwarding: add upper Genesis / Strict / Reclaim destinations, keep original lower Early / Trend / Runner and original voxel core, cubic flight paths, pacing, and audio.
- Homepage alert panel: replace *fabricated* sample entries with Top Three Today by native score, using delayed approved Telegram-delivered signals only.

## Public Top Three Today — signed feed contract

The website endpoint `/api/public/daily-top` is read-only and **fail-closed** until both server-only variables are set:
- `ALPHA_PUBLIC_DAILY_FEED_URL`: HTTPS URL of a redacted static JSON feed managed by the operator. Not a private Telegram API URL.
- `ALPHA_PUBLIC_DAILY_FEED_SECRET`: a high-entropy shared secret (at least 32 characters), stored ONLY as a server-side environment secret and on the offline publisher. NEVER `NEXT_PUBLIC_`.

An offline, independent publisher is provided at `scripts/build_public_daily_feed.py`, with tests at `scripts/test_public_daily_feed.py`. It consumes **curated, owner-approved, confirmed Telegram-delivery receipts**, not pre-send scanner candidates. Its raw input records must include:
`event_id`, `symbol`, `lane`, `timestamp_utc`, `score` on 0–10, `approved_for_public:true`, `delivery_status:"DELIVERED"`, positive `telegram_message_id`, and optionally `alert_mc`, `liquidity_usd`, `m5_tx`.

The builder excludes all stale, suppressed, unsuccessful, unapproved, invalid or younger-than-30-minute alerts; deduplicates event IDs; sorts by native score; **drops the Telegram message ID, chat ID, mint, raw text and all non-allowlisted fields**. It signs the exact JSON text in `signed_body` with HMAC-SHA256 and emits `{"signed_body":"...","signature":"64 hex characters"}`. The public URL may return this redacted signed envelope; the browser never receives that envelope.

The Next.js route verifies the HMAC before trusting the body, applies an additional UTC-day/30-minute/20-minute-freshness check, sorts top three and returns only the minimal public data. Empty/stale/unconnected feeds do **not** produce fictional example alerts. Score is not a profit probability.

### Local validation (no capital, no network)
```bash
cd hub-frontend/scripts
python3 -m unittest -v test_public_daily_feed.py
```

### Production publication remains gated
The bot-side hook creating a post-confirmation curated outbox is **not installed** here. The output must be hosted/published and the corresponding server-side variables configured only after verifying the actual Telegram channel boundary and explicit authorization to reveal delayed public excerpts. Never place private tokens, raw messages, or secrets inside a public static file. No real feed, transaction, or publisher was activated by this PR.

## Verification / release gates
- [x] Stage 1/2/3 inline JavaScript syntax parses.
- [x] Six Stage 2 cards, distinct colors, six reactor instances, overlay and offsets mapped by registry.
- [x] Six Stage 3 routes and destinations, top and bottom, with clamped horizontal positions.
- [x] No old fictional samples or auto hero chart↔reel swap remain.
- [ ] Native Next.js production build / Vercel preview deployed and opened for actual browser QA.
- [ ] Browser tests at 1440×900, 768×1024, 390×844, 360×640, including rotation, reduced-motion, scroll/touch and stage transitions.
- [ ] Real source feed observed and reconciled with delivered Telegram + matured outcome records.
- [ ] Mobile performance trace under representative devices.
- [ ] Production release authorization.

**This is a visual workflow illustration**, not a claim that all six live production lanes are enabled.
