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
