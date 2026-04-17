// OneSignal integration for Petal & Stem.
//
// Two responsibilities:
//   1. SDK — loads the OneSignal Web Push SDK, handles subscription + permission
//   2. REST API — schedules/cancels future notifications via `send_after`
//
// The REST API key is stored client-side. For a single-user florist app
// the risk profile is negligible — worst case: someone sends aunt a push.

import { ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY, ONESIGNAL_DEBUG } from './config.js';
import { storage } from './idb.js';
import { offsetToMinutes, offsetToLabel } from './reminderUtils.js';

const SDK_URL = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
const API_BASE = 'https://onesignal.com/api/v1';

// IDB key where we stash the IDs of notifications we've scheduled,
// so we can cancel them before rescheduling.
const SCHEDULED_KEY = 'onesignal_scheduled';

let sdkReady = false;

// ─── Config check ───

export function isConfigured() {
  return !!ONESIGNAL_APP_ID && !!ONESIGNAL_REST_API_KEY;
}

// ─── SDK lifecycle ───

export async function initSDK(baseUrl) {
  if (!isConfigured()) return;
  if (sdkReady) return;

  // Load the SDK script if not already present
  await new Promise((resolve, reject) => {
    if (window.OneSignalDeferred) { resolve(); return; }
    const s = document.createElement('script');
    s.src = SDK_URL;
    s.async = true;
    s.defer = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });

  // OneSignal v16 uses a deferred init pattern
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function (OneSignal) {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      // Point OneSignal at our combined service worker
      serviceWorkerParam: { scope: baseUrl || '/' },
      serviceWorkerPath: `${baseUrl || '/'}sw.js`,
      // Suppress OneSignal's default prompt — we use our own UI
      promptOptions: { autoPrompt: false },
      // Don't show OneSignal's bell widget
      notifyButton: { enable: false },
    });
    sdkReady = true;
    if (ONESIGNAL_DEBUG) console.log('[OneSignal] SDK initialized');
  });
}

// ─── Permission ───

export async function getPermission() {
  if (!isConfigured() || !sdkReady) return 'default';
  try {
    const OneSignal = window.OneSignal;
    if (!OneSignal) return 'default';
    const perm = await OneSignal.Notifications.permission;
    return perm ? 'granted' : 'default';
  } catch (e) {
    return 'default';
  }
}

export async function requestPermission() {
  if (!isConfigured()) return 'unsupported';
  if (!sdkReady) return 'default';
  try {
    const OneSignal = window.OneSignal;
    if (!OneSignal) return 'default';
    await OneSignal.Notifications.requestPermission();
    // After requesting, also opt the user in
    await OneSignal.User.PushSubscription.optIn();
    const granted = await OneSignal.Notifications.permission;
    return granted ? 'granted' : 'denied';
  } catch (e) {
    if (ONESIGNAL_DEBUG) console.error('[OneSignal] requestPermission error:', e);
    return 'denied';
  }
}

export async function isSubscribed() {
  if (!isConfigured() || !sdkReady) return false;
  try {
    const OneSignal = window.OneSignal;
    if (!OneSignal) return false;
    return OneSignal.User.PushSubscription.optedIn;
  } catch (e) {
    return false;
  }
}

// ─── REST API helpers ───

async function apiCall(method, path, body) {
  const url = `${API_BASE}${path}`;
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (ONESIGNAL_DEBUG) console.log(`[OneSignal] ${method} ${path}`, res.status, data);
  if (!res.ok) throw new Error(data.errors?.[0] || `OneSignal API ${res.status}`);
  return data;
}

// ─── Schedule / cancel ───

async function loadScheduled() {
  try {
    const r = await storage.get(SCHEDULED_KEY);
    return r?.value ? JSON.parse(r.value) : [];
  } catch (e) {
    return [];
  }
}

async function saveScheduled(ids) {
  await storage.set(SCHEDULED_KEY, JSON.stringify(ids));
}

// Cancel all previously scheduled OneSignal notifications
async function cancelAll() {
  const ids = await loadScheduled();
  const remaining = [];
  for (const id of ids) {
    try {
      await apiCall('DELETE', `/notifications/${id}?app_id=${ONESIGNAL_APP_ID}`);
    } catch (e) {
      // Might already have been sent or expired — that's fine
      if (ONESIGNAL_DEBUG) console.warn('[OneSignal] cancel failed for', id, e.message);
    }
  }
  await saveScheduled(remaining);
}

// Build the list of reminders and schedule each via REST API
export async function scheduleReminders(orders, settings) {
  if (!isConfigured()) return { scheduled: 0, reason: 'not-configured' };
  if (!navigator.onLine) return { scheduled: 0, reason: 'offline' };

  // Cancel any existing scheduled notifications first
  await cancelAll();

  const offsets = settings.reminderOffsets || [];
  if (offsets.length === 0) {
    await saveScheduled([]);
    return { scheduled: 0, reason: 'no-offsets' };
  }

  const now = Date.now();
  const newIds = [];
  const businessName = settings.businessName || 'Petal & Stem';

  for (const order of orders) {
    if (order.enableReminders === false) continue;
    if (!order.pickupDateTime) continue;
    const pickupMs = new Date(order.pickupDateTime).getTime();
    if (isNaN(pickupMs) || pickupMs <= now) continue;

    for (const offset of offsets) {
      const fireAt = pickupMs - offsetToMinutes(offset) * 60 * 1000;
      if (fireAt <= now) continue;

      const fireDate = new Date(fireAt);
      const totalText = `${order.quantity}× ${order.arrangement || 'order'} · $${(order.quantity * order.costPer).toFixed(2)}`;
      const pickupStr = new Date(pickupMs).toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit',
      });

      try {
        const result = await apiCall('POST', '/notifications', {
          app_id: ONESIGNAL_APP_ID,
          included_segments: ['Subscribed Users'],
          headings: { en: `Pickup soon — ${order.customerName}` },
          contents: { en: `${totalText}\nPickup ${pickupStr}` },
          send_after: fireDate.toISOString(),
          data: { orderId: order.id },
          web_url: null, // Don't open a URL — let our SW handler navigate
          chrome_web_badge: './icon-192.png',
          chrome_web_icon: './icon-192.png',
        });
        if (result.id) newIds.push(result.id);
      } catch (e) {
        if (ONESIGNAL_DEBUG) console.error('[OneSignal] schedule failed:', e);
        // Continue scheduling the rest
      }
    }
  }

  await saveScheduled(newIds);
  return { scheduled: newIds.length };
}

// Cancel everything (called when reminders are turned off or data is cleared)
export async function cancelAllReminders() {
  if (!isConfigured()) return;
  await cancelAll();
  await saveScheduled([]);
}

// Send a test notification immediately
export async function sendTest(businessName) {
  if (!isConfigured()) return false;
  try {
    await apiCall('POST', '/notifications', {
      app_id: ONESIGNAL_APP_ID,
      included_segments: ['Subscribed Users'],
      headings: { en: businessName || 'Petal & Stem' },
      contents: { en: "Reminders are working! You'll get pickup alerts at the times you've set." },
    });
    return true;
  } catch (e) {
    if (ONESIGNAL_DEBUG) console.error('[OneSignal] test failed:', e);
    return false;
  }
}
