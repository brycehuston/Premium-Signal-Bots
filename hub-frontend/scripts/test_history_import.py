import json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from import_validated_history import validate_doc,endpoint,main
from test_history_builder import A,F,R,CHAT
from build_validated_history import audit

class ValidatedImportTests(unittest.TestCase):
 def write(self,records):
  tmp=tempfile.TemporaryDirectory()
  p=Path(tmp.name)/'audit.json'
  p.write_text(json.dumps({'schema_version':1,'records':records}),encoding='utf-8')
  self.addCleanup(tmp.cleanup)
  return p
 def baseline(self):
  return audit([A],[F],[R],CHAT)[0]
 def test_valid_direct_receipt_payload(self):
  r,d=validate_doc(self.write(self.baseline()));self.assertEqual(len(r),1);self.assertEqual(len(d),64)
 def test_no_candidates_without_receipt(self):
  with self.assertRaises(ValueError):validate_doc(self.write([]))
 def test_duplicate_id_fails(self):
  a=self.baseline()[0];with_doc=self.write([a,a]);
  with self.assertRaisesRegex(ValueError,'duplicate'):validate_doc(with_doc)
 def test_fake_proof_fails(self):
  a={**self.baseline()[0],'proof_kind':'CANDIDATE_CSV'}
  with self.assertRaisesRegex(ValueError,'non-direct'):validate_doc(self.write([a]))
 def test_wrong_destination_fails(self):
  with self.assertRaises(ValueError):endpoint('https://evil.example','ennbnofvmnkcuhftzlhr')
 def test_valid_destination(self):
  self.assertIn('/alpha_history_events?',endpoint('https://ennbnofvmnkcuhftzlhr.supabase.co','ennbnofvmnkcuhftzlhr'))
 def test_dry_run_does_not_touch_network(self):
  import sys
  p=self.write(self.baseline())
  with patch.object(sys,'argv',['import_validated_history.py','--input',str(p)]),patch('import_validated_history.upsert') as op:
   main();op.assert_not_called()
 def test_apply_requires_review_and_destination(self):
  import sys
  p=self.write(self.baseline())
  with patch.object(sys,'argv',['import_validated_history.py','--input',str(p),'--apply']):
   with self.assertRaises(SystemExit):main()

if __name__=='__main__':unittest.main()