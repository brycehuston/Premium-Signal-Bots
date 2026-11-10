-- REVIEW ONLY. Do NOT apply to production until owner approves DDL and RLS review.
-- Independent shared subscriber analytics; no private Telegram message content.
-- Database and service key are read exclusively by an authenticated server route.
BEGIN;

CREATE TABLE IF NOT EXISTS public.alpha_history_events (
  event_id text PRIMARY KEY CHECK(length(event_id) BETWEEN 8 AND 180),
  event_at timestamptz NOT NULL,
  symbol varchar(28) NOT NULL,
  mint varchar(128) NOT NULL,
  lane varchar(12) NOT NULL CHECK (lane IN ('EARLY','GENESIS','TREND','STRICT','RECLAIM','RUNNER')),
  alert_mc numeric(20,4) CHECK (alert_mc IS NULL OR alert_mc > 0),
  liquidity_usd numeric(20,4) CHECK (liquidity_usd IS NULL OR liquidity_usd > 0),
  m5_tx integer CHECK (m5_tx IS NULL OR m5_tx >= 0),
  proof_kind text NOT NULL CHECK (proof_kind = 'DIRECT_TELEGRAM_API_RECEIPT'),
  source_sha256 varchar(64) NOT NULL CHECK (source_sha256 ~ '^[a-f0-9]{64}$'),
  outcome_status varchar(24) NOT NULL DEFAULT 'UNAVAILABLE'
    CHECK(outcome_status IN ('UNAVAILABLE','PENDING','EXPIRED_PARTIAL_DATA','OBSERVED_PEAK')),
  observed_max_multiple numeric(20,4)
    CHECK(observed_max_multiple IS NULL OR observed_max_multiple > 0),
  approved_for_history boolean NOT NULL DEFAULT false CHECK(approved_for_history),
  imported_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT history_peak_requires_verified_outcome CHECK (
    observed_max_multiple IS NULL OR outcome_status = 'OBSERVED_PEAK'
  )
);
CREATE INDEX IF NOT EXISTS alpha_history_events_at_idx
  ON public.alpha_history_events (event_at DESC);
CREATE INDEX IF NOT EXISTS alpha_history_events_lane_time_idx
  ON public.alpha_history_events (lane, event_at DESC);
CREATE INDEX IF NOT EXISTS alpha_history_events_mint_time_idx
  ON public.alpha_history_events (mint, event_at DESC);
ALTER TABLE public.alpha_history_events ENABLE ROW LEVEL SECURITY;
-- Explicitly deny unprivileged roles even if the project's default grants change.
REVOKE ALL ON TABLE public.alpha_history_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.alpha_history_events TO service_role;
-- No service_role DELETE grant. No publicly callable SECURITY DEFINER functions.

CREATE TABLE IF NOT EXISTS public.alpha_history_import_runs (
  import_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_sha256 varchar(64) NOT NULL UNIQUE CHECK (dataset_sha256 ~ '^[a-f0-9]{64}$'),
  source_label text NOT NULL,
  scanned_count integer NOT NULL CHECK(scanned_count >= 0),
  validated_count integer NOT NULL CHECK(validated_count >= 0),
  rejected_count integer NOT NULL CHECK(rejected_count >= 0),
  imported_count integer NOT NULL CHECK(imported_count >= 0),
  completed_at timestamptz DEFAULT now()
);
ALTER TABLE public.alpha_history_import_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.alpha_history_import_runs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.alpha_history_import_runs TO service_role;
COMMIT;