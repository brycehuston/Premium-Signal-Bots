from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parent.parent
class SecureArchitectureTests(unittest.TestCase):
 def test_database_rls(self):
  s=(ROOT/'sql/STAGED_alpha_history_schema.sql').read_text()
  self.assertIn('ENABLE ROW LEVEL SECURITY',s)
  self.assertIn('FROM PUBLIC, anon, authenticated',s)
  self.assertIn('TO service_role',s)
  self.assertNotIn('SECURITY DEFINER',s.replace('No publicly callable SECURITY DEFINER functions.',''))
 def test_server_auth_before_history_select(self):
  s=(ROOT/'app/api/history/route.ts').read_text()
  self.assertLess(s.index('auth.auth.getUser(token)'),s.index('alpha_history_events'))
  self.assertLess(s.index('isEntitled(profile)'),s.index('alpha_history_events'))
  self.assertIn('private, no-store',s)
  self.assertNotIn('NEXT_PUBLIC_HISTORY_SERVICE',s)
 def test_no_browser_archive(self):
  s=(ROOT/'app/dashboard/history/page.tsx').read_text()
  self.assertNotIn('IMPORT',s)
  self.assertIn('SIGN IN',s)
 def test_explicit_metrics_disclaimer(self):
  s=(ROOT/'app/dashboard/history/page.tsx').read_text()
  self.assertIn('not P&L',s)
  self.assertIn('NO VERIFIED EXIT DATA',s)
if __name__=='__main__':unittest.main()