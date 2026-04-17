// Google Sheets sync for Petal & Stem.
//
// One-way push: app → Sheet. The Sheet is a viewable/printable snapshot;
// edits made directly in the Sheet are NOT read back into the app.
//
// Auth: Google Identity Services (GIS) implicit token flow.
// Token lifetime: ~1 hour. We request silently on expiry.
// If silent request fails (user revoked, switched accounts), we surface a "Reconnect" prompt.

import { GOOGLE_CLIENT_ID, GOOGLE_SCOPES, SHEETS_DEBUG, SHEET_TITLE_FALLBACK } from './config.js';
import { storage } from './idb.js';
import { offsetToLabel } from './reminderUtils.js';

const GIS_SRC = 'https://accounts.google.com/gsi/client';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';

let tokenClient = null;
let accessToken = null;
let tokenExpiresAt = 0;
let gisLoaded = false;

const PAYMENT_LABELS = {
  venmo: 'Venmo', paypal: 'PayPal', cashapp: 'Cash App',
  fb: 'Facebook', cash: 'Cash', other: 'Other',
};

const MATERIAL_TYPE_LABELS = {
  wrapping: 'Wrapping', ribbon: 'Ribbon', other: 'Other',
};

// --- Setup ---

export function isConfigured() {
  return !!GOOGLE_CLIENT_ID;
}

function loadGIS() {
  if (gisLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (window.google && window.google.accounts) {
      gisLoaded = true; resolve(); return;
    }
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => { gisLoaded = true; resolve(); });
      existing.addEventListener('error', reject);
      return;
    }
    const s = document.createElement('script');
    s.src = GIS_SRC; s.async = true; s.defer = true;
    s.onload = () => { gisLoaded = true; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function ensureTokenClient() {
  if (tokenClient) return tokenClient;
  await loadGIS();
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: GOOGLE_SCOPES,
    callback: () => {}, // overridden per-request
  });
  return tokenClient;
}

function requestToken({ silent = false } = {}) {
  return new Promise(async (resolve, reject) => {
    const client = await ensureTokenClient();
    client.callback = (resp) => {
      if (resp.error) { reject(new Error(resp.error)); return; }
      accessToken = resp.access_token;
      tokenExpiresAt = Date.now() + (resp.expires_in || 3600) * 1000;
      storage.set('sheets_token', JSON.stringify({
        token: accessToken, expiresAt: tokenExpiresAt,
      })).catch(() => {});
      resolve(accessToken);
    };
    client.requestAccessToken({ prompt: silent ? '' : 'consent' });
  });
}

export async function getValidToken() {
  if (accessToken && tokenExpiresAt > Date.now() + 60_000) return accessToken;

  // Try restoring from IDB
  const stored = await storage.get('sheets_token').catch(() => null);
  if (stored && stored.value) {
    try {
      const { token, expiresAt } = JSON.parse(stored.value);
      if (expiresAt > Date.now() + 60_000) {
        accessToken = token; tokenExpiresAt = expiresAt;
        return token;
      }
    } catch (e) {}
  }

  // Silent re-auth
  return requestToken({ silent: true });
}

export async function connect() {
  if (!isConfigured()) throw new Error('Google sync is not configured. See README.');
  await requestToken({ silent: false });
  return { ok: true };
}

export async function disconnect() {
  if (accessToken && window.google && window.google.accounts) {
    try { window.google.accounts.oauth2.revoke(accessToken); } catch (e) {}
  }
  accessToken = null;
  tokenExpiresAt = 0;
  await storage.delete('sheets_token').catch(() => {});
  await storage.delete('sheets_id').catch(() => {});
  await storage.delete('sheets_meta').catch(() => {});
}

export async function isConnected() {
  if (!isConfigured()) return false;
  if (accessToken && tokenExpiresAt > Date.now() + 60_000) return true;
  const stored = await storage.get('sheets_token').catch(() => null);
  if (!stored) return false;
  try {
    const { expiresAt } = JSON.parse(stored.value);
    return expiresAt > Date.now() + 60_000;
  } catch (e) { return false; }
}

