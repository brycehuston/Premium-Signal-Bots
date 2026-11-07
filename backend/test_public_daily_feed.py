import hashlib
import hmac
import json
import os
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch
import sys

from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from backend.public_daily_feed import router

SECRET = "test-only-long-hmac-shared-secret-123456789012345"


def signed(rows=None,updated=None):
    now=datetime.now(timezone.utc)
    body={"version":1,"source":"confirmed-telegram-delivery",
          "updated_at_utc":(updated or now).isoformat().replace("+00:00","Z"),
          "daily_alerts":rows if rows is not None else []}
    raw=json.dumps(body,separators=(",",":"))
    return {"signed_body":raw,"signature":hmac.new(SECRET.encode(),raw.encode(),hashlib.sha256).hexdigest()}


def row():
    return {"event_id":"9"*32,"symbol":"TEST","lane":"RECLAIM",
            "timestamp_utc":(datetime.now(timezone.utc)-timedelta(hours=1)).isoformat().replace("+00:00","Z"),
            "score":8.4,"alert_mc":31000.0,"liquidity_usd":15000.0,"m5_tx":None,
            "approved_for_public":True,"delivery_status":"DELIVERED"}


class FeedRelayTest(unittest.TestCase):
    def setUp(self):
        self.dir=tempfile.TemporaryDirectory()
        app=FastAPI();app.include_router(router)
        self.client=TestClient(app)
        self.patcher=patch.dict(os.environ,{"ALPHA_PUBLIC_DAILY_FEED_SECRET":SECRET,
            "ALPHA_PUBLIC_DAILY_FEED_STORE":str(Path(self.dir.name)/"feed.json")})
        self.patcher.start()

    def tearDown(self):
        self.patcher.stop();self.client.close();self.dir.cleanup()

    def test_post_and_fetch_only_signed_public_fields(self):
        env=signed([row()])
        self.assertEqual(self.client.put("/public/daily-feed",json=env).status_code,200)
        got=self.client.get("/public/daily-feed")
        self.assertEqual(got.status_code,200)
        self.assertEqual(got.json(),env)
        self.assertNotIn("telegram_message_id",json.dumps(got.json()))
        self.assertNotIn("SECRET_MINT",json.dumps(got.json()))

    def test_bad_signature_rejected(self):
        env=signed([row()]);env["signature"]="0"*64
        self.assertEqual(self.client.put("/public/daily-feed",json=env).status_code,403)
        self.assertEqual(self.client.get("/public/daily-feed").status_code,503)

    def test_future_stale_and_too_recent_row_rejected(self):
        old=signed([],datetime.now(timezone.utc)-timedelta(minutes=30))
        self.assertEqual(self.client.put("/public/daily-feed",json=old).status_code,403)
        soon=row();soon["timestamp_utc"]=(datetime.now(timezone.utc)-timedelta(minutes=5)).isoformat().replace("+00:00","Z")
        self.assertEqual(self.client.put("/public/daily-feed",json=signed([soon])).status_code,403)

    def test_replay_does_not_rewrite(self):
        env=signed([row()]);first=self.client.put("/public/daily-feed",json=env).json()
        again=self.client.put("/public/daily-feed",json=env).json()
        self.assertTrue(first["updated"]);self.assertFalse(again["updated"])

    def test_reject_private_extra_data(self):
        private=row();private["telegram_message_id"]=77
        self.assertEqual(self.client.put("/public/daily-feed",json=signed([private])).status_code,403)

    def test_unconfigured_no_feed(self):
        with patch.dict(os.environ,{"ALPHA_PUBLIC_DAILY_FEED_SECRET":""}):
            self.assertEqual(self.client.put("/public/daily-feed",json=signed([])).status_code,503)
            self.assertEqual(self.client.get("/public/daily-feed").status_code,503)

    def test_oversized_payload(self):
        self.assertEqual(self.client.put("/public/daily-feed",content=b'x'*300000).status_code,413)


if __name__=="__main__":unittest.main()
