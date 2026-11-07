#!/usr/bin/env python3
"""Export six sanitized, confirmed-telegram-delivery Alpha alerts to the public signed reel.

Source: current Alpha-Trend's TREND_token_alerts.csv, which this exact running
source writes ONLY after a truthy, confirmed Telegram API delivery result.
This process never reads Telegram credentials or edits/interrupts the sender.
"""
from __future__ import annotations
import argparse, csv, datetime as dt, hashlib, json, math, os, re, stat, sys
import urllib.error, urllib.request
from pathlib import Path
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat

ROOT = Path("/home/ubuntu/worktrees/alpha-alerts-live-v196-20261101")
SOURCE = ROOT / "alpha_trend_alerts.py"
CSV = ROOT / "logs/TREND_token_alerts.csv"
KEY = Path("/home/ubuntu/.alphaalerts/website_feed/ed25519.private")
ENDPOINT = "https://ennbnofvmnkcuhftzlhr.supabase.co/functions/v1/alpha-public-daily-feed"
EXPECTED_SOURCE_SHA256 = "0c2bf122e3acea2471f02dde6faf420875b6f0301f84ce785fe94ff013db704a"
APPROVED = {"EARLY","GENESIS","TREND","STRICT","RECLAIM","RUNNER"}
ALIASES = {"R8_RECLAIM":"RECLAIM","ALPHA_RUNNER":"RUNNER","EARLY_ALPHA":"EARLY","EARLY_RADAR":"EARLY","GENESIS_SMOOTH_RAMP":"GENESIS"}
SYMBOL = re.compile(r"^[A-Za-z0-9._-]{1,28}$")
UTC = dt.timezone.utc

def source_verified() -> None:
    if hashlib.sha256(SOURCE.read_bytes()).hexdigest() != EXPECTED_SOURCE_SHA256:
        raise ValueError("sender source changed: abort publishing pending code review")
    source = SOURCE.read_text(encoding="utf-8")
    send_boundary = source.index('        if not delivered:\n            token["delivery_status"] = "FAILED"')
    accepted = source.index('        telegram_metadata = _telegram_delivery_metadata(delivered)',send_boundary)
    written = source.index('            _log_alert_csv(token, tier, score, event_alert_num, raise_on_error=True)',accepted)
    if not (send_boundary < accepted < written):
        raise ValueError("CSV no longer unambiguously postdates Telegram confirmation")

def finite_positive(v: str | None) -> float | None:
    try:
        n=float(v) if v is not None else 0
        return round(n,2) if math.isfinite(n) and 0 < n < 1e13 else None
    except (ValueError,TypeError): return None

