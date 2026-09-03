import { readFileSync, writeFileSync } from 'node:fs';

const file = 'src/App.tsx';
let s = readFileSync(file, 'utf8');

if (!s.includes('ANPARDaz_RISK_ENGINE_V1')) {
  const marker = 'const closePosition=';
  const i = s.indexOf(marker);
  if (i >= 0) {
    const risk = `/* ANPARDaz_RISK_ENGINE_V1 */\n  useEffect(()=>{\n    if(mode!=="margin") return;\n    const market=coin.price;\n    const all=DB.getExPositions();\n    if(!Array.isArray(all)||!all.length) return;\n    let changed=false;\n    const next=all.flatMap(pos=>{\n      if(pos.asset!==asset || pos.status==="closed" || pos.status==="liquidated") return [pos];\n      const mmRate=0.005;\n      const liq=pos.side==="long"\n        ? pos.entry*(1-1/Math.max(1,pos.leverage)+mmRate)\n        : pos.entry*(1+1/Math.max(1,pos.leverage)-mmRate);\n      const hitLiq=pos.side==="long" ? market<=liq : market>=liq;\n      const hitSL=typeof pos.stopLoss==="number" && (pos.side==="long" ? market<=pos.stopLoss : market>=pos.stopLoss);\n      const hitTP=typeof pos.takeProfit==="number" && (pos.side==="long" ? market>=pos.takeProfit : market<=pos.takeProfit);\n      if(!hitLiq&&!hitSL&&!hitTP) return [pos];\n      const wallet=DB.getExWallet();\n      const pnl=pos.side==="long" ? (market-pos.entry)*pos.qty : (pos.entry-market)*pos.qty;\n      const closeValue=Math.max(0,pos.margin+pnl-pos.fee);\n      DB.saveExWallet({...wallet,toman:(wallet.toman??0)+closeValue});\n      changed=true;\n      return [{...pos,qty:0,margin:0,status:hitLiq?"liquidated":"closed",closedAt:new Date().toISOString(),closePrice:market,realizedPnl:pnl}];\n    });\n    if(changed) DB.saveExPositions(next);\n  },[tick,coin.price,asset,mode]);\n  `;
    s = s.slice(0, i) + risk + s.slice(i);
  }
}

writeFileSync(file, s);
console.log('Margin risk engine applied.');