// --- Sheet creation / lookup ---

async function fetchJSON(url, opts = {}) {
  const token = await getValidToken();
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    if (SHEETS_DEBUG) console.error('Sheets API error:', res.status, text);
    throw new Error(`Sheets API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function getOrCreateSheet(businessName) {
  const stored = await storage.get('sheets_id').catch(() => null);
  if (stored && stored.value) {
    // Verify it still exists (user may have deleted it from Drive)
    try {
      await fetchJSON(`${DRIVE_API}/${stored.value}?fields=id,trashed`);
      return stored.value;
    } catch (e) {
      // Re-create below
      await storage.delete('sheets_id').catch(() => {});
    }
  }

  const title = `${businessName || SHEET_TITLE_FALLBACK} — Ledger`;
  const body = {
    properties: { title },
    sheets: [
      { properties: { title: 'Flowers', gridProperties: { rowCount: 200, columnCount: 8 } } },
      { properties: { title: 'Materials', gridProperties: { rowCount: 200, columnCount: 6 } } },
      { properties: { title: 'Orders', gridProperties: { rowCount: 500, columnCount: 16 } } },
      { properties: { title: 'Price History', gridProperties: { rowCount: 1000, columnCount: 6 } } },
      { properties: { title: 'Settings', gridProperties: { rowCount: 50, columnCount: 2 } } },
    ],
  };
  const result = await fetchJSON(SHEETS_API, { method: 'POST', body: JSON.stringify(body) });
  const id = result.spreadsheetId;
  await storage.set('sheets_id', id);
  await storage.set('sheets_meta', JSON.stringify({
    createdAt: new Date().toISOString(),
    title,
    url: result.spreadsheetUrl,
  }));

  // Bold the first row of every sheet for headers
  const tabIds = result.sheets.map((s) => s.properties.sheetId);
  await fetchJSON(`${SHEETS_API}/${id}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: tabIds.map((sheetId) => ({
        repeatCell: {
          range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
          cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.95, green: 0.92, blue: 0.85 } } },
          fields: 'userEnteredFormat(textFormat,backgroundColor)',
        },
      })).concat(tabIds.map((sheetId) => ({
        updateSheetProperties: {
          properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
          fields: 'gridProperties.frozenRowCount',
        },
      }))),
    }),
  });

  return id;
}

export async function getSheetUrl() {
  const meta = await storage.get('sheets_meta').catch(() => null);
  if (meta && meta.value) {
    try { return JSON.parse(meta.value).url; } catch (e) {}
  }
  const id = await storage.get('sheets_id').catch(() => null);
  if (id && id.value) return `https://docs.google.com/spreadsheets/d/${id.value}/edit`;
  return null;
}

// --- Tab serialization ---

function flowersToRows(flowers) {
  const header = ['Name', 'Type', 'Price', 'Bunch info', 'Description', 'Image URL'];
  const rows = flowers.map((f) => {
    const isPer = f.mode === 'perStem';
    const price = isPer
      ? `$${(f.bunchPrice / f.bunchCount).toFixed(2)}/stem`
      : `$${f.flatMin.toFixed(2)} – $${f.flatMax.toFixed(2)}`;
    const bunchInfo = isPer ? `$${f.bunchPrice.toFixed(2)} for ${f.bunchCount} stems` : 'flat per bunch';
    return [
      f.name,
      isPer ? 'Per stem' : 'Flat',
      price,
      bunchInfo,
      f.description || '',
      f.imageUrl || '',
    ];
  });
  return [header, ...rows];
}

function materialsToRows(materials) {
  const header = ['Name', 'Type', 'Color', 'Hex', 'Price', 'Note'];
  const rows = materials.map((m) => [
    m.name,
    MATERIAL_TYPE_LABELS[m.type] || 'Other',
    paletteName(m.color),
    m.color,
    m.unitPrice > 0 ? `$${m.unitPrice.toFixed(2)}` : '',
    m.note || '',
  ]);
  return [header, ...rows];
}

