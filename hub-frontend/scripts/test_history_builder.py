import unittest
from datetime import datetime, timezone
from build_validated_history import audit, confirmed_receipt

CHAT = '-100123'
T='2026-11-07T04:00:00Z'
A={"event_id":"event_001", "mint":"mint123", "alert_lane":"R8_RECLAIM", "timestamp_utc":T, "symbol":"RECL", "mc":"56000","liq":"22000","m5_tx":"103"}
F={**A}
R={**A,"delivery_status":"DELIVERED","evidence_source":"telegram_api_response","channel_class":"PUBLIC","approved_for_history":"true","telegram_message_id":"42","telegram_chat_id":CHAT}
O={"alert_id":"event_001","mint":"mint123","status":"DONE","max_multiple":"3.4"}

class HistorySafetyTests(unittest.TestCase):
 def test_joined_direct_receipt(self):
  rows,c=audit([A],[F],[R],CHAT,[O]);self.assertEqual(len(rows),1);self.assertEqual(rows[0]["lane"],"RECLAIM");self.assertEqual(rows[0]["observed_max_multiple"],3.4)
 def test_no_receipt_no_history(self):
  rows,_=audit([A],[F],[],CHAT);self.assertEqual(rows,[])
 def test_candidate_is_not_receipt(self):
  rows,_=audit([A],[F],[{**R,"evidence_source":"candidate_csv"}],CHAT);self.assertEqual(rows,[])
 def test_no_privilege_leak_to_elite(self):
  rows,_=audit([A],[F],[{**R,"channel_class":"ELITE"}],CHAT);self.assertEqual(rows,[])
 def test_wrong_chat(self):
  rows,_=audit([A],[F],[{**R,"telegram_chat_id":"-100999"}],CHAT);self.assertEqual(rows,[])
 def test_duplicates_fail_closed(self):
  rows,c=audit([A],[F],[R,R],CHAT);self.assertEqual(rows,[]);self.assertEqual(c["receipt_duplicate_ids"],1)
 def test_timestamp_mismatch(self):
  rows,_=audit([A],[F],[{**R,"timestamp_utc":"2026-11-07T04:00:01Z"}],CHAT);self.assertEqual(rows,[])
 def test_mint_mismatch(self):
  rows,_=audit([A],[{**F,"mint":"other"}],[R],CHAT);self.assertEqual(rows,[])
 def test_pending_outcomes_not_profit(self):
  rows,_=audit([A],[F],[R],CHAT,[{**O,"status":"PENDING"}]);self.assertIsNone(rows[0]["observed_max_multiple"])
 def test_no_outcomes_is_valid_alert(self):
  rows,_=audit([A],[F],[R],CHAT);self.assertEqual(len(rows),1);self.assertEqual(rows[0]["outcome_status"],"UNAVAILABLE")
 def test_bad_receipt_status(self):
  rows,_=audit([A],[F],[{**R,"delivery_status":"FAILED"}],CHAT);self.assertEqual(rows,[])
 def test_no_chat_approval(self):
  with self.assertRaises(ValueError):audit([A],[F],[R],"")
 def test_untrusted_score_never_exported(self):
  rows,_=audit([{**A,"score":"10"}],[F],[R],CHAT);self.assertNotIn("score",rows[0])

if __name__=='__main__':unittest.main()