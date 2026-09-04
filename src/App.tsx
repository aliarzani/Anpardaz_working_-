import { useState, useEffect, useCallback, useRef, useMemo, type ReactNode } from "react";
import { createPortal } from "react-dom";
import anPardazLogo from "@/imports/ChatGPT_Image_Aug_10__2026__06_38_53_PM__3_.png";
import logoHekmat from "@/imports/Bank-Hekmat-Iranian-Logo.png";
import logoMehr from "@/imports/Bank-Mehr-Iran.png";
import logoHamrahAval from "@/imports/Hamrahe_Aval__2_.png";
import logoIrancell from "@/imports/_wp-content_uploads_2023_12_MTNI-Logo-Yellow-FA-1024-563.png";
import logoAnsar from "@/imports/bank-ansar.png";
import logoKarafarin from "@/imports/bank-karafarin-3.png";
import logoParsian from "@/imports/bank-parsian.png";
import logoRefah from "@/imports/bank-refah.png";
import logoRightel from "@/imports/new-logo4.png";
import logoSarmayeh from "@/imports/bank-sarmayeh.png";
import logoShahr from "@/imports/bank-shahr.png";
import logoTejarat from "@/imports/bank-tejarat.png";
import logoSanatMadan from "@/imports/Sanat-va-madan.png";
import logoMeli from "@/imports/bank-meli__2_.png";
import logoMelal from "@/imports/Melal-Credit-Institution-Logo.png";
import logoToseeTaavon from "@/imports/Tosee-Taavon-Bank-Logo.png";
import logoDi from "@/imports/bank-ayandeh.png";
import logoIranZamin from "@/imports/bank-iranzamin.png";
import logoKeshavarzi from "@/imports/Bank-Keshavarzi-Logo.png";
import logoMaskan from "@/imports/bank-maskan.png";
import logoResalat from "@/imports/bank-resalat.png";
import logoSepah from "@/imports/bank-sepah.png";
import slide2Img from "@/imports/ChatGPT_Image_Aug_26__2026__03_51_21_PM-1.png";
import slide3Img from "@/imports/ChatGPT_Image_Aug_26__2026__03_27_20_PM.png";
import logoGardeshgari from "@/imports/gardeshgari.png";
import logoToseeSaderat from "@/imports/Export-Development-Bank-of-Iran-Logo.png";
import billImgHamrah from "@/imports/67ea208c-b6ea-4a03-9408-156cfa836850.png";
import billImgIrancell from "@/imports/8bd188ae-0d5a-41e2-b9e2-719e1850fb93.png";
import billImgAb from "@/imports/ecad70dc-ed5e-4c95-aac7-cf369ea9d460.png";
import billImgBrq from "@/imports/cb91bb35-cad8-4893-af8b-7256a27ae26e.png";
import billImgMakhab from "@/imports/db7f952b-560e-4108-962f-40b21acd1fde.png";
import charityLogoKomite from "@/imports/bd981266-0952-497e-adc2-6979c25929dd.png";
import charityLogoRedCrescent from "@/imports/50ee0495-3e4f-4701-97e0-f37994adb0e1.png";
import charityLogoChildren from "@/imports/3bea6472-d221-4630-b1c2-ad7882ba4659.png";
import charityLogoBarekat from "@/imports/fea9ea50-c987-4daf-a63c-fc8720539963.png";
import charityLogoEnvironment from "@/imports/39de94f2-ebfb-499f-8225-90f5f5c90ad7-1.png";
import billImgGaz from "@/imports/dfbca881-b660-417c-b45e-7e5ab1120d16.png";
import logoPostBank from "@/imports/postbank.png";
import logoMellat from "@/imports/bank-mellat.png";

// ─── Config ───────────────────────────────────────────────────────────────────
// Iranian Toman fallback. Live market data is preferred; this is only used when
// the exchange API is temporarily unavailable.
const FALLBACK_RATE = 220000;
const KAVENEGAR_KEY = "";

