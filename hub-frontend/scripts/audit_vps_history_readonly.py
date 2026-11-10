#!/usr/bin/env python3
"""Aggregate-only audit for an owner-authenticated SSH session. NEVER exports row IDs."""
import csv, hashlib, json, re
from pathlib import Path
from collections import Counter
root=Path('/home/ubuntu/worktrees/alpha-alerts-live-v196-20261101')
paths={
 'canonical':root/'logs/TREND_token_alerts.csv',
 'features':root/'logs/TREND_alert_features.csv',
 'post_delivery':root/'logs/mev_alert_log.csv',
 'outcomes':root/'reports/runtime/TREND_outcomes.csv',
}
summary={}
cache={}
for label,path in paths.items():
 try:
  if not path.is_file() or path.is_symlink() or path.stat().st_size>250_000_000:raise ValueError('missing/unsafe/oversized')
  with path.open(newline='',encoding='utf-8-sig') as f:
   dr=csv.DictReader(f);heads=dr.fieldnames or []
   rows=list(dr)
  cache[label]=rows
  audit_fields=[c for c in heads if any(term in c.lower() for term in ('event_id','alert_id','telegram','delivery','message_id','status','timestamp'))]
  summary[label]={'rows':len(rows),'audit_fields':audit_fields,'event_id_column':'event_id' in heads,'alert_id_column':'alert_id' in heads}
 except (OSError,ValueError) as e:summary[label]={'error':type(e).__name__}
C={r.get('event_id'):r for r in cache.get('canonical',[]) if r.get('event_id')}
F={r.get('event_id'):r for r in cache.get('features',[]) if r.get('event_id')}
joined=C.keys()&F.keys()
outcomes=cache.get('outcomes',[])
alerts_by_outcome=Counter(r.get('alert_id') for r in outcomes if r.get('alert_id'))
features_ids=[r.get('event_id') for r in cache.get('features',[]) if r.get('event_id')]
source_path=root/'alpha_trend_alerts.py'
producer={}
try:
 text=source_path.read_text(encoding='utf-8')
 producer={'sha256':hashlib.sha256(text.encode('utf-8')).hexdigest(),
  'features_call_lines':[i for i,line in enumerate(text.splitlines(),1) if re.search(r'(?<!def )_log_alert_features_csv\s*\(',line)],
  'pre_send_candidate_flush':text.find('TOKEN_ALERT_PRE_TELEGRAM_FLUSHED')>=0,
  'telegram_delivery_result_present':'_telegram_delivery_metadata(' in text,
  'delivered_status_assignment':'token["delivery_status"] = "DELIVERED"' in text}
except OSError as e:producer={'error':type(e).__name__}
print(json.dumps({'mode':'READ_ONLY_AGGREGATE_ONLY','files':summary,'producer':producer,
 'canonical_feature_join':len(joined),'features_duplicate_event_ids':len(features_ids)-len(set(features_ids)),
 'outcomes_with_joined_alert_id':sum(1 for r in outcomes if r.get('alert_id') in joined),
 'outcome_status_counts':dict(Counter((r.get('status') or 'UNKNOWN').upper() for r in outcomes)),
 'direct_telegram_delivery_independently_verified':False},indent=2,sort_keys=True))