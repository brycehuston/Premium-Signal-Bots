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
def main():
 body=build();wire=json.dumps(body,separators=(",",":"),ensure_ascii=False)
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