// ─── Types ────────────────────────────────────────────────────────────────────
type AppState = "splash" | "login" | "otp" | "unlock-pin" | "onboard-photo" | "onboard-profile" | "onboard-pin" | "verify-anim" | "ready";
type MainTab = "home" | "history" | "profile";
type SubPage = null | "transfer" | "tether-swap" | "exchange" | "charge" | "internet" | "bills" | "car-services" | "violations" | "freeway" | "tehran-traffic" | "insurance" | "sana" | "judiciary-bill" | "property-reg" | "charity" | "service" | "card-balance" | "charge-payment" | "charity-payment" | "bills-payment" | "violations-payment" | "forex-bot" | "cashback";

interface UserData {
  phone: string; name: string; family: string; nationalId: string;
  birthDate: string; photo: string; pin: string;
  tomanBalance: number; usdtBalance: number;
  cryptoBalances: Record<string, number>;
  cards: BankCard[]; registeredAt: string;
}
interface BankCard { id: string; number: string; bank: string; holderName: string; expM?: string; expY?: string; }
interface TxRecord {
  id: string; userId: string;
  type: "deposit" | "withdraw" | "swap" | "transfer" | "service";
  fromAsset: string; toAsset: string;
  amount: number; convertedAmount?: number; fee: number;
  status: "pending" | "done" | "failed"; createdAt: string;
  toAddress?: string; fromCard?: string; note?: string;
  source?: "app" | "exchange"; tradeType?: string;
}
interface ExOrder {
  id: string; pair: string; side: "buy" | "sell";
  price: number; amount: number; total: number;
  status: "open" | "filled" | "cancelled"; createdAt: string;
  mode?: "spot" | "margin";
}
interface ExPosition {
  id: string; asset: string; side: "long" | "short";
  entry: number; qty: number; leverage: number; margin: number; fee: number; openedAt: string;
}
type ExAsset = "toman" | "USDT" | "BTC" | "ETH" | "BNB" | "SOL" | "DOGE" | "ADA";
type ExWallet = Record<ExAsset, number>;

