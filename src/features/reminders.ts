import { LocalNotifications } from "@capacitor/local-notifications";

export type ReminderRepeat = "once" | "daily" | "weekly" | "monthly" | "custom";

export interface Reminder {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  repeat: ReminderRepeat;
  customDays?: number[]; // 0 = Sunday ... 6 = Saturday
  enabled: boolean;
  createdAt: string;
}

const STORAGE_KEY = "anp_reminders_v1";

function readReminders(): Reminder[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeReminders(items: Reminder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getReminders() {
  return readReminders();
}

export function saveReminder(reminder: Reminder) {
  const items = readReminders();
  const next = [...items.filter((item) => item.id !== reminder.id), reminder];
  writeReminders(next);
  return reminder;
}

export function deleteReminder(id: string) {
  writeReminders(readReminders().filter((item) => item.id !== id));
  return cancelReminderNotification(id);
}

export function setReminderEnabled(id: string, enabled: boolean) {
  const items = readReminders().map((item) => (item.id === id ? { ...item, enabled } : item));
  writeReminders(items);
  return enabled ? scheduleReminderNotification(items.find((item) => item.id === id)) : cancelReminderNotification(id);
}

function notificationId(id: string) {
  // LocalNotifications requires an integer identifier.
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return Math.abs(hash || 1);
}

function toDate(reminder: Reminder) {
  const value = new Date(`${reminder.date}T${reminder.time}:00`);
  return Number.isFinite(value.getTime()) ? value : null;
}

export async function requestReminderPermission() {
  const permission = await LocalNotifications.checkPermissions();
  if (permission.display === "granted") return true;
  const requested = await LocalNotifications.requestPermissions();
  return requested.display === "granted";
}

export async function scheduleReminderNotification(reminder?: Reminder) {
  if (!reminder || !reminder.enabled) return;
  const date = toDate(reminder);
  if (!date || date.getTime() <= Date.now()) return;

  const granted = await requestReminderPermission();
  if (!granted) return;

  await cancelReminderNotification(reminder.id);

  const every = reminder.repeat === "daily" ? "day" : reminder.repeat === "weekly" ? "week" : undefined;
  await LocalNotifications.schedule({
    notifications: [{
      id: notificationId(reminder.id),
      title: reminder.title || "یادآور",
      body: reminder.description || "زمان یادآوری فرا رسیده است.",
      schedule: every ? { at: date, every } : { at: date },
      extra: { reminderId: reminder.id },
    }],
  });
}

export async function cancelReminderNotification(id: string) {
  try {
    await LocalNotifications.cancel({ notifications: [{ id: notificationId(id) }] });
  } catch {
    // Browser/dev environments may not have a native notification implementation.
  }
}

export async function rescheduleEnabledReminders() {
  const items = readReminders();
  for (const reminder of items) {
    if (reminder.enabled) await scheduleReminderNotification(reminder);
  }
}
