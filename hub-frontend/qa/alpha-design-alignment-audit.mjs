import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const browser = await chromium.launch({ headless: true });
const origin = process.env.BASE_URL || "http://127.0.0.1:3000";
const pages = ["/", "/pricing", "/login", "/dashboard", "/apps", "/support"];
const widths = [320, 390, 768, 1024, 1440];
const out = [];
await mkdir("qa-screenshots/design-audit", {recursive: true});

for (const width of widths) {
  for (const route of pages) {
    const page = await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
    const errors = [];
    page.on("pageerror", e=>errors.push(e.message));
    try {
      const response = await page.goto(origin+route,{waitUntil:"domcontentloaded",timeout:30000});
      await page.evaluate(async()=>{await document.fonts.ready});
      if(route==="/pricing"){
        await page.locator("#plans").scrollIntoViewIfNeeded({timeout:12000});
        await page.waitForFunction(()=>{const node=document.querySelector("#plans > :first-child");return !!node&&node.getBoundingClientRect().width>100},{timeout:12000});
      }
      if(route==="/"){
        const mover=page.locator("[data-alpha-mover-symbol]").first();
        if(await mover.count())await mover.scrollIntoViewIfNeeded({timeout:12000});
      }
      await page.waitForTimeout(300);
      const metrics = await page.evaluate(()=>{
        const rect = node=>{if(!node)return null;const r=node.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),right:Math.round(r.right)}};
        const cards = Array.from(document.querySelector("#plans")?.children||[]).slice(0,6);
        const controls = Array.from(document.querySelectorAll("button,a,input,select")).filter(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);const intentionalCarousel=!!n.closest('[class*="vibeGallery"]');return !intentionalCarousel&&r.height>2&&r.width>2&&s.display!=="none"&&s.visibility!=="hidden"&&(r.left < -3||r.right>innerWidth+3)}).slice(0,8).map(n=>({text:(n.textContent||n.getAttribute("aria-label")||"").trim().slice(0,32),x:Math.round(n.getBoundingClientRect().left),right:Math.round(n.getBoundingClientRect().right)}));
        const h=document.querySelector("h1");
        return {documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,headerInner:rect(document.querySelector("header.sticky div.mx-auto")),mainInner:rect(document.querySelector("main.py-10 > div.mx-auto")),title:rect(h),titleFont:h?getComputedStyle(h).fontFamily:null,titleText:h?.textContent?.trim().slice(0,55),pricing:cards.map(n=>({box:rect(n),title:rect(n.querySelector("h3")),buttons:Array.from(n.querySelectorAll("button")).map(rect)})),moverWidths:Array.from(document.querySelectorAll("[data-alpha-mover-symbol]")).slice(0,3).map(n=>rect(n.closest("button")||n.parentElement)?.w),overflowControls:controls,nestedMain:!!document.querySelector("main main")};
      });
      await page.evaluate(()=>window.scrollTo(0,0));
      await page.screenshot({path:"qa-screenshots/design-audit/"+(route==="/"?"home":route.slice(1))+"-"+width+".png",animations:"disabled",timeout:12000});
      out.push({route,width,status:response?.status(),...metrics,errors:errors.slice(0,3)});
    }catch(error){out.push({route,width,error:String(error).slice(0,350)});}
    finally{await page.close();}
  }
}
await browser.close();
await writeFile("qa-screenshots/design-audit/geometry.json",JSON.stringify(out,null,2));
const summary={rendered:out.length,failed:out.filter(r=>r.status!==200).map(r=>r.route+"@"+r.width),hScroll:out.filter(r=>r.documentWidth>r.viewportWidth+2).map(r=>r.route+"@"+r.width),outOfView:out.filter(r=>r.overflowControls?.length).map(r=>({page:r.route,width:r.width,controls:r.overflowControls})),pricing:out.filter(r=>r.route==="/pricing").map(r=>({width:r.width,headerX:r.headerInner?.x,mainX:r.mainInner?.x,cardRects:r.pricing?.map(c=>c.box)}))};
console.log(JSON.stringify({summary,entries:out.map(r=>({route:r.route,width:r.width,status:r.status,error:r.error,headerX:r.headerInner?.x,mainX:r.mainInner?.x,documentWidth:r.documentWidth,titleText:r.titleText,moverWidths:r.moverWidths,nestedMain:r.nestedMain}))},null,2));
if(summary.failed.length)process.exitCode=1;
