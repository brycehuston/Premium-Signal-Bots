import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizePrivateTier as authorize } from '../../supabase/functions/alpha-insights/tier-auth.ts';
const owner={id:'00000000-0000-4000-8000-000000000011',email:'owner@example.test'};
const outsider={id:'00000000-0000-4000-8000-000000000022',email:'user@example.test'};
const member={id:'00000000-0000-4000-8000-000000000033',email:'member@example.test'};
const origin='https://membership.example.test';
const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json'}});
const db=async(p)=> {assert.match(p,/^alpha_v4_archive\?select=owner_user_id/);return json([{owner_user_id:owner.id}]);};
const profile={email:member.email,role:'user',plan:'alpha-trend-alerts',is_active:true};
const backend=async(url,init)=> { assert.equal(url,origin+'/me');assert.equal(init.headers.Authorization,'Bearer test-jwt');assert.equal(init.redirect,'error');return json(profile);};
const run=(view,user,dbRead=db,http=backend,base=origin)=> authorize(view,user,'Bearer test-jwt',dbRead,http,base);

test('owner exact id allowed; non-owner denied',async()=>{
 assert.equal(await run('owner',owner),'allowed');
 assert.equal(await run('owner',outsider),'forbidden');
});
test('owner cannot bypass missing/corrupt private owner record',async()=>{
 assert.equal(await run('owner',owner,async()=>json([])),'unavailable');
 assert.equal(await run('owner',owner,async()=>json([{owner_user_id:null}])),'unavailable');
 assert.equal(await run('owner',owner,async()=>json({},503)),'unavailable');
 assert.equal(await run('owner',owner,async()=>{throw Error('db offline')}),'unavailable');
});
test('active verified subscription allowed; exact backend bearer forwarded',async()=>{
 assert.equal(await run('subscriber',member),'allowed');
});
test('all approved plans accepted only while active',async()=>{
 for(const plan of ['alpha-early-alerts','alpha-trend-alerts','alpha-runner-alerts','alpha-bundle']) {
  assert.equal(await run('subscriber',member,db,async()=>json({...profile,plan})),'allowed');
 }
 for(const p of [{...profile,is_active:false},{...profile,plan:'free'}, {...profile,role:'admin'}, {...profile,email:'another@example.test'}, {...profile,email:undefined}, {...profile,plan:42},null]) {
  assert.equal(await run('subscriber',member,db,async()=>json(p)),'forbidden');
 }
});
test('subscriber status 401/403 forbidden, 5xx/timeout unavailable',async()=>{
 for(const code of [401,403])assert.equal(await run('subscriber',member,db,async()=>json({},code)),'forbidden');
 assert.equal(await run('subscriber',member,db,async()=>json({},503)),'unavailable');
 assert.equal(await run('subscriber',member,db,async()=>{throw Error('offline')}),'unavailable');
});
test('malformed/missing configured backend URL fails closed',async()=>{
 for(const base of ['', 'http://membership.example.test','https://membership.example.test/redirect', 'https://a@example.test', 'not a url']) {
  assert.equal(await run('subscriber',member,db,backend,base),'unavailable');
 }
});
test('subscriber missing email, invalid id, unknown tier denied',async()=>{
 assert.equal(await run('subscriber',{id:member.id,email:null}),'forbidden');
 assert.equal(await run('subscriber',{id:'not-a-uuid',email:member.email}),'forbidden');
 assert.equal(await run('admin',member),'forbidden');
});
