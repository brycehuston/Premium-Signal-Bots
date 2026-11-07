#!/usr/bin/env python3
"""Sign a redacted public-day feed from owner-approved, confirmed Telegram receipts.

Invoke offline, on a copy/curated export of post-delivery receipts, never the
pre-Telegram alert candidate log. Does not send network requests.
"""
import argparse
import datetime as dt
import hashlib
import hmac
import json
import math
import os
import re
import tempfile
from pathlib import Path

UTC = dt.timezone.utc
LANES = {"EARLY", "GENESIS", "TREND", "STRICT", "RECLAIM", "RUNNER"}
ALIASES = {"EARLY_RADAR": "EARLY", "GENESIS_SMOOTH_RAMP": "GENESIS", "R8_RECLAIM": "RECLAIM"}


def utc(value):
    try:
        text = str(value)
        if not text.endswith("Z"):
            return None
        parsed = dt.datetime.fromisoformat(text.replace("Z", "+00:00"))
        return parsed if parsed.tzinfo else None
    except (TypeError, ValueError):
        return None


def optional_positive(value):
    try:
        v = float(value)
        return round(v, 2) if math.isfinite(v) and 0 < v < 1e13 else None
    except (TypeError, ValueError):
        return None


def eligible(row, now):
    if row.get("approved_for_public") is not True or row.get("delivery_status") != "DELIVERED":
        return None
    try:
        mid = int(row.get("telegram_message_id") or 0)
        score = float(row.get("score"))
        tx = int(row.get("m5_tx")) if row.get("m5_tx") is not None else None
    except (TypeError, ValueError):
        return None
    if mid <= 0 or not math.isfinite(score) or not 0 <= score <= 10:
        return None
    date = utc(row.get("timestamp_utc"))
    if date is None or date.date() != now.date() or not dt.timedelta(minutes=30) <= now - date <= dt.timedelta(days=1):
        return None
    lane = str(row.get("lane") or "").upper().strip()
    lane = ALIASES.get(lane, lane)
    eid = str(row.get("event_id") or "")
    symbol = str(row.get("symbol") or "").lstrip("$")
    if lane not in LANES or not re.fullmatch(r"[A-Za-z0-9:_-]{8,96}", eid) or not re.fullmatch(r"[A-Za-z0-9._-]{1,28}", symbol):
        return None
    if tx is not None and not 0 <= tx <= 1_000_000_000:
        tx = None
    return {
        "event_id": hashlib.sha256(eid.encode("utf-8")).hexdigest()[:32], "symbol": symbol, "lane": lane,
        "timestamp_utc": date.astimezone(UTC).isoformat().replace("+00:00", "Z"),
        "score": round(score, 2), "alert_mc": optional_positive(row.get("alert_mc")),
        "liquidity_usd": optional_positive(row.get("liquidity_usd")),
        "m5_tx": tx, "approved_for_public": True, "delivery_status": "DELIVERED"
    }


def build(lines, secret, now=None):
    if len(secret) < 32:
        raise ValueError("ALPHA_PUBLIC_DAILY_FEED_SECRET must contain >=32 characters")
    now = now or dt.datetime.now(UTC)
    if now.tzinfo is None:
        raise ValueError("now must be timezone-aware")
    now = now.astimezone(UTC)
    events = {}
    for line in lines:
        if not line.strip():
            continue
        row = json.loads(line)
        if not isinstance(row, dict):
            continue
        item = eligible(row, now)
        if item is not None:
            events[item["event_id"]] = item
    ranked = sorted(events.values(), key=lambda x: (-x["score"], x["timestamp_utc"]))
    body = {"version": 1, "source": "confirmed-telegram-delivery",
            "updated_at_utc": now.isoformat().replace("+00:00", "Z"),
            "daily_alerts": ranked}
    signed_body = json.dumps(body, separators=(",", ":"), ensure_ascii=False)
    signature = hmac.new(secret.encode("utf-8"), signed_body.encode("utf-8"), hashlib.sha256).hexdigest()
    return {"signed_body": signed_body, "signature": signature}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--confirmed-outbox", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    secret = os.environ.get("ALPHA_PUBLIC_DAILY_FEED_SECRET", "")
    envelope = build(args.confirmed_outbox.read_text(encoding="utf-8").splitlines(), secret)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=args.output.parent,
                                         prefix=".alpha-feed-", suffix=".tmp", delete=False) as handle:
            temp_path = Path(handle.name)
            os.fchmod(handle.fileno(), 0o600)
            json.dump(envelope, handle, ensure_ascii=False, separators=(",", ":"))
            handle.write("\n")
        os.replace(temp_path, args.output)
    finally:
        if temp_path and temp_path.exists():
            temp_path.unlink()
    print("Signed public day feed generated (redacted; no private Telegram metadata)")


if __name__ == "__main__":
    main()
