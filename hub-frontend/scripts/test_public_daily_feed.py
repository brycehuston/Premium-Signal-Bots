import datetime as dt
import hashlib
import hmac
import json
import unittest

from build_public_daily_feed import build

NOW = dt.datetime(2026, 11, 4, 18, 0, tzinfo=dt.timezone.utc)
SECRET = "test-only-not-for-production-secret-1234567890"


def item(i, score=8.4, **kw):
    x = dict(event_id=f"event_{i:07d}", symbol="ALPHA", lane="GENESIS",
             timestamp_utc="2026-11-04T16:00:00Z", score=score,
             alert_mc=50000, liquidity_usd=18000, m5_tx=350,
             delivery_status="DELIVERED", approved_for_public=True,
             telegram_message_id=i, telegram_chat_id="private", mint="secret_mint",
             text="secret message")
    x.update(kw)
    return json.dumps(x)


class PublicDailyTest(unittest.TestCase):
    def test_signed_and_private_fields_removed(self):
        data = build([item(1)], SECRET, NOW)
        expected = hmac.new(SECRET.encode(), data["signed_body"].encode(), hashlib.sha256).hexdigest()
        self.assertEqual(data["signature"], expected)
        self.assertNotIn("private", json.dumps(data))
        self.assertNotIn("secret_mint", json.dumps(data))
        self.assertNotIn("event_0000001", data["signed_body"])
        self.assertRegex(json.loads(data["signed_body"])["daily_alerts"][0]["event_id"], r"^[0-9a-f]{32}$")
        self.assertNotIn("telegram_message_id", json.dumps(data))
        self.assertEqual(json.loads(data["signed_body"])["daily_alerts"][0]["score"], 8.4)

    def test_rejects_undelivered_unapproved_and_too_recent(self):
        data = build([item(1), item(2, delivery_status="FAILED"),
                      item(3, approved_for_public=False),
                      item(4, timestamp_utc="2026-11-04T17:45:00Z"),
                      item(5, score=11), item(6, timestamp_utc="2026-11-03T12:00:00Z")], SECRET, NOW)
        self.assertEqual(len(json.loads(data["signed_body"])["daily_alerts"]), 1)

    def test_rank_score_and_dedup(self):
        data = build([item(1, score=5), item(2, score=9), item(1, score=7)], SECRET, NOW)
        ranked = json.loads(data["signed_body"])["daily_alerts"]
        self.assertEqual([i["score"] for i in ranked], [9, 7])

    def test_no_weak_secret(self):
        with self.assertRaises(ValueError):
            build([item(1)], "abc", NOW)


if __name__ == "__main__":
    unittest.main()
