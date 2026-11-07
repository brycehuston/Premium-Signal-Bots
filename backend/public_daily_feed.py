"""Ephemeral, signed, public daily-alert snapshot relay on the existing Render API.

No DB migrations, no Telegram credentials, no private raw messages.
The independent VPS publisher must refresh snapshots every 2 minutes.
Render's ephemeral storage is intentionally reconstructible from the VPS outbox.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
import tempfile
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse

router = APIRouter(tags=["public-daily-feed"])
_LOCK = threading.Lock()
MAX_BYTES = 128 * 1024
FRESHNESS = timedelta(minutes=20)
UTC = timezone.utc
LANES = frozenset({"EARLY", "GENESIS", "TREND", "STRICT", "RECLAIM", "RUNNER"})


def _storage() -> Path:
    return Path(os.environ.get("ALPHA_PUBLIC_DAILY_FEED_STORE") or
                os.path.join(tempfile.gettempdir(), "alpha-alerts-daily-feed.signed.json"))


def _timestamp(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value.endswith("Z"):
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed if parsed.utcoffset() == timedelta(0) else None
    except (ValueError, OverflowError):
        return None


def _validate(envelope: Any, secret: str, now: datetime) -> datetime | None:
    if not isinstance(envelope, dict) or len(secret) < 32:
        return None
    signature = envelope.get("signature")
    body = envelope.get("signed_body")
    if (not isinstance(signature, str) or not re.fullmatch(r"[0-9a-f]{64}", signature)
            or not isinstance(body, str) or len(body.encode("utf-8")) > MAX_BYTES):
        return None
    want = hmac.new(secret.encode("utf-8"), body.encode("utf-8"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(want, signature):
        return None
    try:
        payload = json.loads(body)
    except (json.JSONDecodeError, TypeError):
        return None
    if not isinstance(payload, dict) or payload.get("version") != 1 or payload.get("source") != "confirmed-telegram-delivery":
        return None
    updated = _timestamp(payload.get("updated_at_utc"))
    if updated is None or updated < now - FRESHNESS or updated > now + timedelta(minutes=1):
        return None
    rows = payload.get("daily_alerts")
    if not isinstance(rows, list) or len(rows) > 500:
        return None
    required = frozenset({"event_id", "symbol", "lane", "timestamp_utc", "score",
                          "alert_mc", "liquidity_usd", "m5_tx", "approved_for_public", "delivery_status"})
    for row in rows:
        if not isinstance(row, dict) or set(row) != required:
            return None
        if row["approved_for_public"] is not True or row["delivery_status"] != "DELIVERED":
            return None
        if not isinstance(row["event_id"], str) or not re.fullmatch(r"[a-f0-9]{32}", row["event_id"]):
            return None
        if not isinstance(row["symbol"], str) or not re.fullmatch(r"[A-Za-z0-9._-]{1,28}", row["symbol"]):
            return None
        if row["lane"] not in LANES:
            return None
        if not isinstance(row["score"], (int, float)) or isinstance(row["score"], bool) or not 0 <= row["score"] <= 10:
            return None
        age = _timestamp(row["timestamp_utc"])
        if age is None or age > now - timedelta(minutes=30) or age < now - timedelta(hours=24):
            return None
        for name in ("alert_mc", "liquidity_usd"):
            v = row[name]
            if v is not None and (not isinstance(v, (float, int)) or isinstance(v, bool) or not 0 < v < 1e13):
                return None
        tx = row["m5_tx"]
        if tx is not None and (not isinstance(tx, int) or isinstance(tx, bool) or not 0 <= tx <= 1_000_000_000):
            return None
    return updated


def _read_valid(secret: str, now: datetime) -> tuple[dict[str, Any] | None, datetime | None]:
    try:
        path = _storage()
        if path.stat().st_size > MAX_BYTES * 2:
            return None, None
        content = json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, PermissionError, ValueError, OSError, json.JSONDecodeError):
        return None, None
    updated = _validate(content, secret, now)
    return (content, updated) if updated is not None else (None, None)


@router.get("/public/daily-feed")
def get_public_daily_feed():
    secret = os.environ.get("ALPHA_PUBLIC_DAILY_FEED_SECRET", "")
    content, _ = _read_valid(secret, datetime.now(UTC))
    if content is None:
        raise HTTPException(status_code=503, detail="Public feed unavailable")
    return JSONResponse(content, headers={"Cache-Control": "public, max-age=15"})


@router.put("/public/daily-feed")
async def put_public_daily_feed(request: Request):
    secret = os.environ.get("ALPHA_PUBLIC_DAILY_FEED_SECRET", "")
    if len(secret) < 32:
        raise HTTPException(status_code=503, detail="Public feed not configured")
    collected = bytearray()
    async for part in request.stream():
        collected.extend(part)
        if len(collected) > MAX_BYTES * 2:
            raise HTTPException(status_code=413, detail="Public feed too large")
    try:
        envelope = json.loads(collected)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid JSON")
    now = datetime.now(UTC)
    updated = _validate(envelope, secret, now)
    if updated is None:
        raise HTTPException(status_code=403, detail="Invalid or stale signed public feed")
    path = _storage()
    with _LOCK:
        _, previous_updated = _read_valid(secret, now)
        if previous_updated is not None and updated <= previous_updated:
            return {"accepted": True, "updated": False}
        path.parent.mkdir(parents=True, exist_ok=True)
        staged = None
        try:
            fd, name = tempfile.mkstemp(prefix=".alpha-public-", suffix=".tmp", dir=str(path.parent))
            staged = Path(name)
            with os.fdopen(fd, "w", encoding="utf-8") as handle:
                json.dump(envelope, handle, separators=(",", ":"), ensure_ascii=True)
                handle.write("\n")
            os.replace(staged, path)
        finally:
            if staged is not None:
                staged.unlink(missing_ok=True)
    return {"accepted": True, "updated": True}
