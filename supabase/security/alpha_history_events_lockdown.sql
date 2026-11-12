-- Alpha Alerts / P0 history read-boundary hardening
-- REVIEW ONLY. Do not apply until owner approves a production database permission change.
-- Current finding (2026-11-12): authenticated can SELECT all 3,303 approved history events.
-- Server-side service_role access and existing private APIs are unaffected by this grant change.
-- Preserves the table, records, RLS, and publisher. No deletions or data mutation.

BEGIN;

REVOKE SELECT ON TABLE public.alpha_history_events FROM PUBLIC, anon, authenticated;

DO $alpha_history_lockdown$
BEGIN
  IF has_table_privilege('anon', 'public.alpha_history_events', 'SELECT')
     OR has_table_privilege('authenticated', 'public.alpha_history_events', 'SELECT') THEN
    RAISE EXCEPTION 'Alpha history table is still readable by anon/authenticated';
  END IF;
END
$alpha_history_lockdown$;

COMMIT;
