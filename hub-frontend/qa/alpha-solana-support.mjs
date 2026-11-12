import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
const base=process.env.BASE_URL??"http://127.0.0.1:3000";
const address="EmZrEA6awqWqo5pzbwX3ZRpyE9sNT42LZ6LBvU6bM4M5";
const folder=path.join(process.cwd(),"qa-screenshots","solana-support");
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true});
const report=[];
try{
 for(const width of [320,390,430,1440]){
  const page=await browser.newPage({viewport:{width,height:width<500?844:900},reducedMotion:"reduce"});
  try{
   const response=await page.goto(base+"/support",{waitUntil:"domcontentloaded",timeout:30000});
   assert.equal(response?.status(),200);
   const toggle=page.getByRole("button",{name:/SUPPORT WITH SOL OR USDC/i});
   await toggle.waitFor({timeout:15000});
   // Wait for React event handlers after server-rendered HTML becomes visible.
   await page.waitForTimeout(1000);
   await toggle.click();
   await page.waitForFunction(() => document.querySelector('[aria-controls="crypto-support-details"]')?.getAttribute("aria-expanded")==="true",{timeout:5000});
   const detail=page.locator("#crypto-support-details");
   await detail.getByText(address,{exact:true}).waitFor();
   const usdc=detail.getByRole("button",{name:"USDC",exact:true});
   const sol=detail.getByRole("button",{name:"SOL",exact:true});
   assert.equal(await usdc.getAttribute("aria-pressed"),"true");
   await sol.click();
   assert.equal(await sol.getAttribute("aria-pressed"),"true");
   assert.match(await detail.innerText(),/Solana network/i);
   assert.equal(await detail.locator("svg").count()>0,true,"QR present");
   const bounds=await detail.getByText(address,{exact:true}).boundingBox();
   assert.ok(bounds&&bounds.width>0,"address displayed");
   await page.screenshot({path:path.join(folder,"support-"+width+".png"),animations:"disabled",fullPage:true});
   report.push({width,result:"pass"});
  }catch(e){report.push({width,result:"fail",error:String(e)})}finally{await page.close()}
 }
}finally{await browser.close()}
await writeFile(path.join(folder,"results.json"),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
assert.equal(report.filter(r=>r.result==="fail").length,0,"Support wallet QA failed");
