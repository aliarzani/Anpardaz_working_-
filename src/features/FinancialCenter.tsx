import { useMemo, useState } from "react";
import { buildFinancialInsight, type IncomeMode, type IncomeSource, type IncomeType } from "./financialInsights";

const TYPES: Record<IncomeType,string> = { salary:"حقوق", job1:"شغل ۱", job2:"شغل ۲", business:"کسب‌وکار", rent:"اجاره", other:"سایر" };
const MODES: Record<IncomeMode,string> = { fixed:"ثابت", variable:"متغیر / بازه‌ای", approximate:"تقریبی" };
const key="anp_income_sources_v1";
const load=():IncomeSource[]=>{try{return JSON.parse(localStorage.getItem(key)||"[]")}catch{return[]}};
const save=(x:IncomeSource[])=>localStorage.setItem(key,JSON.stringify(x));
const fa=(n:number)=>new Intl.NumberFormat("fa-IR").format(Math.round(n));

export default function FinancialCenter({onClose}:{onClose:()=>void}){
 const [sources,setSources]=useState<IncomeSource[]>(load); const [show,setShow]=useState(false);
 const [draft,setDraft]=useState<IncomeSource>({id:`income-${Date.now()}`,type:"salary",title:"",amount:0,mode:"fixed",active:true});
 const phone=localStorage.getItem("anp_current")||"";
 const expenses=useMemo(()=>{try{const tx=JSON.parse(localStorage.getItem(`anp_tx_${phone}`)||"[]");return tx.filter((x:any)=>x.type!=="deposit"&&x.status!=="failed").map((x:any)=>({amount:Number(x.amount)||0,date:String(x.createdAt||new Date().toISOString()),category:x.note||"متفرقه",source:x.type==="transfer"?"transfer":"other"}))}catch{return[]}},[phone]);
 const insight=useMemo(()=>buildFinancialInsight(sources,expenses),[sources,expenses]);
 const statusText=insight.status==="normal"?"وضعیت مالی عادی":insight.status==="needs-attention"?"نیازمند توجه":"هشدار مالی";
 const submit=()=>{if(!draft.title.trim())return;const item={...draft,title:draft.title.trim(),amount:Number(draft.amount)||0};const next=[...sources,item];setSources(next);save(next);setShow(false);setDraft({id:`income-${Date.now()+1}`,type:"salary",title:"",amount:0,mode:"fixed",active:true})};
 return <div dir="rtl" className="anp-finance-page"><header><button className="back-btn" onClick={onClose}>‹</button><div><h2>مرکز مالی</h2><p>درآمد، هزینه و وضعیت مالی</p></div></header><main>
  <section className={`anp-finance-status ${insight.status}`}><b>{statusText}</b><span>نسبت هزینه به درآمد: {fa(insight.expenseRatio*100)}٪</span></section>
  <div className="anp-finance-grid"><article><small>درآمد ماهانه</small><strong>{fa(insight.monthlyIncome)}</strong><em>ریال</em></article><article><small>هزینه ماهانه</small><strong>{fa(insight.monthlyExpense)}</strong><em>ریال</em></article><article><small>مانده</small><strong>{fa(insight.balance)}</strong><em>ریال</em></article><article><small>نرخ پس‌انداز</small><strong>{fa(insight.savingsRate*100)}٪</strong></article></div>
  <section className="anp-finance-section"><div className="anp-finance-head"><h3>منابع درآمد</h3><button onClick={()=>setShow(true)}>افزودن</button></div>{sources.length===0?<p className="muted">حقوق، شغل، کسب‌وکار، اجاره یا سایر درآمدها را ثبت کنید تا تحلیل دقیق‌تر شود.</p>:sources.map(s=><div className="anp-income-row" key={s.id}><div><b>{s.title}</b><span>{TYPES[s.type]} · {MODES[s.mode]}</span></div><strong>{fa(s.amount)} ریال</strong></div>)}</section>
  {insight.topCategories.length>0&&<section className="anp-finance-section"><h3>بیشترین هزینه‌ها</h3>{insight.topCategories.map(x=><div className="anp-category-row" key={x.category}><span>{x.category}</span><b>{fa(x.amount)} ریال</b></div>)}</section>}
 </main>{show&&<div className="anp-finance-modal"><div className="anp-finance-sheet"><div className="anp-finance-head"><h3>منبع درآمد جدید</h3><button onClick={()=>setShow(false)}>×</button></div><label>نوع درآمد<select value={draft.type} onChange={e=>setDraft({...draft,type:e.target.value as IncomeType})}>{Object.entries(TYPES).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label><label>عنوان<input value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} placeholder="مثلاً حقوق شرکت"/></label><label>نوع مبلغ<select value={draft.mode} onChange={e=>setDraft({...draft,mode:e.target.value as IncomeMode})}>{Object.entries(MODES).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label><label>مبلغ ماهانه<input inputMode="numeric" value={draft.amount||""} onChange={e=>setDraft({...draft,amount:Number(e.target.value.replace(/\D/g,""))||0})} placeholder="ریال"/></label>{draft.mode==="variable"&&<p className="muted">برای بازه‌های متغیر، حداقل و حداکثر مبلغ را در نسخه بعدی می‌توان جداگانه ثبت کرد؛ فعلاً مبلغ واردشده میانگین تقریبی شما در نظر گرفته می‌شود.</p>}<button className="primary-button" onClick={submit}>ذخیره درآمد</button></div></div>}</div>;
}
