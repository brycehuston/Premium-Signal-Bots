#!/usr/bin/env python3
"""Fail-closed, local-only Alpha Alerts history staging.

Input contracts:
  canonical CSV: pre-send candidates (NEVER proves delivery).
  features CSV: correlation-only (post-send invariant is not yet independently proven).
  receipt CSV: separately reviewed, direct Telegram API success receipts with event_id,
    mint, lane, UTC event timestamp, positive Telegram message_id and exact approved chat.

No network calls, no DB writes, no direct production access. This builder deliberately
rejects missing, duplicate or ambiguous receipts; its output is staging-only pending
operator-reviewed producer receipts and entitlement enforcement.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ALIASES = {"ALPHA_RUNNER":"RUNNER", "R8_RECLAIM":"RECLAIM", "EARLY_ALPHA":"EARLY", "EARLY_RADAR":"EARLY", "GENESIS_SMOOTH_RAMP":"GENESIS"}
LANES = {"EARLY", "GENESIS", "TREND", "STRICT", "RECLAIM", "RUNNER"}
LIMIT_BYTES = 250_000_000
MAX_ROWS = 200_000
REQUIRED = {"event_id", "mint", "alert_lane", "timestamp_utc"}
WITNESS_REQUIRED = REQUIRED | {"delivery_status", "telegram_message_id", "telegram_chat_id", "evidence_source", "channel_class", "approved_for_history"}


def lane(raw):
    value = str(raw or "").strip().upper()
    return ALIASES.get(value, value)


def utc(raw):
    if not isinstance(raw, str) or not raw.endswith("Z"):
        raise ValueError("UTC timestamp must end with Z")
    dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        raise ValueError("naive timestamp")
    dt = dt.astimezone(timezone.utc)
    if dt.year < 2020 or dt > datetime.now(timezone.utc):
        raise ValueError("out-of-bounds timestamp")
    return dt.isoformat().replace("+00:00", "Z")


def value(row, *names):
    for name in names:
        v = row.get(name)
        if v is not None and str(v).strip():
            return str(v).strip()
    return ""


def positive_float(raw):
    if raw is None or raw == "":
        return None
    try:
        n = float(raw)
    except (TypeError, ValueError):
        return None
    if not (0 < n < 1e13) or not (float("-inf") < n < float("inf")):
        return None
    return round(n, 4)


def csv_rows(path, required):
    path = Path(path)
    if path.is_symlink() or not path.is_file():
        raise ValueError("missing or unsafe source: " + path.name)
    if not 0 < path.stat().st_size <= LIMIT_BYTES:
        raise ValueError("invalid source size: " + path.name)
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames or not required.issubset(reader.fieldnames):
            raise ValueError("missing required columns in " + path.name)
        rows = []
        for row in reader:
            rows.append(row)
            if len(rows) > MAX_ROWS:
                raise ValueError("audit row limit exceeded")
        return rows


def unique_index(rows):
    index, dupes = {}, set()
    for row in rows:
        event = value(row, "event_id")
        if not event:
            continue
        if event in index:
            dupes.add(event)
        else:
            index[event] = row
    for event in dupes:
        index.pop(event, None)
    return index, dupes


def identity_match(a, b):
    try:
        return (value(a, "event_id") == value(b, "event_id") and
                value(a, "mint") == value(b, "mint") and
                lane(a.get("alert_lane")) == lane(b.get("alert_lane")) and
                utc(value(a, "timestamp_utc")) == utc(value(b, "timestamp_utc")))
    except ValueError:
        return False


def confirmed_receipt(row, approved_chat):
    # Require direct Telegram API response for the correct channel and event.
    # A boolean 'sent' field, features row or source candidate cannot replace this.
    if (value(row, "delivery_status") != "DELIVERED" or
        value(row, "evidence_source") != "telegram_api_response" or
        value(row, "channel_class").upper() != "PUBLIC" or
        value(row, "approved_for_history").lower() != "true" or
        value(row, "telegram_chat_id") != approved_chat):
        return False
    msg_id = value(row, "telegram_message_id")
    return msg_id.isdigit() and int(msg_id) > 0 and int(msg_id) < 1_000_000_000_000


def audit(canonical, features, receipts, approved_chat, outcomes=()):
    if not approved_chat:
        raise ValueError("An exact approved Telegram channel ID is required")
    counts = Counter()
    canonical_by_id, cdupes = unique_index(canonical)
    feature_by_id, fdupes = unique_index(features)
    receipts_by_id, rdupes = unique_index(receipts)
    counts.update({"canonical_rows":len(canonical),"feature_rows":len(features),
                   "receipt_rows":len(receipts), "canonical_duplicate_ids":len(cdupes),
                   "feature_duplicate_ids":len(fdupes),"receipt_duplicate_ids":len(rdupes)})
    outcome_by_id = defaultdict(list)
    for o in outcomes:
        key = value(o,"alert_id")
        if key:
            outcome_by_id[key].append(o)
    validated=[]
    for event, a in canonical_by_id.items():
        f = feature_by_id.get(event)
        r = receipts_by_id.get(event)
        if not f or not r:
            counts["missing_feature_or_receipt"] += 1
            continue
        if not identity_match(a,f) or not identity_match(a,r):
            counts["identity_mismatch"] += 1
            continue
        if not confirmed_receipt(r,approved_chat):
            counts["missing_direct_delivery_proof"] += 1
            continue
        symbol = value(a,"symbol")
        current_lane = lane(a.get("alert_lane"))
        if (current_lane not in LANES or not re.fullmatch(r"[A-Za-z0-9._-]{1,28}",symbol)
                or not 8<=len(event)<=180 or len(value(a,"mint"))>128):
            counts["invalid_identity_or_lane"] += 1
            continue
        observed_peak = None
        outcome_status = "UNAVAILABLE"
        matches = outcome_by_id.get(event,[])
        if len(matches)==1 and value(matches[0],"mint")==value(a,"mint"):
            status = value(matches[0],"status").upper()
            if status=="DONE":
                # Outcome engine is observational, NOT a trading ledger. Never call it PNL.
                observed_peak=positive_float(value(matches[0],"max_multiple"))
                outcome_status="OBSERVED_PEAK" if observed_peak is not None else "UNAVAILABLE"
            elif status in {"PENDING", "EXPIRED_PARTIAL_DATA"}:
                outcome_status=status
        source_hash=hashlib.sha256(json.dumps({"a":a,"f":f,"r":r},sort_keys=True,separators=(",",":")).encode()).hexdigest()
        validated.append({
            "event_id":event,"event_at":utc(value(a,"timestamp_utc")),"symbol":symbol,
            "mint":value(a,"mint"),"lane":current_lane,
            "alert_mc":positive_float(value(a,"mc","alert_mc")),
            "liquidity_usd":positive_float(value(a,"liq","liquidity_usd")),
            "m5_tx":int(value(a,"m5_tx")) if value(a,"m5_tx").isdigit() and int(value(a,"m5_tx")) <= 2147483647 else None,
            "proof_kind":"DIRECT_TELEGRAM_API_RECEIPT", "source_sha256":source_hash,
            "outcome_status":outcome_status,"observed_max_multiple":observed_peak,
            "approved_for_history":True,
        })
    validated.sort(key=lambda x:(x["event_at"],x["event_id"]))
    counts["validated_events"] = len(validated)
    counts["observed_peaks"] = sum(r["outcome_status"]=="OBSERVED_PEAK" for r in validated)
    return validated,dict(sorted(counts.items()))


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--canonical",required=True)
    p.add_argument("--features",required=True)
    p.add_argument("--receipts",required=True,help="Reviewed event-id linked direct Telegram API success receipts")
    p.add_argument("--approved-chat-id",required=True,help="Exact approved PUBLIC Telegram channel; never stored")
    p.add_argument("--outcomes")
    p.add_argument("--output",help="Local staging JSON file. No live upload performed")
    args=p.parse_args()
    canonical=csv_rows(args.canonical,REQUIRED)
    features=csv_rows(args.features,REQUIRED)
    receipts=csv_rows(args.receipts,WITNESS_REQUIRED)
    outcomes=csv_rows(args.outcomes,{"alert_id","mint","status"}) if args.outcomes else []
    rows,counts=audit(canonical,features,receipts,args.approved_chat_id,outcomes)
    print(json.dumps({"mode":"READ_ONLY_STAGING","counts":counts,"eligible_for_import":bool(rows)},sort_keys=True,indent=2))
    if args.output:
        if not rows:
            raise SystemExit("FAIL_CLOSED: no independently witnessed deliveries; no import file generated")
        dst=Path(args.output)
        if dst.exists() or dst.is_symlink():
            raise SystemExit("Refusing to overwrite an existing audit artifact")
        # Respect umask; avoid publishing mint/receipt hashes into repo or web assets.
        with dst.open("x",encoding="utf-8") as f:
            json.dump({"schema_version":1,"records":rows,"counts":counts},f,sort_keys=True,indent=2)
            f.write("\n")
        dst.chmod(0o600)


if __name__=="__main__":
    main()