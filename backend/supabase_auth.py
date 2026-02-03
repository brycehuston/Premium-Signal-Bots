# backend/supabase_auth.py
import os
import time
from typing import Any

import requests
from jose import jwt, jwk


SUPABASE_JWKS_URL = os.getenv("SUPABASE_JWKS_URL", "")
SUPABASE_ISSUER = os.getenv("SUPABASE_ISSUER", "")
SUPABASE_AUDIENCE = os.getenv("SUPABASE_AUDIENCE", "authenticated")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
JWKS_CACHE_TTL = int(os.getenv("SUPABASE_JWKS_CACHE_TTL", "3600"))

_JWKS_CACHE: dict[str, Any] = {"keys": [], "fetched_at": 0}


def _fetch_jwks() -> dict:
    if not SUPABASE_JWKS_URL:
        raise ValueError("SUPABASE_JWKS_URL is not set")
    headers = {}
    api_key = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY
    if api_key:
        headers = {"apikey": api_key, "Authorization": f"Bearer {api_key}"}

    resp = requests.get(SUPABASE_JWKS_URL, headers=headers, timeout=6)
    if resp.status_code == 404 and ".well-known/jwks.json" not in SUPABASE_JWKS_URL:
        # Supabase JWKS endpoint is now under /.well-known/jwks.json
        alt = SUPABASE_JWKS_URL.rstrip("/").replace("/auth/v1/keys", "/auth/v1/.well-known/jwks.json")
        resp = requests.get(alt, headers=headers, timeout=6)
    if resp.status_code == 401:
        # Some projects require an API key header for JWKS
        raise ValueError("jwks_unauthorized")
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
    alg = header.get("alg")
    if not kid:
        raise ValueError("missing kid")

    if alg and alg.startswith("HS") and SUPABASE_JWT_SECRET:
        return jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=[alg],
            audience=SUPABASE_AUDIENCE or None,
            issuer=SUPABASE_ISSUER or None,
        )

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
        algorithms=[alg] if alg else ["RS256"],
        audience=SUPABASE_AUDIENCE or None,
        issuer=SUPABASE_ISSUER or None,
        options=options,
    )
