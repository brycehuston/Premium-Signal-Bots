"""Fail-closed identity binding for Supabase-authenticated accounts.

A signed JWT's ``sub`` is the account identifier. User-editable metadata and
email alone must never assign an existing local account or its entitlements.
"""
from __future__ import annotations

import re
from uuid import UUID


def verified_supabase_identity(payload: dict) -> tuple[str, str]:
    """Extract canonical sub and signed top-level email after JWT verification.

    A signed email claim is not itself proof that a legacy account belongs to
    this subject. Legacy account linking must be an explicit verified operation.
    """
    if not isinstance(payload, dict):
        raise ValueError("invalid identity claims")
    subject = payload.get("sub")
    email = payload.get("email")
    if not isinstance(subject, str) or not subject:
        raise ValueError("missing Supabase identity")
    try:
        subject_uuid = str(UUID(subject))
    except (ValueError, AttributeError, TypeError) as exc:
        raise ValueError("invalid Supabase identity") from exc
    if subject_uuid != subject.lower():
        raise ValueError("noncanonical Supabase identity")
    if not isinstance(email, str) or len(email) > 254:
        raise ValueError("missing verified identity email claim")
    normalized = email.strip().lower()
    if not normalized or normalized != email.lower() or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", normalized):
        raise ValueError("invalid identity email")
    return subject_uuid, normalized
