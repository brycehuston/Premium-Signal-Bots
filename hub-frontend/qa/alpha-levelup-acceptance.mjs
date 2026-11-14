import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
const base=process.env.BASE_URL??"http://127.0.0.1:3000";
const dir=path.join(process.cwd(),"qa-screenshots","alpha-levelup");
await mkdir(dir,{recursive:true});
const widths=[320,375,390,430,768,1024,1280,1440];
const offers=[["EARLY",69,599],["GENESIS",59,499],["TREND",59,499],["STRICT",49,399],["RECLAIM",69,599],["RUNNER",49,399]];
const failures=[],results=[];
const browser=await chromium.launch({headless:true});
try{
 for(const width of widths){
  const page=await browser.newPage({viewport:{width,height:width<=430?844:900},deviceScaleFactor:1,reducedMotion:"reduce",isMobile:width<=430,hasTouch:width<=430});
  try{
   const errors=[];page.on("pageerror",e=>errors.push(e.message));
   const response=await page.goto(base+"/pricing",{waitUntil:"domcontentloaded",timeout:40000});
   await page.locator('[data-alpha-lane="RUNNER"]').waitFor({timeout:20000});
   const cards=page.locator("[data-alpha-lane]");
   assert.equal(await cards.count(),6,"exactly six paid lane cards");
   for(const [lane,monthly,annual] of offers){
    const card=page.locator('[data-alpha-lane="'+lane+'"]');
    assert.equal(await card.count(),1);
    assert.match(await card.innerText(),new RegExp("\\$"+monthly+"\\b"));
    if(["EARLY","GENESIS","STRICT","RECLAIM"].includes(lane))
     assert.match(await card.innerText(),/PLANNED · NOT YET AVAILABLE/);
    else assert.match(await card.innerText(),/REQUEST ACCESS/);
   }
   assert.equal(await page.locator(".coming-soon-ribbon").count(),0,"old diagonal ribbon not rendered");
   assert.match(await page.locator("body").innerText(),/DEVELOPED · PRIVATE ACCESS CLOSED/);
   await page.getByRole("button",{name:"Annual",exact:true}).click();
   for(const [lane,,annual] of offers) assert.match(await page.locator('[data-alpha-lane="'+lane+'"]').innerText(),new RegExp("\\$"+annual+"\\b"));
   const dimensions=await cards.evaluateAll(nodes=>nodes.map(el=>{
    const rect=el.getBoundingClientRect();
    const h=el.querySelector("h3")?.getBoundingClientRect();
    return {lane:el.getAttribute("data-alpha-lane"),x:rect.x,right:rect.right,top:rect.top,bottom:rect.bottom,titleTop:h?.top};
   }));
   for(const c of dimensions)assert.ok(c.x>=-2&&c.right<=width+2,"card bounds "+JSON.stringify(c));
   assert.equal(errors.length,0,"pricing JavaScript errors "+errors.join("|"));
   await page.screenshot({path:path.join(dir,"pricing-"+width+".png"),animations:"disabled",fullPage:true});
   const unauth=await page.goto(base+"/dashboard",{waitUntil:"domcontentloaded",timeout:40000});
   assert.equal(unauth?.status(),200,"public auth-gate availability");
   await page.locator("main").getByRole("link",{name:"SIGN IN",exact:true}).waitFor({timeout:15000});
   await page.screenshot({path:path.join(dir,"account-unauth-"+width+".png"),animations:"disabled"});
   results.push({width,offers:6,unauthGuard:true,dimensions,errors});
  }catch(e){failures.push({width,error:String(e).slice(0,900)})}finally{await page.close()}
 }
}finally{await browser.close()}
await writeFile(path.join(dir,"results.json"),JSON.stringify({results,failures},null,2));
console.log(JSON.stringify({tested:results.length,widths,failures},null,2));
assert.equal(failures.length,0,"Alpha Level-Up acceptance: see screenshots and results");
