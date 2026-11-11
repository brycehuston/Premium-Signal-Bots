#!/usr/bin/env python3
"""Read-only, signed Alpha Alerts aggregate publisher. No trading controls."""
import collections,csv,datetime as dt,hashlib,json,re,sys,urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import Encoding,PublicFormat
ROOT=Path("/home/ubuntu/worktrees/alpha-alerts-live-v196-20261101")
CODE=ROOT/"alpha_trend_alerts.py"; CSV=ROOT/"logs/TREND_token_alerts.csv"
KEY=Path("/home/ubuntu/.alphaalerts/website_feed/ed25519.private")
ENDPOINT="https://ennbnofvmnkcuhftzlhr.supabase.co/functions/v1/alpha-insights?view=ingest"
FINGERPRINT="6dfd39df0db8a64cf15a5e4806a99edbd6d474538f581845aee54d93514631af"
PUBKEY="f1c11839ae78d92f8dcd0b228aff18120423d8ff6199f0a2e247f2d8057027e0"
LANES=("EARLY","GENESIS","RECLAIM","TREND","STRICT","RUNNER")
ALIASES={"EARLY_RADAR":"EARLY","EARLY_ALPHA":"EARLY","GENESIS_SMOOTH_RAMP":"GENESIS","R8_RECLAIM":"RECLAIM","R8_D_RECLAIM":"RECLAIM","ALPHA_RUNNER":"RUNNER"}
UTC=dt.timezone.utc
PT=ZoneInfo("America/Vancouver")
def build():
 if CODE.is_symlink() or hashlib.sha256(CODE.read_bytes()).hexdigest()!=FINGERPRINT:raise ValueError("SOURCE_HASH_CHANGED")
 s=CODE.read_text()
 a=s.index('        if not delivered:\n            token["delivery_status"] = "FAILED"')
 b=s.index('        telegram_metadata = _telegram_delivery_metadata(delivered)',a)
 c=s.index('            _log_alert_csv(token, tier, score, event_alert_num, raise_on_error=True)',b)
 if not a<b<c:raise ValueError("SEND_BOUNDARY_CHANGED")
 if CSV.is_symlink() or not CSV.is_file() or not 0<CSV.stat().st_size<=200_000_000:raise ValueError("BAD_ALERT_CSV")
 now=dt.datetime.now(UTC);rows=0;index={};duplicate=set()
 with CSV.open(newline="",encoding="utf-8-sig") as f:
  reader=csv.DictReader(f)
  if not reader.fieldnames or not {"timestamp_utc","event_id","symbol","mint","alert_lane"}.issubset(reader.fieldnames):raise ValueError("BAD_COLUMNS")
  for row in reader:
   rows+=1
   if rows>250_000:raise ValueError("OVER_ROW_LIMIT")
   eid=(row.get("event_id") or "").strip()
   mint=(row.get("mint") or "").strip()
   symbol=(row.get("symbol") or "").lstrip("$")
   lane=(row.get("alert_lane") or "").strip().upper();lane=ALIASES.get(lane,lane)
   stamp=(row.get("timestamp_utc") or "").strip()
   if not (8<=len(eid)<=180 and 0<len(mint)<=128 and re.fullmatch(r"[A-Za-z0-9._-]{1,28}",symbol) and lane in LANES and re.fullmatch(r"\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ",stamp)):continue
   try:t=dt.datetime.strptime(stamp,"%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=UTC)
   except ValueError:continue
   if t>now or t.year<2020:continue
   if eid in index:duplicate.add(eid)
   else:index[eid]=(mint,lane,t)
 for eid in duplicate:index.pop(eid,None)
 events=sorted(index.values(),key=lambda x:x[2]);mints=set();daily={};hourly={};subdays={};sublanes=collections.Counter()
 cutoff=now-dt.timedelta(hours=24);start=cutoff-dt.timedelta(days=7)
 for mint,lane,t in events:
  local=t.astimezone(PT);day=local.date().isoformat();hour=local.hour
  first=mint not in mints;mints.add(mint)
  if day not in daily:daily[day]={"date_pt":day,"all_alerts":0,"first_mints":0,**{l:0 for l in LANES}}
  d=daily[day];d["all_alerts"]+=1;d["first_mints"]+=int(first);d[lane]+=1
  k=(day,hour)
  if k not in hourly:hourly[k]={"date_pt":day,"dow":local.strftime("%a"),"clock_hour_pt":hour,"pulse_mode":"UNAVAILABLE","all_alerts":0,"first_mints":0,**{l:0 for l in LANES}}
  h=hourly[k];h["all_alerts"]+=1;h["first_mints"]+=int(first);h[lane]+=1
  if start<=t<=cutoff:
   sublanes[lane]+=1
   if day not in subdays:subdays[day]={"date":day,"alerts":0,"first_mints":0}
   subdays[day]["alerts"]+=1;subdays[day]["first_mints"]+=int(first)
 daykeys=sorted(daily)
 owner={"daily":[daily[k] for k in daykeys],"hourly":[hourly[k] for k in sorted(hourly)],
 "first":[],"regimes":[],"transitions":[],
 "summary":{"start":daykeys[0] if daykeys else now.astimezone(PT).date().isoformat(),
 "end":daykeys[-1] if daykeys else now.astimezone(PT).date().isoformat(),
 "messages":len(events),"mint":len(mints),"lane":len(events),"heartbeat":0,"pulse":0}}
 member={"state":"ready","tier":"subscriber","delay_hours":24,
 "as_of_utc":cutoff.isoformat().replace("+00:00","Z"),
 "summary":{"events_7d":sum(sublanes.values()),"first_mints_7d":sum(x["first_mints"] for x in subdays.values()),"active_days":len(subdays)},
 "daily":[subdays[k] for k in sorted(subdays)],
 "lanes":[{"lane":l,"count":sublanes[l]} for l in LANES if sublanes[l]]}
 return {"schema_version":1,"state":"staging_aggregate_only",
 "source_type":"POST_SEND_CSV_RUNTIME_CORRELATION_NOT_PUBLIC_DELIVERY_PROOF","producer_sha256":FINGERPRINT,
 "as_of_utc":now.isoformat().replace("+00:00","Z"),"owner":{"state":"ready","tier":"owner","as_of_utc":now.isoformat().replace("+00:00","Z"),"dataset":owner},
 "subscriber":member,
 "quality":{"source_rows":rows,"accepted_unique_events":len(events),"invalid_rows":rows-len(events)-len(duplicate),
 "duplicate_ids_quarantined":len(duplicate),"has_public_delivery_proof":False,"has_verified_peak_outcomes":False,
 "first_token_lookup_coverage":"not_included_aggregate_only","regime_coverage":"unavailable","hour_coverage":"observed_hours_only"}}

def build_bot_movers(now:dt.datetime):
 """Verified primary-bot Telegram delivery + repeated pair-matched DEX observations.

 Private destination is not represented as a public-channel post.
 Public market data is delayed 31 minutes; raw mint/address/message IDs never leave VPS.
 """
 import math
 import collections
 state_path=ROOT/"state/mev_alert_state.json"
 snaps_path=ROOT/"reports/runtime/TREND_price_snapshots.csv"
 if state_path.is_symlink() or not state_path.is_file() or state_path.stat().st_size>150_000_000:raise ValueError("UNSAFE_STATE")
 if snaps_path.is_symlink() or not snaps_path.is_file() or snaps_path.stat().st_size>100_000_000:raise ValueError("UNSAFE_SNAPSHOTS")
 state=json.loads(state_path.read_text())
 cutoff=now-dt.timedelta(minutes=31)
 first={}
 with CSV.open(newline="",encoding="utf-8-sig") as f:
  for row in csv.DictReader(f):
   mint=(row.get("mint") or "").strip()
   raw=(row.get("timestamp_utc") or "").strip()
   if not mint or not raw.endswith("Z"):continue
   try:stamp=dt.datetime.strptime(raw,"%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=UTC)
   except ValueError:continue
   if stamp>cutoff or stamp<now-dt.timedelta(days=90):continue
   if mint not in first or stamp<first[mint][0]:first[mint]=(stamp,row)
 calls={}
 dests=set()
 for mint,(stamp,row) in first.items():
  details=state.get(mint)
  if not isinstance(details,dict):continue
  try:
   msg=int(details.get("first_public_alert_telegram_message_id") or 0)
   chat=int(details.get("first_public_alert_telegram_chat_id") or 0)
   ts=float(details.get("first_public_alert_ts") or 0)
   base=float(details.get("first_public_alert_mc") or 0)
   alert_mc=float(row.get("mc") or 0)
  except (ValueError,TypeError):continue
  # The message ID/chat are recorded only from Telegram API delivery metadata.
  if msg<=0 or chat==0 or not (math.isfinite(base) and 0<base<1e13) or abs(ts-stamp.timestamp())>3 or abs(base-alert_mc)>max(1,base*.02):continue
  symbol=(row.get("symbol") or "").strip().lstrip("$")
  lane=(row.get("alert_lane") or "").upper().strip();lane=ALIASES.get(lane,lane)
  if not re.fullmatch(r"[A-Za-z0-9._-]{1,28}",symbol) or lane not in LANES:continue
  pair=(row.get("pair_address") or "").strip()
  if not pair:continue
  dests.add(chat)
  calls[mint]=(stamp,symbol,lane,base,pair)
 # Fail closed if several Telegram destinations appear in an allegedly single-channel cohort.
 if len(dests)>1:raise ValueError("TELEGRAM_DESTINATION_CONFLICT")
 observations=collections.defaultdict(list)
 with snaps_path.open(newline="",encoding="utf-8-sig") as f:
  reader=csv.DictReader(f)
  fields={"mint","pair_address","ts_utc","market_cap_usd","source","ok"}
  if not reader.fieldnames or not fields.issubset(reader.fieldnames):raise ValueError("SNAPSHOT_COLUMNS_CHANGED")
  for row in reader:
   mint=(row.get("mint") or "").strip()
   if mint not in calls or (row.get("pair_address") or "").strip()!=calls[mint][4]:continue
   if (row.get("source") or "").lower()!="dexscreener" or (row.get("ok") or "").lower() not in ("true","1","yes"):continue
   raw=(row.get("ts_utc") or "").strip()
   try:
    stamp=dt.datetime.fromisoformat(raw.replace("Z","+00:00"))
    value=float(row.get("market_cap_usd") or 0)
   except (ValueError,TypeError):continue
   if stamp.tzinfo is None or stamp>cutoff or stamp<calls[mint][0] or not(math.isfinite(value) and 0<value<1e13):continue
   observations[mint].append((stamp,value))
 valid=[]
 for mint,seq in observations.items():
  if len(seq)<2:continue
  peak=max(price for _,price in seq)
  near=sorted((stamp,price) for stamp,price in seq if price>=peak*.80)
  if len(near)<2 or (near[-1][0]-near[0][0]).total_seconds()<30:continue
  called,symbol,lane,base,pair=calls[mint]
  if peak<base:continue
  first_mc=round(base,2);peak_mc=round(peak,2)
  valid.append((called,{"id":hashlib.sha256(mint.encode()).hexdigest()[:24],"symbol":symbol,"lane":lane,
   "called_at_utc":called.isoformat().replace("+00:00","Z"),"first_mc":first_mc,"peak_mc":peak_mc,
   "multiple":round(peak_mc/first_mc,4)}))
 valid.sort(key=lambda entry:entry[0],reverse=True)
 # Latest complete 24-hour call cohort; otherwise most recent past 24h cohort.
 for days_back in range(90):
  if days_back==0:
   start=now-dt.timedelta(hours=24);end=cutoff;window="24h";ref=now
  else:
   end=now-dt.timedelta(hours=24*days_back)
   start=end-dt.timedelta(hours=24);window="historical";ref=end
  group=[row for call,row in valid if start<=call<=end]
  group.sort(key=lambda item:(item["multiple"],item["peak_mc"]),reverse=True)
  seen=set();distinct=[]
  for m in group:
   if m["id"] not in seen:distinct.append(m);seen.add(m["id"])
   if len(distinct)==3:break
  if len(distinct)==3:
   return {"state":"verified","window":window,"as_of_utc":now.isoformat().replace("+00:00","Z"),
    "reference_time_utc":ref.isoformat().replace("+00:00","Z"),"movers":distinct,
    "telegram_delivery_confirmed":True,"observed_peaks_corroborated":True,
    "method":"BOT_DELIVERY_AND_REPEATED_DEXSCREENER_PAIR_SNAPSHOTS"}
 raise ValueError("NO_VERIFIABLE_TOP_3_COHORT")

def main():
 body=build();body['public_report']=build_bot_movers(dt.datetime.fromisoformat(body['as_of_utc'].replace('Z','+00:00')));wire=json.dumps(body,separators=(",",":"),ensure_ascii=False)
 if len(wire.encode())>300_000:raise ValueError("PAYLOAD_TOO_LARGE")
 key=Ed25519PrivateKey.from_private_bytes(KEY.read_bytes())
 if key.public_key().public_bytes(Encoding.Raw,PublicFormat.Raw).hex()!=PUBKEY:raise ValueError("UNEXPECTED_KEY")
 envelope=json.dumps({"signed_body":wire,"signature":key.sign(wire.encode()).hex()},separators=(",",":")).encode()
 if "--dry-run" in sys.argv:
  print("DRY_RUN",json.dumps({"events":body["owner"]["dataset"]["summary"]["messages"],"delayed_events":body["subscriber"]["summary"]["events_7d"],"bytes":len(envelope)}));return
 req=urllib.request.Request(ENDPOINT,data=envelope,headers={"Content-Type":"application/json"},method="PUT")
 with urllib.request.urlopen(req,timeout=15) as response:
  result=json.load(response)
  if response.status!=200 or result.get("accepted") is not True:raise ValueError("NOT_ACCEPTED")
 print("PUBLISHED",json.dumps({"as_of_utc":body["as_of_utc"],"events":body["owner"]["dataset"]["summary"]["messages"]}))
if __name__=="__main__":main()
