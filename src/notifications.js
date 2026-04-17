// Notification scheduling for Petal & Stem.
//
// Three layers (belt, suspenders, AND the backup belt):
//  1. OneSignal REST API — server-side scheduled delivery. Fires even if the
//     phone is off. The most reliable layer. Only active when configured.
//  2. SW message with Notification Triggers API where available (Chromium+flag).
//     Fires even when app is fully closed.
//  3. In-page setTimeout for the active session as a guaranteed fallback —
//     fires whenever the app is open or running in the background as an installed PWA.
//
// On every reschedule we clear all existing timers + SW notifications + OneSignal
// scheduled sends, then recreate everything from scratch.

import { offsetToMinutes } from './reminderUtils.js';
import * as onesignal from './onesignal.js';

let pageTimers = []; // active setTimeout handles for this session

export function notificationsSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export function permissionState() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  return result;
}

// Build the list of {fireAt, title, body, tag, orderId} from orders + offsets.
function buildReminderList(orders, offsets) {
  const now = Date.now();
  const list = [];
  for (const order of orders) {
    if (order.enableReminders === false) continue;
    if (!order.pickupDateTime) continue;
    const pickupMs = new Date(order.pickupDateTime).getTime();
    if (isNaN(pickupMs)) continue;
    if (pickupMs <= now) continue;

    for (const offset of offsets) {
      const fireAt = pickupMs - offsetToMinutes(offset) * 60 * 1000;
      if (fireAt <= now) continue;
      const tag = `reminder-${order.id}-${offset.unit}-${offset.value}`;
      const totalText = `${order.quantity}× ${order.arrangement || 'order'} · $${(order.quantity * order.costPer).toFixed(2)}`;
      list.push({
        fireAt,
        tag,
        orderId: order.id,
        title: `Pickup soon — ${order.customerName}`,
        body: `${totalText}\nPickup ${formatPickupShort(pickupMs)}`,
      });
    }
  }
  return list;
}

// Build trip-day reminders. One per scheduled/active trip with reminders on:
// fires at `reminderTime` (default 09:00) on the trip's `scheduledFor` date.
function buildTripReminderList(trips) {
  const now = Date.now();
  const list = [];
  for (const trip of trips || []) {
    if (!trip || !trip.scheduledFor) continue;
    if (trip.status !== 'scheduled' && trip.status !== 'active') continue;
    if (trip.enableReminders === false) continue;
    const time = (trip.reminderTime && /^\d{2}:\d{2}$/.test(trip.reminderTime)) ? trip.reminderTime : '09:00';
    const [h, m] = time.split(':').map(Number);
    const [y, mo, d] = trip.scheduledFor.split('-').map(Number);
    if (!y || !mo || !d) continue;
    const fireAt = new Date(y, mo - 1, d, h, m, 0).getTime();
    if (isNaN(fireAt) || fireAt <= now) continue;
    const itemCount = (trip.items || []).length;
    const stores = (trip.storeTags || []).join(', ');
    const tripName = trip.name || 'Untitled trip';
    list.push({
      fireAt,
      tag: `trip-${trip.id}`,
      tripId: trip.id,
      title: `Shopping today — ${tripName}`,
      body: [
        stores || null,
        itemCount > 0 ? `${itemCount} item${itemCount === 1 ? '' : 's'} on the list` : 'Tap to view your list',
      ].filter(Boolean).join(' · '),
    });
  }
  return list;
}

function formatPickupShort(ms) {
  const d = new Date(ms);
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const sameDayCheck = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (sameDayCheck(d, today)) return `today at ${time}`;
  if (sameDayCheck(d, tomorrow)) return `tomorrow at ${time}`;
  return `${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${time}`;
}

// Cancel any outstanding page-level timers
function clearPageTimers() {
  pageTimers.forEach((id) => clearTimeout(id));
  pageTimers = [];
}

// Schedule one notification via in-page setTimeout. Only fires if the app
// is still open at fireAt — but as installed PWA on Android, this is robust
// for short-range reminders (minutes-hours).
function schedulePageTimer(reminder) {
  const delay = reminder.fireAt - Date.now();
  // setTimeout maxes out around 24.8 days; clamp to be safe.
  if (delay <= 0 || delay > 2_000_000_000) return;
  const id = setTimeout(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(reminder.title, {
        body: reminder.body,
        tag: reminder.tag,
        icon: './icon-192.png',
        badge: './icon-192.png',
        data: { orderId: reminder.orderId, url: './' },
      });
    } catch (e) {
      // Permission may have been revoked, or SW not ready. Silent fail.
    }
  }, delay);
  pageTimers.push(id);
}

// Send to SW for Notification Triggers (long-range, app-closed reliability)
async function scheduleViaServiceWorker(reminders) {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const channel = new MessageChannel();
    return new Promise((resolve) => {
      channel.port1.onmessage = (e) => resolve(e.data);
      reg.active && reg.active.postMessage(
        { type: 'SCHEDULE_REMINDERS', reminders },
        [channel.port2]
      );
      // Resolve after 2s even if SW doesn't reply
      setTimeout(() => resolve({ ok: true }), 2000);
    });
  } catch (e) {
    return null;
  }
}

// Main entry — call this whenever orders/trips/settings change.
// `trips` may be omitted for backward compat; if passed, scheduled & active
// shopping trips with reminders enabled get a single notification at their
// configured time on the trip's `scheduledFor` date.
export async function rescheduleAll(orders, trips, settings) {
  // Backward-compat: old call shape was rescheduleAll(orders, settings)
  if (settings === undefined && trips && !Array.isArray(trips)) {
    settings = trips; trips = [];
  }
  clearPageTimers();

  // OneSignal layer (server-side, most reliable) — runs independently of local permission
  if (onesignal.isConfigured()) {
    onesignal.scheduleReminders(orders, settings).catch((e) => {
      // Non-fatal — local layers still cover us
    });
  }

  if (permissionState() !== 'granted') return { scheduled: 0, reason: 'no-permission' };

  const orderReminders = (settings && Array.isArray(settings.reminderOffsets) && settings.reminderOffsets.length > 0)
    ? buildReminderList(orders || [], settings.reminderOffsets)
    : [];
  const tripReminders = buildTripReminderList(trips || []);
  const reminders = [...orderReminders, ...tripReminders];

  // Page-level: schedule everything in the active session (reliable fallback)
  reminders.forEach(schedulePageTimer);

  // SW-level: schedule via Notification Triggers if supported
  await scheduleViaServiceWorker(reminders);

  return { scheduled: reminders.length, orderCount: orderReminders.length, tripCount: tripReminders.length };
}

// Show a one-off test notification — used by the "Test it" button in settings.
export async function testNotification() {
  if (permissionState() !== 'granted') return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification('Reminders are working', {
      body: "You'll get pickup alerts at the times you've set.",
      tag: 'test-notification',
      icon: './icon-192.png',
      badge: './icon-192.png',
    });
    return true;
  } catch (e) {
    return false;
  }
}
