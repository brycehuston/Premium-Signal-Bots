import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";

const base=process.env.BASE_URL||"http://127.0.0.1:3000";
const out=path.join(process.cwd(),"qa-screenshots","lane-motion");
const user={
 id:"00000000-0000-4000-8000-000000000011",aud:"authenticated",role:"authenticated",
 email:"owner@example.test",app_metadata:{provider:"google",providers:["google"]},
 user_metadata:{},created_at:"2026-11-01T00:00:00.000Z"
};
const session={access_token:"mock-owner-browser-session",refresh_token:"test-browser-refresh",
 token_type:"bearer",expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user};
const day=(date,a,f)=>({date_pt:date,all_alerts:a,first_mints:f,EARLY:a-2,GENESIS:1,
 RECLAIM:1,TREND:0,STRICT:0,RUNNER:0});
const hour=(date,pulse)=>({date_pt:date,dow:"Wed",clock_hour_pt:17,pulse_mode:pulse,
 all_alerts:3,first_mints:1,EARLY:1,GENESIS:1,RECLAIM:1,TREND:0,STRICT:0,RUNNER:0});
const dataset={
 daily:[day("2026-11-10",5,2),day("2026-11-11",7,3)],
 hourly:[hour("2026-11-10","RISK_ON"),hour("2026-11-11","UNKNOWN")],
 first:[],regimes:[],transitions:[],
 summary:{start:"2026-11-10",end:"2026-11-11",messages:12,mint:5,lane:12,heartbeat:0,pulse:0}
};
const body={state:"ready",tier:"owner",as_of_utc:"2026-11-11T23:30:00.000Z",dataset};
const headers={"content-type":"application/json","cache-control":"no-store"};
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
try{
 for(const [label,reduced,width] of [["normal",false,1440],["reduced",true,390]]){
  const context=await browser.newContext({
   viewport:{width,height:900},reducedMotion:reduced?"reduce":"no-preference"
  });
  await context.addCookies([{name:"sb-test-auth-token",
   value:"base64-"+Buffer.from(JSON.stringify(session),"utf8").toString("base64url"),
   url:base,expires:Math.floor(Date.now()/1000)+3600,httpOnly:false,secure:false,sameSite:"Lax"}]);
  const page=await context.newPage();
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.route("https://test.supabase.co/**",async route=>{
   await route.fulfill({status:200,headers,body:JSON.stringify(
    route.request().url().includes("/auth/v1/user")?user:{user,session})});
  });
  await page.route("**/api/intelligence/access",async route=>{
   await route.fulfill({status:200,headers,body:JSON.stringify({state:"owner",delay_hours:0})});
  });
  await page.route("**/api/intelligence/archive",async route=>{
   await route.fulfill({status:503,headers,body:JSON.stringify({state:"unavailable"})});
  });
  await page.route("**/api/intelligence/data",async route=>{
   await route.fulfill({status:200,headers,body:JSON.stringify(body)});
  });
  try{
   const res=await page.goto(base+"/dashboard/intelligence",{waitUntil:"domcontentloaded",timeout:30000});
   assert.equal(res?.status(),200);
   await page.getByText("AUTO SYNC ACTIVE",{exact:true}).waitFor({timeout:15000});
   await page.locator(".ai-metric strong").first().waitFor();
   const brand=page.locator(".ai-brand-link");
   assert.equal(await brand.locator('img[src="/alpha-lane-v4-logo.png"]').count(),1,
    "existing homepage logo must remain unchanged");
   assert.equal(await page.locator(".ai-metric").count(),4);
   assert.equal(await page.locator(".ai-day-bars i").count(),4,"two existing daily bar pairs");
   assert.ok(await page.locator(".ai-bar .ai-track>div").count()>0);
   assert.equal(await page.locator(".ai-donut-ring").count(),1,"existing lane-share donut");
   const styles=await page.evaluate(()=>{
    const style=selector=>getComputedStyle(document.querySelector(selector));
    return {
     metric:style(".ai-metric").animationName,
     chart:style(".ai-day-bars i").animationName,
     fill:style(".ai-track>div").animationName,
     ring:style(".ai-donut-ring").animationName,
     ringMask:style(".ai-donut-ring").maskImage
    };
   });
   if(reduced){
    for(const key of ["metric","chart","fill","ring"])assert.equal(styles[key],"none",
     "reduced-motion disables "+key+" animation");
   }else{
    assert.match(styles.metric,/ai-enter-rise/);
    assert.match(styles.chart,/ai-enter-bars/);
    assert.match(styles.fill,/ai-enter-fill/);
    assert.match(styles.ring,/ai-enter-ring/);
    assert.match(styles.ringMask,/conic-gradient/);
   }
   await page.waitForTimeout(reduced?120:2050);
   const values=await page.locator(".ai-metric strong").allTextContents();
   assert.deepEqual(values,["12","5","2","1"],"motion never changes observed totals");
   assert.equal(await page.locator(".ai-donut strong").innerText(),"12",
    "lane-share center remains real alert count");
   await page.screenshot({path:path.join(out,label+"-"+width+".png"),
    animations:"disabled",fullPage:true});
   assert.equal(errors.length,0,"no browser JS errors: "+errors.join("|"));
   results.push({case:label,width,result:"pass",styles,values});
  }catch(e){
   results.push({case:label,width,result:"fail",error:String(e).slice(0,900),
    body:(await page.locator("body").innerText().catch(()=>"")).slice(0,900)});
  }finally{await context.close();}
 }
}finally{await browser.close();}
await writeFile(path.join(out,"results.json"),JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
assert.equal(results.filter(x=>x.result==="fail").length,0,"Lane Flow motion QA failed");
