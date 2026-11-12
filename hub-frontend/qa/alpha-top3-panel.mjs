import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const base = process.env.BASE_URL || "http://127.0.0.1:3000";
const artifactDir = path.join(process.cwd(), "qa-screenshots");
await mkdir(artifactDir, { recursive: true });

const verified = { state: "verified", window: "24h", as_of_utc: "2026-11-12T16:00:00Z", movers: [
  { id: "top3-a", symbol: "SCAMSON", lane: "TREND", multiple: 18.39, first_mc: 12425, peak_mc: 228500, called_at_utc: "2026-11-12T10:00:00Z" },
  { id: "top3-b", symbol: "updog", lane: "RECLAIM", multiple: 10.84, first_mc: 45000, peak_mc: 487800, called_at_utc: "2026-11-12T11:00:00Z" },
  { id: "top3-c", symbol: "FLC", lane: "RECLAIM", multiple: 5.94, first_mc: 10000, peak_mc: 59400, called_at_utc: "2026-11-12T12:00:00Z" }
] };
const widths = [320, 375, 390, 430, 768, 1024, 1324, 1440];
const browser = await chromium.launch({ headless: true });
const results = [], failures = [];

for (const width of widths) {
  const height = width < 500 ? 844 : width < 1000 ? 1024 : 900;
  const page = await browser.newPage({ viewport: {width,height}, isMobile: width < 500, hasTouch: width < 500, reducedMotion: "reduce" });
  const pageErrors=[];
  page.on("pageerror", e => pageErrors.push(String(e.message).slice(0,160)));
  await page.route("**/api/public/top-movers", route => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify(verified)
  }));
  try {
    const response = await page.goto(base + "/", { waitUntil: "domcontentloaded", timeout: 45000 });
    assert.equal(response?.status(), 200, "Homepage must return HTTP 200");

    const panel = page.locator("[data-alpha-top3-frame]");
    await panel.getByText("18.39×",{exact:true}).first().waitFor({timeout:12000});
    await panel.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const layout = await panel.evaluate(node => {
      const area=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
      const cards=[...node.querySelectorAll('div[aria-label="Ranked market-cap movers"] > button')];
      const title=node.querySelector('[data-alpha-top3-heading]');
      const stats=node.querySelector('[aria-label="Top mover summary"]');
      const note=node.querySelector("p:last-child");
      const style=getComputedStyle(node);
      const statStyle=getComputedStyle(stats);
      const eyebrow=document.querySelector("[data-alpha-hero-eyebrow]");
      const stage=document.querySelector("[data-alpha-hero-right] .relative.isolate");
      const chart=stage?.firstElementChild?.firstElementChild;
      const computedCardStyles=cards.map(el=>{
        const st=getComputedStyle(el);
        return {border:st.borderTopWidth,background:st.backgroundImage,shadow:st.boxShadow,multipleColor:getComputedStyle(el.querySelector("strong")).color};
      });
      return {panel:area(node),title:area(title),cards:cards.map(area),stats:area(stats),note:area(note),
        eyebrow:eyebrow?area(eyebrow):null,
        chart:chart?{width:chart.offsetWidth,height:chart.offsetHeight}:null,
        viewport:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,
        background:style.backgroundColor,borderColor:style.borderTopColor,borderWidth:style.borderTopWidth,
        radius:style.borderTopLeftRadius,paddingTop:parseFloat(style.paddingTop),paddingBottom:parseFloat(style.paddingBottom),
        paddingLeft:parseFloat(style.paddingLeft),statTopBorder:statStyle.borderTopWidth,statBackground:statStyle.backgroundColor,
        cardStyles:computedCardStyles,
        symbolWidths:cards.map(card=>{const el=card.querySelector("[data-alpha-mover-symbol]");return {client:el?.clientWidth??0,scroll:el?.scrollWidth??0,text:el?.textContent??""};}),
        multipleTextRects:cards.map(card=>{const el=card.querySelector("strong");const range=document.createRange();range.selectNodeContents(el);const r=range.getBoundingClientRect();return {left:r.left,right:r.right,content:el?.textContent??""};})};
    });

    assert.equal(layout.viewport,width,"Viewport width mismatch");
    assert(layout.scrollWidth <= width + 4,"Document horizontal overflow");
    assert(layout.panel.left >= -2 && layout.panel.right <= width + 2,"Top 3 parent escapes viewport");
    assert.equal(layout.background,"rgba(0, 0, 0, 0)","Blue-tinted parent panel must be removed");
    assert.equal(layout.borderWidth,"0px","Original open layout should not have an outer box");
    assert.equal(layout.statTopBorder,"1px","Original separated statistics strip border missing");
    assert.equal(layout.statBackground,"rgb(17, 18, 21)","Stats must use neutral charcoal");
    assert.equal(layout.cards.length,3,"Three ranked cards required");
    for(const card of layout.cards){
      assert(card.width >= 50,"Card too narrow");
      assert(card.left >= layout.panel.left && card.right <= layout.panel.right,"Card clipped by parent");
      assert(card.height >= 140,"Card too short");
    }
    assert(layout.cards[0].right < layout.cards[1].left,"First and second card overlap");
    assert(layout.cards[1].right < layout.cards[2].left,"Second and third card overlap");
    assert(layout.title.top-layout.panel.top >= 7,"Insufficient top padding");
    assert(layout.cards[0].top-layout.title.bottom >= 14,"Heading crowded against cards");
    assert(layout.stats.top-layout.cards[0].bottom >= 18,"Stats crowded against cards");
    assert(layout.note.top-layout.stats.bottom >= 10,"Disclosure crowded against stats");
    assert(layout.panel.bottom-layout.note.bottom >= 6,"Insufficient bottom padding");
    assert(layout.cardStyles.every(x=>x.border==="1px"&&x.shadow!=="none"),"Card distinction or underglow lost");
    assert.deepEqual(layout.cardStyles.map(x=>x.multipleColor),
      ["rgb(233, 188, 117)","rgb(139, 204, 233)","rgb(197, 165, 236)"],
      "Multipliers must correspond to gold, cyan and violet rank accents");
    assert(layout.cardStyles.every(x=>{
      const swatches=[...x.background.matchAll(/rgb\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/g)];
      return swatches.length===3 && swatches.every(m=>{
        const channels=m.slice(1).map(Number);
        return Math.max(...channels)-Math.min(...channels)<=5;
      });
    }),"Card backgrounds are blue-tinted instead of neutral charcoal");
    assert(layout.symbolWidths.every(x=>x.client>0 && x.scroll<=x.client+1),
      "A normal-length token is truncated: "+JSON.stringify(layout.symbolWidths));
    assert(layout.multipleTextRects.every((text,index)=>text.left>=layout.cards[index].left+1&&text.right<=layout.cards[index].right-1),
      "A peak multiplier extends beyond its card: "+JSON.stringify({text:layout.multipleTextRects,cards:layout.cards}));
    if(width >= 768){
      assert(layout.chart,"BTC chart reference panel unavailable");
      assert(Math.abs(layout.panel.width-layout.chart.width)<=2,"Top 3 width differs from BTC chart: "+JSON.stringify(layout));
      assert(Math.abs(layout.panel.height-layout.chart.height)<=2,"Top 3 height differs from BTC chart: "+JSON.stringify(layout));
    }
    if(width >= 1024){
      assert(layout.eyebrow && Math.abs(layout.title.top-layout.eyebrow.top) <= 48,
        "Right header misaligned relative to left hero");
    }
    const statsText=await panel.locator('[aria-label="Top mover summary"]').innerText();
    for(const value of ["RANKED","3","TOP MOVE","18.39×","AVG MOVE","11.72×"])
      assert(statsText.includes(value),"Missing derived summary: "+value);

    await page.addStyleTag({content:"nextjs-portal{display:none!important}"});
    await panel.screenshot({path:path.join(artifactDir,"top3-panel-"+width+".png"),animations:"disabled"});
    if(width===390||width===1324){
      await page.screenshot({path:path.join(artifactDir,"top3-home-"+width+".png"),animations:"disabled"});
    }
    if(width===320||width===390||width===1324){
      const first=panel.locator('div[aria-label="Ranked market-cap movers"] > button').first();
      await first.click();
      await panel.getByText("Call MC",{exact:false}).waitFor({timeout:5000});
      assert((await panel.innerText()).includes("$228,500"),"Peak call detail lost");
      await first.click();
      assert.equal(await panel.locator("#alpha-mover-expanded").count(),0,"Details did not collapse");
    }
    assert.deepEqual(pageErrors,[],"Client-side errors");
    results.push({width,pass:true,topPadding:Math.round(layout.title.top-layout.panel.top),
      titleToCards:Math.round(layout.cards[0].top-layout.title.bottom),
      cardsToStats:Math.round(layout.stats.top-layout.cards[0].bottom),
      statsToNote:Math.round(layout.note.top-layout.stats.bottom),
      bottomPadding:Math.round(layout.panel.bottom-layout.note.bottom),
      opticalAlignment:layout.eyebrow?Math.round(layout.title.top-layout.eyebrow.top):null,
      panelSize:{width:Math.round(layout.panel.width),height:Math.round(layout.panel.height)},btcChartSize:layout.chart});
  }catch(error){
    const failure={width,pass:false,error:String(error).slice(0,500)};
    failures.push(failure);results.push(failure);
  }finally{await page.close();}
}
await browser.close();
await writeFile(path.join(artifactDir,"top3-panel-results.json"),JSON.stringify({results,failures},null,2));
console.log(JSON.stringify({tests:results.length,failures,results},null,2));
assert.equal(failures.length,0,"Top3 design QA failed");
