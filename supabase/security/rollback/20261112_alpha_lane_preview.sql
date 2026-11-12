-- DESTRUCTIVE ROLLBACK, requires explicit authorization. Deletes preview history.
begin;
revoke execute on function public.alpha_lane_preview_data() from authenticated;
revoke execute on function public.alpha_lane_preview_start() from authenticated;
revoke execute on function public.alpha_lane_preview_status() from authenticated;
drop function if exists public.alpha_lane_preview_data();
drop function if exists public.alpha_lane_preview_start();
drop function if exists public.alpha_lane_preview_status();
drop table if exists public.alpha_lane_flow_previews;
commit;