// ─── Exchange Constants ────────────────────────────────────────────────────────
const EX_PAIRS = [
  "BTC/USDT","ETH/USDT","BNB/USDT","XRP/USDT","ADA/USDT","SOL/USDT",
  "AVAX/USDT","DOT/USDT","MATIC/USDT","LINK/USDT","UNI/USDT","ATOM/USDT",
  "LTC/USDT","ETC/USDT","DOGE/USDT","TRX/USDT","NEAR/USDT","ALGO/USDT",
  "VET/USDT","SHIB/USDT","APE/USDT","OP/USDT","ARB/USDT","INJ/USDT",
  "SUI/USDT","PEPE/USDT","WIF/USDT","JUP/USDT",
  "BTC/TOMAN","ETH/TOMAN","USDT/TOMAN","BNB/TOMAN","SOL/TOMAN","DOGE/TOMAN",
];
const INITIAL_PRICES: Record<string, number> = {
  "BTC/USDT":67543,"ETH/USDT":3852,"BNB/USDT":608,
  "XRP/USDT":0.621,"ADA/USDT":0.483,"SOL/USDT":187,
  "AVAX/USDT":42.3,"DOT/USDT":8.52,"MATIC/USDT":0.953,
  "LINK/USDT":18.7,"UNI/USDT":12.5,"ATOM/USDT":11.3,
  "LTC/USDT":93.2,"ETC/USDT":36.5,"DOGE/USDT":0.1865,
  "TRX/USDT":0.1285,"NEAR/USDT":8.25,"ALGO/USDT":0.221,
  "VET/USDT":0.0473,"SHIB/USDT":0.0000267,
  "APE/USDT":1.87,"OP/USDT":2.97,"ARB/USDT":1.27,
  "INJ/USDT":38.5,"SUI/USDT":1.97,"PEPE/USDT":0.0000187,
  "WIF/USDT":3.48,"JUP/USDT":1.14,
  "BTC/TOMAN":67543*220000,"ETH/TOMAN":3852*220000,
  "USDT/TOMAN":220000,"BNB/TOMAN":608*220000,
  "SOL/TOMAN":187*220000,"DOGE/TOMAN":0.1865*220000,
};
const TV_SYMBOLS: Record<string,string> = {
  "BTC/USDT":"BINANCE:BTCUSDT","ETH/USDT":"BINANCE:ETHUSDT",
  "BNB/USDT":"BINANCE:BNBUSDT","XRP/USDT":"BINANCE:XRPUSDT",
  "ADA/USDT":"BINANCE:ADAUSDT","SOL/USDT":"BINANCE:SOLUSDT",
  "AVAX/USDT":"BINANCE:AVAXUSDT","DOT/USDT":"BINANCE:DOTUSDT",
  "MATIC/USDT":"BINANCE:MATICUSDT","LINK/USDT":"BINANCE:LINKUSDT",
  "UNI/USDT":"BINANCE:UNIUSDT","ATOM/USDT":"BINANCE:ATOMUSDT",
  "LTC/USDT":"BINANCE:LTCUSDT","ETC/USDT":"BINANCE:ETCUSDT",
  "DOGE/USDT":"BINANCE:DOGEUSDT","TRX/USDT":"BINANCE:TRXUSDT",
  "NEAR/USDT":"BINANCE:NEARUSDT","ALGO/USDT":"BINANCE:ALGOUSDT",
  "VET/USDT":"BINANCE:VETUSDT","SHIB/USDT":"BINANCE:SHIBUSDT",
  "APE/USDT":"BINANCE:APEUSDT","OP/USDT":"BINANCE:OPUSDT",
  "ARB/USDT":"BINANCE:ARBUSDT","INJ/USDT":"BINANCE:INJUSDT",
  "SUI/USDT":"BINANCE:SUIUSDT","PEPE/USDT":"BINANCE:PEPEUSDT",
  "WIF/USDT":"BINANCE:WIFUSDT","JUP/USDT":"BINANCE:JUPUSDT",
  "USDT/TOMAN":"NOBITEX:USDTIRT","BTC/TOMAN":"NOBITEX:BTCIRT",
  "ETH/TOMAN":"NOBITEX:ETHIRT","BNB/TOMAN":"NOBITEX:BNBIRT",
  "SOL/TOMAN":"NOBITEX:SOLIRT","DOGE/TOMAN":"NOBITEX:DOGEIRT",
};

// ─── Storage ──────────────────────────────────────────────────────────────────
const DB = {
  getUser:(p:string):UserData|null=>{try{const raw=JSON.parse(localStorage.getItem(`anp_user_${p}`)??"null");if(!raw)return null;const u={cryptoBalances:{},...raw};if(!u.cards?.length)u.cards=[{id:"card-melat-1",number:"6104338761369582",bank:"بانک ملت",holderName:(u.name||"")+" "+(u.family||"")}];/* DEMO: ensure test balances for prototype */if(!u.tomanBalance||u.tomanBalance===0)u.tomanBalance=10000000;if(!u.usdtBalance||u.usdtBalance===0)u.usdtBalance=100;return u;}catch{return null}},
  saveUser:(u:UserData)=>localStorage.setItem(`anp_user_${u.phone}`,JSON.stringify(u)),
  currentPhone:()=>localStorage.getItem("anp_current")??"",
  setCurrentPhone:(p:string)=>localStorage.setItem("anp_current",p),
  getTx:(p:string):TxRecord[]=>{try{return JSON.parse(localStorage.getItem(`anp_tx_${p}`)??"[]")}catch{return[]}},
  saveTx:(p:string,t:TxRecord[])=>localStorage.setItem(`anp_tx_${p}`,JSON.stringify(t)),
  userExists:(p:string)=>!!localStorage.getItem(`anp_user_${p}`),
  getExWallet:():ExWallet=>{try{const raw=localStorage.getItem("anp_ex_wallet");if(!raw){const seed={toman:50000000,USDT:100,BTC:0.1,ETH:0,BNB:0,SOL:0,DOGE:0,ADA:0};localStorage.setItem("anp_ex_wallet",JSON.stringify(seed));return seed;}return JSON.parse(raw)||{toman:50000000,USDT:100,BTC:0.1,ETH:0,BNB:0,SOL:0,DOGE:0,ADA:0}}catch{return{toman:50000000,USDT:100,BTC:0.1,ETH:0,BNB:0,SOL:0,DOGE:0,ADA:0}}},
  saveExWallet:(w:ExWallet)=>localStorage.setItem("anp_ex_wallet",JSON.stringify(w)),
  getExOrders:():ExOrder[]=>{try{return JSON.parse(localStorage.getItem("anp_ex_orders")??"[]")}catch{return[]}},
  saveExOrders:(o:ExOrder[])=>localStorage.setItem("anp_ex_orders",JSON.stringify(o)),
  getExPositions:():ExPosition[]=>{try{return JSON.parse(localStorage.getItem("anp_ex_positions")??"[]")}catch{return[]}},
  saveExPositions:(p:ExPosition[])=>localStorage.setItem("anp_ex_positions",JSON.stringify(p)),
};

