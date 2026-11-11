"""Fail-closed cross-check for publisher candidates against post-send features.

An exact match is necessary, but not sufficient, evidence of delivered Telegram
alerts. A reviewed writer contract and an approved sender fingerprint are also
required before this module may be used for live publication.
"""
from __future__ import annotations

import csv
from pathlib import Path

MAX_FEATURES_BYTES = 150_000_000
REQUIRED = frozenset({"event_id", "mint", "alert_lane", "timestamp_utc"})
ALIASES = {
    "R8_RECLAIM": "RECLAIM",
    "ALPHA_RUNNER": "RUNNER",
    "EARLY_ALPHA": "EARLY",
    "EARLY_RADAR": "EARLY",
    "GENESIS_SMOOTH_RAMP": "GENESIS",
}
APPROVED = frozenset({"EARLY", "GENESIS", "TREND", "STRICT", "RECLAIM", "RUNNER"})


def _lane(value: str | None) -> str:
    raw = (value or "").strip().upper()
    return ALIASES.get(raw, raw)


def confirmed_feature_index(path: Path) -> dict[str, tuple[str, str, str]]:
    """Return uniquely keyed feature-row identities; exclude duplicate IDs.

    No rows are considered confirmed merely because they appear in this file.
    Caller must separately approve the writer's post-send delivery invariant.
    """
    if path.is_symlink() or not path.is_file():
        raise ValueError("post-send feature log is absent or unsafe")
    size = path.stat().st_size
    if size <= 0 or size > MAX_FEATURES_BYTES:
        raise ValueError("post-send feature log exceeds allowed size or is empty")
    entries: dict[str, tuple[str, str, str]] = {}
    duplicate_ids: set[str] = set()
    with path.open("r", newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames or not REQUIRED.issubset(reader.fieldnames):
            raise ValueError("post-send feature schema changed")
        for row in reader:
            event_id = (row.get("event_id") or "").strip()
            mint = (row.get("mint") or "").strip()
            timestamp = (row.get("timestamp_utc") or "").strip()
            lane = _lane(row.get("alert_lane"))
            if not event_id or len(event_id) > 180 or not mint or lane not in APPROVED or not timestamp:
                continue
            if event_id in entries:
                duplicate_ids.add(event_id)
            else:
                entries[event_id] = (mint, lane, timestamp)
    for event_id in duplicate_ids:
        entries.pop(event_id, None)
    return entries


def has_matching_post_send_feature(row: dict[str, str], index: dict[str, tuple[str, str, str]]) -> bool:
    """Reject absent, mismatched or ambiguous candidate event IDs."""
    key = (row.get("event_id") or "").strip()
    recorded = index.get(key)
    if not key or recorded is None:
        return False
    mint = (row.get("mint") or "").strip()
    lane = _lane(row.get("alert_lane"))
    ts = (row.get("timestamp_utc") or "").strip()
    return bool(mint and ts and lane in APPROVED and recorded == (mint, lane, ts))
