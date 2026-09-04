export type NotificationKey =
  | 'deposit'
  | 'importantTransactions'
  | 'failedTransaction'
  | 'pendingTransaction'
  | 'duplicateTransaction'
  | 'unusualActivity'
  | 'securityAlert'
  | 'financialStatus'
  | 'financialAnalysis'
  | 'financialReports'
  | 'cryptoTrade'
  | 'reminders'
  | 'otherImportant';

export const NOTIFICATION_DEFAULTS: Record<NotificationKey, boolean> = {
  deposit: true,
  importantTransactions: true,
  failedTransaction: true,
  pendingTransaction: true,
  duplicateTransaction: true,
  unusualActivity: true,
  securityAlert: true,
  financialStatus: true,
  financialAnalysis: false,
  financialReports: false,
  cryptoTrade: false,
  reminders: true,
  otherImportant: false,
};

const STORAGE_KEY = 'anp_notification_preferences_v1';
const EVENTS_KEY = 'anp_notification_events_v1';

export type SmartNotification = {
  id: string;
  key: NotificationKey;
  title: string;
  body: string;
  createdAt: string;
  action?: { label: string; type: 'transaction' | 'history' | 'security' | 'analysis' | 'reminder' | 'retry' };
  read: boolean;
};

export function getNotificationPreferences(): Record<NotificationKey, boolean> {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Partial<Record<NotificationKey, boolean>>;
    return { ...NOTIFICATION_DEFAULTS, ...saved };
  } catch {
    return { ...NOTIFICATION_DEFAULTS };
  }
}

export function setNotificationPreference(key: NotificationKey, enabled: boolean) {
  const next = { ...getNotificationPreferences(), [key]: enabled };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function setAllNotifications(enabled: boolean) {
  const next = Object.fromEntries(
    (Object.keys(NOTIFICATION_DEFAULTS) as NotificationKey[]).map((key) => [key, enabled]),
  ) as Record<NotificationKey, boolean>;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function getSmartNotifications(): SmartNotification[] {
  try {
    const value = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
    return Array.isArray(value) ? value as SmartNotification[] : [];
  } catch {
    return [];
  }
}

export function markSmartNotificationRead(id: string) {
  const next = getSmartNotifications().map((item) => item.id === id ? { ...item, read: true } : item);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('anp-smart-notifications-changed'));
}

export function emitSmartNotification(input: Omit<SmartNotification, 'id' | 'createdAt' | 'read'>) {
  if (!getNotificationPreferences()[input.key]) return null;
  const item: SmartNotification = {
    ...input,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  const next = [item, ...getSmartNotifications()].slice(0, 50);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('anp-smart-notifications-changed', { detail: item }));
  return item;
}