// ─── Operator Detection ───────────────────────────────────────────────────────
const OPERATORS = {
  mci:      {id:"mci",      name:"همراه اول", color:"#f5a623", textColor:"#fff",    logo:logoHamrahAval as string},
  irancell: {id:"irancell", name:"ایرانسل",   color:"#FFD700", textColor:"#071D2C", logo:logoIrancell as string},
  rightel:  {id:"rightel",  name:"رایتل",      color:"#9C27B0", textColor:"#fff",    logo:logoRightel as string},
} as const;
type OperatorId = keyof typeof OPERATORS;
type Operator = (typeof OPERATORS)[OperatorId];
function detectOperator(phone:string):Operator|null{
  const n=phone.replace(/^0/,"").slice(0,3);
  const map:Record<string,OperatorId>={
    "910":"mci","911":"mci","912":"mci","913":"mci","914":"mci","915":"mci",
    "916":"mci","917":"mci","918":"mci","919":"mci","990":"mci","991":"mci",
    "992":"mci","932":"mci","931":"mci",
    "930":"irancell","933":"irancell","935":"irancell","936":"irancell",
    "937":"irancell","938":"irancell","939":"irancell","901":"irancell",
    "902":"irancell","903":"irancell","904":"irancell","905":"irancell","941":"irancell",
    "920":"rightel","921":"rightel","922":"rightel",
  };
  const id=map[n];return id?OPERATORS[id]:null;
}
function OperatorBadge({op,size="md"}:{op:Operator;size?:"sm"|"md"}){
  const pad=size==="sm"?"4px 8px":"6px 12px";const fs=size==="sm"?11:13;const imgSz=size==="sm"?18:22;
  return <span style={{display:"inline-flex",alignItems:"center",gap:5,background:op.color+"22",border:`1.5px solid ${op.color}66`,borderRadius:20,padding:pad,fontSize:fs,fontWeight:700,fontFamily:"Vazirmatn",flexShrink:0,color:"var(--text-primary)"} as React.CSSProperties}>
    <img src={op.logo} alt={op.name} style={{width:imgSz,height:imgSz,objectFit:"contain",flexShrink:0}} decoding="async"/>
    {op.name}
  </span>;
}
function BankLogo({bankName,size=42,rounded=12}:{bankName:string;size?:number;rounded?:number}){
  const info=getBankInfo(bankName);
  if(info?.logo){
    return <div style={{width:size,height:size,borderRadius:rounded,overflow:"hidden",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:"1px solid rgba(0,0,0,0.08)"}}>
      <img src={info.logo} alt={bankName} style={{width:"80%",height:"80%",objectFit:"contain"}} decoding="async"/>
    </div>;
  }
  return <div style={{width:size,height:size,borderRadius:rounded,background:info?.color||"#2d6b4a",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:size*0.38,fontFamily:"Vazirmatn",flexShrink:0}}>
    {bankName.slice(0,1)}
  </div>;
}

