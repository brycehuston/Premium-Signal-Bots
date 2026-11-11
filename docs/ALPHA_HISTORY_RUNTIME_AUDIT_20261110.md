# Alpha Alerts — authorized production read-only delivery-lineage audit
**Observed:** 2026-11-11 00:03 UTC (2026-11-10 Vancouver time)  
**Source:** connected SentinelX `alpha-prod`, sudo **read-only** Python/CSV inspection.  
**Status:** DIRECTLY VERIFIED source ordering and aggregate counts. No event rows, credentials, token IDs, Telegram IDs or message contents exported.

## Current source and process
- Active scanner source: `/home/ubuntu/worktrees/alpha-alerts-live-v196-20261101/alpha_trend_alerts.py`
- Source SHA-256: `6dfd39df0db8a64cf15a5e4806a99edbd6d474538f581845aee54d93514631af`.
- File modified: `2026-11-09 21:42:30 UTC`; live scanner process started `2026-11-09 21:42:32 UTC`.
- The running source flushes `TREND_token_alerts.csv` **before Telegram**. Failed sends return before the post-send sinks. `TREND_alert_features.csv` is written in the sink loop **after successful API send**, at source line 12784; the sole feature-writer call site was verified.
- The Telegram transport accepts HTTP 200 with JSON `ok=true`, preserves returned `message_id` and `chat_id`, and treats 5xx/timeouts as ambiguous.
- Thus a clean feature join after this *current runtime start* is credible post-send telemetry, but **does not by itself prove public-channel distribution**.

## Evidence counts (actively changing logs)
| Source / check | Result |
| --- | ---: |
| Canonical pre-send rows | 3,375 |
| Feature post-send rows | 3,307 |
| Canonical/feature exact event ID + mint + lane + UTC timestamp matches | 3,303 |
| Duplicate feature event IDs | 1 (2 feature rows; disqualified) |
| 24h matching records at audit time | 308 |
| 7d matching records | 2,779 |
| 30d matching records | 3,303 |
| Outcomes rows | 4,794 |
| Outcome records carrying `delivery_status=DELIVERED` | 1,883 |
| Strict matched events after *current* scanner process start | **334** |
| Those 334 with unique matching outcome marked `DELIVERED` | **334** |
| Outcome statuses among those 334 | **327 PENDING / 7 EXPIRED_PARTIAL_DATA / 0 DONE** |

The 334 cohort is the most defensible observed **bot-delivered** subset from this exact active process; it is **not** certified as **public-channel-delivered**, nor as profitable executed trades. Their lane breakdown is EARLY 116; GENESIS 32; RECLAIM 55; RUNNER 100; STRICT 1; TREND 30. The full 3,303 cohort requires historical process/source-version evidence for the older timestamps.

## Telegram destination lineage caveat
- Production state contains first/last Telegram message IDs and chat IDs, but is not an event-keyed append-only receipt journal.
- 1,783 feature rows were observed within 2 seconds of a state `first_public_alert_ts`, with matching state message identity present. Their stored chat IDs were **positive 9-digit IDs**, and those matched entries had **no public-channel permalink**. 2 chat IDs occur in retained state, overwhelmingly one.
- The producer's code checks identity against the configured destination, but *does not establish that a positive-ID recipient is a Telegram public channel*. This provenance **cannot be elevated to public delivery confirmation** based on naming or state alone.
- No Telegram message identity, channel ID, mint or unredacted token data was transmitted off-host in the audit.

## Immutable snapshot hashes (stable during each hash pass)
- Source: `6dfd39df0db8a64cf15a5e4806a99edbd6d474538f581845aee54d93514631af`
- `logs/TREND_token_alerts.csv`: `84da206087aab5130aa5e05fa2a153fd927c9dbf90f0c15b7fbe39164da10fd0`
- `logs/TREND_alert_features.csv`: `2b7ad79d75aa20bb43acc00c63f4cd4bbf89e63559da305c26a437fce07e15e6`
- `reports/runtime/TREND_outcomes.csv`: `ff45bf59575bd75e22dd968ae3aa18c4674d0a9b4660c0905567beb0bf2fc9d6`
- `state/mev_alert_state.json`: `06a6bbbe6033fa7ff23062f26ce9f41d1758a567a26273500831d8a732870f5b`

## Independent public feed issue
- `alpha-alerts-public-feed.service` is **failed**.
- The publisher pinned source SHA: `0c2bf122e3acea2471f02dde6faf420875b6f0301f84ce785fe94ff013db704a`.
- Actual live source SHA is `6dfd39...631af`; the publisher deliberately fails with `sender source changed`.
- **Do not bypass the hash guard or restart service** without a reviewed new source fingerprint and explicit production-change authorization.

## Correct shipping strategy
1. **Internal historical analytics can be staged from the 334 bot-delivered observations** under a distinct and explicitly named provenance class, without public-delivery or P&L claims. Do **not** relabel them `DIRECT_TELEGRAM_API_RECEIPT` or `public approved`.
2. For a **public-facing alert history**, first establish destination/channel provenance from the actual forwarding or publishing system. A privately addressed Telegram message is not evidence of public publication.
3. In either case, keep price-path outcomes separate until snapshots, source health and time-to-peak are independently reconciled. For this 334 cohort, no `DONE` observation exists.
4. The preview server history UI/API and RLS migration remain staged; `public.alpha_history_events` does **not** exist in production as of this audit. Applying SQL, provisioning service keys, importing raw/sanitized events or exposing them to subscribers requires a separate explicit production/data-sharing release approval.
5. Recheck source fingerprints, event counts and RLS gates immediately before a future approved backfill; logs are live and can change.

**No production edits, data export, Telegram operations, DB writes, permission changes or service restarts occurred during this audit.**
