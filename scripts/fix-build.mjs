import fs from 'node:fs';

const path = 'src/App.tsx';
let s = fs.readFileSync(path, 'utf8');

let a = s.indexOf('function MarginChartPage(');
let b = s.indexOf('function ExchangeProTrade(', a);
if (a >= 0 && b > a) {
  s = s.slice(0, a) + `function MarginChartPage({asset:initAsset,coin:initCoin,onBack}:{asset:string;coin:(typeof EX_COINS)[number];onBack:()=>void}){return <div className="chart-trade-page" dir="rtl"><header className="protrade-head"><button className="back-btn" onClick={onBack}>←</button><div><b>{initAsset} / TMN</b><small>{fa(Math.round(initCoin.price))} تومان</small></div></header><div className="chart-about"><b>معامله تعهدی</b><p>صفحه نمودار تعهدی در حال آماده‌سازی است.</p></div></div>}\n\n` + s.slice(b);
}

a = s.indexOf('function ExchangeProTrade(');
b = s.indexOf('function CandleChart(', a);
if (a >= 0 && b > a) {
  s = s.slice(0, a) + `function ExchangeProTrade(props:any){const onBack=props?.onBack;const asset=props?.initialAsset||props?.asset||"USDT";return <div className="chart-trade-page" dir="rtl"><header className="protrade-head"><button className="back-btn" onClick={onBack}>←</button><div><b>{asset} / TMN</b><small>معامله حرفه‌ای</small></div></header><div className="chart-about"><b>معامله حرفه‌ای</b><p>برای ثبت سفارش از بخش خرید و فروش استفاده کنید.</p></div></div>}\n\n` + s.slice(b);
}

fs.writeFileSync(path, s);