// ─── API ──────────────────────────────────────────────────────────────────────
async function fetchUSDTRate():Promise<number>{
  try{const r=await fetch("https://api.wallex.ir/v1/markets",{signal:AbortSignal.timeout(7000)});const d=await r.json();const p=d?.result?.symbols?.USDTTMN?.stats?.lastPrice??d?.result?.symbols?.USDTTMN?.stats?.bidPrice;if(p){const n=parseFloat(p);if(Number.isFinite(n)&&n>100000)return n;}return FALLBACK_RATE;}catch{return FALLBACK_RATE}
}
async function sendOTP(phone:string,code:string):Promise<{ok:boolean;devCode?:string}>{
  if(!KAVENEGAR_KEY)return{ok:false,devCode:code};
  try{const url=`https://api.kavenegar.com/v1/${KAVENEGAR_KEY}/sms/send.json`;const body=new URLSearchParams({receptor:phone,message:`کد تأیید آن‌پرداز: ${code}`,sender:"10004346"});const r=await fetch(url,{method:"POST",body});const d=await r.json();return{ok:d.return?.status===200}}catch{return{ok:false,devCode:code}}
}

// ─── Utilities ────────────────────────────────────────────────────────────────
const toFaDigits=(value:string)=>value.replace(/[0-9]/g,d=>"۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
const toLatinDigits=(value:string)=>value.replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
function normalizeIranianPhone(tel:string):string{
  const d=toLatinDigits(tel).replace(/[\s\-().]/g,"");
  if(d.startsWith("+98"))return "0"+d.slice(3);
  if(d.startsWith("0098"))return "0"+d.slice(4);
  if(d.startsWith("98")&&d.length===12)return "0"+d.slice(2);
  return d;
}
const fa=(v:number|string)=>new Intl.NumberFormat("fa-IR").format(Number(v));
const faFixed=(v:number,d=4)=>new Intl.NumberFormat("fa-IR",{minimumFractionDigits:d,maximumFractionDigits:d}).format(v);
function genOTP(){return String(Math.floor(100000+Math.random()*900000))}
function genId(){return"TX"+Date.now().toString(36).toUpperCase()}

// ─── Mobile Back-Button Stack ──────────────────────────────────────────────────
const _ANP_BACK:Array<()=>void>=[];
function useBackHandler(fn:()=>void){
  const ref=useRef(fn);ref.current=fn;
  useEffect(()=>{const h=()=>ref.current();_ANP_BACK.push(h);return()=>{const i=_ANP_BACK.lastIndexOf(h);if(i>=0)_ANP_BACK.splice(i,1)}},[]);
}

// ─── FloatInput — RTL floating-label input ────────────────────────────────────
function FloatInput({label,value,onChange,type="text",inputMode,dir="rtl",maxLength,readOnly,autoFocus,onFocus,onBlur,className,style,suffix,multiline}:{label:string;value:string;onChange?:(v:string)=>void;type?:string;inputMode?:React.HTMLAttributes<HTMLInputElement>["inputMode"];dir?:"rtl"|"ltr";maxLength?:number;readOnly?:boolean;autoFocus?:boolean;onFocus?:()=>void;onBlur?:()=>void;className?:string;style?:React.CSSProperties;suffix?:string;multiline?:boolean}){
  const hasVal=value.length>0;
  const sharedProps={className:`fl-input${dir==="ltr"?" ltr":""}${className?" "+className:""}`,value,onChange:onChange?((e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>onChange(e.target.value)):undefined,readOnly,maxLength,dir,placeholder:" ",autoFocus,onFocus,onBlur};
  return(
    <div className="fl-wrap" style={{position:"relative",...style}}>
      {multiline?<textarea {...sharedProps as any} style={{minHeight:110,resize:"vertical"}}/>:<input {...sharedProps} type={type} inputMode={inputMode}/>} 
      <label className={`fl-label${hasVal?" has":""}`}>{label}</label>
      {suffix&&<span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:12,color:"var(--text-muted)",pointerEvents:"none"}}>{suffix}</span>}
    </div>
  );
}
