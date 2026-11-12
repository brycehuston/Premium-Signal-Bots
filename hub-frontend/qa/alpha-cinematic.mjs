import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
const base=process.env.BASE_URL||"http://127.0.0.1:3000";
const dir=path.join(process.cwd(),"qa-cinematic-artifacts");
await mkdir(dir,{recursive:true});
const sizes=[{w:320,h:700},{w:375,h:812},{w:390,h:844},{w:430,h:932},{w:768,h:1024},{w:844,h:390},{w:1024,h:900},{w:1280,h:900},{w:1440,h:900}];
const browser=await chromium.launch({headless:true});
const checks=[];const errors=[];
for(const {w,h} of sizes)for(const stage of [1,2,3]){
 const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:w<=430&&h>w,hasTouch:w<=430,reducedMotion:"reduce"});
 await page.addInitScript(()=>{
   window.__alphaCanvasTexts=[];
   const original=CanvasRenderingContext2D.prototype.fillText;
   CanvasRenderingContext2D.prototype.fillText=function(t,x,y,...rest){
     const str=String(t).trim();
     if(str && window.__alphaCanvasTexts.length<5000){
       const m=this.getTransform();
       const scaleX=this.canvas.clientWidth ? this.canvas.clientWidth/Math.max(1,this.canvas.width) : 1;
       const scaleY=this.canvas.clientHeight ? this.canvas.clientHeight/Math.max(1,this.canvas.height) : 1;
       window.__alphaCanvasTexts.push({text:str,x:Math.round(x),y:Math.round(y),absX:Math.round((m.a*x+m.c*y+m.e)*scaleX),absY:Math.round((m.b*x+m.d*y+m.f)*scaleY),font:this.font});
     }
     return original.call(this,t,x,y,...rest);
   };
 });
 page.on("pageerror",e=>errors.push({stage,width:w,error:e.message.slice(0,200)}));
 const route="/stage-"+stage;
 try {
  const r=await page.goto(base+route,{waitUntil:"domcontentloaded",timeout:35000});
  const iframe=page.locator("iframe").first();
  await iframe.waitFor({timeout:17000});
  const frame=await (await iframe.elementHandle()).contentFrame();
  if(!frame)throw Error("Missing embedded frame "+stage);
  await frame.locator(".frame").waitFor({timeout:18000});
  await page.waitForTimeout(1900);
  const data=await frame.evaluate(()=>{
    const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {x:+r.x.toFixed(1),y:+r.y.toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1),right:+r.right.toFixed(1),bottom:+r.bottom.toFixed(1)}};
    const frame=document.querySelector(".frame"),canvas=document.querySelector("#cv"),title=document.querySelector(".mobileHeroTitle");
    const panels=[...document.querySelectorAll(".panel")];
    const laneNames=panels.map(x=>({lane:x.dataset.bot,rect:rect(x),computedColor:getComputedStyle(x).getPropertyValue("--lane-color")}));
    const wrap=document.querySelector(".clusterWrap");
    const words=(window.__alphaCanvasTexts||[]).slice(-1400);
    const target=["EARLY","GENESIS","TREND","STRICT","RECLAIM","RUNNER"];
    const laneText=words.filter(x=>target.some(t=>x.text.toUpperCase().includes(t))).slice(-60);
    const sourceLabels=words.filter(x=>["DEXSCREENER","OHLCV / CHART DATA","RPC / MEMPOOL","VPS CORE"].includes(x.text)).slice(-48);
    const canvasPixels=(()=>{
      if(!canvas)return null;
      try{
        const c=canvas.getContext("2d",{willReadFrequently:true});const W=canvas.width,H=canvas.height;
        const sample=c.getImageData(0,0,W,H).data;
        let covered=0,central=0,parts={};
        for(let gy=0;gy<5;gy++)for(let gx=0;gx<5;gx++){
          let active=0;for(let sy=0;sy<12;sy++)for(let sx=0;sx<12;sx++){
            const x=Math.min(W-1,Math.floor((gx+(sx+.5)/12)*W/5));
            const y=Math.min(H-1,Math.floor((gy+(sy+.5)/12)*H/5));
            const p=(y*W+x)*4;const lum=(sample[p]+sample[p+1]+sample[p+2])/3;
            if(lum>42 && sample[p+3]>55)active++;
          }
          parts[gx+"-"+gy]=active;
          covered+=active;
          if(gx===2&&gy===2)central=active;
        }
        return {w:W,h:H,covered,central,parts};
      }catch(e){return {error:String(e)}}
    })();
    const overlay=document.querySelector(".forwarder3d");
    const go=document.querySelector("#goAlphaBtn");
    const router=document.querySelector("#routerBtn");
    return {
      viewport:{w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight},
      frame:rect(frame),canvas:rect(canvas),canvasPixels,
      badge:rect(document.querySelector(".badgeStack")),mobileTitle:rect(title),
      header:rect(document.querySelector(".header")),wrap:rect(wrap),wrapScroll:wrap?{h:wrap.scrollHeight,ch:wrap.clientHeight}:null,
      panels:laneNames,
      core:rect(overlay),go:rect(go),router:rect(router), 
      canvasLaneLabels:laneText,sourceLabels,canvasTextCount:words.length,
      jsErrors:[],
    };
  });
  checks.push({stage,width:w,height:h,http:r?.status(),...data});
  if(stage===2&&w<=430){
    const scroll=frame.locator(".clusterWrap");await scroll.evaluate(el=>el.scrollTop=el.scrollHeight);
    await page.waitForTimeout(300);
    checks[checks.length-1].lastPanelScroll=await frame.locator('.panel[data-bot="RUNNER"]').evaluate(x=>{const r=x.getBoundingClientRect();return {top:r.top,bottom:r.bottom,visible:r.bottom>0&&r.top<innerHeight}});
  }
  await page.screenshot({path:path.join(dir,"stage"+stage+"-"+w+"x"+h+".png"),animations:"disabled",timeout:12000});
 } catch(e){checks.push({stage,width:w,height:h,error:String(e).slice(0,430)});}
 finally{await page.close()}
}

