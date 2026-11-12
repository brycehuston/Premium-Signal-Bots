import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

// Mock only the network/services; import and exercise the actual Edge handler.
const gateway = 'a'.repeat(64);
const gatewayHash = createHash('sha256').update(gateway).digest('hex');
const ownerId = '00000000-0000-4000-8000-000000000011';
const outsiderId = '00000000-0000-4000-8000-000000000022';
const memberId = '00000000-0000-4000-8000-000000000033';
const keys = {
  owner: 'owner-token-mock-supabase-jwt-0001',
  outsider: 'outsider-token-mock-supabase-jwt-02',
  member: 'member-token-mock-supabase-jwt-003',
};
let ownerRowPresent = true;
let memberOnline = true;
let memberActive = true;
const env = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'fake-service-key-for-tests-only',
  ALPHA_MEMBERSHIP_API_BASE: 'https://members.example.test',
};
let handler;
globalThis.Deno = {
  env: { get: (key) => env[key] },
  serve: (callback) => { handler = callback; },
};
const json = (data,status=200) => Response.json(data,{status});
let writes=0;
globalThis.fetch = async (input,init={}) => {
  const url = new URL(input);
  if(url.pathname === '/rest/v1/alpha_intelligence_gateway')
    return json([{token_sha256:gatewayHash}]);
  if(url.pathname === '/auth/v1/user') {
    const bearer = init.headers?.Authorization;
    if(bearer === 'Bearer '+keys.owner) return json({id:ownerId,email:'owner@example.test'});
    if(bearer === 'Bearer '+keys.outsider) return json({id:outsiderId,email:'outsider@example.test'});
    if(bearer === 'Bearer '+keys.member) return json({id:memberId,email:'member@example.test'});
    return json({error:'invalid'},401);
  }
  if(url.pathname === '/rest/v1/alpha_v4_archive')
    return json(ownerRowPresent?[{owner_user_id:ownerId}]:[]);
  if(url.pathname === '/rest/v1/alpha_intelligence_snapshot') {
    if(init.method==='POST') {writes++;return json({error:'no writes permitted'},403);}
    return json([{
      captured_at:new Date().toISOString(),
      owner_dataset:{private_marker:'owner-only'},
      subscriber_report:{state:'ready',tier:'subscriber',delay_hours:24,as_of_utc:new Date(Date.now()-24*3600000).toISOString(),daily:[],lanes:[]},
      public_movers:null,
    }]);
  }
  if(url.origin === 'https://members.example.test' && url.pathname === '/me') {
    assert.equal(init.headers.Authorization, 'Bearer '+keys.member);
    if(!memberOnline) throw Error('membership backend unavailable');
    return json({email:'member@example.test',role:'user',plan:'alpha-trend-alerts',is_active:memberActive});
  }
  throw Error('Unexpected fetch destination: '+url.pathname);
};
await import('../../supabase/functions/alpha-insights/index.ts');
assert.equal(typeof handler,'function');
async function read(view,token,options={}){
  const headers = new Headers();
  if(!options.noGateway)headers.set('x-alpha-gateway',gateway);
  if(token)headers.set('authorization','Bearer '+token);
  headers.set('x-alpha-tier',options.tier??view);
  const res=await handler(new Request('https://test.supabase.co/functions/v1/alpha-insights?view='+view,{headers}));
  return {status:res.status,body:await res.json()};
}

test('valid owner receives owner-only dataset',async()=>{
  const x=await read('owner',keys.owner);
  assert.equal(x.status,200);assert.equal(x.body.tier,'owner');
  assert.equal(x.body.dataset.private_marker,'owner-only');
});
test('signed-in unrelated user and forged tier cannot read owner data',async()=>{
  assert.equal((await read('owner',keys.outsider)).status,403);
  assert.equal((await read('owner',keys.member,{tier:'subscriber'})).status,403);
  assert.equal((await read('owner',keys.owner,{noGateway:true})).status,403);
});
test('unverified session rejected',async()=>{
  assert.equal((await read('owner',null)).status,403);
  assert.equal((await read('owner','bad-unknown-token-length-12345')).status,401);
});
test('valid subscriber gets delayed aggregate only, not owner dataset',async()=>{
  const x=await read('subscriber',keys.member);
  assert.equal(x.status,200);assert.equal(x.body.tier,'subscriber');
  assert.equal(x.body.delay_hours,24);
  assert.equal(x.body.dataset,undefined);
});
test('inactive subscription and backend outage deny subscriber request',async()=>{
  memberActive=false;
  assert.equal((await read('subscriber',keys.member)).status,403);
  memberActive=true;memberOnline=false;
  assert.equal((await read('subscriber',keys.member)).status,503);
  memberOnline=true;
});
test('missing membership configuration fails closed',async()=>{
  const old=env.ALPHA_MEMBERSHIP_API_BASE;env.ALPHA_MEMBERSHIP_API_BASE='';
  assert.equal((await read('subscriber',keys.member)).status,503);
  env.ALPHA_MEMBERSHIP_API_BASE=old;
});
test('missing private owner record fails closed',async()=>{
  ownerRowPresent=false;
  assert.equal((await read('owner',keys.owner)).status,503);
  ownerRowPresent=true;
});
test('public read remains available and unsigned ingestion stays rejected',async()=>{
  const publicRes=await handler(new Request('https://test.supabase.co/functions/v1/alpha-insights?view=public'));
  assert.equal(publicRes.status,200);
  assert.equal((await publicRes.json()).state,'unavailable');
  const put=await handler(new Request('https://test.supabase.co/functions/v1/alpha-insights?view=ingest',{method:'PUT',body:JSON.stringify({signed_body:'{}',signature:'0'.repeat(128)})}));
  assert.equal(put.status,403);
  assert.equal(writes,0);
});
