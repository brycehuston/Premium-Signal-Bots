\set ON_ERROR_STOP on
create role authenticated nologin;
create role anon nologin;
create schema auth;
grant usage on schema auth to authenticated;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
 select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
grant execute on function auth.uid() to authenticated;
create table public.alpha_v4_archive(id smallint primary key,dataset jsonb not null);
insert into auth.users values
 ('11111111-1111-1111-1111-111111111111'),
 ('22222222-2222-2222-2222-222222222222');
insert into public.alpha_v4_archive values(1,'{"daily":[{"date_pt":"2025-01-01","all_alerts":12,"first_mints":5,"EARLY":3,"GENESIS":2,"TREND":2,"STRICT":1,"RECLAIM":2,"RUNNER":2},{"date_pt":"2099-01-01","all_alerts":9000,"EARLY":9000}],"first":[{"mint":"SECRET_PRIVATE_TOKEN_ID"}]}'::jsonb);
\i supabase/migrations/20261112_alpha_lane_preview.sql
do $$
begin
 if has_table_privilege('authenticated','public.alpha_lane_flow_previews','SELECT') then
  raise exception 'AUTH CLIENT CAN READ PRIVATE TABLE';
 end if;
 if has_function_privilege('anon','public.alpha_lane_preview_start()','EXECUTE') then
  raise exception 'ANON MAY EXECUTE PREVIEW START';
 end if;
end $$;
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
do $$
declare initial jsonb; started jsonb; repeated jsonb; d jsonb; second jsonb;
begin
 initial:=public.alpha_lane_preview_status();
 if initial->>'state' <> 'eligible' then raise exception 'not initially eligible'; end if;
 d:=public.alpha_lane_preview_data();
 if d->>'state' <> 'eligible' then raise exception 'data before start'; end if;
 started:=public.alpha_lane_preview_start();
 repeated:=public.alpha_lane_preview_start();
 if started->>'state'<>'active' or started->>'expires_at' is distinct from repeated->>'expires_at' then
  raise exception 'duplicate start changed expiry';
 end if;
 d:=public.alpha_lane_preview_data();
 if d->>'state'<>'active' or jsonb_array_length(d->'daily')<>1 then
  raise exception 'unexpected preview result %',d;
 end if;
 if d::text like '%SECRET_PRIVATE_TOKEN_ID%' or d::text like '%9000%' then
  raise exception 'private or recent archive data leaked';
 end if;
 if (d->'daily'->0->>'alerts')::integer<>12 then
  raise exception 'historical aggregate mismatch';
 end if;
 perform set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false);
 second:=public.alpha_lane_preview_status();
 if second->>'state'<>'eligible' then raise exception 'cross-account access'; end if;
end $$;
reset role;
select count(*) as single_user_row from public.alpha_lane_flow_previews;
do $$
begin
 if (select count(*) from public.alpha_lane_flow_previews)<>1 then
  raise exception 'cross-account preview row created';
 end if;
 update public.alpha_lane_flow_previews
 set started_at=expired.ts,expires_at=expired.ts+interval '10 minutes'
 from (select clock_timestamp()-interval '11 minutes' as ts) expired
 where user_id='11111111-1111-1111-1111-111111111111';
end $$;
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
do $$
declare expired jsonb; again jsonb; blocked jsonb;
begin
 expired:=public.alpha_lane_preview_status();
 again:=public.alpha_lane_preview_start();
 blocked:=public.alpha_lane_preview_data();
 if expired->>'state'<>'expired' or again->>'state'<>'expired' or blocked->>'state'<>'expired' then
  raise exception 'expired preview can restart or read private data';
 end if;
end $$;
reset role;
\echo Preview SQL contract: PASS
