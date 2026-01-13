# backend/clerk_auth.py
import os
import time
from typing import Any

import requests
from jose import jwt, jwk


CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL", "")
CLERK_ISSUER = os.getenv("CLERK_ISSUER", "")
CLERK_AUDIENCE = os.getenv("CLERK_AUDIENCE", "")
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY", "")
CLERK_API_BASE = os.getenv("CLERK_API_BASE", "https://api.clerk.com/v1")
JWKS_CACHE_TTL = int(os.getenv("CLERK_JWKS_CACHE_TTL", "3600"))

_JWKS_CACHE: dict[str, Any] = {"keys": [], "fetched_at": 0}


def _fetch_jwks() -> dict:
    if not CLERK_JWKS_URL:
        raise ValueError("CLERK_JWKS_URL is not set")
    resp = requests.get(CLERK_JWKS_URL, timeout=6)
    resp.raise_for_status()
    data = resp.json()
    if "keys" not in data:
        raise ValueError("JWKS response missing keys")
    return data


def _get_jwks() -> dict:
    now = int(time.time())
    if _JWKS_CACHE["keys"] and (now - _JWKS_CACHE["fetched_at"]) < JWKS_CACHE_TTL:
        return _JWKS_CACHE
    data = _fetch_jwks()
    _JWKS_CACHE["keys"] = data.get("keys", [])
    _JWKS_CACHE["fetched_at"] = now
    return _JWKS_CACHE


def verify_clerk_token(token: str) -> dict:
    if not token:
        raise ValueError("missing token")
    header = jwt.get_unverified_header(token)
    kid = header.get("kid")
    if not kid:
        raise ValueError("missing kid")

    jwks = _get_jwks()
    key_data = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
    if not key_data:
        jwks = _fetch_jwks()
        _JWKS_CACHE["keys"] = jwks.get("keys", [])
        _JWKS_CACHE["fetched_at"] = int(time.time())
        key_data = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
    if not key_data:
        raise ValueError("signing key not found")

    public_key = jwk.construct(key_data)
    verify_aud = bool(CLERK_AUDIENCE)
    verify_iss = bool(CLERK_ISSUER)
    options = {"verify_aud": verify_aud, "verify_iss": verify_iss}

    return jwt.decode(
        token,
        public_key.to_pem().decode("utf-8"),
        algorithms=["RS256"],
        audience=CLERK_AUDIENCE or None,
        issuer=CLERK_ISSUER or None,
        options=options,
    )


def fetch_clerk_email(clerk_user_id: str) -> str | None:
    if not CLERK_SECRET_KEY:
        return None
    if not clerk_user_id:
        return None
    resp = requests.get(
        f"{CLERK_API_BASE}/users/{clerk_user_id}",
        headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"},
        timeout=6,
    )
    if not resp.ok:
        return None
    data = resp.json()
    primary_id = data.get("primary_email_address_id")
    emails = data.get("email_addresses", [])
    for e in emails:
        if e.get("id") == primary_id:
            return e.get("email_address")
    if emails:
        return emails[0].get("email_address")
    return None
