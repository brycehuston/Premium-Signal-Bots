import datetime as dt
import pathlib
import sys
import unittest
sys.path.insert(0,str(pathlib.Path(__file__).parent))
from build_postsend_history import build

UTC=dt.timezone.utc
T="2026-11-10T22:00:00Z"
A={"event_id":"EVENT_00001","mint":"mint0001","alert_lane":"R8_RECLAIM","timestamp_utc":T}
F={**A,"symbol":"A1","mc":"67000","liq":"14000","m5_tx":"120"}
O={"alert_id":"EVENT_00001","mint":"mint0001","delivery_status":"DELIVERED","status":"DONE","max_multiple":"7.4"}
HASH="a"*64
NOW=dt.datetime(2026,11,11,tzinfo=UTC)

def run(c=None,f=None,o=None,since="2026-11-09T21:42:32Z"):
    return build([A] if c is None else c,[F] if f is None else f,[O] if o is None else o,since_utc=since,source_sha256=HASH,read_at=NOW)

class Audit(unittest.TestCase):
    def test_joins_three_sources(self):
        r,c=run();self.assertEqual(len(r),1);self.assertEqual(c["runtime_correlated_events"],1);self.assertEqual(r[0]["lane"],"RECLAIM")
    def test_never_marks_public_delivery(self):
        r,_=run();self.assertFalse(r[0]["public_delivery_verified"]);self.assertFalse(r[0]["approved_for_history"])
    def test_no_peak_claims(self):
        r,_=run();self.assertIsNone(r[0]["observed_max_multiple"]);self.assertEqual(r[0]["outcome_status"],"UNAVAILABLE")
    def test_before_attested_runtime_rejected(self):
        r,_=run(since="2026-11-10T23:00:00Z");self.assertEqual(r,[])
    def test_future_event_rejected(self):
        r,_=run(f=[{**F,"timestamp_utc":"2026-11-12T22:00:00Z"}]);self.assertEqual(r,[])
    def test_missing_outcome_rejected(self):
        r,_=run(o=[]);self.assertEqual(r,[])
    def test_delivery_failed_rejected(self):
        r,_=run(o=[{**O,"delivery_status":"FAILED"}]);self.assertEqual(r,[])
    def test_wrong_mint_rejected(self):
        r,_=run(o=[{**O,"mint":"another"}]);self.assertEqual(r,[])
    def test_timestamp_mismatch_rejected(self):
        r,_=run(f=[{**F,"timestamp_utc":"2026-11-10T22:00:01Z"}]);self.assertEqual(r,[])
    def test_lane_mismatch_rejected(self):
        r,_=run(f=[{**F,"alert_lane":"TREND"}]);self.assertEqual(r,[])
    def test_duplicate_features_fail(self):
        r,_=run(f=[F,F]);self.assertEqual(r,[])
    def test_duplicate_outcomes_fail(self):
        r,_=run(o=[O,O]);self.assertEqual(r,[])
    def test_duplicate_canonical_fail(self):
        r,_=run(c=[A,A]);self.assertEqual(r,[])
    def test_unknown_lane_fails(self):
        r,_=run(c=[{**A,"alert_lane":"UNKNOWN"}],f=[{**F,"alert_lane":"UNKNOWN"}]);self.assertEqual(r,[])
    def test_invalid_symbol_fails(self):
        r,_=run(f=[{**F,"symbol":"<script>"}]);self.assertEqual(r,[])
    def test_invalid_event_id_rejected(self):
        r,_=run(c=[{**A,"event_id":"<a_bad_id>"}],f=[{**F,"event_id":"<a_bad_id>"}],o=[{**O,"alert_id":"<a_bad_id>"}]);self.assertEqual(r,[])
    def test_invalid_pin_fails(self):
        with self.assertRaises(ValueError):build([A],[F],[O],since_utc="2026-11-09T21:42:32Z",source_sha256="bad",read_at=NOW)

if __name__=="__main__":unittest.main()