function ordersToRows(orders) {
  // "Arrangement" = the user's short label for the order (e.g. "Wedding bouquet").
  // "Items" = the breakdown of flowers/supplies (was "Recipe"; renamed to match
  // the in-app vocabulary, but kept distinct from Arrangement since both columns coexist).
  // "Discount" — display string like "10% off" or "$5.00 off". The Total column
  // already has discount applied so the sheet adds up to what the customer paid.
  const header = ['Customer', 'Pickup', 'Event', 'Arrangement', 'Items', 'Qty', 'Each', 'Extras', 'Discount', 'Total', 'Paid?', 'Payment', 'Reminders', 'Card message', 'Notes'];
  const sorted = [...orders].sort((a, b) => new Date(a.pickupDateTime) - new Date(b.pickupDateTime));
  const rows = sorted.map((o) => {
    const extrasSum = Array.isArray(o.extraCosts)
      ? o.extraCosts.reduce((s, e) => {
          const n = Number(e.amount); return s + (isFinite(n) && n > 0 ? n : 0);
        }, 0)
      : 0;
    const extrasText = Array.isArray(o.extraCosts) && o.extraCosts.length > 0
      ? o.extraCosts.map((e) => `${e.label}: $${Number(e.amount).toFixed(2)}`).join(', ')
      : '';
    // Apply discount to the total so the synced sheet matches what the
    // customer actually paid. Mirrors the in-app `discountAmountOf` logic.
    const subtotalRaw = (Number(o.quantity) || 0) * (Number(o.costPer) || 0) + extrasSum;
    let discountAmount = 0;
    let discountText = '';
    if (o.discount && Number(o.discount.value) > 0) {
      const v = Number(o.discount.value);
      if (o.discount.kind === 'percent') {
        discountAmount = Math.min(subtotalRaw, subtotalRaw * Math.min(100, Math.max(0, v)) / 100);
        discountText = `${v}% off (−$${discountAmount.toFixed(2)})`;
      } else {
        discountAmount = Math.min(subtotalRaw, Math.max(0, v));
        discountText = `$${v.toFixed(2)} off`;
      }
    }
    const finalTotal = Math.max(0, subtotalRaw - discountAmount);
    return [
      o.customerName,
      o.pickupDateTime ? new Date(o.pickupDateTime).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit',
      }) : '',
      o.eventType || 'general',
      o.arrangement || '',
      Array.isArray(o.items) && o.items.length > 0
        ? o.items.map((it) => {
            // Bouquet bundle: show name + nested contents inline.
            if (it.kind === 'bouquet') {
              const inner = Array.isArray(it.contents) && it.contents.length > 0
                ? ` (${it.contents.map(s => `${s.qty}× ${s.name}`).join(', ')})`
                : '';
              const label = `[${it.qty}× ${it.name}${inner}]`;
              return it.included === false ? `${label} (not counted)` : label;
            }
            const label = `${it.qty}× ${it.name}`;
            return it.included === false ? `${label} (not counted)` : label;
          }).join(', ')
        : '',
      o.quantity,
      `$${o.costPer.toFixed(2)}`,
      extrasText,
      discountText,
      `$${finalTotal.toFixed(2)}`,
      o.paid ? 'Yes' : 'No',
      PAYMENT_LABELS[o.paymentMethod] || 'Other',
      o.enableReminders === false ? 'Off' : 'On',
      o.cardMessage || '',
      o.notes || '',
    ];
  });
  return [header, ...rows];
}

