import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const origin = process.env.BASE_URL || "http://127.0.0.1:3000";
const out = path.join(process.cwd(), "qa-screenshots");
await mkdir(out, {recursive:true});
const data = {state:"verified",window:"24h",as_of_utc:"2026-11-12T02:00:00Z",movers:[
 {id:"hero-mover-1",symbol:"NOBUSHI",lane:"GENESIS",multiple:2.43,first_mc:191232,peak_mc:464932,called_at_utc:"2026-11-11T00:40:00Z"},
 {id:"hero-mover-2",symbol:"FLIPIF",lane:"RECLAIM",multiple:1.89,first_mc:41345,peak_mc:78210,called_at_utc:"2026-11-11T15:57:00Z"},
 {id:"hero-mover-3",symbol:"NIHAONOON",lane:"TREND",multiple:1.77,first_mc:175130,peak_mc:309976,called_at_utc:"2026-11-11T23:01:00Z"}
]};
const browser = await chromium.launch({headless:true});
const records = [];
const failures = [];
for (const width of [320,390,768,1024,1324,1440]) {
 const page = await browser.newPage({viewport:{width,height:width<500?844:900},reducedMotion:width===1324?"no-preference":"reduce",isMobile:width<500,hasTouch:width<500});
 const jsErrors=[];
 page.on("pageerror",e=>jsErrors.push(e.message));
 await page.route("**/api/public/top-movers",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(data)}));
 try {
  const response=await page.goto(origin+"/",{waitUntil:"domcontentloaded",timeout:45000});
  assert.equal(response?.status(),200,"Homepage response");
  const widget=page.locator('section[aria-label="Alpha Alerts top movers"]');
  await widget.getByText("2.43×",{exact:true}).first().waitFor({timeout:12000});
  await page.waitForTimeout(400);
  const geometry=await page.evaluate(()=>{
    const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
    const eyebrow=document.querySelector("[data-alpha-hero-eyebrow]");
    const heading=document.querySelector("[data-alpha-top3-heading]");
    const panel=document.querySelector('section[aria-label="Alpha Alerts top movers"]');
    const cards=[...document.querySelectorAll('div[aria-label="Ranked market-cap movers"] > button')];
    const summary=document.querySelector('div[aria-label="Top mover summary"]');
    const left=eyebrow.closest(".space-y-6");
    return {eyebrow:rect(eyebrow),heading:rect(heading),panel:rect(panel),cards:cards.map(rect),summary:rect(summary),
      rootWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,
      leftHeight:left?.getBoundingClientRect().height??0};
  });
  assert(geometry.clientWidth===width,"Unexpected viewport width");
  assert(geometry.rootWidth<=width+4,"Horizontal overflow");
  assert(geometry.panel.left>=-2&&geometry.panel.right<=width+2,"Panel clipped");
  assert(geometry.cards.length===3&&geometry.cards.every(x=>x.width>=50),"Missing or narrow cards");
  assert(geometry.cards[0].right<geometry.cards[1].left&&geometry.cards[1].right<geometry.cards[2].left,"Cards overlap");
  assert(geometry.summary.top-geometry.cards[0].bottom>=19,"Missing breathing room between cards and summary");
  if(width>=1024){
    assert(Math.abs(geometry.heading.top-geometry.eyebrow.top)<=48,"Top 3 header does not align with left hero eyebrow");
    assert(geometry.cards[0].height>=175,"Desktop mover cards too short");
  }
  assert.deepEqual(jsErrors,[],"Browser page errors");
  await widget.screenshot({path:path.join(out,"hero-widget-"+width+".png"),animations:"disabled"});
  if(width===390||width===1324) await page.screenshot({path:path.join(out,"hero-full-"+width+".png"),animations:"disabled"});
  records.push({width,case:"hero-balance",status:"pass",headerDelta:Math.round(geometry.heading.top-geometry.eyebrow.top),cardHeight:Math.round(geometry.cards[0].height),cardGap:Math.round(geometry.summary.top-geometry.cards[0].bottom),rootWidth:geometry.rootWidth});
  if(width===1324){
    const grid=page.locator("[data-alpha-number-grid]");
    await grid.scrollIntoViewIfNeeded();
    await page.waitForTimeout(450);
    const cards=grid.locator("[data-alpha-number-order]");
    assert.equal(await cards.count(),3);
    const delays=[];
    for(let n=0;n<3;n++){
      const col=cards.nth(n).locator("[data-roll-column]");
      const raw=await col.evaluate(el=>getComputedStyle(el).transitionDelay);
      delays.push(Number.parseFloat(raw)*1000);
    }
    assert(Math.abs(delays[0]-0)<30,"First rolling number does not start immediately");
    assert(delays[1]>=1300&&delays[1]<=1400,"Second rolling number not staggered");
    assert(delays[2]>=2650&&delays[2]<=2750,"Third rolling number not staggered");
    await grid.screenshot({path:path.join(out,"hero-number-sequence-1324.png"),animations:"allow"});
    records.push({width,case:"numbers-sequential",status:"pass",delaysMs:delays});
  }
 }catch(e){
  const issue={width,status:"fail",error:String(e).slice(0,480)};
  failures.push(issue);records.push(issue);
 }finally{await page.close()}
}
const reduced=await browser.newPage({viewport:{width:1324,height:900},reducedMotion:"reduce"});
await reduced.goto(origin+"/",{waitUntil:"domcontentloaded",timeout:45000});
await reduced.locator("[data-alpha-number-grid]").scrollIntoViewIfNeeded();
await reduced.waitForTimeout(400);
const styles=await reduced.locator("[data-alpha-number-grid] [data-roll-column]").evaluateAll(nodes=>nodes.map(el=>getComputedStyle(el).transitionDuration));
if(styles.length!==3||styles.some(x=>!Number.isFinite(Number(x.replace(/s$/,"")))||Number(x.replace(/s$/,""))>0.001))failures.push({case:"reduced-motion",style:styles,error:"Rolling numbers should not animate in reduced-motion mode"});
else records.push({case:"reduced-motion",status:"pass",durations:styles});
await reduced.close();
await browser.close();
await writeFile(path.join(out,"hero-rhythm-results.json"),JSON.stringify({records,failures},null,2));
console.log(JSON.stringify({tests:records.length,failures,records},null,2));
assert.equal(failures.length,0,"Hero rhythm or number sequencing failed");
