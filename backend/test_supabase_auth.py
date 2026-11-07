"""Auth regression tests. Run from repository root with: python -m unittest backend.test_supabase_auth"""
import time
import unittest
from unittest.mock import patch

from jose import jwt

from backend import supabase_auth


class SupabaseJWTTests(unittest.TestCase):
    def setUp(self):
        self.secret = "local-test-secret-only"
        self.payload = {
            "sub": "123e4567-e89b-12d3-a456-426614174000",
            "aud": "authenticated",
            "role": "authenticated",
            "exp": int(time.time()) + 300,
        }

    def test_legacy_hs256_without_kid_verifies(self):
        token = jwt.encode(self.payload, self.secret, algorithm="HS256")
        self.assertNotIn("kid", jwt.get_unverified_header(token))
        with patch.object(supabase_auth, "SUPABASE_JWT_SECRET", self.secret), \
             patch.object(supabase_auth, "SUPABASE_ISSUER", ""):
            claims = supabase_auth.verify_supabase_token(token)
        self.assertEqual(claims["sub"], self.payload["sub"])

    def test_wrong_secret_fails_closed(self):
        token = jwt.encode(self.payload, "different-secret", algorithm="HS256")
        with patch.object(supabase_auth, "SUPABASE_JWT_SECRET", self.secret):
            with self.assertRaises(Exception):
                supabase_auth.verify_supabase_token(token)

    def test_missing_legacy_secret_fails_closed(self):
        token = jwt.encode(self.payload, self.secret, algorithm="HS256")
        with patch.object(supabase_auth, "SUPABASE_JWT_SECRET", ""):
            with self.assertRaisesRegex(ValueError, "not configured"):
                supabase_auth.verify_supabase_token(token)

    def test_unsigned_legacy_algs_do_not_fall_back(self):
        with patch.object(supabase_auth.jwt, "get_unverified_header", return_value={"alg": "HS512", "kid": "untrusted"}):
            with self.assertRaisesRegex(ValueError, "unsupported"):
                supabase_auth.verify_supabase_token("fake-token")

    def test_asymmetric_token_requires_kid(self):
        with patch.object(supabase_auth.jwt, "get_unverified_header", return_value={"alg": "RS256"}):
            with self.assertRaisesRegex(ValueError, "missing kid"):
                supabase_auth.verify_supabase_token("fake-token")


if __name__ == "__main__":
    unittest.main()
