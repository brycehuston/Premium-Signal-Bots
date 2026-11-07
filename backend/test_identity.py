"""Regression tests for signed Supabase account ownership; no external services."""
import unittest

from backend.identity import verified_supabase_identity

SUB = "123e4567-e89b-12d3-a456-426614174000"


class IdentityTests(unittest.TestCase):
    def test_valid_top_level_claim(self):
        self.assertEqual(verified_supabase_identity({"sub": SUB, "email": "Person@Example.com"}), (SUB, "person@example.com"))

    def test_metadata_email_cannot_impersonate_existing_account(self):
        with self.assertRaisesRegex(ValueError, "email claim"):
            verified_supabase_identity({"sub": SUB, "user_metadata": {"email": "owner@example.com"}})

    def test_missing_or_non_uuid_subject_rejected(self):
        for sub in (None, "", "someone@example.com", "not-a-uuid"):
            with self.subTest(sub=sub), self.assertRaises(ValueError):
                verified_supabase_identity({"sub": sub, "email": "user@example.com"})

    def test_invalid_email_claims_rejected(self):
        for email in (None, "", "missing-at", "x@", "x y@example.com", "x@example.com\n", "x@x."):
            with self.subTest(email=email), self.assertRaises(ValueError):
                verified_supabase_identity({"sub": SUB, "email": email})

    def test_metadata_cannot_override_signed_email(self):
        claims = {"sub": SUB, "email": "real@example.com", "user_metadata": {"email": "victim@example.com"}}
        self.assertEqual(verified_supabase_identity(claims)[1], "real@example.com")


if __name__ == "__main__":
    unittest.main()
