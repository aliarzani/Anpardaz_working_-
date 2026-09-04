import React, { useMemo, useState } from "react";
import { getReminders, saveReminder, setReminderEnabled, deleteReminder, scheduleReminderNotification, requestReminderPermission, type Reminder, type ReminderRepeat } from "./reminders";

const fa=(v:number|string)=>String(v).replace(/\d/g,d=>"۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
const id=()=>`rem_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;

export default function RemindersScreen({onClose}:{onClose:()=>void}){
  const [items,setItems]=useState<Reminder[]>(()=>getReminders());
  const [editing,setEditing]=useState<Reminder|null>(null);
  const [title,setTitle]=useState(""); const [description,setDescription]=useState("");
  const [date,setDate]=useState(()=>new Date().toISOString().slice(0,10)); const [time,setTime]=useState("09:00");
  const [repeat,setRepeat]=useState<ReminderRepeat>("once"); const [customDays,setCustomDays]=useState<number[]>([6]);
  const [error,setError]=useState("");
  const sorted=useMemo(()=>[...items].sort((a,b)=>`${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)),[items]);
  const openNew=()=>{setEditing(null);setTitle("");setDescription("");setDate(new Date().toISOString().slice(0,10));setTime("09:00");setRepeat("once");setCustomDays([6]);setError("")};
  const openEdit=(r:Reminder)=>{setEditing(r);setTitle(r.title);setDescription(r.description);setDate(r.date);setTime(r.time);setRepeat(r.repeat);setCustomDays(r.customDays??[6]);setError("")};
  const save=async()=>{
    if(!title.trim()){setError("عنوان یادآور را وارد کنید.");return}
    if(!date||!time){setError("تاریخ و ساعت را کامل کنید.");return}
    if(repeat==="custom"&&!customDays.length){setError("حداقل یک روز را انتخاب کنید.");return}
    const reminder:Reminder={id:editing?.id??id(),title:title.trim(),description:description.trim(),date,time,repeat,customDays:repeat==="custom"?customDays:undefined,enabled:true,createdAt:editing?.createdAt??new Date().toISOString()};
    saveReminder(reminder); setItems(getReminders()); setEditing(null); await scheduleReminderNotification(reminder); setTitle(""); setDescription("");
  };
  const toggle=async(r:Reminder)=>{await setReminderEnabled(r.id,!r.enabled);setItems(getReminders())};
  const remove=async(r:Reminder)=>{await deleteReminder(r.id);setItems(getReminders())};
  return <div className="anp-full-page" dir="rtl">
    <div className="anp-page-header"><button className="back-btn" onClick={onClose}>‹</button><h2 className="subscreen-title">یادآورها</h2><div style={{width:36}}/></div>
    <div className="anp-page-body">
      <button className="primary-button" onClick={openNew}>+ افزودن یادآور</button>
      {sorted.length===0&&!editing&&<div className="empty-state" style={{marginTop:28,textAlign:"center"}}>هنوز یادآوری ثبت نشده است.</div>}
      {sorted.map(r=><div key={r.id} className="setting-row" style={{marginTop:10,alignItems:"center"}}>
        <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700}}>{r.title}</div><div style={{fontSize:12,color:"var(--text-secondary)",marginTop:4}}>{fa(r.date)} · {fa(r.time)} {r.repeat!=="once"?`· ${r.repeat==="daily"?"روزانه":r.repeat==="weekly"?"هفتگی":r.repeat==="monthly"?"ماهانه":"سفارشی"}`:""}</div>{r.description&&<div style={{fontSize:12,color:"var(--text-muted)",marginTop:4,overflow:"hidden",textOverflow:"ellipsis"}}>{r.description}</div>}</div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}><button className="outline-button" onClick={()=>openEdit(r)}>ویرایش</button><button className="outline-button" onClick={()=>toggle(r)}>{r.enabled?"روشن":"خاموش"}</button><button className="outline-button" onClick={()=>remove(r)} aria-label="حذف یادآور">حذف</button></div>
      </div>)}
      {editing!==null||title!==""?<div style={{marginTop:18,padding:16,borderRadius:16,background:"var(--card-bg2)",border:"1px solid var(--border-color)"}}>
        <div className="subscreen-title" style={{fontSize:16,marginBottom:14}}>{editing?"ویرایش یادآور":"یادآور جدید"}</div>
        <input className="anp-input" placeholder="عنوان" value={title} onChange={e=>setTitle(e.target.value)}/>
        <input className="anp-input" placeholder="توضیحات (اختیاری)" value={description} onChange={e=>setDescription(e.target.value)} style={{marginTop:8}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><input className="anp-input" type="date" value={date} onChange={e=>setDate(e.target.value)}/><input className="anp-input" type="time" value={time} onChange={e=>setTime(e.target.value)}/></div>
        <select className="anp-input" value={repeat} onChange={e=>setRepeat(e.target.value as ReminderRepeat)} style={{marginTop:8}}><option value="once">یک‌بار</option><option value="daily">روزانه</option><option value="weekly">هفتگی</option><option value="monthly">ماهانه</option><option value="custom">سفارشی</option></select>
        {repeat==="custom"&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>{["ی","د","س","چ","پ","ج","ش"].map((d,i)=><button key={d} className={customDays.includes(i)?"outline-button active":"outline-button"} onClick={()=>setCustomDays(v=>v.includes(i)?v.filter(x=>x!==i):[...v,i])}>{d}</button>)}</div>}
        {error&&<div className="field-err" style={{marginTop:8}}>{error}</div>}
        <div style={{display:"flex",gap:8,marginTop:14}}><button className="primary-button" onClick={save}>ذخیره</button><button className="outline-button" onClick={()=>setEditing(null)}>انصراف</button></div>
      </div>:null}
    </div>
  </div>;
}
