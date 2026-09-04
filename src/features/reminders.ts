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
const CUSTOM_HORIZON_DAYS = 90;
const MONTHLY_HORIZON = 12;

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

export async function deleteReminder(id: string) {
  writeReminders(readReminders().filter((item) => item.id !== id));
  await cancelReminderNotification(id);
}

export async function setReminderEnabled(id: string, enabled: boolean) {
  const items = readReminders().map((item) => (item.id === id ? { ...item, enabled } : item));
  writeReminders(items);
  if (enabled) await scheduleReminderNotification(items.find((item) => item.id === id));
  else await cancelReminderNotification(id);
  return enabled;
}

function baseNotificationId(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return Math.abs(hash || 1);
}

function notificationId(id: string, occurrence = 0) {
  // Keep IDs positive and stable while allowing several future occurrences.
  const base = baseNotificationId(id) % 1000000;
  return Math.max(1, (base * 100 + occurrence) % 2147483647);
}

function toDate(reminder: Reminder) {
  const value = new Date(`${reminder.date}T${reminder.time}:00`);
  return Number.isFinite(value.getTime()) ? value : null;
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function withTime(day: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const result = new Date(day);
  result.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return result;
}

function buildOccurrences(reminder: Reminder) {
  const first = toDate(reminder);
  if (!first) return [] as Date[];
  const now = Date.now();
  const occurrences: Date[] = [];

  if (reminder.repeat === "once") {
    return first.getTime() > now ? [first] : [];
  }

  if (reminder.repeat === "daily" || reminder.repeat === "weekly") {
    const step = reminder.repeat === "daily" ? 1 : 7;
    const cursor = new Date(first);
    while (cursor.getTime() <= now) cursor.setDate(cursor.getDate() + step);
    for (let i = 0; i < 30 && cursor.getTime() > now; i++) {
      occurrences.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + step);
    }
    return occurrences;
  }

  if (reminder.repeat === "monthly") {
    const cursor = new Date(first);
    while (cursor.getTime() <= now) cursor.setMonth(cursor.getMonth() + 1);
    for (let i = 0; i < MONTHLY_HORIZON; i++) {
      occurrences.push(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return occurrences;
  }

  const allowed = new Set((reminder.customDays ?? []).filter((day) => day >= 0 && day <= 6));
  if (!allowed.size) return [];
  const cursor = startOfDay(new Date(Math.max(first.getTime(), now)));
  for (let i = 0; i <= CUSTOM_HORIZON_DAYS; i++) {
    const day = new Date(cursor);
    day.setDate(cursor.getDate() + i);
    const occurrence = withTime(day, reminder.time);
    if (allowed.has(day.getDay()) && occurrence.getTime() > now) occurrences.push(occurrence);
  }
  return occurrences;
}

export async function requestReminderPermission() {
  const permission = await LocalNotifications.checkPermissions();
  if (permission.display === "granted") return true;
  const requested = await LocalNotifications.requestPermissions();
  return requested.display === "granted";
}

export async function scheduleReminderNotification(reminder?: Reminder) {
  if (!reminder || !reminder.enabled) return;
  const occurrences = buildOccurrences(reminder);
  if (!occurrences.length) return;

  const granted = await requestReminderPermission();
  if (!granted) return;

  await cancelReminderNotification(reminder.id);

  await LocalNotifications.schedule({
    notifications: occurrences.map((at, index) => ({
      id: notificationId(reminder.id, index),
      title: reminder.title || "یادآور",
      body: reminder.description || "زمان یادآوری فرا رسیده است.",
      schedule: { at },
      extra: { reminderId: reminder.id, occurrence: index },
    })),
  });
}

export async function cancelReminderNotification(id: string) {
  try {
    await LocalNotifications.cancel({
      notifications: Array.from({ length: 32 }, (_, index) => ({ id: notificationId(id, index) })),
    });
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
