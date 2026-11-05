# Alpha Alerts Workflow — Six-Lane Review

Scope: **preview branch only**, source based on GitHub `main`. No changes to the live trading bot or production website.

## Video-matched target
- Stage 1 source core: preserve appearance/physics, remove resize-induced particle jumps, reduce mobile rendering work.
- Stage 2 Python scanner: six visible lane reactors, 3×2 desktop and 2×3 scrollable mobile/tablet layout, color distinctions: EARLY bronze, GENESIS teal, TREND ice, STRICT soft violet, RECLAIM emerald, RUNNER champagne gold.
- Stage 3 forwarding: add upper Genesis / Strict / Reclaim destinations, keep original lower Early / Trend / Runner and original voxel core, cubic flight paths, pacing, and audio.
- Homepage alert panel: replace *fabricated* sample entries with Top Three Today by native score, using delayed approved Telegram-delivered signals only.

## Public top-three feed contract
Server-only config: `ALPHA_PUBLIC_DAILY_FEED_URL` (HTTPS only, outbound public feed that the owner has explicitly approved for publication).
The server reads a maximum 128 KiB from that URL and checks:
- `version:1`, `source:"confirmed-telegram-delivery"`, `updated_at_utc` no older than 20 minutes.
- `daily_alerts` array with `approved_for_public:true`, `delivery_status:"DELIVERED"`, positive integer `telegram_message_id`, `event_id`, `symbol`, `lane`, `score` on a native 0–10 scale, `timestamp_utc` with Z UTC.
- Optional `alert_mc`, `liquidity_usd`, `m5_tx`. Route drops every other field. No chat ID, message body, token mint, invite link, usernames or wallet keys are published.
- Server excludes events younger than **30 minutes**, outside the current UTC day, and outside six recognized lanes; dedupes by event ID, sorts by score then recency, returns at most three.
- When no approved feed is configured, return `state:"unavailable"` with no fabricated signals. `state:"empty"` if feed is valid but has no eligible alerts. Scores do **not** equal profits or success probabilities.

### Example *schema only* (not production data; do NOT publish as live feed)
```json
{
  "version": 1,
  "source": "confirmed-telegram-delivery",
  "updated_at_utc": "2026-11-04T00:00:00Z",
  "daily_alerts": []
}
```

**Important:** This branch adds the protected read-only display interface, not the producer/publisher. Telegram confirmation and approved-data curation must remain separate from paid channels, and the site must never scrape raw Telegram channels from the browser. Source candidate delivery/outcome processor exists in the prior verified-reel package, but it has not been connected to production.

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
