// Petal & Stem service worker
// Bumped on every release so old caches are evicted.

// OneSignal's push notification handler — must be imported before our code.
// Safe even if OneSignal isn't configured: it just sits idle.
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const VERSION = 'v1.0.0';
const CACHE_NAME = `petal-stem-${VERSION}`;

// App shell — these get pre-cached on install. Vite hashes JS/CSS so we
// can't list them by name; we add them lazily on first fetch instead.
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Some files might 404 on first install if not yet built — skip failures.
      Promise.all(APP_SHELL.map((url) => cache.add(url).catch(() => null)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first for navigation (so deploys reach the user fast),
// cache-first for assets (fast loads, offline support).
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Don't intercept Google API calls — those need fresh network always.
  if (url.hostname.includes('googleapis.com') ||
      url.hostname.includes('google.com') ||
      url.hostname.includes('gstatic.com')) {
    return;
  }
  // Don't intercept Wikipedia lookups either.
  if (url.hostname.includes('wikipedia.org')) return;
  // Don't intercept OneSignal API/CDN calls.
  if (url.hostname.includes('onesignal.com')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match('./index.html').then((r) => r || caches.match('./'))
      )
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});

// --- Notifications ---

// Page sends us a list of reminders to schedule. We use the Notification
// Triggers API where available (Chromium with the flag) so they fire even
// when the app is fully closed. Falls back to silent — page-level setTimeout
// handles scheduling while the app is open.
self.addEventListener('message', async (event) => {
  const data = event.data || {};

  if (data.type === 'SCHEDULE_REMINDERS') {
    await scheduleReminders(data.reminders || []);
    if (event.ports && event.ports[0]) event.ports[0].postMessage({ ok: true });
    return;
  }

  if (data.type === 'CLEAR_REMINDERS') {
    await clearReminders(data.tag);
    if (event.ports && event.ports[0]) event.ports[0].postMessage({ ok: true });
    return;
  }

  if (data.type === 'SHOW_NOTIFICATION') {
    await self.registration.showNotification(data.title, data.options || {});
    if (event.ports && event.ports[0]) event.ports[0].postMessage({ ok: true });
    return;
  }
});

async function scheduleReminders(reminders) {
  // Clear all previously scheduled reminders first to avoid dupes
  const existing = await self.registration.getNotifications({ includeTriggered: false });
  existing.forEach((n) => {
    if (n.tag && n.tag.startsWith('reminder-')) n.close();
  });

  if (!('showTrigger' in Notification.prototype)) {
    // Triggers unsupported — page-level scheduling will handle it
    return;
  }

  const now = Date.now();
  for (const r of reminders) {
    if (r.fireAt <= now) continue;
    try {
      await self.registration.showNotification(r.title, {
        body: r.body,
        tag: r.tag,
        icon: './icon-192.png',
        badge: './icon-192.png',
        data: { orderId: r.orderId, url: './' },
        showTrigger: new TimestampTrigger(r.fireAt),
      });
    } catch (e) {
      // Trigger scheduling failed — fall back silently
    }
  }
}

async function clearReminders(tagPrefix) {
  const existing = await self.registration.getNotifications({ includeTriggered: false });
  existing.forEach((n) => {
    if (!tagPrefix || (n.tag && n.tag.startsWith(tagPrefix))) n.close();
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            orderId: event.notification.data && event.notification.data.orderId,
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