const workflowTransitions=[];
for (const {w,h} of [{w:390,h:844},{w:844,h:390}]) {
  const page=await browser.newPage({viewport:{width:w,height:h},isMobile:w<500,hasTouch:w<500,reducedMotion:"reduce"});
  try {
    await page.goto(base+"/stage-1",{waitUntil:"domcontentloaded",timeout:30000});
    const core=page.frameLocator("iframe").locator("#cv");
    await core.waitFor({timeout:20000});
    await core.focus();
    await page.keyboard.press("Enter");
    await page.waitForURL("**/stage-2",{timeout:14000});
    // Next development indicator overlaps the bottom-left forwarding button on phones.
    // It is absent in production and must not intercept this production-equivalent tap.
    await page.addStyleTag({content:"nextjs-portal{display:none!important}"});
    const router=page.frameLocator("iframe").locator("#routerBtn");
    await router.waitFor({timeout:18000});
    if(w<500) await router.tap({timeout:12000,noWaitAfter:true});
    else await router.click({timeout:12000,noWaitAfter:true});
    await page.waitForURL("**/stage-3",{timeout:14000});
    const go=page.frameLocator("iframe").locator("#goAlphaBtn");
    await go.waitFor({timeout:18000});
    await go.click({timeout:12000});
    await page.waitForURL("**/pricing",{timeout:14000});
    workflowTransitions.push({width:w,height:h,result:"stage1 -> stage2 -> stage3 -> pricing verified"});
  } catch(error) {
    const issue={width:w,height:h,error:String(error).slice(0,500)};
    workflowTransitions.push(issue);
    errors.push({stage:"navigation",width:w,error:issue.error});
  } finally { await page.close(); }
}

await browser.close();
await writeFile(path.join(dir,"stage-results.json"),JSON.stringify({base,checks,errors},null,2));
const failures=[];
const allLanes=["EARLY","GENESIS","TREND","STRICT","RECLAIM","RUNNER"];
for(const c of checks){
 if(c.error||c.http!==200){failures.push({stage:c.stage,width:c.width,error:c.error||("HTTP "+c.http)});continue;}
 if(c.frame && (c.frame.x< -2 || c.frame.right>c.width+2 || c.frame.y< -2 || c.frame.bottom>c.height+2)){
   failures.push({stage:c.stage,width:c.width,error:"frame beyond viewport",rect:c.frame});
 }
 if(c.stage===1){
   const names=new Set((c.sourceLabels||[]).map(x=>x.text));
   if(!["DEXSCREENER","OHLCV / CHART DATA","RPC / MEMPOOL","VPS CORE"].every(x=>names.has(x)))
     failures.push({stage:1,width:c.width,error:"source labels missing"});
   if(c.height<500 && c.width>600){
     const unique=Object.values(Object.fromEntries((c.sourceLabels||[]).map(x=>[x.text,x])));
     const sources=unique.filter(x=>x.text!=="VPS CORE").sort((a,b)=>a.absX-b.absX);
     if(sources.length!==3 || sources.some((x,i)=>i>0&&x.absX-sources[i-1].absX<110))
       failures.push({stage:1,width:c.width,error:"compact sources too close",positions:sources});
   }
 }
 if(c.stage===2){
   if(c.panels?.length!==6 || !allLanes.every(n=>c.panels.some(x=>x.lane===n)))
     failures.push({stage:2,width:c.width,error:"scanner lane missing"});
   if(c.width<=430 && !c.lastPanelScroll?.visible)
     failures.push({stage:2,width:c.width,error:"last scanner not reachable"});
 }
 if(c.stage===3){
   const labels=c.canvasLaneLabels||[];
   for(const name of allLanes){
     const hit=labels.filter(x=>x.text.toUpperCase()===name).at(-1);
     if(!hit)failures.push({stage:3,width:c.width,error:"canvas route absent: "+name});
     else if(c.canvas && (hit.absX<42||hit.absX>c.canvas.w-42||hit.absY<22||hit.absY>c.canvas.h-22))
       failures.push({stage:3,width:c.width,error:"canvas route clipped: "+name,x:hit.absX,y:hit.absY});
   }
 }
}
const summary=checks.map(c=>({stage:c.stage,w:c.width,h:c.height,http:c.http,error:c.error,frame:c.frame,canvas:c.canvas,coverage:c.canvasPixels?.covered,panels:c.panels?.map(x=>x.lane),scroll:c.wrapScroll,last:c.lastPanelScroll,labels:[...new Set(c.canvasLaneLabels?.map(x=>x.text)||[])],labelPositions:c.stage===3?Object.values(Object.fromEntries((c.canvasLaneLabels||[]).map(x=>[x.text,[x.absX,x.absY]]))):undefined,sourcePositions:c.stage===1?Object.values(Object.fromEntries((c.sourceLabels||[]).map(x=>[x.text,[x.absX,x.absY]]))):undefined}));
console.log(JSON.stringify({tests:checks.length,workflowTransitions,failures,errors,summary},null,2));
if(checks.length!==sizes.length*3||failures.length||errors.length)process.exitCode=1;
