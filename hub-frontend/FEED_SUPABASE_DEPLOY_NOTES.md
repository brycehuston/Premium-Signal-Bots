# Alpha Alerts — Persistent public feed (Supabase)
This replaces the transient Render feed relay. The source of truth is the private Supabase table `public.alpha_public_feed_state` (RLS on; no anon/authenticated table grants). Credentials live in `public.alpha_public_feed_config`, also protected; never add to the client or commit to git.

An Edge Function `alpha-public-daily-feed` accepts `PUT` of a redacted signed envelope with the upload credential and returns a verified, unmodified envelope on `GET`. The Vercel public route independently checks HMAC signature, age, approval, and 30-minute delay before rendering.

Environment (server-side Vercel):
- ALPHA_PUBLIC_DAILY_FEED_URL=https://ennbnofvmnkcuhftzlhr.supabase.co/functions/v1/alpha-public-daily-feed
- ALPHA_PUBLIC_DAILY_FEED_SECRET=<stored in protected Supabase config; do not commit>
VPS publisher:
- ALPHA_PUBLIC_DAILY_FEED_URL (same URL)
- ALPHA_PUBLIC_DAILY_FEED_SECRET (same signing secret)
- ALPHA_PUBLIC_FEED_UPLOAD_SECRET (independent upload credential)
- ALPHA_PUBLIC_FEED_ENABLED and ALPHA_PUBLIC_FEED_APPROVED_CHAT_ID gating primary public channel only.

Disable previous Render relay. Roll back: unassign Vercel deployment or unset Vercel feed vars; edge remains fail-closed if feed is stale. Database is reconstructible from VPS post-delivery outbox. Never store raw Telegram messages, mints, credentials, Elite events, or account data in the public feed.