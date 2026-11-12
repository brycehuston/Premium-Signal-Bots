-- STAGING CANDIDATE ONLY. PRODUCTION DDL REQUIRES SEPARATE APPROVAL.
begin;
create table if not exists public.alpha_lane_flow_previews(
 user_id uuid primary key references auth.users(id) on delete cascade,
 started_at timestamptz not null,
 expires_at timestamptz not null,
 constraint preview_fixed_ten_minutes check(expires_at=started_at+interval '10 minutes')
);
alter table public.alpha_lane_flow_previews enable row level security;
revoke all on public.alpha_lane_flow_previews from public,anon,authenticated;
-- RLS deliberately has no direct client policies. These functions are the only API.
create or replace function public.alpha_lane_preview_status()
returns jsonb language plpgsql security definer set search_path=''
as $$
declare uid uuid:=auth.uid(); p public.alpha_lane_flow_previews%rowtype;
begin
 if uid is null then raise exception 'unauthenticated' using errcode='28000'; end if;
 select * into p from public.alpha_lane_flow_previews where user_id=uid;
 if not found then return jsonb_build_object('state','eligible'); end if;
 return jsonb_build_object('state',case when clock_timestamp()<p.expires_at then 'active' else 'expired' end,'expires_at',p.expires_at,'started_at',p.started_at);
end $$;
create or replace function public.alpha_lane_preview_start()
returns jsonb language plpgsql security definer set search_path=''
as $$
declare uid uuid:=auth.uid(); p public.alpha_lane_flow_previews%rowtype; ts timestamptz:=clock_timestamp();
begin
 if uid is null then raise exception 'unauthenticated' using errcode='28000'; end if;
 insert into public.alpha_lane_flow_previews(user_id,started_at,expires_at) values(uid,ts,ts+interval '10 minutes')
 on conflict(user_id) do nothing;
 select * into strict p from public.alpha_lane_flow_previews where user_id=uid;
 return jsonb_build_object('state',case when clock_timestamp()<p.expires_at then 'active' else 'expired' end,'expires_at',p.expires_at,'started_at',p.started_at);
end $$;
-- Server checks active expiry on every read. Only daily totals, at least
-- two whole UTC dates old, are permitted. No token or private event fields.
create or replace function public.alpha_lane_preview_data()
returns jsonb language plpgsql security definer set search_path=''
as $$
declare uid uuid:=auth.uid(); expiry timestamptz; records jsonb;
begin
 if uid is null then raise exception 'unauthenticated' using errcode='28000'; end if;
 select expires_at into expiry from public.alpha_lane_flow_previews where user_id=uid;
 if expiry is null then return jsonb_build_object('state','eligible'); end if;
 if clock_timestamp()>=expiry then return jsonb_build_object('state','expired'); end if;
 select coalesce(jsonb_agg(jsonb_build_object(
  'date',r.item->>'date_pt',
  'alerts',coalesce((r.item->>'all_alerts')::integer,0),
  'first_mints',coalesce((r.item->>'first_mints')::integer,0),
  'early',coalesce((r.item->>'EARLY')::integer,0),
  'genesis',coalesce((r.item->>'GENESIS')::integer,0),
  'trend',coalesce((r.item->>'TREND')::integer,0),
  'strict',coalesce((r.item->>'STRICT')::integer,0),
  'reclaim',coalesce((r.item->>'RECLAIM')::integer,0),
  'runner',coalesce((r.item->>'RUNNER')::integer,0)
 ) order by r.item->>'date_pt'),'[]'::jsonb) into records
 from (
   select item from public.alpha_v4_archive a,
    lateral jsonb_array_elements(coalesce(a.dataset->'daily','[]'::jsonb)) item
   where a.id=1 and (item->>'date_pt') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    and (item->>'date_pt')::date <= (clock_timestamp() at time zone 'UTC')::date - 2
   order by item->>'date_pt' desc limit 14
 ) r;
 return jsonb_build_object('state','active','delay_hours_min',24,'daily',records,'expires_at',expiry);
end $$;
revoke all on function public.alpha_lane_preview_status() from public,anon;
revoke all on function public.alpha_lane_preview_start() from public,anon;
revoke all on function public.alpha_lane_preview_data() from public,anon;
grant execute on function public.alpha_lane_preview_status() to authenticated;
grant execute on function public.alpha_lane_preview_start() to authenticated;
grant execute on function public.alpha_lane_preview_data() to authenticated;
commit;