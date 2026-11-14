# Alpha Lane Flow preview — staging gate

Migration: supabase/migrations/20261112_alpha_lane_preview.sql
Rollback: supabase/security/rollback/20261112_alpha_lane_preview.sql

The migration has NOT been applied to production. No customer entitlements
or live Edge functions have changed. Database RPCs derive identity from
Supabase Auth, never from caller-selected tiers or expiry. Activation inserts
one row per user atomically. Refresh, retries, second device and subsequent
sessions cannot reset the recorded expiry. Every read enforces it server side.
Only whitelisted 24h+ delayed aggregate daily counts are returned. Preview
API returns 503 until the migration is installed in an approved environment.
Requires migration + real-account validation before release.
