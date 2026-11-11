"""Offline signed post-send envelope tamper/contract checks."""
import json
import sys
import tempfile
import unittest
from datetime import datetime,timezone
from pathlib import Path
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
sys.path.insert(0,str(Path(__file__).resolve().parent))
from signed_delivery_receipts import load_signed_receipts

class SignedReceipts(unittest.TestCase):
 def setUp(self):
  self.t=tempfile.TemporaryDirectory();self.addCleanup(self.t.cleanup)
  self.p=Path(self.t.name)/"receipts.json";self.sk=Ed25519PrivateKey.generate()
  self.pk=self.sk.public_key().public_bytes(serialization.Encoding.Raw,serialization.PublicFormat.Raw).hex()
  self.sha="a"*64
  self.row={"event_id":"evt_0000000001","mint":"MINT","alert_lane":"TREND",
            "timestamp_utc":"2026-11-06T18:00:00Z","delivered_at_utc":"2026-11-06T18:00:02Z",
            "delivery_status":"DELIVERED","evidence_source":"telegram_api_response",
            "channel_class":"PUBLIC","approved_for_history":True,
            "telegram_message_id":11,"telegram_chat_id":-100123456}
  self.write()
 def write(self,rows=None,sha=None):
  body=json.dumps({"version":1,"source":"alpha-history-post-send-receipts",
         "producer_sha256":sha or self.sha,"generated_at_utc":datetime.now(timezone.utc).isoformat().replace("+00:00","Z"),
         "receipts":rows if rows is not None else [self.row]},separators=(",",":"))
  self.p.write_text(json.dumps({"signed_body":body,"signature":self.sk.sign(body.encode()).hex()}))
 def load(self,pk=None,sha=None):return load_signed_receipts(str(self.p),pk or self.pk,sha or self.sha)
 def test_good_signed_contract(self):self.assertEqual(len(self.load()),1)
 def test_forgery(self):
  d=json.loads(self.p.read_text());d["signed_body"]+=" "
  self.p.write_text(json.dumps(d));self.assertRaisesRegex(ValueError,"signature",self.load)
 def test_wrong_key(self):self.assertRaisesRegex(ValueError,"signature",lambda:self.load("c"*64))
 def test_unapproved_sha(self):self.assertRaisesRegex(ValueError,"producer",lambda:self.load(sha="b"*64))
 def test_failed_delivery_not_exported(self):self.write([{**self.row,"delivery_status":"FAILED"}]);self.assertEqual(self.load(),[])
 def test_elite_not_exported(self):self.write([{**self.row,"channel_class":"ELITE"}]);self.assertEqual(self.load(),[])
 def test_future_delivery_rejected(self):
  self.write([{**self.row,"delivered_at_utc":"2099-11-06T18:00:02Z"}]);self.assertRaises(ValueError,self.load)
 def test_missing_message_rejected(self):
  self.write([{**self.row,"telegram_message_id":0}]);self.assertRaises(ValueError,self.load)
 def test_missing_producer_sha(self):
  d=json.loads(self.p.read_text());body=json.loads(d["signed_body"]);del body["producer_sha256"]
  updated=json.dumps(body,separators=(",",":"));d={"signed_body":updated,"signature":self.sk.sign(updated.encode()).hex()}
  self.p.write_text(json.dumps(d));self.assertRaisesRegex(ValueError,"producer",self.load)
 def test_symlink_rejected(self):
  moved=Path(self.t.name)/"else.json";self.p.rename(moved);self.p.symlink_to(moved)
  self.assertRaisesRegex(ValueError,"unsafe",self.load)
if __name__=="__main__":unittest.main()