def normalize(row: dict[str,str], now: dt.datetime) -> dict | None:
    raw=(row.get("timestamp_utc") or "").strip()
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z",raw):return None
    try:
        sent=dt.datetime.strptime(raw,"%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=UTC)
        score=float(row.get("score") or "nan")
    except(ValueError,TypeError):return None
    # 31m rather than 30m protects against small host clock differences.
    age=now-sent
    if not(dt.timedelta(minutes=31)<=age<=dt.timedelta(days=7)):return None
    if not(math.isfinite(score) and 0<=score<=10):return None
    lane=ALIASES.get((row.get("alert_lane") or "").upper(),(row.get("alert_lane") or "").upper())
    if lane not in APPROVED:return None
    symbol=(row.get("symbol") or "").lstrip("$")
    if not SYMBOL.fullmatch(symbol):return None
    event_id=(row.get("event_id") or "").strip()
    if not event_id or len(event_id)>180:return None
    try:tx=int(row.get("m5_tx") or "")
    except(ValueError,TypeError):tx=None
    if tx is not None and not 0<=tx<=1_000_000_000:tx=None
    return dict(event_id=hashlib.sha256(event_id.encode()).hexdigest()[:32],
        symbol=symbol,lane=lane,timestamp_utc=raw,score=round(score,2),
        alert_mc=finite_positive(row.get("mc")),
        liquidity_usd=finite_positive(row.get("liq")),m5_tx=tx,
        approved_for_public=True,delivery_status="DELIVERED")

def prepare(now:dt.datetime) -> tuple[dict,dict]:
    source_verified()
    if not CSV.is_file() or CSV.is_symlink():raise ValueError("alert log missing or symlink")
    if CSV.stat().st_size > 150_000_000:raise ValueError("alert log unexpectedly large")
    dedup:dict[str,dict]={}
    with CSV.open(newline="",encoding="utf-8-sig") as f:
        reader=csv.DictReader(f)
        needed={"timestamp_utc","event_id","symbol","alert_lane","score","mc","liq","m5_tx"}
        if not reader.fieldnames or not needed.issubset(reader.fieldnames):
            raise ValueError("source columns changed")
        for row in reader:
            item=normalize(row,now)
            if item is None:continue
            old=dedup.get(item["event_id"])
            if old is None or item["timestamp_utc"]>old["timestamp_utc"]:
                dedup[item["event_id"]]=item
    cutoff=now-dt.timedelta(hours=24)
    scored=sorted(dedup.values(),key=lambda row:(-row["score"],row["timestamp_utc"]),reverse=False)
    day=[r for r in scored if dt.datetime.fromisoformat(r["timestamp_utc"].replace("Z","+00:00"))>=cutoff][:3]
    week=[r for r in scored if dt.datetime.fromisoformat(r["timestamp_utc"].replace("Z","+00:00"))<cutoff][:3]
    # Only six sanitized rows cross the network, never private receipts, mints,
    # raw Telegram messages, message IDs, chat IDs, invite URLs or account data.
    body={"version":1,"source":"confirmed-telegram-delivery",
          "updated_at_utc":now.isoformat(timespec="seconds").replace("+00:00","Z"),
          "daily_alerts":day+week}
    counts={"eligible_7d":len(dedup),"sent_24h":len(day),
            "weekly_reserve":len(week),"published_rows":len(body["daily_alerts"])}
    return body,counts

def signed(body:dict) -> dict:
    if KEY.is_symlink() or (KEY.stat().st_mode & (stat.S_IRWXG|stat.S_IRWXO)):
        raise ValueError("private signer permissions are not owner-only")
    raw=KEY.read_bytes()
    if len(raw)!=32:raise ValueError("unexpected key format")
    private=Ed25519PrivateKey.from_private_bytes(raw)
    public=private.public_key().public_bytes(Encoding.Raw,PublicFormat.Raw).hex()
    # Public key is nonsecret, but publication requires explicit match to the
    # destination project to prevent sending from the wrong host/account.
    if public!="f1c11839ae78d92f8dcd0b228aff18120423d8ff6199f0a2e247f2d8057027e0":
        raise ValueError("signer not registered for Alpha Alerts")
    encoded=json.dumps(body,separators=(",",":"),ensure_ascii=False)
    return {"signed_body":encoded,"signature":private.sign(encoded.encode()).hex()}

def run(publish=False) -> None:
    now=dt.datetime.now(UTC)
    body,counts=prepare(now)
    envelope=signed(body)
    if len(envelope["signed_body"].encode())>=131072:raise ValueError("feed size exceeded")
    print("FEED_PREFLIGHT",json.dumps(counts,sort_keys=True),flush=True)
    if not publish:
        print("DRY_RUN_ONLY; no network request made",flush=True);return
    payload=json.dumps(envelope,separators=(",",":")).encode()
    req=urllib.request.Request(ENDPOINT,payload,headers={"Content-Type":"application/json"},method="PUT")
    with urllib.request.urlopen(req,timeout=12) as response:
        data=json.loads(response.read(512))
        if response.status!=200 or data.get("accepted") is not True:
            raise RuntimeError("signed snapshot not accepted")
    print("PUBLISHED_SIGNED_RECEIPTS",counts["published_rows"],flush=True)

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--publish",action="store_true")
    args=parser.parse_args()
    run(args.publish)
