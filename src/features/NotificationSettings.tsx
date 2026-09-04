import { useMemo, useState } from 'react';
import {
  getNotificationPreferences,
  setAllNotifications,
  setNotificationPreference,
  type NotificationKey,
} from './smartNotifications';

const ITEMS: Array<{ key: NotificationKey; title: string; description: string }> = [
  { key: 'securityAlert', title: 'هشدارهای امنیتی', description: 'ورود مشکوک و رویدادهای امنیتی مهم' },
  { key: 'failedTransaction', title: 'تراکنش ناموفق', description: 'وقتی یک پرداخت یا انتقال ناموفق باشد' },
  { key: 'pendingTransaction', title: 'تراکنش در حال بررسی', description: 'وقتی نتیجه یک تراکنش هنوز مشخص نشده باشد' },
  { key: 'deposit', title: 'واریز وجه', description: 'اطلاع از ثبت و تأیید واریز' },
  { key: 'importantTransactions', title: 'تراکنش‌های مهم', description: 'رویدادهای مهم حساب و پرداخت‌ها' },
  { key: 'duplicateTransaction', title: 'تشخیص تراکنش تکراری', description: 'هشدار قبل از پرداخت مشابه' },
  { key: 'unusualActivity', title: 'فعالیت غیرعادی', description: 'رفتارهای غیرمعمول در حساب' },
  { key: 'financialStatus', title: 'وضعیت مالی', description: 'هشدارهای مهم درباره وضعیت مالی' },
  { key: 'reminders', title: 'یادآورها', description: 'یادآوری در زمان تعیین‌شده' },
  { key: 'financialAnalysis', title: 'تحلیل مالی', description: 'تحلیل‌های دوره‌ای دخل و خرج' },
  { key: 'financialReports', title: 'گزارش‌های مالی', description: 'گزارش‌های کم‌اهمیت و دوره‌ای' },
  { key: 'cryptoTrade', title: 'خرید و فروش رمزارز', description: 'اعلان مربوط به معاملات صرافی' },
  { key: 'otherImportant', title: 'سایر اعلان‌های مهم', description: 'اعلان‌های ضروری دیگر' },
];

export default function NotificationSettings({ onClose }: { onClose: () => void }) {
  const [prefs, setPrefs] = useState(getNotificationPreferences);
  const enabledCount = useMemo(() => Object.values(prefs).filter(Boolean).length, [prefs]);
  const update = (key: NotificationKey) => setPrefs(setNotificationPreference(key, !prefs[key]));
  const setAll = (enabled: boolean) => setPrefs(setAllNotifications(enabled));

  return (
    <div className="anp-full-page" dir="rtl">
      <div className="anp-page-header">
        <button className="back-btn" onClick={onClose} aria-label="بازگشت">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h2 className="subscreen-title">تنظیمات اعلان‌ها</h2>
        <div style={{width:36}}/>
      </div>
      <div className="anp-page-body" style={{paddingBottom:32}}>
        <div style={{padding:"4px 0 16px"}}>
          <div style={{fontSize:13,color:"var(--text-muted)",lineHeight:1.8}}>اعلان‌های موردنیاز خود را جداگانه فعال یا غیرفعال کنید. خاموش کردن اعلان‌ها روی خودِ خدمات و تراکنش‌ها اثری ندارد.</div>
          <div style={{display:"flex",gap:8,marginTop:14}}>
            <button className="outline-button" style={{flex:1,fontSize:12}} onClick={()=>setAll(true)}>فعال کردن همه اعلان‌ها</button>
            <button className="outline-button" style={{flex:1,fontSize:12}} onClick={()=>setAll(false)}>خاموش کردن همه</button>
          </div>
          <div style={{fontSize:11,color:"var(--text-muted)",marginTop:10,textAlign:"center"}}>{toFa(enabledCount)} از {toFa(ITEMS.length)} اعلان فعال است</div>
        </div>
        <div style={{borderTop:"1px solid var(--border-lighter)"}}>
          {ITEMS.map((item) => {
            const on = prefs[item.key];
            return <div key={item.key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:"14px 0",borderBottom:"1px solid var(--border-lighter)"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>{item.title}</div>
                <div style={{fontSize:11,color:"var(--text-muted)",lineHeight:1.6,marginTop:3}}>{item.description}</div>
              </div>
              <button onClick={()=>update(item.key)} aria-label={`${item.title} ${on?'فعال':'غیرفعال'}`} style={{width:52,height:28,borderRadius:14,background:on?"#00D6B0":"var(--card-bg3)",position:"relative",border:"1px solid var(--border-color)",cursor:"pointer",flexShrink:0}}>
                <div style={{position:"absolute",top:3,right:on?3:27,width:22,height:22,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.2)",transition:"right .2s"}}/>
              </button>
            </div>;
          })}
        </div>
      </div>
    </div>
  );
}

function toFa(n: number) { return String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]); }
