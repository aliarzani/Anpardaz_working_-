import { createRoot, type Root } from 'react-dom/client';
import NotificationSettings from './NotificationSettings';

let overlayRoot: Root | null = null;
let overlayEl: HTMLDivElement | null = null;
let launcher: HTMLButtonElement | null = null;

function close() { overlayRoot?.unmount(); overlayRoot = null; overlayEl?.remove(); overlayEl = null; if (launcher) launcher.style.display = 'block'; }
function open() { if (overlayRoot) return; overlayEl = document.createElement('div'); overlayEl.id = 'anp-notification-settings-root'; Object.assign(overlayEl.style,{position:'fixed',inset:'0',zIndex:'10000'}); document.body.appendChild(overlayEl); overlayRoot=createRoot(overlayEl); overlayRoot.render(<NotificationSettings onClose={close}/>); if(launcher) launcher.style.display='none'; }
function onDocumentClickCapture(event: MouseEvent) {
  const target=event.target as HTMLElement|null;
  const button=target?.closest('button[aria-label="فعال یا غیرفعال کردن اعلان‌ها"]');
  if(!button)return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();open();
}
export function installNotificationSettingsBridge(){
  document.addEventListener('click',onDocumentClickCapture,true);
  if(document.getElementById('anp-notification-launcher'))return;
  launcher=document.createElement('button');launcher.id='anp-notification-launcher';launcher.type='button';launcher.textContent='اعلان‌ها';launcher.setAttribute('aria-label','تنظیمات اعلان‌ها');
  Object.assign(launcher.style,{position:'fixed',right:'16px',bottom:'178px',zIndex:'9998',border:'1px solid rgba(0,214,176,.4)',background:'var(--card-bg,#071a24)',color:'var(--text-primary,#fff)',fontFamily:'Vazirmatn,sans-serif',fontWeight:'800',fontSize:'13px',padding:'10px 14px',borderRadius:'14px',boxShadow:'0 8px 24px rgba(0,0,0,.18)'});
  launcher.onclick=open;document.body.appendChild(launcher);
}
