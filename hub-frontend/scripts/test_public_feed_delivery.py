"""Fail-closed synthetic regression tests. No production files or keys read."""
import csv
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from public_feed_delivery import confirmed_feature_index, has_matching_post_send_feature

BASE = {"event_id": "e1", "mint": "mint111", "alert_lane": "R8_RECLAIM", "timestamp_utc": "2026-11-07T08:00:00Z"}


class FeatureProofTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / "features.csv"

    def write(self, rows, fields=None):
        cols = fields or list(BASE)
        with self.path.open("w", newline="", encoding="utf-8") as h:
            writer = csv.DictWriter(h, fieldnames=cols)
            writer.writeheader()
            writer.writerows(rows)
        return confirmed_feature_index(self.path)

    def test_exact_join(self):
        self.assertTrue(has_matching_post_send_feature(BASE, self.write([BASE])))

    def test_alias_normalization(self):
        row = {**BASE, "alert_lane": "RECLAIM"}
        self.assertTrue(has_matching_post_send_feature(row, self.write([BASE])))

    def test_missing_id_fails_closed(self):
        self.assertFalse(has_matching_post_send_feature({**BASE, "event_id": "unknown"}, self.write([BASE])))

    def test_mint_mismatch_fails_closed(self):
        self.assertFalse(has_matching_post_send_feature({**BASE, "mint": "different"}, self.write([BASE])))

    def test_lane_mismatch_fails_closed(self):
        self.assertFalse(has_matching_post_send_feature({**BASE, "alert_lane": "TREND"}, self.write([BASE])))

    def test_timestamp_mismatch_fails_closed(self):
        self.assertFalse(has_matching_post_send_feature({**BASE, "timestamp_utc": "2026-11-07T08:00:01Z"}, self.write([BASE])))

    def test_duplicate_feature_id_disqualified(self):
        idx = self.write([BASE, BASE])
        self.assertNotIn("e1", idx)
        self.assertFalse(has_matching_post_send_feature(BASE, idx))

    def test_schema_mismatch_fails_closed(self):
        with self.assertRaisesRegex(ValueError, "schema changed"):
            self.write([{"event_id": "e1"}], ["event_id"])

    def test_bad_lane_excluded(self):
        self.assertEqual({}, self.write([{**BASE, "alert_lane": "DEGEN_SNIPER"}]))

    def test_empty_file_fails_closed(self):
        self.path.write_text("")
        with self.assertRaises(ValueError):
            confirmed_feature_index(self.path)

    def test_symlink_fails_closed(self):
        target = Path(self.temp.name) / "target.csv"
        target.write_text("event_id,mint,alert_lane,timestamp_utc\n")
        self.path.symlink_to(target)
        with self.assertRaisesRegex(ValueError, "unsafe"):
            confirmed_feature_index(self.path)


if __name__ == "__main__":
    unittest.main()
