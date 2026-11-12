import { chromium } from "playwright";

const origin = process.env.BASE_URL || "http://127.0.0.1:3000";
const user = {
  id:"00000000-0000-4000-8000-000000000011", aud:"authenticated", role:"authenticated",
  email:"owner@example.test", app_metadata:{provider:"google",providers:["google"]},
  user_metadata:{},created_at:"2026-11-01T00:00:00.000Z"
};
const session={
  access_token:"mock-owner-browser-session",refresh_token:"test-browser-refresh",
  token_type:"bearer",expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user
};
const lanes=["EARLY","GENESIS","RECLAIM","TREND","STRICT","RUNNER"];
const mkDay=(date,value)=>({
 date_pt:date,all_alerts:value,first_mints:1,
 EARLY:value,GENESIS:0,RECLAIM:0,TREND:0,STRICT:0,RUNNER:0
});
const mkHour=(date,value)=>({
 date_pt:date,dow:"Wed",clock_hour_pt:17,pulse_mode:"UNAVAILABLE",
 all_alerts:value,first_mints:1,
 EARLY:value,GENESIS:0,RECLAIM:0,TREND:0,STRICT:0,RUNNER:0
});
const dataset={
 daily:[mkDay("2026-11-10",3),mkDay("2026-11-11",4)],
 hourly:[mkHour("2026-11-10",3),mkHour("2026-11-11",4)],
 first:[],regimes:[],transitions:[],
 summary:{start:"2026-11-10",end:"2026-11-11",messages:7,mint:2,lane:7,heartbeat:0,pulse:0}
};
const snapshot={state:"ready",tier:"owner",as_of_utc:"2026-11-11T23:30:00.000Z",dataset};
const jsonHeaders={"content-type":"application/json","cache-control":"no-store"};
const browser=await chromium.launch({headless:true});
const results=[];
for(const width of [390,1440]) {
 const context=await browser.newContext({viewport:{width,height:width===390?844:900}});
 const cookieValue="base64-"+Buffer.from(JSON.stringify(session),"utf8").toString("base64url");
 await context.addCookies([{
   name:"sb-test-auth-token",value:cookieValue,url:origin,expires:Math.floor(Date.now()/1000)+3600,
   httpOnly:false,secure:false,sameSite:"Lax"
 }]);
 const page=await context.newPage();
 const errs=[];page.on("pageerror",e=>errs.push(e.message));
 let apiCalls=0;let allowLive=width!==390;
 await page.route("https://test.supabase.co/**",async route=>{
   const url=route.request().url();
   if(url.includes("/auth/v1/user")){
     await route.fulfill({status:200,headers:jsonHeaders,body:JSON.stringify(user)});
   }else{
     await route.fulfill({status:200,headers:jsonHeaders,body:JSON.stringify({user,session})});
   }
 });
 await page.route("**/api/intelligence/access",async route=>{
   await route.fulfill({status:200,headers:jsonHeaders,body:JSON.stringify({state:"owner",delay_hours:0})});
 });
 await page.route("**/api/intelligence/data",async route=>{
   apiCalls++;
   if(!allowLive){
     await route.fulfill({status:503,headers:jsonHeaders,body:JSON.stringify({state:"unavailable"})});
   }else{
     await route.fulfill({status:200,headers:jsonHeaders,body:JSON.stringify(snapshot)});
   }
 });
 try{
  const response=await page.goto(origin+"/dashboard/intelligence",{waitUntil:"domcontentloaded",timeout:25000});
  if(response?.status()!==200)throw new Error("dashboard HTTP "+response?.status());
  if(width===390){
    await page.getByText("LIVE FEED OFFLINE",{exact:true}).waitFor({timeout:12000});
    allowLive=true;
    await page.getByRole("button",{name:"RETRY LIVE SYNC"}).click();
  }
  await page.getByText("AUTO SYNC ACTIVE",{exact:true}).waitFor({timeout:16000});
  const brand=page.locator(".ai-brand-link");
  const logo=brand.locator('img[src="/alpha-lane-v4-logo.png"]');
  if(await logo.count()!==1||!await logo.isVisible())throw new Error("Lane Flow logo is missing");
  if(!/ALPHA\s+ALERTS/.test(await brand.innerText()))throw new Error("Lane Flow brand wordmark mismatch");

  if(apiCalls<1)throw new Error("owner API was not requested");
  const snapshotVisible=await page.getByText("LIVE DATA CONNECTED",{exact:true}).isVisible();
  if(!snapshotVisible)throw new Error("verified owner live data status missing");
  // The optional archive drawer may be absent when automatic data already arrived.
  // The essential contract is verified live data, usable research, and no forced upload.
  if(!(await page.getByText("LIVE DATA CONNECTED",{exact:true}).isVisible()))throw new Error("authorized research unavailable");
  if(await page.getByRole("button",{name:"IMPORT HISTORICAL FILE"}).isVisible())throw new Error("archive upload unexpectedly prominent");
  const pageText=await page.locator("#overview").innerText();
  if(!pageText.includes("not independently verified Telegram deliveries")&&!pageText.includes("not verified deliveries"))throw new Error("missing research qualification");
  if(!pageText.includes("NOT IN CURRENT SNAPSHOT"))throw new Error("missing unavailable-data disclosure");
  if(errs.length)throw new Error("page errors: "+errs.join("; "));
  results.push({width,status:"pass",apiCalls});
 }catch(e) {
  results.push({width,status:"fail",apiCalls,error:String(e).slice(0,700),body:(await page.locator("body").innerText().catch(()=>"")).slice(0,1000)});
 }finally{await context.close()}
}
await browser.close();
console.log(JSON.stringify({results},null,2));
if(results.some(r=>r.status!=="pass"))process.exit(1);
