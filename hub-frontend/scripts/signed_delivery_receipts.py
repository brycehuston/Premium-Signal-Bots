"""Cryptographic gate for reviewed post-send Alpha Alerts receipt batches.

A signature proves integrity and signer possession of the key, not that the
producer's Telegram-delivery contract was correctly implemented. The operator
MUST separately review the exact producer code and pin its SHA-256 here.
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

REQUIRED = frozenset({"event_id", "mint", "alert_lane", "timestamp_utc",
                      "delivered_at_utc", "delivery_status", "evidence_source",
                      "channel_class", "approved_for_history", "telegram_message_id",
                      "telegram_chat_id"})


def _utc(value: object) -> datetime:
    if not isinstance(value, str) or not value.endswith("Z"):
        raise ValueError("invalid UTC timestamp")
    d = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if d.utcoffset() != timedelta(0):
        raise ValueError("non-UTC timestamp")
    return d


def load_signed_receipts(path: str, public_key_hex: str, approved_producer_sha256: str) -> list[dict[str, str]]:
    src = Path(path)
    if src.is_symlink() or not src.is_file() or not 0 < src.stat().st_size <= 200_000_000:
        raise ValueError("receipt source absent, unsafe or oversized")
    if not re.fullmatch(r"[0-9a-fA-F]{64}", public_key_hex):
        raise ValueError("invalid pinned receipt signing key")
    if not re.fullmatch(r"[0-9a-f]{64}", approved_producer_sha256):
        raise ValueError("reviewed producer SHA-256 required")
    envelope=json.loads(src.read_text(encoding="utf-8"))
    if not isinstance(envelope,dict) or set(envelope)!={"signed_body","signature"}:
        raise ValueError("invalid signed receipt envelope")
    body,sig=envelope["signed_body"],envelope["signature"]
    if not isinstance(body,str) or not isinstance(sig,str) or not re.fullmatch(r"[0-9a-fA-F]{128}",sig):
        raise ValueError("invalid signed receipt encoding")
    try:
        Ed25519PublicKey.from_public_bytes(bytes.fromhex(public_key_hex)).verify(bytes.fromhex(sig),body.encode("utf-8"))
    except (InvalidSignature,ValueError) as exc:
        raise ValueError("invalid receipt signature") from exc
    payload=json.loads(body)
    if (not isinstance(payload,dict) or payload.get("version")!=1 or
        payload.get("source")!="alpha-history-post-send-receipts" or
        payload.get("producer_sha256")!=approved_producer_sha256):
        raise ValueError("unapproved producer contract")
    created=_utc(payload.get("generated_at_utc"))
    now=datetime.now(timezone.utc)
    if created > now+timedelta(minutes=1):
        raise ValueError("receipt batch future dated")
    receipts=payload.get("receipts")
    if not isinstance(receipts,list) or len(receipts)>200_000:
        raise ValueError("unbounded receipt batch")
    output=[]
    for row in receipts:
        if not isinstance(row,dict) or not REQUIRED.issubset(row):
            raise ValueError("receipt is missing proof fields")
        ts,delivered=_utc(row["timestamp_utc"]),_utc(row["delivered_at_utc"])
        if ts>now or delivered<ts or delivered>now+timedelta(minutes=1):
            raise ValueError("receipt time inconsistent")
        if not isinstance(row["event_id"],str) or not re.fullmatch(r"[A-Za-z0-9:_-]{8,180}",row["event_id"]):
            raise ValueError("invalid receipt identity")
        if str(row["delivery_status"])!="DELIVERED" or str(row["evidence_source"])!="telegram_api_response":
            continue
        if str(row["channel_class"]).upper()!="PUBLIC" or str(row["approved_for_history"]).lower()!="true":
            continue
        if not str(row["telegram_chat_id"]).lstrip("-").isdigit() or not str(row["telegram_message_id"]).isdigit() or int(row["telegram_message_id"])<1:
            raise ValueError("missing Telegram identity")
        # The calling reconciliation also checks the exact approved chat ID.
        output.append({key:str(row[key]) for key in REQUIRED if key!="delivered_at_utc"})
    return output