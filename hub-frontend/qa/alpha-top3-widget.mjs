import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const origin=process.env.BASE_URL||"http://127.0.0.1:3000";
const out=path.join(process.cwd(),"qa-screenshots");
await mkdir(out,{recursive:true});
const movers=[
  {id:"mover-nobushi-1",symbol:"NOBUSHI",lane:"GENESIS",first_mc:191232,peak_mc:464932,multiple:2.43,called_at_utc:"2026-11-10T18:40:00Z"},
  {id:"mover-flipif-2",symbol:"FLIPIF",lane:"RECLAIM",first_mc:41345,peak_mc:78210,multiple:1.89,called_at_utc:"2026-11-11T15:57:00Z"},
  {id:"mover-nihaon-3",symbol:"NIHAON",lane:"TREND",first_mc:175130,peak_mc:309976,multiple:1.77,called_at_utc:"2026-11-11T23:01:00Z"}
];
const browser=await chromium.launch({headless:true});
const results=[];
try {
  for(const width of [320,390,768,1440]){
    const page=await browser.newPage({viewport:{width,height:width<500?780:950},reducedMotion:"reduce",isMobile:width<500,hasTouch:width<500});
    const errors=[];page.on("pageerror",e=>errors.push(e.message));
    await page.route("**/api/public/top-movers",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({state:"verified",window:"24h",as_of_utc:"2026-11-11T23:30:00Z",movers})}));
    const response=await page.goto(origin+"/",{waitUntil:"domcontentloaded",timeout:45000});
    assert.equal(response.status(),200);
    const widget=page.locator('section[aria-label="Alpha Alerts top movers"]');
    await widget.locator('div[aria-label="Ranked market-cap movers"] > button').first().getByText("2.43×",{exact:true}).waitFor({timeout:12000});
    await widget.scrollIntoViewIfNeeded();
    const cards=widget.locator('div[aria-label="Ranked market-cap movers"] > button');
    assert.equal(await cards.count(),3);
    for(let i=0;i<3;i++){
      assert.equal((await cards.nth(i).innerText()).includes(movers[i].symbol),true,"symbol "+i);
      assert.equal((await cards.nth(i).innerText()).includes(movers[i].multiple.toFixed(2)+"×"),true,"multiple "+i);
    }
    const footer=widget.locator('div[aria-label="Top mover summary"]');
    const footerText=await footer.innerText();
    for(const expected of ["RANKED","TOP MOVE","AVG MOVE","2.43×","2.03×"])assert(footerText.includes(expected),"Missing "+expected);
    const layout=await widget.evaluate(el=>{
      const cards=[...el.querySelectorAll('div[aria-label="Ranked market-cap movers"] > button')];
      const rect=el.getBoundingClientRect(),cw=document.documentElement.clientWidth;
      const boxes=cards.map(n=>{const r=n.getBoundingClientRect();return {l:r.left,r:r.right,t:r.top,b:r.bottom,w:r.width}});
      return {left:rect.left,right:rect.right,viewport:cw,documentWidth:document.documentElement.scrollWidth,boxes};
    });
    assert(layout.left>=-2&&layout.right<=width+2,"Widget leaves viewport "+JSON.stringify(layout));
    assert(layout.documentWidth<=width+4,"Document overflows");
    assert(layout.boxes.every(b=>b.w>45&&b.l>=-2&&b.r<=width+2),"Card escapes viewport");
    assert(layout.boxes[0].r<layout.boxes[1].l&&layout.boxes[1].r<layout.boxes[2].l,"Cards overlap");
    await widget.screenshot({path:path.join(out,"top3-verified-"+width+".png"),animations:"disabled"});
    if(width===390){
      await cards.first().click();
      await widget.getByText("Call MC",{exact:false}).waitFor({timeout:5000});
      assert((await widget.innerText()).includes("$464,932"),"Tap-to-open peak details missing");
      await cards.first().click();
      assert.equal(await widget.locator("#alpha-mover-expanded").count(),0);
    }
    assert.deepEqual(errors,[],"Browser JS errors");
    results.push({case:"verified",width,result:"pass",cards:3,layout});
    await page.close();
  }
  for(const state of ["historical","unavailable"]){
    const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce",isMobile:true,hasTouch:true});
    await page.route("**/api/public/top-movers",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(state==="historical"?{state:"historical",window:"historical",reference_time_utc:"2026-11-04T20:00:00Z",movers}:{state:"unavailable",window:"24h",movers:[]})}));
    await page.goto(origin+"/",{waitUntil:"domcontentloaded",timeout:45000});
    const widget=page.locator('section[aria-label="Alpha Alerts top movers"]');
    if(state==="historical"){
      await widget.getByText("Latest verified ranking",{exact:true}).waitFor({timeout:12000});
      assert((await widget.innerText()).includes("As of"),"Historical date is not disclosed");
      await widget.locator('div[aria-label="Ranked market-cap movers"] > button').first().getByText("2.43×",{exact:true}).waitFor({timeout:3000});
    }else{
      await widget.getByText("Observed market-cap peaks",{exact:true}).waitFor({timeout:12000});
      assert(!(await widget.innerText()).includes("2.43×"),"Fake gain displayed on outage");
      assert((await widget.innerText()).includes("No corroborated mover records"),"Missing honest unavailable copy");
    }
    await widget.scrollIntoViewIfNeeded();
    await widget.screenshot({path:path.join(out,"top3-"+state+"-390.png"),animations:"disabled"});
    results.push({case:state,width:390,result:"pass"});
    await page.close();
  }
}finally{await browser.close();}
await writeFile(path.join(out,"top3-results.json"),JSON.stringify(results,null,2));
console.log(JSON.stringify({total:results.length,passed:results.filter(x=>x.result==="pass").length,results:results.map(({case:scenario,width,result})=>({scenario,width,result}))},null,2));
