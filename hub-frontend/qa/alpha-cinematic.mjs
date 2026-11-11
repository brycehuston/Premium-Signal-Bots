import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
const base=process.env.BASE_URL||"http://127.0.0.1:3000";
const dir=path.join(process.cwd(),"qa-cinematic-artifacts");
await mkdir(dir,{recursive:true});
const sizes=[{w:320,h:700},{w:390,h:844},{w:430,h:932},{w:768,h:1024},{w:844,h:390},{w:1440,h:900}];
const browser=await chromium.launch({headless:true});
const checks=[];const errors=[];
for(const {w,h} of sizes)for(const stage of [1,2,3]){
 const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:w<=430&&h>w,hasTouch:w<=430,reducedMotion:"reduce"});
 await page.addInitScript(()=>{
   window.__alphaCanvasTexts=[];
   const original=CanvasRenderingContext2D.prototype.fillText;
   CanvasRenderingContext2D.prototype.fillText=function(t,x,y,...rest){
     const str=String(t).trim();
     if(str && window.__alphaCanvasTexts.length<5000)window.__alphaCanvasTexts.push({text:str,x:Math.round(x),y:Math.round(y),font:this.font});
     return original.call(this,t,x,y,...rest);
   };
 });
 page.on("pageerror",e=>errors.push({stage,width:w,error:e.message.slice(0,200)}));
 const route="/stage-"+stage;
 try {
  const r=await page.goto(base+route,{waitUntil:"domcontentloaded",timeout:35000});
  const iframe=page.locator("iframe").first();
  await iframe.waitFor({timeout:17000});
  const frame=await iframe.contentFrame();
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
      canvasLaneLabels:laneText,canvasTextCount:words.length,
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
await browser.close();
await writeFile(path.join(dir,"stage-results.json"),JSON.stringify({base,checks,errors},null,2));
const summary=checks.map(c=>({stage:c.stage,w:c.width,h:c.height,http:c.http,error:c.error,frame:c.frame,canvas:c.canvas,coverage:c.canvasPixels?.covered,panels:c.panels?.map(x=>x.lane),scroll:c.wrapScroll,last:c.lastPanelScroll,labels:c.canvasLaneLabels?.map(x=>x.text).filter((x,i,a)=>a.indexOf(x)===i)}));
console.log(JSON.stringify({tests:checks.length,errors,summary},null,2));
if(checks.length!==sizes.length*3||checks.some(x=>x.error||x.http!==200)||errors.length)process.exitCode=1;
