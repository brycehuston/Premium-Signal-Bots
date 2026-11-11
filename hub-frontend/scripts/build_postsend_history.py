#!/usr/bin/env python3
"""Stage runtime-correlated Alpha Alerts observations; no DB/network operations.

These are successful bot-send telemetry, NOT proof of public channel delivery.
The output is quarantine-only, not a publication/import authorization.
"""
from __future__ import annotations
import argparse
import collections
import csv
import datetime as dt
import hashlib
import json
import os
import re
from pathlib import Path

MAX_BYTES = 250_000_000
MAX_ROWS = 200_000
LANE_ALIAS = {"ALPHA_RUNNER":"RUNNER","R8_RECLAIM":"RECLAIM","R8_D_RECLAIM":"RECLAIM", "EARLY_ALPHA":"EARLY","EARLY_RADAR":"EARLY","GENESIS_SMOOTH_RAMP":"GENESIS"}
LANES = frozenset({"EARLY","GENESIS","TREND","STRICT","RECLAIM","RUNNER"})
NEEDED = {"event_id", "mint", "alert_lane", "timestamp_utc"}


def parse_utc(value: str) -> dt.datetime:
    if not isinstance(value,str) or not value.endswith("Z"):
        raise ValueError("Noncanonical UTC time")
    v = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    if v.tzinfo is None or v.utcoffset() != dt.timedelta():
        raise ValueError("Timezone mismatch")
    return v


def checked_csv(file: Path, fields: set[str]) -> list[dict[str,str]]:
    if file.is_symlink() or not file.is_file():
        raise ValueError("Unsafe or missing input: "+file.name)
    size=file.stat().st_size
    if size<=0 or size>MAX_BYTES:
        raise ValueError("File size out of bound: "+file.name)
    with file.open(encoding="utf-8-sig",newline="") as f:
        reader=csv.DictReader(f)
        if not reader.fieldnames or not fields.issubset(reader.fieldnames):
            raise ValueError("CSV schema missing fields: "+file.name)
        records=[]
        for r in reader:
            records.append(r)
            if len(records)>MAX_ROWS:
                raise ValueError("CSV too many rows: "+file.name)
        return records


def uniq(rows: list[dict[str,str]],field: str):
    d=collections.defaultdict(list)
    for r in rows:
        if r.get(field): d[r[field]].append(r)
    return {k:v[0] for k,v in d.items() if len(v)==1}, {k for k,v in d.items() if len(v)>1}


def lane(raw: str) -> str:
    s=(raw or "").strip().upper()
    return LANE_ALIAS.get(s,s)


def positive_float(value):
    try:
        if value is None or value=="":return None
        v=float(value)
        if not 0<v<1e13:return None
        return round(v,4)
    except (TypeError,ValueError):return None


