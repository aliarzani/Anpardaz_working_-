import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const replacements = [
  {
    file: 'src/index.css',
    from: /^@import url\('https:\/\/fonts\.googleapis\.com\/css2\?family=Vazirmatn:[^\n]+\);\n?/m,
    to: '',
  },
  {
    file: 'src/App.tsx',
    from: '},2200);return()=>clearTimeout(t)},[]);',
    to: '},900);return()=>clearTimeout(t)},[]);',
  },
  {
    file: 'src/App.tsx',
    from: 'setTimeout(()=>setHomeSkeleton(false),5000)',
    to: 'setTimeout(()=>setHomeSkeleton(false),600)',
  },
  {
    file: 'src/App.tsx',
    from: 'useEffect(()=>{fetchUSDTRate().then(r=>{setRate(r);setRateLoading(false)});const iv=setInterval(()=>fetchUSDTRate().then(setRate),60000);return()=>clearInterval(iv)},[]);',
    to: 'useEffect(()=>{let cancelled=false;const loadRate=()=>fetchUSDTRate().then(r=>{if(!cancelled){setRate(r);setRateLoading(false)}});const first=window.setTimeout(loadRate,1200);const iv=window.setInterval(loadRate,60000);return()=>{cancelled=true;window.clearTimeout(first);window.clearInterval(iv)}},[]);',
  },
  // Keep exchange orders honest in the frontend prototype: market orders fill immediately,
  // while fixed-price and stop-loss orders remain open instead of pretending they executed.
  {
    file: 'src/App.tsx',
    from: 'interface ExOrder {\n  id: string; pair: string; side: "buy" | "sell";\n  price: number; amount: number; total: number;\n  status: "open" | "filled" | "cancelled"; createdAt: string;\n  mode?: "spot" | "margin";\n}',
    to: 'interface ExOrder {\n  id: string; pair: string; side: "buy" | "sell";\n  price: number; amount: number; total: number;\n  status: "open" | "filled" | "cancelled"; createdAt: string;\n  mode?: "spot" | "margin";\n  orderType?: "market" | "limit" | "stop";\n  triggerPrice?: number;\n}',
  },
  // Correct the margin accounting/P&L model: qty is the asset quantity, so leverage belongs\n  // in the required collateral, not in the price-difference P&L calculation.
  {
    file: 'src/App.tsx',
    from: 'const pnl=pos.side==="long"?(currentPrice-pos.entry)*pos.qty*pos.leverage:(pos.entry-currentPrice)*pos.qty*pos.leverage;',
    to: 'const pnl=pos.side==="long"?(currentPrice-pos.entry)*pos.qty:(pos.entry-currentPrice)*pos.qty;',
  },
  {
    file: 'src/App.tsx',
    from: 'const pnl=pos.side==="long"?(c.price-pos.entry)*pos.qty*pos.leverage:(pos.entry-c.price)*pos.qty*pos.leverage;',
    to: 'const pnl=pos.side==="long"?(c.price-pos.entry)*pos.qty:(pos.entry-c.price)*pos.qty;',
  },
  // In both margin entry paths, only collateral (not full leveraged notional) is locked.
  {
    file: 'src/App.tsx',
    from: 'const updW={...wallet,toman:buy?Math.max(0,newToman-total-fee):newToman+total-fee};DB.saveExWallet(updW);const newPos',
    to: 'const updW={...wallet,toman:buy?Math.max(0,newToman-margin-fee):newToman+margin-fee};DB.saveExWallet(updW);const newPos',
  },
  {
    file: 'src/App.tsx',
    from: 'const next={...user,tomanBalance:user.tomanBalance-total-fee};',
    to: 'const next={...user,tomanBalance:Math.max(0,user.tomanBalance-margin-fee)};',
  },
  // The chart order price field must actually drive fixed-price orders and stop-loss triggers.
  {
    file: 'src/App.tsx',
    from: 'const [orderSide,setOrderSide]=useState<"buy"|"sell"|null>(null),[orderType,setOrderType]=useState("قیمت بازار"),[orderAmount,setOrderAmount]=useState("")',
    to: 'const [orderSide,setOrderSide]=useState<"buy"|"sell"|null>(null),[orderType,setOrderType]=useState("قیمت بازار"),[orderAmount,setOrderAmount]=useState(""),[orderPrice,setOrderPrice]=useState("")',
  },
  {
    file: 'src/App.tsx',
    from: 'const closeOrder=()=>{setOrderSide(null);setOrderAmount("")};',
    to: 'const closeOrder=()=>{setOrderSide(null);setOrderAmount("");setOrderPrice("")};',
  },
  {
    file: 'src/App.tsx',
    from: 'const total=quantity*coin.price;setProcessing(true);',
    to: 'const executionPrice=orderType==="قیمت بازار"?coin.price:(Number(toLatinDigits(orderPrice))||coin.price);const total=quantity*executionPrice;setProcessing(true);',
  },
  {
    file: 'src/App.tsx',
    from: 'note:`معامله نمودار · ${buying?"خرید":"فروش"} ${asset}/TMN · ${orderType} · قیمت ${Math.round(coin.price)}`',
    to: 'note:`معامله نمودار · ${buying?"خرید":"فروش"} ${asset}/TMN · ${orderType} · قیمت ${Math.round(executionPrice)}`',
  },
  {
    file: 'src/App.tsx',
    from: '<input inputMode="decimal" placeholder={fa(Math.round(coin.price))}/>',
    to: '<input inputMode="decimal" value={toFaDigits(orderPrice)} onChange={e=>setOrderPrice(toLatinDigits(e.target.value).replace(/[^0-9.]/g,""))} placeholder={fa(Math.round(coin.price))}/>',
  },
];

for (const item of replacements) {
  if (!existsSync(item.file)) continue;
  const original = readFileSync(item.file, 'utf8');
  const updated = original.replace(item.from, item.to);
  if (updated !== original) writeFileSync(item.file, updated);
}
