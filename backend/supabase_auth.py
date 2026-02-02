# backend/supabase_auth.py
import os
import time
from typing import Any

import requests
from jose import jwt, jwk


SUPABASE_JWKS_URL = os.getenv("SUPABASE_JWKS_URL", "")
SUPABASE_ISSUER = os.getenv("SUPABASE_ISSUER", "")
SUPABASE_AUDIENCE = os.getenv("SUPABASE_AUDIENCE", "authenticated")
JWKS_CACHE_TTL = int(os.getenv("SUPABASE_JWKS_CACHE_TTL", "3600"))

_JWKS_CACHE: dict[str, Any] = {"keys": [], "fetched_at": 0}


def _fetch_jwks() -> dict:
    if not SUPABASE_JWKS_URL:
        raise ValueError("SUPABASE_JWKS_URL is not set")
    resp = requests.get(SUPABASE_JWKS_URL, timeout=6)
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


def verify_supabase_token(token: str) -> dict:
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
    verify_aud = bool(SUPABASE_AUDIENCE)
    verify_iss = bool(SUPABASE_ISSUER)
    options = {"verify_aud": verify_aud, "verify_iss": verify_iss}

    return jwt.decode(
        token,
        public_key.to_pem().decode("utf-8"),
        algorithms=["RS256"],
        audience=SUPABASE_AUDIENCE or None,
        issuer=SUPABASE_ISSUER or None,
        options=options,
    )
