import { readFileSync, writeFileSync } from 'node:fs';

const file = 'src/App.tsx';
let s = readFileSync(file, 'utf8');

// Keep the local prototype semantics aligned with a future server-side matching engine:
// explicit order identity, remaining quantity and reserved balances, without changing UI.
s = s.replace(
  /interface ExOrder \{[\s\S]*?\n\}/,
  `interface ExOrder {\n  id: string; pair: string; side: "buy" | "sell";\n  price: number; amount: number; total: number;\n  status: "open" | "filled" | "cancelled"; createdAt: string;\n  mode?: "spot" | "margin";\n  orderType?: "market" | "limit" | "stop";\n  triggerPrice?: number;\n  filledAmount?: number; remainingAmount?: number;\n  reservedQuote?: number; reservedBase?: number;\n  clientOrderId?: string; executedAt?: string;\n}`
);

// Make position state future-proof for server-side risk management.
s = s.replace(
  /interface ExPosition \{[\s\S]*?\n\}/,
  `interface ExPosition {\n  id: string; asset: string; side: "long" | "short";\n  entry: number; qty: number; leverage: number; margin: number; fee: number; openedAt: string;\n  stopLoss?: number; takeProfit?: number; status?: "open" | "closed" | "liquidated";\n}`
);

// Idempotency and fee constants live inside the trading component so they can later be replaced by server config.
if (!s.includes('const EX_TAKER_FEE = 0.003;')) {
  const marker = 'function ExchangeProTrade(';
  const i = s.indexOf(marker);
  if (i >= 0) {
    const bodyStart = s.indexOf('{', i);
    s = s.slice(0, bodyStart + 1) + '\n  const EX_TAKER_FEE = 0.003;\n  const EX_MAKER_FEE = 0.001;\n  const MAX_LEVERAGE = 20;\n  const MIN_ORDER_QTY = 0.00000001;\n' + s.slice(bodyStart + 1);
  }
}

// Replace the pending spot-order branch with balance-aware reservation semantics.
const pendingStart = s.indexOf('if(mode==="spot"&&(orderType==="قیمت ثابت"||orderType==="حد ضرر")){');
if (pendingStart >= 0) {
  const pendingEnd = s.indexOf('if(mode==="spot"){', pendingStart + 10);
  if (pendingEnd > pendingStart) {
    const pending = `if(mode==="spot"&&(orderType==="قیمت ثابت"||orderType==="حد ضرر")){const triggerPrice=Number(toLatinDigits(String(price)));if(!Number.isFinite(qty)||qty<MIN_ORDER_QTY){setProcessing(false);setReceipt({title:"مقدار نامعتبر",amount:"",destination:"",detail:"مقدار سفارش باید بیشتر از صفر باشد."});return;}if(!Number.isFinite(triggerPrice)||triggerPrice<=0){setProcessing(false);setReceipt({title:"قیمت نامعتبر",amount:"",destination:"",detail:"قیمت سفارش باید بیشتر از صفر باشد."});return;}const allOpen=DB.getExOrders().filter(o=>o.mode==="spot"&&o.status==="open"&&o.pair===\`${asset}/TOMAN\`);const reservedQuote=allOpen.reduce((n,o)=>n+(o.reservedQuote??(o.side==="buy"?(o.price||o.triggerPrice||0)*o.amount:0)),0);const reservedBase=allOpen.reduce((n,o)=>n+(o.reservedBase??(o.side==="sell"?o.amount:0)),0);const availableQuote=(wallet.toman??0)-reservedQuote;const availableBase=((wallet as Record<string,number>)[asset]??0)-reservedBase;const reserveQuote=buy?triggerPrice*qty*(1+EX_TAKER_FEE):0;const reserveBase=buy?0:qty;if((buy&&availableQuote<reserveQuote)||(!buy&&availableBase<reserveBase)){setProcessing(false);setReceipt({title:"موجودی کافی نیست",amount:"",destination:"",detail:buy?"موجودی تومان آزاد برای این سفارش کافی نیست.":\`موجودی آزاد \${asset} برای فروش کافی نیست.\`});return;}const pending:ExOrder={id:orderId,clientOrderId:orderId,pair:\`${asset}/TOMAN\`,side:buy?"buy":"sell",price:orderType==="حد ضرر"?0:price,amount:qty,filledAmount:0,remainingAmount:qty,total:orderType==="حد ضرر"?triggerPrice*qty:total,status:"open",createdAt:new Date().toISOString(),mode:"spot",orderType:orderType==="حد ضرر"?"stop":"limit",triggerPrice:orderType==="حد ضرر"?triggerPrice:undefined,reservedQuote:reserveQuote,reservedBase:reserveBase};const nextOrders=[pending,...DB.getExOrders()];DB.saveExOrders(nextOrders);setOrders(nextOrders);setAmount("");setSelectedPct(null);setProcessing(false);setReceipt({title:orderType==="حد ضرر"?"سفارش حد ضرر ثبت شد":"سفارش قیمت ثابت ثبت شد",amount:\`${faFixed(qty,4)} ${asset}\`,destination:orderType==="حد ضرر"?\`فعال‌سازی در ${fa(Math.round(triggerPrice))} تومان\`:\`قیمت ${fa(Math.round(price))} تومان\`,detail:"موجودی سفارش رزرو شد و تا اجرای شرط یا لغو سفارش آزاد نمی‌شود."});return;}`;
    s = s.slice(0, pendingStart) + pending + s.slice(pendingEnd);
  }
}

