import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";

const base=process.env.BASE_URL||"http://127.0.0.1:3000";
const profileBase="https://alpha-synthetic-api.example.test";
const out=path.join(process.cwd(),"qa-screenshots","alpha-command-member");
const jsonHeaders={"content-type":"application/json","cache-control":"private, no-store"};
const subject={
 id:"00000000-0000-4000-8000-000000000022",aud:"authenticated",role:"authenticated",
 email:"member@example.test",app_metadata:{provider:"email",providers:["email"]},
 user_metadata:{},created_at:"2026-11-01T00:00:00.000Z"
};
const session={
 access_token:"synthetic-verified-browser-member-token",refresh_token:"synthetic-member-refresh",
 token_type:"bearer",expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user:subject
};
const expiration=new Date(Date.now()+600000).toISOString();
const scenarios=[
 {name:"free-preview",access:"none",accessStatus:403,preview:"eligible",
  profile:{plan:"free",is_active:false,entitlements:[]},activate:true},
 {name:"subscriber",access:"subscriber",accessStatus:200,preview:"expired",
  profile:{plan:"alpha-trend-alerts",is_active:true,entitlements:["alpha_trend"]}},
 {name:"inactive",access:"none",accessStatus:403,preview:"expired",
  profile:{plan:"alpha-trend-alerts",is_active:false,entitlements:[]}},
 {name:"service-outage",access:"unavailable",accessStatus:503,preview:"unavailable",
  profile:null},
 {name:"expired-preview",access:"none",accessStatus:403,preview:"expired",
  profile:{plan:"free",is_active:false,entitlements:[]}}
];
const browser=await chromium.launch({headless:true});
const results=[];
await mkdir(out,{recursive:true});
try{
 for(const width of [390,1440]){
  for(const scenario of scenarios){
   const context=await browser.newContext({viewport:{width,height:width===390?844:900},reducedMotion:"reduce"});
   const cookieValue="base64-"+Buffer.from(JSON.stringify(session),"utf8").toString("base64url");
   await context.addCookies([{name:"sb-test-auth-token",value:cookieValue,url:base,
    expires:Math.floor(Date.now()/1000)+3600,httpOnly:false,secure:false,sameSite:"Lax"}]);
   const page=await context.newPage();
   const errors=[];
   let started=false,startCalls=0,readCalls=0;
   page.on("pageerror",e=>errors.push(e.message));
   await page.route("https://test.supabase.co/**",async route=>{
    const url=route.request().url();
    await route.fulfill({status:200,headers:jsonHeaders,
      body:JSON.stringify(url.includes("/auth/v1/user")?subject:{user:subject,session})});
   });
   await page.route(profileBase+"/**",async route=>{
    await route.fulfill({status:scenario.profile?200:503,headers:jsonHeaders,
      body:JSON.stringify(scenario.profile||{error:"membership_unavailable"})});
   });
   await page.route("**/api/intelligence/access",async route=>{
    await route.fulfill({status:scenario.accessStatus,headers:jsonHeaders,
      body:JSON.stringify({state:scenario.access,delay_hours:scenario.access==="subscriber"?24:0})});
   });
   await page.route("**/api/intelligence/preview/data",async route=>{
    readCalls++;
    await route.fulfill({status:started?200:403,headers:jsonHeaders,
      body:JSON.stringify(started?{state:"active",delay_hours_min:24,expires_at:expiration,
       daily:[{date:"2025-01-01",alerts:7,first_mints:2,early:1,genesis:0,trend:3,
        strict:0,reclaim:2,runner:1}]}:{state:"expired"})});
   });
   await page.route("**/api/intelligence/preview",async route=>{
    if(route.request().method()==="POST"){
     startCalls++;
     if(scenario.activate&&!started)started=true;
    }
    const state=started?"active":scenario.preview;
    await route.fulfill({status:state==="unavailable"?503:200,headers:jsonHeaders,
     body:JSON.stringify({state,expires_at:state==="active"?expiration:undefined})});
   });
   try{
    const response=await page.goto(base+"/dashboard",{waitUntil:"domcontentloaded",timeout:35000});
    assert.equal(response?.status(),200,"signed-in dashboard returned HTTP 200");
    await page.getByRole("heading",{name:"ALPHA COMMAND"}).waitFor({timeout:17000});
    const dashboardBrand=page.locator("main > header").getByRole("link",{name:"Alpha Alerts homepage"});
    assert.equal(await dashboardBrand.count(),1,"dashboard uses the approved homepage brand");
    const logo=dashboardBrand.locator("img");
    assert.equal(await logo.getAttribute("src"),"/alpha-lane-v4-logo.png");
    if(scenario.name==="free-preview"){
     await page.getByText("Free account",{exact:true}).waitFor();
     await page.getByRole("button",{name:"START MY 10-MINUTE PREVIEW"}).click();
     await page.getByText(/PREVIEW ACTIVE ·/).waitFor({timeout:12000});
     await page.getByRole("button",{name:"2025-01-01: 7 observations"}).waitFor({timeout:12000});
     await page.getByRole("button",{name:"trend",exact:true}).click();
     await page.getByRole("button",{name:"2025-01-01: 3 observations"}).click();
     await page.getByText("2025-01-01 · 3 observations",{exact:true}).waitFor();
     assert.equal(startCalls,1,"one authorized activation");
     assert.equal(readCalls,1,"one delayed aggregate read");
     assert.equal(await page.getByRole("link",{name:"OPEN AUTHORIZED INTELLIGENCE"}).count(),0,
      "free user cannot open private owner/subscriber page");
     await page.reload({waitUntil:"domcontentloaded"});
     await page.getByText(/PREVIEW ACTIVE ·/).waitFor({timeout:15000});
     assert.equal(startCalls,1,"reload must not restart preview");
     assert.equal(await page.getByRole("button",{name:"START MY 10-MINUTE PREVIEW"}).count(),0);
    }else if(scenario.name==="subscriber"){
     await page.getByText("Active subscriber",{exact:true}).waitFor();
     await page.getByText("ALPHA TREND ALERTS",{exact:true}).waitFor();
     await page.getByText("Verified subscription access",{exact:true}).waitFor();
     assert.equal(await page.getByText("Verified subscription access",{exact:true}).count(),1,
      "only one lane may be shown as entitled");
     await page.getByRole("link",{name:"OPEN AUTHORIZED INTELLIGENCE"}).waitFor();
     assert.equal(startCalls,0);
    }else if(scenario.name==="inactive"){
     await page.getByText("Inactive subscription",{exact:true}).waitFor();
     assert.equal(await page.getByText("Verified subscription access",{exact:true}).count(),0);
     assert.equal(await page.getByRole("link",{name:"OPEN AUTHORIZED INTELLIGENCE"}).count(),0);
    }else if(scenario.name==="service-outage"){
     await page.getByText("Status unavailable",{exact:true}).waitFor();
     await page.getByText(/Preview service unavailable/).waitFor();
     assert.equal(await page.getByText("Verified subscription access",{exact:true}).count(),0);
     assert.equal(await page.getByRole("link",{name:"OPEN AUTHORIZED INTELLIGENCE"}).count(),0);
    }else if(scenario.name==="expired-preview"){
     await page.getByText(/Your one-time preview has expired/).waitFor();
     assert.equal(await page.getByRole("button",{name:"START MY 10-MINUTE PREVIEW"}).count(),0);
     assert.equal(readCalls,0,"expired preview cannot fetch aggregates");
    }
    assert.equal(errors.length,0,"dashboard JavaScript error: "+errors.join("; "));
    await page.screenshot({path:path.join(out,scenario.name+"-"+width+".png"),
      animations:"disabled",fullPage:true});
    results.push({width,case:scenario.name,result:"pass",startCalls,readCalls});
   }catch(e){
    results.push({width,case:scenario.name,result:"fail",error:String(e).slice(0,850),
     body:(await page.locator("body").innerText().catch(()=>"")).slice(0,900)});
   }finally{await context.close();}
  }
 }
}finally{await browser.close();}
await writeFile(path.join(out,"results.json"),JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
assert.equal(results.filter(x=>x.result==="fail").length,0,"Alpha Command member acceptance failed");
