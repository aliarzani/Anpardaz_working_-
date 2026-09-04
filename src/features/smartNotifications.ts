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

const PREFERENCES_KEY = 'anp_notification_preferences_v1';
const EVENTS_KEY = 'anp_notification_events_v1';
const EVENTS_CHANGED = 'anp-smart-notifications-changed';

export type SmartNotificationAction = {
  label: string;
  type: string;
};

export type SmartNotification = {
  id: string;
  key: NotificationKey;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  action?: SmartNotificationAction;
  actionLabel?: string;
};

export function getNotificationPreferences(): Record<NotificationKey, boolean> {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}') as Partial<Record<NotificationKey, boolean>>;
    return { ...NOTIFICATION_DEFAULTS, ...saved };
  } catch {
    return { ...NOTIFICATION_DEFAULTS };
  }
}

export function setNotificationPreference(key: NotificationKey, enabled: boolean) {
  const next = { ...getNotificationPreferences(), [key]: enabled };
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
  return next;
}

export function setAllNotifications(enabled: boolean) {
  const next = Object.fromEntries(
    (Object.keys(NOTIFICATION_DEFAULTS) as NotificationKey[]).map((key) => [key, enabled]),
  ) as Record<NotificationKey, boolean>;
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
  return next;
}

function load(): SmartNotification[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(items: SmartNotification[]) {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(items.slice(0, 50)));
    window.dispatchEvent(new CustomEvent(EVENTS_CHANGED));
  } catch {}
}

export function getSmartNotifications() {
  return load().sort((a, b) => b.createdAt - a.createdAt);
}

export function markSmartNotificationRead(id: string) {
  save(load().map((item) => item.id === id ? { ...item, read: true } : item));
}

export function emitSmartNotification(input: Omit<SmartNotification, 'id' | 'createdAt' | 'read'>) {
  if (getNotificationPreferences()[input.key] === false) return;
  save([
    {
      ...input,
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      read: false,
    },
    ...load(),
  ]);
}
