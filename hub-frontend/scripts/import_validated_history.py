#!/usr/bin/env python3
"""Owner-gated, idempotent importer for reviewed Alpha Alerts history JSON.

DRY-RUN is the default and makes NO network calls. Apply only after owner review
of the runtime receipt evidence, destination schema, entitlements and release.
Credentials are environment variables and are never printed.
"""
import argparse
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

MAX_FILE_BYTES=80_000_000
MAX_IMPORT_ROWS=100_000
BATCH=200
REQUIRED={"event_id","event_at","symbol","mint","lane","proof_kind","source_sha256","approved_for_history","outcome_status"}
LANES={"EARLY","GENESIS","TREND","STRICT","RECLAIM","RUNNER"}


def validate_doc(path):
    path=Path(path)
    if path.is_symlink() or not path.is_file() or not 0<path.stat().st_size<=MAX_FILE_BYTES:
        raise ValueError("missing, unsafe, or oversized reviewed staging artifact")
    raw=path.read_bytes()
    try:
        doc=json.loads(raw)
    except (ValueError,UnicodeDecodeError) as e:
        raise ValueError("invalid staging JSON") from e
    if not isinstance(doc,dict) or doc.get("schema_version")!=1 or not isinstance(doc.get("records"),list):
        raise ValueError("unexpected history schema version")
    records=doc["records"]
    if not records or len(records)>MAX_IMPORT_ROWS:
        raise ValueError("empty or oversized history payload")
    seen=set()
    for row in records:
        if not isinstance(row,dict) or not REQUIRED.issubset(row):
            raise ValueError("missing event identity/provenance")
        eid=row["event_id"]
        if not isinstance(eid,str) or not re.fullmatch(r"[a-zA-Z0-9:_-]{8,180}",eid) or eid in seen:
            raise ValueError("duplicate or unsafe event identifier")
        seen.add(eid)
        if row.get("proof_kind")!="DIRECT_TELEGRAM_API_RECEIPT" or row.get("approved_for_history") is not True:
            raise ValueError("unapproved or non-direct delivery proof")
        if row.get("lane") not in LANES or not isinstance(row.get("symbol"),str) or not re.fullmatch(r"[A-Za-z0-9._-]{1,28}",row["symbol"]):
            raise ValueError("unapproved lane or symbol")
        if not isinstance(row.get("mint"),str) or not 1<=len(row["mint"])<=128:
            raise ValueError("invalid mint")
        if not isinstance(row.get("source_sha256"),str) or not re.fullmatch(r"[a-f0-9]{64}",row["source_sha256"]):
            raise ValueError("missing source lineage checksum")
        timestamp=row.get("event_at")
        if not isinstance(timestamp,str) or not timestamp.endswith("Z"):
            raise ValueError("event timestamp must be UTC Z")
        try:
            dt=datetime.fromisoformat(timestamp.replace("Z","+00:00"))
        except ValueError as e:
            raise ValueError("invalid UTC timestamp") from e
        if dt.year<2020 or dt>datetime.now(timezone.utc):
            raise ValueError("future or impossible history timestamp")
        if row.get("outcome_status") not in {"UNAVAILABLE","PENDING","EXPIRED_PARTIAL_DATA","OBSERVED_PEAK"}:
            raise ValueError("invalid outcome status")
        if row.get("observed_max_multiple") is not None and row["outcome_status"]!="OBSERVED_PEAK":
            raise ValueError("peak without final observational outcome")
    return records,hashlib.sha256(raw).hexdigest()


def endpoint(url,ref):
    # Require exact approved Supabase host; never permit arbitrary user-supplied URL.
    expected=f"https://{ref}.supabase.co"
    if url!=expected or not re.fullmatch(r"[a-z0-9]{20}",ref):
        raise ValueError("destination must exactly match the approved project ref")
    return expected+"/rest/v1/alpha_history_events?on_conflict=event_id"


def upsert(rows,url,key):
    for start in range(0,len(rows),BATCH):
        body=json.dumps(rows[start:start+BATCH],separators=(",",":")).encode()
        request=urllib.request.Request(url,method="POST",data=body,headers={
            "apikey":key,"Authorization":"Bearer "+key,
            "Content-Type":"application/json",
            "Prefer":"resolution=merge-duplicates,return=minimal",
        })
        try:
            with urllib.request.urlopen(request,timeout=20) as response:
                if response.status not in (200,201,204):
                    raise RuntimeError("unexpected import HTTP status")
        except (urllib.error.HTTPError,urllib.error.URLError) as e:
            raise RuntimeError("history import failed; no credentials or row contents were logged") from e
        print(json.dumps({"processed_rows":min(start+BATCH,len(rows)),"of":len(rows)}))


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--input",required=True)
    p.add_argument("--apply",action="store_true",help="Mutates destination database. Requires explicit prior owner approval.")
    p.add_argument("--confirm-project",help="Expected 20-character Supabase project ref")
    p.add_argument("--confirm-reviewed",action="store_true",help="Owner independently reviewed actual delivery receipts and RLS")
    args=p.parse_args()
    rows,digest=validate_doc(args.input)
    print(json.dumps({"mode":"APPLY" if args.apply else "DRY_RUN","events":len(rows),"payload_sha256":digest,"no_unverified_candidates":True}))
    if not args.apply:
        return
    if not args.confirm_project or not args.confirm_reviewed:
        raise SystemExit("FAIL_CLOSED: --apply requires exact --confirm-project AND --confirm-reviewed after owner approval")
    url=endpoint(os.getenv("ALPHA_HISTORY_SUPABASE_URL", ""),args.confirm_project)
    key=os.getenv("ALPHA_HISTORY_SERVICE_ROLE_KEY", "")
    if not key or len(key)<32:
        raise SystemExit("FAIL_CLOSED: missing server-only history credential")
    upsert(rows,url,key)
    print(json.dumps({"result":"UPSERT_COMPLETED","rows":len(rows),"payload_sha256":digest}))

if __name__=="__main__":
    main()