// Replace the local spot matcher with a reservation-safe, idempotent matcher.
const engineStart = s.indexOf('useEffect(()=>{if(mode!=="spot")return;const market=coin.price;');
if (engineStart >= 0) {
  const engineEnd = s.indexOf('},[tick,coin.price,asset,mode]);', engineStart);
  if (engineEnd > engineStart) {
    const engineEndFull = engineEnd + '},[tick,coin.price,asset,mode]);'.length;
    const engine = `useEffect(()=>{if(mode!=="spot")return;const market=coin.price;const all=DB.getExOrders();let changed=false;const next=all.map(o=>{if(o.mode!=="spot"||o.status!=="open")return o;const [base,quote]=o.pair.split("/");if(base!==asset||quote!=="TOMAN")return o;const trigger=o.orderType==="stop"?(o.triggerPrice??o.price):o.price;const hit=o.orderType==="stop"?(o.side==="buy"?market>=trigger:market<=trigger):(o.side==="buy"?market<=trigger:market>=trigger);if(!hit)return o;const wallet=DB.getExWallet();const baseBal=(wallet as Record<string,number>)[base]??0;const quoteBal=wallet.toman??0;const otherOpen=all.filter(x=>x.id!==o.id&&x.mode==="spot"&&x.status==="open"&&x.pair===o.pair);const reservedQuote=otherOpen.reduce((n,x)=>n+(x.reservedQuote??(x.side==="buy"?(x.price||x.triggerPrice||0)*x.amount:0)),0);const reservedBase=otherOpen.reduce((n,x)=>n+(x.reservedBase??(x.side==="sell"?x.amount:0)),0);const fillQty=o.remainingAmount??o.amount;const fillTotal=market*fillQty;const fillFee=fillTotal*EX_TAKER_FEE;const availableQuote=quoteBal-reservedQuote;const availableBase=baseBal-reservedBase;if(o.side==="buy"&&availableQuote<fillTotal+fillFee)return o;if(o.side==="sell"&&availableBase<fillQty)return o;const updatedWallet={...wallet,[base]:o.side==="buy"?baseBal+fillQty:Math.max(0,baseBal-fillQty),toman:o.side==="buy"?Math.max(0,quoteBal-fillTotal-fillFee):quoteBal+fillTotal-fillFee};DB.saveExWallet(updatedWallet);changed=true;return {...o,status:"filled",price:market,total:fillTotal,filledAmount:(o.filledAmount??0)+fillQty,remainingAmount:0,reservedQuote:0,reservedBase:0,executedAt:new Date().toISOString()};});if(changed){DB.saveExOrders(next);setOrders(next);}},[tick,coin.price,asset,mode]);`;
    s = s.slice(0, engineStart) + engine + s.slice(engineEndFull);
  }
}

// Cancellation is idempotent and explicitly releases reservations by zeroing them.
s = s.replace(
  /const cancelOrder=\(id:string\)=>\{[^}]+\};/,
  'const cancelOrder=(id:string)=>{const next=DB.getExOrders().map(o=>o.id===id&&o.status==="open"?{...o,status:"cancelled",reservedQuote:0,reservedBase:0}:o);DB.saveExOrders(next);setOrders(next);};'
);

// Validate leverage before margin execution and cap it to a sane prototype risk ceiling.
s = s.replace(
  'const buy=side==="buy"||side==="long";const orderId=genId();const wallet=DB.getExWallet();',
  'const buy=side==="buy"||side==="long";if(mode==="margin"&&(lev<1||lev>MAX_LEVERAGE)){setProcessing(false);setReceipt({title:"اهرم نامعتبر",amount:"",destination:"",detail:`اهرم باید بین 1x و ${MAX_LEVERAGE}x باشد.`});return;}if(!Number.isFinite(qty)||qty<MIN_ORDER_QTY||!Number.isFinite(price)||price<=0){setProcessing(false);setReceipt({title:"پارامتر سفارش نامعتبر",amount:"",destination:"",detail:"مقدار و قیمت سفارش را بررسی کنید."});return;}const orderId=genId();const wallet=DB.getExWallet();'
);

// Avoid reprocessing the same local order after an async UI rerender.
s = s.replace(
  'const newOrder:ExOrder={id:orderId,pair:`${asset}/TOMAN`,side:buy?"buy":"sell",price,amount:qty,total,status:"filled",createdAt:new Date().toISOString(),mode:"spot"};',
  'const newOrder:ExOrder={id:orderId,clientOrderId:orderId,pair:`${asset}/TOMAN`,side:buy?"buy":"sell",price,amount:qty,filledAmount:qty,remainingAmount:0,total,status:"filled",createdAt:new Date().toISOString(),executedAt:new Date().toISOString(),mode:"spot"};'
);

writeFileSync(file, s);
console.log('Exchange hardening applied.');
