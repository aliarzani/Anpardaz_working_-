import { getNotificationPreferences } from "./notificationPreferences";

export type SmartNotification = {
  id: string;
  key: string;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  actionLabel?: string;
  action?: string;
};

const EVENTS_KEY = "anp_notification_events_v1";
const EVENTS_CHANGED = "anp-smart-notifications-changed";

function load(): SmartNotification[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
function save(items: SmartNotification[]) {
  try { localStorage.setItem(EVENTS_KEY, JSON.stringify(items.slice(0, 50))); window.dispatchEvent(new CustomEvent(EVENTS_CHANGED)); } catch {}
}
export function getSmartNotifications() { return load().sort((a,b)=>b.createdAt-a.createdAt); }
export function markSmartNotificationRead(id: string) { save(load().map(item=>item.id===id?{...item,read:true}:item)); }
export function emitSmartNotification(input: Omit<SmartNotification,"id"|"createdAt"|"read">) {
  try { if (getNotificationPreferences()[input.key] === false) return; } catch {}
  save([{...input,id:`${Date.now()}_${Math.random().toString(36).slice(2,8)}`,createdAt:Date.now(),read:false}, ...load()]);
}
