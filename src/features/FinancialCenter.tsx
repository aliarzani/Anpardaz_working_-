import { useMemo, useState } from "react";
import { buildFinancialInsight, type IncomeMode, type IncomeSource, type IncomeType, type ExpenseItem } from "./financialInsights";

const TYPES: Record<IncomeType,string> = { salary:"حقوق", job1:"شغل ۱", job2:"شغل ۲", business:"کسب‌وکار", rent:"اجاره", other:"سایر" };
const MODES: Record<IncomeMode,string> = { fixed:"ثابت", variable:"متغیر / بازه‌ای", approximate:"تقریبی" };
const incomeKey="anp_income_sources_v1";
const categoryKey="anp_expense_category_learning_v1";
const glowKey="anp_finance_warning_glow_v1";
const load=():IncomeSource[]=>{try{return JSON.parse(localStorage.getItem(incomeKey)||"[]")}catch{return[]}};
const save=(x:IncomeSource[])=>localStorage.setItem(incomeKey,JSON.stringify(x));
const loadCategories=():Record<string,string>=>{try{return JSON.parse(localStorage.getItem(categoryKey)||"{}")}catch{return{}}};
const fa=(n:number)=>new Intl.NumberFormat("fa-IR").format(Math.round(n));
const toLatin=(v:string)=>v.replace(/[۰-۹]/g,c=>"۰۱۲۳۴۵۶۷۸۹".indexOf(c).toString()).replace(/\D/g,"");

function txCategory(tx:any, learned:Record<string,string>){
  const note=String(tx.note||tx.description||tx.title||"").trim();
  const merchant=String(tx.merchant||tx.payee||"").trim();
  const learningKey=merchant||note;
  if(learningKey&&learned[learningKey]) return learned[learningKey];
  if(note) return note;
  if(tx.type==="service") return "خدمات و قبوض";
  if(tx.type==="transfer") return "انتقال وجه";
  if(tx.type==="swap") return "تبدیل دارایی";
  if(tx.source==="exchange") return "صرافی";
  if(tx.type==="withdraw") return "برداشت";
  return "متفرقه";
}