def build(canonical,features,outcomes, *, since_utc: str, source_sha256: str, read_at: dt.datetime | None=None):
    """Strict 1:1 join; excludes every record lacking recorded post-send/outcome corroboration."""
    since=parse_utc(since_utc)
    now=read_at or dt.datetime.now(dt.timezone.utc)
    if since>now or since.year<2026 or not re.fullmatch(r"[a-f0-9]{64}",source_sha256):
        raise ValueError("Unreviewed runtime start or producer fingerprint")
    c,cd=uniq(canonical,"event_id")
    f,fd=uniq(features,"event_id")
    o,od=uniq(outcomes,"alert_id")
    counts=collections.Counter({"canonical":len(canonical),"features":len(features),"outcomes":len(outcomes),"duplicate_canonical_ids":len(cd),"duplicate_feature_ids":len(fd),"duplicate_outcome_ids":len(od)})
    records=[]
    for eid,feat in f.items():
        raw=c.get(eid);out=o.get(eid)
        if raw is None or out is None:
            counts["missing_source_or_outcome"]+=1;continue
        if eid in cd or eid in fd or eid in od:
            counts["ambiguous_identity"]+=1;continue
        if (raw.get("mint")!=feat.get("mint") or raw.get("timestamp_utc")!=feat.get("timestamp_utc") or
            lane(raw.get("alert_lane"))!=lane(feat.get("alert_lane")) or out.get("mint")!=feat.get("mint")):
            counts["identity_mismatch"]+=1;continue
        try:
            stamp=parse_utc(feat["timestamp_utc"])
        except (KeyError,ValueError):
            counts["timestamp_invalid"]+=1;continue
        if stamp<since or stamp>now:
            counts["outside_attested_runtime"]+=1;continue
        if out.get("delivery_status")!="DELIVERED":
            counts["outcome_delivery_not_confirmed"]+=1;continue
        label=lane(feat.get("alert_lane"))
        symbol=(feat.get("symbol") or "").strip()
        mint=(feat.get("mint") or "").strip()
        if (label not in LANES or not re.fullmatch(r"[A-Za-z0-9._-]{1,28}",symbol)
                or not re.fullmatch(r"[A-Za-z0-9:_-]{8,180}",eid) or not mint or len(mint)>128):
            counts["invalid_export_identity"]+=1;continue
        mc=positive_float(feat.get("mc"))
        liq=positive_float(feat.get("liq"))
        m5=feat.get("m5_tx") or ""
        m5num=int(m5) if m5.isdigit() and int(m5)<=2147483647 else None
        proof=hashlib.sha256(json.dumps({"canonical":raw,"features":feat,"outcomes":out},sort_keys=True,separators=(",",":")).encode()).hexdigest()
        records.append({
            "event_id":eid,"event_at":feat["timestamp_utc"],"symbol":symbol,"mint":mint,"lane":label,
            "alert_mc":mc,"liquidity_usd":liq,"m5_tx":m5num,
            "outcome_status":"UNAVAILABLE","observed_max_multiple":None,
            "proof_kind":"POST_SEND_RUNTIME_CORRELATION","source_sha256":proof,
            "producer_sha256":source_sha256,
            "approved_for_history":False,
            "public_delivery_verified":False
        })
    records.sort(key=lambda r:(r["event_at"],r["event_id"]))
    counts["runtime_correlated_events"]=len(records)
    counts["public_channel_verified_events"]=0
    return records,dict(sorted(counts.items()))


def main():
    p=argparse.ArgumentParser(description=__doc__)
    for key in ("canonical","features","outcomes","producer"):
        p.add_argument("--"+key,required=True)
    p.add_argument("--expected-producer-sha256",required=True)
    p.add_argument("--runtime-start-utc",required=True)
    p.add_argument("--output",help="Quarantined staging only, never authorized for import")
    a=p.parse_args()
    prod=Path(a.producer)
    if not prod.is_file() or prod.is_symlink():raise ValueError("Invalid producer")
    observed=hashlib.sha256(prod.read_bytes()).hexdigest()
    if observed!=a.expected_producer_sha256:raise ValueError("Producer fingerprint mismatch")
    can=checked_csv(Path(a.canonical),NEEDED)
    feats=checked_csv(Path(a.features),NEEDED | {"symbol","mc","liq","m5_tx"})
    outs=checked_csv(Path(a.outcomes),{"alert_id","mint","delivery_status"})
    records,counts=build(can,feats,outs,since_utc=a.runtime_start_utc,source_sha256=observed)
    print(json.dumps({"state":"QUARANTINE_ONLY","counts":counts,"publication_authorized":False,"producer_sha256":observed},sort_keys=True,indent=2))
    if a.output:
        if not records:raise SystemExit("Fail closed: no reconciled cohort")
        dest=Path(a.output)
        if dest.is_symlink() or dest.exists():raise ValueError("Refuse overwrite")
        fd=os.open(str(dest),os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
        with os.fdopen(fd,"w",encoding="utf-8") as f:
            json.dump({"schema_version":2,"state":"QUARANTINE_ONLY","records":records,"counts":counts},f,sort_keys=True)
            f.write("\n")

if __name__=="__main__":main()