import {createPublicKey,verify} from "node:crypto";
// Official Telegram production Mini Apps Ed25519 public key.
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
const TELEGRAM_KEY="e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c187fe7d34caed242d";
export type VerifiedTelegram={telegramId:string;authDate:number};
export function validateTelegramInitData(
 initData:string,botId:string,nowSeconds=Math.floor(Date.now()/1000),keyHex=TELEGRAM_KEY
):VerifiedTelegram|null{
 if(typeof initData!=="string"||initData.length<50||initData.length>4096||
    !/^[1-9][0-9]{4,19}$/.test(botId))return null;
 try{
  const params=new URLSearchParams(initData);
  const seen=new Set<string>(),items:string[]=[];
  let signature="",authDate="",userRaw="";
  for(const [key,value] of params){
   if(seen.has(key)||key.length>80||value.length>2500)return null;
   seen.add(key);
   if(key==="signature"){signature=value;continue;}
   if(key==="hash")continue;
   if(key==="auth_date")authDate=value;
   if(key==="user")userRaw=value;
   items.push(key+"="+value);
  }
  if(!/^[0-9]{10,11}$/.test(authDate)||!signature||!userRaw)return null;
  const ts=Number(authDate);
  if(!Number.isSafeInteger(ts)||ts>nowSeconds+30||nowSeconds-ts>120)return null;
  if(!/^[A-Za-z0-9_-]{80,110}$/.test(signature))return null;
  const sig=Buffer.from(signature,"base64url");
  if(sig.length!==64||!(/^[0-9a-f]{64}$/i.test(keyHex)))return null;
  items.sort();
  const check=botId+":WebAppData\n"+items.join("\n");
  const pubKey=createPublicKey({key:Buffer.from("302a300506032b6570032100"+keyHex,"hex"),format:"der",type:"spki"});
  if(!verify(null,Buffer.from(check,"utf8"),pubKey,sig))return null;
  const user=JSON.parse(userRaw);
  const id=user?.id;
  if(!Number.isSafeInteger(id)||id<1||String(id).length>16)return null;
  return {telegramId:String(id),authDate:ts};
 }catch{return null;}
}