function priceHistoryToRows(flowers) {
  const header = ['Flower', 'Date', 'Price', 'Note'];
  const all = [];
  flowers.forEach((f) => {
    (f.priceHistory || []).forEach((h) => {
      const price = h.bunchPrice !== undefined
        ? `$${h.bunchPrice.toFixed(2)} (${h.bunchCount} stems = $${(h.bunchPrice / h.bunchCount).toFixed(2)}/stem)`
        : `$${h.flatMin.toFixed(2)} – $${h.flatMax.toFixed(2)}`;
      all.push({
        flower: f.name,
        date: h.date,
        price,
        note: h.note || '',
      });
    });
  });
  all.sort((a, b) => new Date(b.date) - new Date(a.date));
  const rows = all.map((h) => [
    h.flower,
    new Date(h.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    h.price,
    h.note,
  ]);
  return [header, ...rows];
}

function settingsToRows(settings) {
  const header = ['Setting', 'Value'];
  const reminderSummary = (settings.reminderOffsets || [])
    .map(offsetToLabel).join(', ') || 'none';
  const pad = (n) => String(n).padStart(2, '0');
  const pickup = `${pad(settings.defaultPickupHour)}:${pad(settings.defaultPickupMinute)}`;
  return [
    header,
    ['Business name', settings.businessName || ''],
    ['Default pickup time', pickup],
    ['Reminders', reminderSummary],
    ['Reminders on by default', settings.remindersDefault ? 'Yes' : 'No'],
    ['Week starts on', settings.weekStartsOn === 1 ? 'Monday' : 'Sunday'],
    ['Last synced', new Date().toLocaleString('en-US')],
  ];
}

function paletteName(hex) {
  // Tiny lookup for common hex codes. App has the full PALETTE — we only
  // recreate the most useful labels here to avoid duplicating that data.
  const map = {
    '#ffffff': 'White', '#fffdf5': 'Ivory', '#f5e6d3': 'Cream', '#f0d9b5': 'Champagne',
    '#f5c6c1': 'Blush', '#c48b9f': 'Dusty Rose', '#f48fb1': 'Pink', '#ff7f6e': 'Coral',
    '#c62828': 'Red', '#5d1f28': 'Burgundy', '#c9b5e0': 'Lavender', '#b19cd9': 'Lilac',
    '#7c4dbf': 'Purple', '#4a2545': 'Plum', '#b8d4e3': 'Powder Blue', '#1e3a8a': 'Navy',
    '#0f766e': 'Teal', '#8fa68b': 'Sage', '#2d4a2e': 'Forest', '#fff4b5': 'Butter',
    '#d4af37': 'Gold', '#c8cbd0': 'Silver', '#c4a57b': 'Kraft', '#1a1a1a': 'Black',
  };
  return map[hex.toLowerCase()] || 'Custom';
}

// --- Sync ---

async function writeTab(spreadsheetId, tab, rows) {
  // Clear first, then write
  await fetchJSON(`${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(tab)}!A1:Z1000:clear`, {
    method: 'POST', body: JSON.stringify({}),
  });
  if (rows.length === 0) return;
  await fetchJSON(`${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(tab)}!A1?valueInputOption=RAW`, {
    method: 'PUT',
    body: JSON.stringify({ range: `${tab}!A1`, values: rows }),
  });
}

// Single full sync — call after any data change.
// Debounced by the caller to avoid hammering the API on rapid edits.
export async function syncAll({ flowers, materials, orders, settings }) {
  if (!isConfigured()) return { ok: false, reason: 'not-configured' };
  if (!await isConnected()) return { ok: false, reason: 'not-connected' };
  if (!navigator.onLine) return { ok: false, reason: 'offline' };

  try {
    const id = await getOrCreateSheet(settings.businessName);
    await writeTab(id, 'Flowers', flowersToRows(flowers));
    await writeTab(id, 'Materials', materialsToRows(materials));
    await writeTab(id, 'Orders', ordersToRows(orders));
    await writeTab(id, 'Price History', priceHistoryToRows(flowers));
    await writeTab(id, 'Settings', settingsToRows(settings));
    const syncedAt = new Date().toISOString();
    await storage.set('sheets_last_sync', syncedAt);
    return { ok: true, syncedAt };
  } catch (e) {
    if (SHEETS_DEBUG) console.error('Sync failed:', e);
    return { ok: false, reason: 'error', error: e.message };
  }
}

export async function getLastSync() {
  const r = await storage.get('sheets_last_sync').catch(() => null);
  return r && r.value ? r.value : null;
}
