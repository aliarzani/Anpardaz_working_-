import { readFileSync, writeFileSync } from 'node:fs';

const file = 'src/App.tsx';
let src = readFileSync(file, 'utf8');

src = src.replace(/async function fetchUSDTRate\(\):Promise<number>\{[\s\S]*?\n\}/, `async function fetchUSDTRate():Promise<number>{
  const cacheKey="anp_live_usdt_toman_v1";
  try{
    const r=await fetch("https://api.wallex.ir/v1/markets",{signal:AbortSignal.timeout(7000)});
    const d=await r.json();
    const p=d?.result?.symbols?.USDTTMN?.stats?.lastPrice??d?.result?.symbols?.USDTTMN?.stats?.bidPrice;
    if(p){
      const n=parseFloat(p);
      const toman=n>1000000?n/10:n;
      if(Number.isFinite(toman)&&toman>100000&&toman<1000000){
        try{localStorage.setItem(cacheKey,JSON.stringify({value:toman,updatedAt:Date.now()}))}catch{}
        return toman;
      }
    }
  }catch{}
  try{
    const cached=JSON.parse(localStorage.getItem(cacheKey)||"null");
    if(cached?.value&&Date.now()-cached.updatedAt<30*60*1000)return cached.value;
  }catch{}
  return FALLBACK_RATE;
}`);

src = src.replace(/pair:`\$\{asset\}\/USDT`/g, 'pair:`${asset}/TOMAN`');

writeFileSync(file, src);