export default function FinancialCenter({onClose}:{onClose:()=>void}){
 const [sources,setSources]=useState<IncomeSource[]>(load);
 const [show,setShow]=useState(false);
 const [glow,setGlow]=useState(()=>localStorage.getItem(glowKey)!=="0");
 const [learned,setLearned]=useState<Record<string,string>>(loadCategories);
 const [customCategory,setCustomCategory]=useState<Record<string,string>>({});
 const [draft,setDraft]=useState<IncomeSource>({id:`income-${Date.now()}`,type:"salary",title:"",amount:0,mode:"fixed",active:true});
 const phone=localStorage.getItem("anp_current")||"";
 const expenses=useMemo<ExpenseItem[]>(()=>{
   try{
     const tx=JSON.parse(localStorage.getItem(`anp_tx_${phone}`)||"[]") as any[];
     return tx.filter(x=>x.status!=="failed" && x.type!=="deposit").map((x,i)=>({
       id:String(x.id||x.txId||`${x.createdAt||"tx"}-${i}`),
       amount:Number(x.convertedAmount ?? x.amount)||0,
       date:String(x.createdAt||new Date().toISOString()),
       category:txCategory(x,learned),
       merchant:String(x.merchant||x.payee||x.note||x.description||"").trim(),
       source:x.source==="exchange"?"exchange":x.type==="service"?"bill":x.type==="transfer"?"transfer":x.type==="charge"?"recharge":x.source==="pos"?"pos":"other"
     }));
   }catch{return[]}
 },[phone,learned]);
 const insight=useMemo(()=>buildFinancialInsight(sources,expenses),[sources,expenses]);
 const statusText=insight.status==="normal"?"وضعیت مالی عادی":insight.status==="needs-attention"?"نیازمند توجه":"هشدار مالی";
 const statusHint=insight.status==="normal"?"تعادل درآمد و هزینه مناسب است.":insight.status==="needs-attention"?"هزینه‌ها به درآمد نزدیک شده‌اند.":"هزینه‌ها یا نبود درآمد ثبت‌شده نیاز به بررسی دارد.";
 const saveCategory=(expense:ExpenseItem,value:string)=>{
   const key=expense.merchant||expense.category||"";
   if(!key||!value.trim())return;
   const next={...learned,[key]:value.trim()};setLearned(next);localStorage.setItem(categoryKey,JSON.stringify(next));
 };
 const submit=()=>{
   if(!draft.title.trim())return;
   const amount=Math.max(0,Number(draft.amount)||0); const min=Math.max(0,Number(draft.minAmount)||0); const max=Math.max(min,Number(draft.maxAmount)||0);
   const item={...draft,title:draft.title.trim(),amount,active:true,...(draft.mode==="variable"?{minAmount:min,maxAmount:max}:{})};
   const next=[...sources,item];setSources(next);save(next);setShow(false);
   setDraft({id:`income-${Date.now()+1}`,type:"salary",title:"",amount:0,mode:"fixed",active:true});
 };
 const trend=insight.expenseTrend==="up"?"هزینه‌ها نسبت به ماه قبل بیشتر شده‌اند.":insight.expenseTrend==="down"?"هزینه‌ها نسبت به ماه قبل کاهش یافته‌اند.":"هزینه‌ها نسبت به ماه قبل تغییر محسوسی نداشته‌اند.";
 return <div dir="rtl" className="anp-finance-page"><header><button className="back-btn" onClick={onClose}>‹</button><div><h2>مرکز مالی</h2><p>تحلیل درآمد، هزینه و وضعیت مالی</p></div></header><main>
  <section className={`anp-finance-status ${insight.status}${glow&&insight.status!=="normal"?" warning-glow":""}`}><div><b>{statusText}</b><div className="muted">{statusHint}</div></div><span>نسبت هزینه به درآمد: {fa(insight.expenseRatio*100)}٪</span></section>
  <div className="anp-finance-grid"><article><small>درآمد ماهانه</small><strong>{fa(insight.monthlyIncome)}</strong><em>ریال</em></article><article><small>هزینه ماهانه</small><strong>{fa(insight.monthlyExpense)}</strong><em>ریال</em></article><article><small>مانده برآوردی</small><strong>{fa(insight.balance)}</strong><em>ریال</em></article><article><small>نرخ پس‌انداز</small><strong>{fa(insight.savingsRate*100)}٪</strong></article></div>
  <section className="anp-finance-section"><div className="anp-finance-head"><h3>منابع درآمد</h3><button onClick={()=>setShow(true)}>افزودن</button></div>{sources.length===0?<p className="muted">حقوق، شغل، کسب‌وکار، اجاره یا سایر درآمدها را ثبت کنید تا تحلیل دقیق‌تر شود.</p>:sources.map(s=><div className="anp-income-row" key={s.id}><div><b>{s.title}</b><span>{TYPES[s.type]} · {MODES[s.mode]}{s.mode==="variable"&&s.minAmount!=null&&s.maxAmount!=null?` · ${fa(s.minAmount)} تا ${fa(s.maxAmount)}`:""}</span></div><strong>{fa(s.mode==="variable"&&s.minAmount!=null&&s.maxAmount!=null?(s.minAmount+s.maxAmount)/2:s.amount)} ریال</strong></div>)}</section>
  {insight.topCategories.length>0&&<section className="anp-finance-section"><div className="anp-finance-head"><h3>بیشترین هزینه‌ها</h3><span className="muted">این ماه</span></div>{insight.topCategories.map(x=><div className="anp-category-row" key={x.category}><span>{x.category||"متفرقه"}</span><b>{fa(x.amount)} ریال</b></div>)}</section>}
  {expenses.length>0&&<section className="anp-finance-section"><div className="anp-finance-head"><h3>تحلیل هوشمند</h3><span className="muted">{trend}</span></div>
    {insight.unusualExpenses.length>0&&<div className="anp-finance-insight"><b>هزینه غیرعادی</b>{insight.unusualExpenses.map(x=><div key={x.id}>{x.category||"متفرقه"} · {fa(x.amount)} ریال</div>)}</div>}
    {insight.recurringExpenses.length>0&&<div className="anp-finance-insight"><b>هزینه‌های تکرارشونده</b>{insight.recurringExpenses.slice(0,3).map(x=><div key={`${x.category}-${x.amount}`}>{x.category} · {fa(x.amount)} ریال · {fa(x.count)} بار</div>)}</div>}
    {insight.unusualExpenses.length===0&&insight.recurringExpenses.length===0&&<p className="muted">الگوی غیرعادی یا پرداخت تکرارشونده قابل توجهی پیدا نشد.</p>}
  </section>}
  {expenses.some(x=>x.category==="متفرقه")&&<section className="anp-finance-section"><div className="anp-finance-head"><h3>دسته‌بندی هزینه‌ها</h3><span className="muted">دسته‌بندی شما برای دفعات بعد ذخیره می‌شود</span></div>{expenses.filter(x=>x.category==="متفرقه").slice(0,5).map(x=>{const key=x.id||x.merchant||"expense";return <div className="anp-category-row" key={key}><span>{x.merchant||"تراکنش متفرقه"}</span><div><select value={customCategory[key]||"متفرقه"} onChange={e=>{const v=e.target.value;setCustomCategory({...customCategory,[key]:v});saveCategory(x,v)}}><option>متفرقه</option><option>خوراک</option><option>خرید</option><option>حمل‌ونقل</option><option>قبوض</option><option>تفریح</option><option>سلامت</option><option>آموزش</option><option>سایر</option></select></div></div>})}</section>}
  {expenses.length===0&&<section className="anp-finance-section"><h3>تحلیل هزینه</h3><p className="muted">با ثبت تراکنش‌ها، انتقال‌ها، قبوض و فعالیت‌های صرافی، دسته‌بندی هزینه‌ها در این بخش به‌صورت خودکار تکمیل می‌شود.</p></section>}
  <section className="anp-finance-section"><div className="anp-finance-head"><h3>تنظیمات تحلیل</h3><label><input type="checkbox" checked={glow} onChange={e=>{setGlow(e.target.checked);localStorage.setItem(glowKey,e.target.checked?"1":"0")}}/> هشدار بصری وضعیت مالی</label></div><p className="muted">با خاموش کردن این گزینه، فقط افکت هشدار وضعیت مالی حذف می‌شود و خود تحلیل همچنان فعال است.</p></section>
 </main>{show&&<div className="anp-finance-modal"><div className="anp-finance-sheet"><div className="anp-finance-head"><h3>منبع درآمد جدید</h3><button onClick={()=>setShow(false)}>×</button></div>
   <label>نوع درآمد<select value={draft.type} onChange={e=>setDraft({...draft,type:e.target.value as IncomeType})}>{Object.entries(TYPES).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>
   <label>عنوان<input value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} placeholder="مثلاً حقوق شرکت"/></label>
   <label>نوع مبلغ<select value={draft.mode} onChange={e=>setDraft({...draft,mode:e.target.value as IncomeMode})}>{Object.entries(MODES).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>
   {draft.mode==="variable"?<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><label>حداقل مبلغ<input inputMode="numeric" value={draft.minAmount||""} onChange={e=>setDraft({...draft,minAmount:Number(toLatin(e.target.value))||0})} placeholder="ریال"/></label><label>حداکثر مبلغ<input inputMode="numeric" value={draft.maxAmount||""} onChange={e=>setDraft({...draft,maxAmount:Number(toLatin(e.target.value))||0})} placeholder="ریال"/></label></div>:<label>مبلغ ماهانه<input inputMode="numeric" value={draft.amount||""} onChange={e=>setDraft({...draft,amount:Number(toLatin(e.target.value))||0})} placeholder="ریال"/></label>}
   {draft.mode==="approximate"&&<p className="muted">این مبلغ به‌عنوان برآورد تقریبی در تحلیل ماهانه استفاده می‌شود.</p>}
   <button className="primary-button" onClick={submit}>ذخیره درآمد</button>
 </div></div>}</div>;
}
