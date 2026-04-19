import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, Flower2, X, Pencil, Minus, Leaf, Search, Loader2, Tag, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Clock, ArrowLeftRight, ArrowUp, Download, Upload, Copy, ClipboardPaste, Check, AlertCircle, Palette, Pipette, CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign, CalendarPlus, BellRing, Settings, BellOff, AlertTriangle, Sheet, ExternalLink, Wifi, WifiOff, RotateCw, CreditCard, Banknote, Wallet, LayoutGrid, List, Star } from 'lucide-react';
import { storage } from './idb.js';
import * as sheets from './sheets.js';
import * as drive from './drive.js';
import * as notifs from './notifications.js';
import * as onesignal from './onesignal.js';
import {
  REMINDER_UNITS, offsetToTrigger, offsetToLabel, offsetToShortLabel, sortOffsets,
} from './reminderUtils.js';

const C = {
  bg: '#F2EADB', bgDeep: '#E8DEC9', card: '#FDFAF1',
  ink: '#2A3528', inkSoft: '#4A5645', inkFaint: '#6E7A68',
  sage: '#8FA68B', sageDeep: '#5A7356',
  rose: '#B87070', roseDeep: '#8E4E4E',
  plum: '#8E6E8B', plumDeep: '#6B4F69',
  gold: '#B8924A', border: '#D9CEB6', borderSoft: '#E8DEC9',
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Inter:wght@400;500;600;700&display=swap');
`;

const PALETTE = [
  { name: 'White', hex: '#FFFFFF' }, { name: 'Ivory', hex: '#FFFDF5' },
  { name: 'Cream', hex: '#F5E6D3' }, { name: 'Champagne', hex: '#F0D9B5' },
  { name: 'Blush', hex: '#F5C6C1' }, { name: 'Dusty Rose', hex: '#C48B9F' },
  { name: 'Pink', hex: '#F48FB1' }, { name: 'Coral', hex: '#FF7F6E' },
  { name: 'Red', hex: '#C62828' }, { name: 'Burgundy', hex: '#5D1F28' },
  { name: 'Lavender', hex: '#C9B5E0' }, { name: 'Lilac', hex: '#B19CD9' },
  { name: 'Purple', hex: '#7C4DBF' }, { name: 'Plum', hex: '#4A2545' },
  { name: 'Powder Blue', hex: '#B8D4E3' }, { name: 'Navy', hex: '#1E3A8A' },
  { name: 'Teal', hex: '#0F766E' }, { name: 'Sage', hex: '#8FA68B' },
  { name: 'Forest', hex: '#2D4A2E' }, { name: 'Butter', hex: '#FFF4B5' },
  { name: 'Gold', hex: '#D4AF37' }, { name: 'Silver', hex: '#C8CBD0' },
  { name: 'Kraft', hex: '#C4A57B' }, { name: 'Black', hex: '#1A1A1A' },
];

const DEFAULT_MATERIAL_TYPES = [
  { key: 'wrapping', label: 'Wrapping' },
  { key: 'ribbon', label: 'Ribbon' },
  { key: 'other', label: 'Other' },
];
// Back-compat alias for components that read the type list before settings were threaded.
const MATERIAL_TYPES = DEFAULT_MATERIAL_TYPES;

// Common florist flower and supply names used as typeahead fallback — so
// typing "Li" suggests "Lily" even when her catalog doesn't have Lily yet.
// She can pick one to add as a trip row; no catalog entry is created unless
// she does so explicitly from the Add-to-trip overlay.
const COMMON_FLOWER_NAMES = [
  'Acacia', 'Achillea', 'African daisy', 'Agapanthus', 'Allium',
  'Alstroemeria', 'Alyssum', 'Amaranthus', 'Amaryllis', 'Anemone',
  'Angelica', 'Anthurium', 'Aspidistra leaf', 'Aster', 'Astilbe', 'Azalea',
  "Baby's breath", 'Bachelor\'s button', 'Banksia', 'Bear grass',
  'Begonia', 'Bells of Ireland', 'Bergenia', 'Billy buttons',
  'Bird of paradise', 'Black-eyed Susan', 'Bleeding heart', 'Blue thistle',
  'Bouvardia', 'Boxwood', 'Bupleurum', 'Buttercup',
  'Calendula', 'Calla lily', 'Camellia', 'Camomile', 'Campanula', 'Canna',
  'Carnation', 'Cedar', 'Celosia', 'Cherry blossom', 'Chrysanthemum',
  'Clematis', 'Cockscomb', 'Columbine', 'Coneflower', 'Coreopsis',
  'Cornflower', 'Cosmos', 'Crocus', 'Curly willow', 'Cymbidium orchid', 'Cypress',
  'Daffodil', 'Dahlia', 'Daisy', 'Delphinium', 'Dendrobium orchid',
  'Dianthus', 'Dogwood', 'Dusty miller',
  'Echinacea', 'Eremurus', 'Eryngium', 'Eucalyptus', 'Euphorbia',
  'Ferns', 'Feverfew', 'Flowering quince', 'Forget-me-not', 'Forsythia', 'Foxglove',
  'Frangipani', 'Freesia', 'Fritillaria', 'Fuchsia',
  'Gaillardia', 'Galax leaf', 'Gardenia', 'Gazania', 'Gentian', 'Geranium',
  'Gerbera', 'Ginger', 'Gladiolus', 'Globe amaranth', 'Godetia',
  'Grape hyacinth', 'Gypsophila',
  'Heather', 'Helenium', 'Heliconia', 'Helleborus', 'Hibiscus', 'Hollyhock',
  'Honeysuckle', 'Hosta', 'Huckleberry', 'Hyacinth', 'Hydrangea', 'Hypericum',
  'Iberis', 'Iris', 'Israeli ruscus', 'Italian ruscus', 'Ivy', 'Ixia',
  'Jasmine', 'Jonquil', 'Juniper',
  'Kale', 'King protea', 'Knautia',
  "Lamb's ear", 'Lantana', 'Larkspur', 'Lavender', 'Leather leaf',
  'Lemon leaf', 'Leucadendron', 'Liatris', 'Lilac', 'Lily',
  'Lily of the valley', 'Lisianthus', 'Lobelia', 'Lotus pod', 'Love-in-a-mist',
  'Lupine',
  'Magnolia', 'Magnolia leaf', 'Maidenhair fern', 'Marigold', 'Millet',
  'Mimosa', 'Mini carnation', 'Mini rose', 'Monkshood', 'Monstera leaf',
  'Moss', 'Mum', 'Myrtle',
  'Narcissus', 'Nasturtium', 'Nerine', 'Nigella',
  'Olive branch', 'Oregonia', 'Oriental lily', 'Orchid',
  'Pampas grass', 'Pansy', 'Paperwhite', 'Passionflower', 'Peony', 'Phlox',
  'Pincushion', 'Pittosporum', 'Plumeria', 'Plumosa fern', 'Podocarpus',
  'Poppy', 'Primrose', 'Protea',
  "Queen Anne's lace",
  'Ranunculus', 'Rose', 'Rosemary', 'Ruscus',
  'Sage', 'Salal', 'Scabiosa', 'Sea holly', 'Sedum', 'Seeded eucalyptus',
  'Silver dollar eucalyptus', 'Skimmia', 'Snapdragon', 'Snowberry',
  'Snowdrop', 'Solidago', 'Spider mum', 'Spirea', 'Spray rose',
  'Stargazer lily', 'Statice', 'Stephanotis', 'Stock', 'Strawflower',
  'Succulent', 'Sunflower', 'Sweet Annie', 'Sweet pea', 'Sweet William',
  'Sword fern',
  'Tansy', 'Thistle', 'Trachelium', 'Tuberose', 'Tulip', 'Tweedia',
  'Veronica', 'Viburnum', 'Viola', 'Violet',
  'Wallflower', 'Waxflower', 'Willow', 'Wisteria',
  'Yarrow', 'Yucca',
  'Zinnia',
];
const COMMON_SUPPLY_NAMES = [
  'Bouquet holder', 'Boutonnière pins', 'Burlap', 'Candles', 'Cellophane',
  'Chicken wire', 'Clear tape', 'Clips', 'Cord', 'Corsage magnet',
  'Dowels', 'Floral foam', 'Floral picks', 'Floral tape', 'Floral wire',
  'Flower food', 'Glue dots', 'Glue gun', 'Greening pins', 'Hot glue sticks',
  'Jute', 'Moss mat', 'Oasis', 'Pebbles', 'Pins', 'Raffia', 'Ribbon',
  'River rocks', 'Rubber bands', 'Sand', 'Sheet moss', 'Sphagnum moss',
  'Sticks', 'Styrofoam', 'Tape', 'Tulle', 'Twine', 'Vase', 'Water tubes',
  'Wire', 'Wrapping paper',
];

const DEFAULT_PAYMENT_METHODS = [
  { key: 'venmo', label: 'Venmo', color: '#3D95CE' },
  { key: 'paypal', label: 'PayPal', color: '#1546A0' },
  { key: 'cashapp', label: 'Cash App', color: '#00B832' },
  { key: 'fb', label: 'Facebook', color: '#1877F2' },
  { key: 'cash', label: 'Cash', color: '#4F7942' },
  { key: 'other', label: 'Other', color: '#8A9283' },
];
// Backwards-compat alias used in places where settings aren't in scope.
const PAYMENT_METHODS = DEFAULT_PAYMENT_METHODS;

// Map payment method key → icon component. Digital wallets get a card; cash gets a banknote.
// Custom keys fall back to a generic wallet.
function paymentIconFor(key) {
  if (key === 'cash') return Banknote;
  if (key === 'venmo' || key === 'paypal' || key === 'cashapp' || key === 'fb') return CreditCard;
  return Wallet;
}

const DEFAULT_EVENT_TYPES = [
  { key: 'general', label: 'General', color: '#8FA68B' },
  { key: 'wedding', label: 'Wedding', color: '#FFFDF5' },
  { key: 'birthday', label: 'Birthday', color: '#3D95CE' },
  { key: 'valentines', label: "Valentine's", color: '#C62828' },
  { key: 'mothers', label: "Mother's Day", color: '#F48FB1' },
  { key: 'sympathy', label: 'Sympathy', color: '#7C4DBF' },
  { key: 'anniversary', label: 'Anniversary', color: '#D4AF37' },
];

const DEFAULT_SETTINGS = {
  businessName: '',
  defaultPickupHour: 14,
  defaultPickupMinute: 0,
  reminderOffsets: [
    { value: 2, unit: 'days' },
    { value: 5, unit: 'hours' },
  ],
  remindersDefault: true,
  weekStartsOn: 0,
  eventTypes: DEFAULT_EVENT_TYPES,
  materialTypes: DEFAULT_MATERIAL_TYPES,
  paymentMethods: DEFAULT_PAYMENT_METHODS,
  stores: [],          // [{ id, name, kind: 'physical'|'online', address?, url?, notes? }]
  storeTags: [],       // legacy — migrated into stores on load
  statsResetAt: null,
  onboardingComplete: false,
  // Tracks one-time nudges so we don't re-show after dismiss
  firstOrderNudgeShown: false,
  lastBackupNudgeAt: null,
  // Restock builder defaults — how far ahead to scan for orders, and which
  // store tags to pre-apply to the auto-built trip.
  restockHorizonDays: 14,
  restockDefaultStores: [],
};


const SYNC_DEBOUNCE_MS = 1500;

const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };
const daysAhead = (n, hour = 14, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + n); d.setHours(hour, minute, 0, 0);
  const pad = x => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Seeds intentionally empty — a fresh install lands on empty tabs with
// the built-in empty-state nudges ("Your garden is empty" etc). The
// app's owner adds her own flowers, supplies, bouquets, and orders.
const SEED_FLOWERS = [];
const SEED_MATERIALS = [];
const SEED_SHOPPING = [];
const SEED_BOUQUETS = [];
const SEED_ORDERS = [];

async function fetchWikipedia(name) {
  const title = encodeURIComponent(name.trim());
  const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`);
  if (!res.ok) throw new Error('notfound');
  const data = await res.json();
  if (data.type === 'disambiguation') throw new Error('ambiguous');
  return {
    description: data.extract || '',
    imageUrl: data.thumbnail?.source || data.originalimage?.source || '',
    wikiUrl: data.content_urls?.desktop?.page || '',
  };
}

function formatRelative(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function formatPickupTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
function formatLongDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
function formatTime12(hour, minute) {
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${h12}:${String(minute).padStart(2, '0')} ${ampm}`;
}
function sameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}
function getMonthGrid(year, month, weekStart = 0) {
  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevDays = (startDayOfWeek - weekStart + 7) % 7;
  const cells = [];
  for (let i = prevDays - 1; i >= 0; i--) cells.push({ date: new Date(year, month - 1, prevMonthLastDay - i), inMonth: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(year, month, d), inMonth: true });
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last); next.setDate(last.getDate() + 1);
    cells.push({ date: next, inMonth: false });
  }
  return cells;
}
function getDayLabels(weekStart = 0) {
  const all = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return [...all.slice(weekStart), ...all.slice(0, weekStart)];
}
function isLight(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}
function getPaletteName(hex) {
  return PALETTE.find(p => p.hex.toLowerCase() === hex.toLowerCase())?.name || 'Custom';
}

function escapeICS(text) {
  if (!text) return '';
  return String(text)
    .replace(/\\/g, '\\\\').replace(/;/g, '\\;')
    .replace(/,/g, '\\,').replace(/\n/g, '\\n');
}
function formatICSDateTime(date, utc = false) {
  const pad = (n) => String(n).padStart(2, '0');
  if (utc) {
    return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
  }
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
function orderToVEVENT(order, settings) {
  const start = new Date(order.pickupDateTime);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const now = new Date();
  const payment = PAYMENT_METHODS.find(p => p.key === order.paymentMethod);
  const extrasSum = (order.extraCosts || []).reduce((s, e) => {
    const n = Number(e.amount); return s + (isFinite(n) && n > 0 ? n : 0);
  }, 0);
  const subtotalRaw = order.quantity * order.costPer + extrasSum;
  // Discount applied so calendar event description matches what customer pays
  const total = Math.max(0, subtotalRaw - discountAmountOf(subtotalRaw, order.discount)).toFixed(2);
  const useReminders = order.enableReminders !== false;
  const descLines = [];
  if (order.arrangement) descLines.push(`${order.quantity}× ${order.arrangement}`);
  else descLines.push(`Quantity: ${order.quantity}`);
  descLines.push(`Total: $${total}`);
  if (payment) descLines.push(`Payment: ${payment.label}${order.paid ? ' (paid)' : ' (unpaid)'}`);
  if (order.notes) { descLines.push(''); descLines.push(order.notes); }
  descLines.push(''); descLines.push(`— ${settings.businessName}`);
  const alarmLines = useReminders ? settings.reminderOffsets.flatMap(offset => [
    'BEGIN:VALARM',
    `TRIGGER:${offsetToTrigger(offset)}`,
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS(`Pickup ${offsetToLabel(offset)} — ${order.customerName}`)}`,
    'END:VALARM',
  ]) : [];
  return [
    'BEGIN:VEVENT',
    `UID:${order.id}@petal-and-stem.app`,
    `DTSTAMP:${formatICSDateTime(now, true)}`,
    `DTSTART:${formatICSDateTime(start)}`,
    `DTEND:${formatICSDateTime(end)}`,
    `SUMMARY:${escapeICS(`Pickup: ${order.customerName}`)}`,
    `DESCRIPTION:${escapeICS(descLines.join('\n'))}`,
    ...alarmLines,
    'END:VEVENT',
  ].join('\r\n');
}
function buildICS(orders, settings) {
  const events = orders.map(o => orderToVEVENT(o, settings)).join('\r\n');
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    `PRODID:-//${settings.businessName}//Flower Orders//EN`,
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    events, 'END:VCALENDAR',
  ].join('\r\n');
}
function sanitizeFilename(name) {
  return (name || 'order').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'order';
}
function downloadICS(orders, settings, filename) {
  const content = buildICS(orders, settings);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildExport(flowers, materials, orders, settings) {
  return { app: 'petal-and-stem', version: 5, exportedAt: new Date().toISOString(), flowers, materials, orders, settings };
}

// ─── Order schema migration (v5+) ───
// Legacy orders had: paymentMethod: string, paid: bool, cardMessage: string
// New orders have:   payments: [{id, method, amount, paid, paidAt?}],
//                    cardMessages: string[]
// Migration is idempotent; on reload it's a no-op once orders are upgraded.

function migrateOrder(order) {
  if (!order) return order;
  let changed = false;
  let next = order;

  if (!Array.isArray(order.payments)) {
    const total = (Number(order.quantity) || 0) * (Number(order.costPer) || 0);
    const method = order.paymentMethod || 'cash';
    const paid = !!order.paid;
    next = {
      ...next,
      payments: total > 0 || method
        ? [{
            id: `pay-mig-${order.id || Math.random().toString(36).slice(2)}`,
            method, amount: total, paid,
            paidAt: paid ? (order.createdAt || new Date().toISOString()) : null,
          }]
        : [],
    };
    changed = true;
  }
  if (!Array.isArray(order.cardMessages)) {
    const single = (order.cardMessage || '').trim();
    next = { ...next, cardMessages: single ? [single] : [] };
    changed = true;
  }
  return changed ? next : order;
}

function migrateOrders(orders) {
  if (!Array.isArray(orders)) return [];
  return orders.map(migrateOrder);
}

// Sum of additional bouquet line items (qty × costPer). Excludes the
// main bouquet (which is captured in the order's arrangement/quantity/
// costPer fields).
function additionalBouquetsSum(order) {
  const list = Array.isArray(order.additionalBouquets) ? order.additionalBouquets : [];
  return list.reduce((s, b) => {
    const q = Number(b.quantity) || 0;
    const p = Number(b.costPer) || 0;
    return s + q * p;
  }, 0);
}

// Helpers for deriving order state from its payments array. The UI
// avoids reading `order.paid` directly so partial payments display
// correctly; use these instead.
function orderTotal(order) {
  return (Number(order.quantity) || 0) * (Number(order.costPer) || 0) + additionalBouquetsSum(order);
}
function paymentsTotal(order) {
  return (order.payments || []).reduce((s, p) => s + (p.paid ? (Number(p.amount) || 0) : 0), 0);
}
function orderPaidState(order) {
  const payments = order.payments || [];
  if (payments.length === 0) return order.paid ? 'paid' : 'unpaid';
  const total = orderTotal(order);
  const paid = paymentsTotal(order);
  if (paid <= 0) return 'unpaid';
  if (paid + 0.001 >= total) return 'paid';
  return 'partial';
}
function outstandingBalance(order) {
  return Math.max(0, orderTotal(order) - paymentsTotal(order));
}
function validateImport(data) {
  if (!data || typeof data !== 'object') return { ok: false, error: 'File is not valid data.' };
  if (!Array.isArray(data.flowers)) return { ok: false, error: 'No flowers found in this file.' };
  for (const f of data.flowers) {
    if (!f.id || !f.name || !f.mode) return { ok: false, error: 'Some flowers are missing required fields.' };
    if (f.mode === 'perStem' && (typeof f.bunchPrice !== 'number' || typeof f.bunchCount !== 'number'))
      return { ok: false, error: `"${f.name}" is missing pricing details.` };
    if (f.mode === 'flat' && (typeof f.flatMin !== 'number' || typeof f.flatMax !== 'number'))
      return { ok: false, error: `"${f.name}" is missing pricing details.` };
  }
  const materials = Array.isArray(data.materials) ? data.materials : [];
  for (const m of materials) {
    if (!m.id || !m.name || !m.color) return { ok: false, error: 'Some materials are missing required fields.' };
  }
  const orders = Array.isArray(data.orders) ? data.orders : [];
  for (const o of orders) {
    if (!o.id || !o.customerName || typeof o.quantity !== 'number' || typeof o.costPer !== 'number')
      return { ok: false, error: 'Some orders are missing required fields.' };
  }
  return { ok: true, flowerCount: data.flowers.length, materialCount: materials.length, orderCount: orders.length, hasSettings: !!data.settings };
}

export default function App() {
  const VALID_TABS = ['inventory', 'materials', 'build', 'shopping', 'orders'];
  const [showStats, setShowStats] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('petal_activeTab');
      return saved && VALID_TABS.includes(saved) ? saved : 'inventory';
    } catch { return 'inventory'; }
  });
  useEffect(() => {
    try { localStorage.setItem('petal_activeTab', activeTab); } catch {}
  }, [activeTab]);
  const [flowers, setFlowers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [cart, setCart] = useState({ customerName: '', items: [], customerPrice: '', extraCosts: [], discount: null });
  const [expandedHistory, setExpandedHistory] = useState({});
  const [loggingFlower, setLoggingFlower] = useState(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [lastExport, setLastExport] = useState(null);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [bouquets, setBouquets] = useState([]);
  const [shopping, setShopping] = useState([]);
  const [showBouquetForm, setShowBouquetForm] = useState(false);
  const [editingBouquetId, setEditingBouquetId] = useState(null);
  const [bouquetForm, setBouquetForm] = useState({ name: '', fixedPrice: '', imageUrl: '', imagePosition: '50% 50%', imageZoom: 1, items: [] });
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [storeForm, setStoreForm] = useState({ id: null, name: '', kind: 'physical', address: '', url: '', notes: '' });
  const [receiptOrderId, setReceiptOrderId] = useState(null);
  const [form, setForm] = useState({
    name: '', mode: 'perStem', bunchPrice: '', bunchCount: '', flatMin: '', flatMax: '',
    description: '', imageUrl: '', wikiUrl: '',
  });
  const [materialForm, setMaterialForm] = useState({ name: '', type: 'ribbon', color: '#F5E6D3', unitPrice: '', note: '', storeTags: [], imageUrl: '', imagePosition: '50% 50%', imageZoom: 1 });
  const [orderForm, setOrderForm] = useState({
    customerName: '', arrangement: '', quantity: '1', costPer: '',
    paymentMethod: 'venmo', pickupDateTime: '', paid: false, notes: '', cardMessage: '', cardMessages: [], payments: [], additionalBouquets: [],
    eventType: 'general',
    enableReminders: true,
    items: [], extraCosts: [],
  });
  const [lookupState, setLookupState] = useState({ loading: false, error: '' });

  // PWA-only state
  const [permState, setPermState] = useState('default');
  const [sheetsState, setSheetsState] = useState({ connected: false, lastSync: null, syncing: false });
  const [driveState, setDriveState] = useState({ lastSync: null, syncing: false, lastError: null });
  // Holds a pending restore offer after a fresh connect — { exportedAt, modifiedTime, data }
  const [restoreOffer, setRestoreOffer] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [toast, setToast] = useState(null);
  const [pendingUndo, setPendingUndo] = useState(null);

  const syncTimerRef = useRef(null);
  const driveTimerRef = useRef(null);
  const focusOrderRef = useRef(null);
  const toastTimerRef = useRef(null);
  const undoTimerRef = useRef(null);
  const cartFinalizeRef = useRef(false);
  // Measured height of the sticky app chrome (header + tabs). Exposed as a CSS
  // variable so sticky children inside each tab (e.g. the Shopping restock
  // banner) can offset themselves to sit right below the chrome.
  const chromeRef = useRef(null);

  const showToast = (msg, kind = 'error') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, kind });
    toastTimerRef.current = setTimeout(() => setToast(null), 4500);
  };
  // Queue an undo snackbar that auto-dismisses after 10 seconds.
  // If a previous undo was pending, that one auto-commits (the new delete supersedes it).
  const queueUndo = (label, undo) => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setPendingUndo({ label, undo, id: Date.now() });
    undoTimerRef.current = setTimeout(() => setPendingUndo(null), 10000);
  };
  const commitUndo = () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setPendingUndo(null);
  };
  const runUndo = () => {
    if (pendingUndo && pendingUndo.undo) {
      try { pendingUndo.undo(); } catch {}
    }
    commitUndo();
  };

  useEffect(() => { loadAll(); }, []);

  // Publish the sticky chrome's height as --chrome-h so sticky children inside
  // tabs can sit just below the chrome instead of being covered by it. Re-measured
  // on resize since header height grows/shrinks with business-name length.
  useEffect(() => {
    const el = chromeRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const update = () => {
      document.documentElement.style.setProperty('--chrome-h', `${el.offsetHeight}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Keep the document title (used by browser tab + print headers) in sync with the business name.
  useEffect(() => {
    const name = (settings.businessName || '').trim();
    document.title = name || 'Petal & Stem';
  }, [settings.businessName]);

  // Persist the in-flight order draft so closing the form or refreshing the page
  // doesn't lose work. Cleared on submit/cancel.
  useEffect(() => {
    if (loading) return;
    const isDirty = !!(
      (orderForm.customerName || '').trim()
      || (orderForm.arrangement || '').trim()
      || (orderForm.cardMessage || '').trim()
      || (orderForm.notes || '').trim()
      || (orderForm.items && orderForm.items.length > 0)
      || (orderForm.extraCosts && orderForm.extraCosts.length > 0)
    );
    if (isDirty) {
      storage.set('order_draft_v1', JSON.stringify({
        draft: orderForm, editingId: editingOrderId,
      })).catch(() => {});
    } else {
      storage.delete('order_draft_v1').catch(() => {});
    }
  }, [orderForm, editingOrderId, loading]);

  // Track online/offline
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Track notification permission — re-check when the tab becomes visible,
  // since the user can change browser-level permission outside the app.
  useEffect(() => {
    const refresh = () => setPermState(notifs.permissionState());
    refresh();
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  // SW message handler — when user taps a notification, jump to that order
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handler = (event) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICKED' && event.data.orderId) {
        focusOrderRef.current = event.data.orderId;
        setActiveTab('orders');
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, []);

  // Reschedule notifications whenever orders, trips, or relevant settings change
  useEffect(() => {
    if (loading) return;
    notifs.rescheduleAll(orders, shopping, settings).catch(() => {});
  }, [orders, shopping, settings.reminderOffsets, settings.remindersDefault, loading]);

  // First-order nudge: once she's saved her first order, prompt to enable
  // notifications if she hasn't already granted permission. One-time only.
  useEffect(() => {
    if (loading) return;
    if (settings.firstOrderNudgeShown) return;
    if (orders.length === 0) return;
    if (permState === 'granted') {
      // Already on; just mark it shown so we don't re-check
      saveSettings({ ...settings, firstOrderNudgeShown: true });
      return;
    }
    if (permState === 'denied') return; // can't help her here
    // Permission state is 'default' or 'unsupported' — gentle nudge
    showToast('Want pickup reminders? Enable them in Settings → Reminders.', 'success');
    saveSettings({ ...settings, firstOrderNudgeShown: true });
  }, [orders.length, permState, loading, settings.firstOrderNudgeShown]);

  // Trigger sheets sync (debounced) on data changes
  useEffect(() => {
    if (loading) return;
    if (!sheets.isConfigured()) return;
    if (!sheetsState.connected) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      setSheetsState((s) => ({ ...s, syncing: true }));
      const result = await sheets.syncAll({ flowers, materials, orders, settings });
      setSheetsState((s) => ({
        ...s,
        syncing: false,
        lastSync: result.ok ? result.syncedAt : s.lastSync,
        lastError: result.ok ? null : result.reason,
      }));
      if (!result.ok && result.reason !== 'offline' && result.reason !== 'not-connected') {
        showToast("Couldn't sync to Google Sheets. Will retry on next change.");
      }
    }, SYNC_DEBOUNCE_MS);
    return () => { if (syncTimerRef.current) clearTimeout(syncTimerRef.current); };
  }, [flowers, materials, orders, settings, sheetsState.connected, loading]);

  // On reconnect, retry failed sync
  useEffect(() => {
    if (isOnline && sheetsState.lastError === 'offline') {
      handleManualSync();
    }
  }, [isOnline]);

  // Drive backup — debounced auto-push of the full data blob (JSON + images)
  // to a single file in her Google Drive. Reuses the same OAuth session as
  // sheets. Runs independently of sheets sync so either can fail without
  // taking the other down.
  useEffect(() => {
    if (loading) return;
    if (!drive.isConfigured()) return;
    if (!sheetsState.connected) return; // shared auth — sheets connected ⇒ drive connected
    if (driveTimerRef.current) clearTimeout(driveTimerRef.current);
    driveTimerRef.current = setTimeout(async () => {
      setDriveState((s) => ({ ...s, syncing: true, lastError: null }));
      try {
        const payload = buildExport(flowers, materials, orders, settings);
        const meta = await drive.uploadBackup(payload);
        setDriveState({
          lastSync: meta.modifiedTime || new Date().toISOString(),
          syncing: false, lastError: null,
        });
      } catch (e) {
        setDriveState((s) => ({ ...s, syncing: false, lastError: e.message || 'upload failed' }));
      }
    }, SYNC_DEBOUNCE_MS);
    return () => { if (driveTimerRef.current) clearTimeout(driveTimerRef.current); };
  }, [flowers, materials, orders, settings, sheetsState.connected, loading]);

  const loadAll = async () => {
    try {
      const r = await storage.get('settings_v1');
      if (r?.value) {
        const merged = { ...DEFAULT_SETTINGS, ...JSON.parse(r.value) };
        // Migrate legacy storeTags (string[]) → stores ([{id, name, kind}])
        if (Array.isArray(merged.storeTags) && merged.storeTags.length > 0) {
          const existingNames = new Set((merged.stores || []).map(s => (s.name || '').toLowerCase()));
          const newStores = merged.storeTags
            .filter(t => t && !existingNames.has(t.toLowerCase()))
            .map(t => ({ id: `store-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: t, kind: 'physical' }));
          if (newStores.length > 0) {
            merged.stores = [...(merged.stores || []), ...newStores];
          }
          merged.storeTags = []; // wipe legacy
        }
        setSettings(merged);
      } else {
        setSettings(DEFAULT_SETTINGS);
        await storage.set('settings_v1', JSON.stringify(DEFAULT_SETTINGS)).catch(() => {});
      }
    } catch (e) { setSettings(DEFAULT_SETTINGS); }
    try {
      const r = await storage.get('flowers_v3');
      if (r?.value) setFlowers(JSON.parse(r.value));
      else { setFlowers(SEED_FLOWERS); await storage.set('flowers_v3', JSON.stringify(SEED_FLOWERS)).catch(() => {}); }
    } catch (e) { setFlowers(SEED_FLOWERS); }
    try {
      const r = await storage.get('materials_v1');
      if (r?.value) setMaterials(JSON.parse(r.value));
      else { setMaterials(SEED_MATERIALS); await storage.set('materials_v1', JSON.stringify(SEED_MATERIALS)).catch(() => {}); }
    } catch (e) { setMaterials(SEED_MATERIALS); }
    try {
      const r = await storage.get('orders_v1');
      if (r?.value) setOrders(migrateOrders(JSON.parse(r.value)));
      else { setOrders(SEED_ORDERS); await storage.set('orders_v1', JSON.stringify(SEED_ORDERS)).catch(() => {}); }
    } catch (e) { setOrders(SEED_ORDERS); }
    try {
      const r = await storage.get('shopping_v1');
      if (r?.value) setShopping(JSON.parse(r.value));
      else { setShopping(SEED_SHOPPING); await storage.set('shopping_v1', JSON.stringify(SEED_SHOPPING)).catch(() => {}); }
    } catch (e) { setShopping(SEED_SHOPPING); }
    // Restore in-flight order draft (so closing the form or refreshing doesn't lose work)
    try {
      const r = await storage.get('order_draft_v1');
      if (r?.value) {
        const parsed = JSON.parse(r.value);
        if (parsed && parsed.draft) {
          setOrderForm(parsed.draft);
          if (parsed.editingId) setEditingOrderId(parsed.editingId);
        }
      }
    } catch (e) {}
    try {
      const r = await storage.get('bouquets_v1');
      if (r?.value) {
        setBouquets(JSON.parse(r.value));
      } else {
        // Migrate from older templates_v1 if it exists
        const old = await storage.get('templates_v1').catch(() => null);
        if (old?.value) {
          try {
            const parsed = JSON.parse(old.value);
            const migrated = parsed.map(t => ({
              id: t.id, name: t.name,
              fixedPrice: t.fixedPrice || 0,
              imageUrl: t.imageUrl || '',
              items: t.items || [],
              createdAt: t.createdAt || new Date().toISOString(),
            }));
            setBouquets(migrated);
            await storage.set('bouquets_v1', JSON.stringify(migrated)).catch(() => {});
          } catch (e) { setBouquets(SEED_BOUQUETS); }
        } else {
          setBouquets(SEED_BOUQUETS);
          await storage.set('bouquets_v1', JSON.stringify(SEED_BOUQUETS)).catch(() => {});
        }
      }
    } catch (e) { setBouquets(SEED_BOUQUETS); }
    try {
      const r = await storage.get('last_export');
      if (r?.value) setLastExport(r.value);
    } catch (e) {}
    try {
      const r = await storage.get('cart_v1');
      if (r?.value) {
        const parsed = JSON.parse(r.value);
        if (parsed && Array.isArray(parsed.items)) {
          setCart({
            customerName: parsed.customerName || '',
            items: parsed.items,
            customerPrice: parsed.customerPrice || '',
            extraCosts: Array.isArray(parsed.extraCosts) ? parsed.extraCosts : [],
          });
        }
      } else {
        // Migrate from old arrangement format ({flowerId: qty})
        const old = await storage.get('arrangement_v1').catch(() => null);
        if (old?.value) {
          try {
            const obj = JSON.parse(old.value);
            const items = Object.entries(obj || {}).map(([id, qty]) => ({
              kind: 'flower', id, qty, included: true,
            }));
            if (items.length > 0) setCart({ customerName: '', items, customerPrice: '', extraCosts: [] });
          } catch (e) {}
        }
      }
    } catch (e) {}

    // Sheets connection check
    if (sheets.isConfigured()) {
      const connected = await sheets.isConnected();
      const lastSync = await sheets.getLastSync();
      setSheetsState({ connected, lastSync, syncing: false });
      // Drive backup state — use the last modifiedTime we saw on Drive as
      // our "last synced" display value. Non-blocking: if this fails, the
      // UI just shows "never" and the first data change will refresh it.
      if (connected) {
        drive.getLastKnownModified()
          .then((t) => { if (t) setDriveState({ lastSync: t, syncing: false, lastError: null }); })
          .catch(() => {});
      }
    }

    // OneSignal SDK init — non-blocking, failures are silent
    if (onesignal.isConfigured()) {
      onesignal.initSDK(import.meta.env.BASE_URL).catch(() => {});
    }

    setLoading(false);
  };

  const persist = async (key, value, errMsg) => {
    try { await storage.set(key, value); }
    catch (e) {
      if (e && e.name === 'QuotaExceededError') showToast("Phone storage is full — couldn't save changes.");
      else showToast(errMsg || "Couldn't save changes locally.");
    }
  };
  const saveFlowers = async (next) => { setFlowers(next); await persist('flowers_v3', JSON.stringify(next)); };
  const saveMaterials = async (next) => { setMaterials(next); await persist('materials_v1', JSON.stringify(next)); };
  const saveOrders = async (next) => { setOrders(next); await persist('orders_v1', JSON.stringify(next)); };
  const saveSettings = async (next) => { setSettings(next); await persist('settings_v1', JSON.stringify(next)); };
  const saveCart = async (next) => { setCart(next); await persist('cart_v1', JSON.stringify(next)); };
  const saveBouquets = async (next) => { setBouquets(next); await persist('bouquets_v1', JSON.stringify(next)); };
  const saveShopping = async (next) => { setShopping(next); await persist('shopping_v1', JSON.stringify(next)); };

  const clearAllData = async () => {
    const blankCart = { customerName: '', items: [], customerPrice: '', extraCosts: [], discount: null };
    setFlowers([]); setMaterials([]); setOrders([]); setBouquets([]); setShopping([]); setCart(blankCart); setExpandedHistory({});
    await persist('flowers_v3', JSON.stringify([]));
    await persist('materials_v1', JSON.stringify([]));
    await persist('orders_v1', JSON.stringify([]));
    await persist('bouquets_v1', JSON.stringify([]));
    await persist('shopping_v1', JSON.stringify([]));
    await persist('cart_v1', JSON.stringify(blankCart));
    if (onesignal.isConfigured()) {
      try { await onesignal.cancelAllReminders(); }
      catch (e) { showToast("Couldn't cancel scheduled reminders. They may still fire."); }
    }
  };

  const markExported = async () => {
    const now = new Date().toISOString();
    setLastExport(now);
    await storage.set('last_export', now).catch(() => {});
  };

  const handleImport = async (data) => {
    const validation = validateImport(data);
    if (!validation.ok) return validation;
    await saveFlowers(data.flowers);
    await saveMaterials(Array.isArray(data.materials) ? data.materials : []);
    await saveOrders(migrateOrders(Array.isArray(data.orders) ? data.orders : []));
    if (data.settings) await saveSettings({ ...DEFAULT_SETTINGS, ...data.settings });
    await saveCart({ customerName: '', items: [], customerPrice: '', extraCosts: [], discount: null });
    setExpandedHistory({});
    return validation;
  };

  // --- Notification permission ---
  const handleEnableNotifications = async () => {
    // If OneSignal is configured, use its permission flow (also subscribes)
    if (onesignal.isConfigured()) {
      const osResult = await onesignal.requestPermission();
      if (osResult === 'granted') setPermState('granted');
      else if (osResult === 'denied') setPermState('denied');
    }
    // Also request via browser API (for local fallback notifications)
    const result = await notifs.requestPermission();
    setPermState(result);
    if (result === 'granted') {
      notifs.rescheduleAll(orders, shopping, settings).catch(() => {});
    }
  };
  const handleTestNotification = async () => {
    // Try OneSignal first (server-delivered = the one that matters)
    if (onesignal.isConfigured()) {
      const sent = await onesignal.sendTest(settings.businessName);
      if (sent) return; // OneSignal handled it
    }
    // Fallback to local
    await notifs.testNotification();
  };

  // --- Sheets sync ---
  const handleConnectSheets = async () => {
    try {
      await sheets.connect();
      setSheetsState((s) => ({ ...s, connected: true }));
      // Trigger initial sync immediately
      handleManualSync();
      // Also check for an existing Drive backup — if there's one with more
      // recent data than what we have locally, offer to restore it. This is
      // the core "new device, sign in, get your data" flow.
      try {
        const meta = await drive.getBackupMeta();
        if (meta && meta.id) {
          const data = await drive.downloadBackup();
          if (data && data.exportedAt) {
            const cloudTime = new Date(data.exportedAt).getTime();
            const localTime = lastExport ? new Date(lastExport).getTime() : 0;
            // Offer restore if cloud is meaningfully newer (>10s — handles clock skew).
            if (cloudTime > localTime + 10_000) {
              setRestoreOffer({
                exportedAt: data.exportedAt,
                modifiedTime: meta.modifiedTime,
                data,
              });
            }
          }
        }
      } catch (e) {
        // Non-fatal: sheets is connected, drive restore just didn't surface.
        if (typeof console !== 'undefined') console.warn('[drive] restore check failed:', e);
      }
    } catch (e) {
      showToast(`Couldn't connect to Google: ${e.message}`);
    }
  };
  const handleDisconnectSheets = async () => {
    await sheets.disconnect();
    await drive.clearLocalDriveState().catch(() => {});
    setSheetsState({ connected: false, lastSync: null, syncing: false });
    setDriveState({ lastSync: null, syncing: false, lastError: null });
  };
  // Manual "pull from cloud" — downloads the latest Drive backup and applies
  // it locally (same path as a manual JSON import). Useful on a 2nd device
  // that wasn't around when the 1st device pushed.
  const handlePullFromDrive = async () => {
    if (!sheetsState.connected) return;
    setDriveState((s) => ({ ...s, syncing: true, lastError: null }));
    try {
      const data = await drive.downloadBackup();
      if (!data) {
        setDriveState((s) => ({ ...s, syncing: false, lastError: 'No backup in Drive yet' }));
        showToast('No backup in Drive yet — make a change and one will be created.', 'info');
        return;
      }
      const result = await handleImport(data);
      if (!result.ok) {
        setDriveState((s) => ({ ...s, syncing: false, lastError: result.error }));
        showToast(`Restore failed: ${result.error}`);
        return;
      }
      const meta = await drive.getBackupMeta();
      setDriveState({
        lastSync: meta?.modifiedTime || new Date().toISOString(),
        syncing: false, lastError: null,
      });
      showToast('Restored from Drive backup.', 'info');
    } catch (e) {
      setDriveState((s) => ({ ...s, syncing: false, lastError: e.message || 'download failed' }));
      showToast(`Couldn't pull from Drive: ${e.message}`);
    }
  };
  const handleAcceptRestore = async () => {
    if (!restoreOffer) return;
    const result = await handleImport(restoreOffer.data);
    setRestoreOffer(null);
    if (result.ok) {
      setDriveState((s) => ({ ...s, lastSync: restoreOffer.modifiedTime || restoreOffer.exportedAt }));
      showToast('Restored from your Drive backup.', 'info');
    } else {
      showToast(`Restore failed: ${result.error}`);
    }
  };
  const handleDeclineRestore = () => setRestoreOffer(null);
  const handleManualSync = async () => {
    if (!sheetsState.connected) return;
    setSheetsState((s) => ({ ...s, syncing: true }));
    const result = await sheets.syncAll({ flowers, materials, orders, settings });
    setSheetsState((s) => ({
      ...s,
      syncing: false,
      lastSync: result.ok ? result.syncedAt : s.lastSync,
      lastError: result.ok ? null : result.reason,
    }));
  };
  const getSheetUrl = async () => sheets.getSheetUrl();

  const recentNotes = useMemo(() => {
    const counts = {};
    flowers.forEach(f => (f.priceHistory || []).forEach(h => { if (h.note) counts[h.note] = (counts[h.note] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([n]) => n);
  }, [flowers]);

  const resetForm = () => {
    setForm({ name: '', mode: 'perStem', bunchPrice: '', bunchCount: '', flatMin: '', flatMax: '', description: '', imageUrl: '', imagePosition: '50% 50%', imageZoom: 1, wikiUrl: '' });
    setEditingId(null); setShowForm(false); setLookupState({ loading: false, error: '' });
  };
  const startEdit = (f) => {
    setForm({
      name: f.name, mode: f.mode,
      bunchPrice: f.bunchPrice ?? '', bunchCount: f.bunchCount ?? '',
      flatMin: f.flatMin ?? '', flatMax: f.flatMax ?? '',
      description: f.description ?? '',
      imageUrl: f.imageUrl ?? '',
      imagePosition: f.imagePosition || '50% 50%',
      imageZoom: typeof f.imageZoom === 'number' && f.imageZoom > 0 ? f.imageZoom : 1,
      wikiUrl: f.wikiUrl ?? '',
    });
    setEditingId(f.id); setShowForm(true); setLookupState({ loading: false, error: '' });
  };
  const doLookup = async () => {
    if (!form.name.trim()) return;
    setLookupState({ loading: true, error: '', searchUrl: '' });
    try {
      const info = await fetchWikipedia(form.name);
      setForm(f => ({ ...f, description: info.description || f.description, imageUrl: info.imageUrl || f.imageUrl, wikiUrl: info.wikiUrl || f.wikiUrl }));
      setLookupState({ loading: false, error: '', searchUrl: '' });
    } catch (e) {
      const searchUrl = `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(form.name + ' flower')}`;
      const msg = e.message === 'ambiguous'
        ? "More than one match — pick the right one on Wikipedia, then refine the name here."
        : "Couldn't find that exact name. Search Wikipedia or type your own description below.";
      setLookupState({ loading: false, error: msg, searchUrl });
    }
  };
  const submitForm = () => {
    if (!form.name.trim()) return;
    const existing = editingId ? flowers.find(f => f.id === editingId) : null;
    const entry = {
      id: editingId || `f-${Date.now()}`, name: form.name.trim(), mode: form.mode,
      description: form.description.trim() || undefined,
      imageUrl: form.imageUrl || undefined,
      imagePosition: form.imagePosition || undefined,
      imageZoom: typeof form.imageZoom === 'number' && form.imageZoom > 0 ? form.imageZoom : undefined,
      wikiUrl: form.wikiUrl || undefined,
      priceHistory: existing?.priceHistory || [],
    };
    if (form.mode === 'perStem') {
      const bp = parseFloat(form.bunchPrice), bc = parseInt(form.bunchCount);
      if (!bp || !bc) return;
      entry.bunchPrice = bp; entry.bunchCount = bc;
    } else {
      const mn = parseFloat(form.flatMin), mx = parseFloat(form.flatMax);
      if (!mn || !mx) return;
      entry.flatMin = mn; entry.flatMax = mx;
    }
    saveFlowers(editingId ? flowers.map(f => f.id === editingId ? entry : f) : [...flowers, entry]);
    resetForm();
  };
  // Fast path for "I'm mid-trip and want this in the catalog now" — creates a
  // minimal flat-priced flower so she can finish shopping, fill in details later.
  const quickCreateFlower = (rawName) => {
    const name = (rawName || '').trim();
    if (!name) return null;
    if (flowers.some(f => (f.name || '').toLowerCase() === name.toLowerCase())) return null;
    const entry = {
      id: `f-${Date.now()}`, name, mode: 'flat',
      flatMin: 0, flatMax: 0, priceHistory: [],
    };
    saveFlowers([...flowers, entry]);
    return entry;
  };
  // Strip dangling cart-shape items pointing at a deleted catalog entry.
  const pruneOrderDraftItems = (kind, idSet) => {
    if (!Array.isArray(orderForm.items) || orderForm.items.length === 0) return;
    if (!orderForm.items.some(it => it.kind === kind && idSet.has(it.id))) return;
    setOrderForm({
      ...orderForm,
      items: orderForm.items.filter(it => !(it.kind === kind && idSet.has(it.id))),
    });
  };
  const deleteFlower = (id) => {
    const flower = flowers.find(f => f.id === id);
    if (!flower) return;
    const prevFlowers = flowers, prevCart = cart, prevDraft = orderForm;
    saveFlowers(flowers.filter(f => f.id !== id));
    if (cart.items.some(it => it.kind === 'flower' && it.id === id)) {
      saveCart({ ...cart, items: cart.items.filter(it => !(it.kind === 'flower' && it.id === id)) });
    }
    pruneOrderDraftItems('flower', new Set([id]));
    queueUndo(`Deleted "${flower.name}"`, () => {
      saveFlowers(prevFlowers); saveCart(prevCart); setOrderForm(prevDraft);
    });
  };
  const bulkDeleteFlowers = (ids) => {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    const removed = flowers.filter(f => idSet.has(f.id));
    if (removed.length === 0) return;
    const prevFlowers = flowers, prevCart = cart, prevDraft = orderForm;
    saveFlowers(flowers.filter(f => !idSet.has(f.id)));
    if (cart.items.some(it => it.kind === 'flower' && idSet.has(it.id))) {
      saveCart({ ...cart, items: cart.items.filter(it => !(it.kind === 'flower' && idSet.has(it.id))) });
    }
    pruneOrderDraftItems('flower', idSet);
    queueUndo(`Deleted ${removed.length} ${removed.length === 1 ? 'flower' : 'flowers'}`, () => {
      saveFlowers(prevFlowers); saveCart(prevCart); setOrderForm(prevDraft);
    });
  };

  const resetMaterialForm = () => {
    setMaterialForm({ name: '', type: 'ribbon', color: '#F5E6D3', unitPrice: '', note: '', storeTags: [], imageUrl: '', imagePosition: '50% 50%', imageZoom: 1 });
    setEditingMaterialId(null); setShowMaterialForm(false);
  };
  const startEditMaterial = (m) => {
    setMaterialForm({
      name: m.name, type: m.type, color: m.color,
      unitPrice: m.unitPrice != null ? String(m.unitPrice) : '',
      note: m.note ?? '',
      storeTags: Array.isArray(m.storeTags) ? [...m.storeTags] : [],
      imageUrl: m.imageUrl || '',
      imagePosition: m.imagePosition || '50% 50%',
      imageZoom: typeof m.imageZoom === 'number' && m.imageZoom > 0 ? m.imageZoom : 1,
    });
    setEditingMaterialId(m.id); setShowMaterialForm(true);
  };
  const submitMaterialForm = () => {
    if (!materialForm.name.trim() || !materialForm.color) return;
    const priceNum = parseFloat(materialForm.unitPrice);
    const cleanTags = (materialForm.storeTags || []).map(t => (t || '').trim()).filter(Boolean);
    const entry = {
      id: editingMaterialId || `m-${Date.now()}`, name: materialForm.name.trim(),
      type: materialForm.type, color: materialForm.color,
      unitPrice: isFinite(priceNum) && priceNum >= 0 ? priceNum : 0,
      note: materialForm.note.trim() || undefined,
      storeTags: cleanTags.length > 0 ? cleanTags : undefined,
      imageUrl: materialForm.imageUrl || undefined,
      imagePosition: materialForm.imageUrl ? (materialForm.imagePosition || '50% 50%') : undefined,
      imageZoom: materialForm.imageUrl ? (materialForm.imageZoom || 1) : undefined,
    };
    saveMaterials(editingMaterialId ? materials.map(m => m.id === editingMaterialId ? entry : m) : [...materials, entry]);
    resetMaterialForm();
  };
  const quickCreateMaterial = (rawName) => {
    const name = (rawName || '').trim();
    if (!name) return null;
    if (materials.some(m => (m.name || '').toLowerCase() === name.toLowerCase())) return null;
    const entry = {
      id: `m-${Date.now()}`, name,
      type: 'ribbon', color: '#F5E6D3', unitPrice: 0,
    };
    saveMaterials([...materials, entry]);
    return entry;
  };
  const deleteMaterial = (id) => {
    const m = materials.find(x => x.id === id);
    if (!m) return;
    const prevMaterials = materials, prevCart = cart, prevDraft = orderForm;
    saveMaterials(materials.filter(x => x.id !== id));
    if (cart.items.some(it => it.kind === 'material' && it.id === id)) {
      saveCart({ ...cart, items: cart.items.filter(it => !(it.kind === 'material' && it.id === id)) });
    }
    pruneOrderDraftItems('material', new Set([id]));
    queueUndo(`Deleted "${m.name}"`, () => {
      saveMaterials(prevMaterials); saveCart(prevCart); setOrderForm(prevDraft);
    });
  };
  const bulkDeleteMaterials = (ids) => {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    const removed = materials.filter(m => idSet.has(m.id));
    if (removed.length === 0) return;
    const prevMaterials = materials, prevCart = cart, prevDraft = orderForm;
    saveMaterials(materials.filter(m => !idSet.has(m.id)));
    if (cart.items.some(it => it.kind === 'material' && idSet.has(it.id))) {
      saveCart({ ...cart, items: cart.items.filter(it => !(it.kind === 'material' && idSet.has(it.id))) });
    }
    pruneOrderDraftItems('material', idSet);
    queueUndo(`Deleted ${removed.length} ${removed.length === 1 ? 'supply' : 'supplies'}`, () => {
      saveMaterials(prevMaterials); saveCart(prevCart); setOrderForm(prevDraft);
    });
  };
  const bulkDeleteStores = (ids) => {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    const removed = (settings.stores || []).filter(s => idSet.has(s.id));
    if (removed.length === 0) return;
    // Cascade: also strip the matching tag names from materials & shopping trips
    // so they don't linger as ghost options in knownStoreTags after deletion.
    const removedNames = new Set(removed.map(s => (s.name || '').trim().toLowerCase()).filter(Boolean));
    const prevStores = settings.stores;
    const prevMaterials = materials;
    const prevShopping = shopping;
    const nextMaterials = materials.map(m => {
      if (!Array.isArray(m.storeTags)) return m;
      const filtered = m.storeTags.filter(t => !removedNames.has((t || '').trim().toLowerCase()));
      return filtered.length === m.storeTags.length ? m : { ...m, storeTags: filtered };
    });
    const nextShopping = shopping.map(s => {
      if (!Array.isArray(s.storeTags)) return s;
      const filtered = s.storeTags.filter(t => !removedNames.has((t || '').trim().toLowerCase()));
      return filtered.length === s.storeTags.length ? s : { ...s, storeTags: filtered };
    });
    const materialsChanged = nextMaterials.some((m, i) => m !== materials[i]);
    const shoppingChanged = nextShopping.some((s, i) => s !== shopping[i]);
    saveSettings({ ...settings, stores: (settings.stores || []).filter(s => !idSet.has(s.id)) });
    if (materialsChanged) saveMaterials(nextMaterials);
    if (shoppingChanged) saveShopping(nextShopping);
    queueUndo(`Deleted ${removed.length} ${removed.length === 1 ? 'store' : 'stores'}`, () => {
      saveSettings({ ...settings, stores: prevStores });
      if (materialsChanged) saveMaterials(prevMaterials);
      if (shoppingChanged) saveShopping(prevShopping);
    });
  };

  const resetOrderForm = () => {
    setOrderForm({
      customerName: '', arrangement: '', quantity: '1', costPer: '',
      paymentMethod: 'venmo', pickupDateTime: '', paid: false, notes: '', cardMessage: '', cardMessages: [], payments: [], additionalBouquets: [],
      eventType: 'general',
      enableReminders: settings.remindersDefault,
      items: [], extraCosts: [],
    });
    setEditingOrderId(null); setShowOrderForm(false);
    cartFinalizeRef.current = false;
  };
  // Hide-only close: preserves form state so reopening continues the draft.
  const closeOrderForm = () => { setShowOrderForm(false); };
  const hasOrderDraft = !!(
    (orderForm.customerName || '').trim()
    || (orderForm.arrangement || '').trim()
    || (orderForm.items && orderForm.items.length > 0)
    || (orderForm.cardMessage || '').trim()
    || (orderForm.notes || '').trim()
  );
  const defaultPickupISO = (defaultDate) => {
    const now = new Date();
    const base = defaultDate ? new Date(defaultDate) : new Date(now);
    base.setHours(settings.defaultPickupHour, settings.defaultPickupMinute, 0, 0);
    // If the chosen pickup time is already in the past, push it forward so the
    // datetime input (which has min=now) isn't pre-filled with an invalid value.
    if (base.getTime() < now.getTime()) {
      // Same calendar day with passed hour: round current time up to next 15min + 1h buffer.
      const isSameDay = base.getFullYear() === now.getFullYear()
        && base.getMonth() === now.getMonth()
        && base.getDate() === now.getDate();
      if (isSameDay) {
        const ms = now.getTime() + 60 * 60 * 1000;
        base.setTime(ms);
        const m = base.getMinutes();
        base.setMinutes(Math.ceil(m / 15) * 15, 0, 0);
      } else {
        // Past calendar day: snap to today at default hour (or tomorrow if today's already passed).
        base.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
        base.setHours(settings.defaultPickupHour, settings.defaultPickupMinute, 0, 0);
        if (base.getTime() < now.getTime()) base.setDate(base.getDate() + 1);
      }
    }
    const pad = x => String(x).padStart(2, '0');
    return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}T${pad(base.getHours())}:${pad(base.getMinutes())}`;
  };
  // "+ New order" jumps to Build with a fresh draft (or preserves an in-progress
  // one). The Build tab is now the order workflow — no separate modal.
  const startNewOrder = (defaultDate) => {
    // Preserve any in-progress draft (cart items + order fields) unless we're
    // editing — in that case clear and start clean with the default pickup time.
    if (editingOrderId) {
      setEditingOrderId(null);
      clearCart();
    }
    // Only seed pickupDateTime if it's empty or we have a defaultDate hint
    if (!orderForm.pickupDateTime || defaultDate) {
      setOrderForm({
        ...orderForm,
        pickupDateTime: defaultPickupISO(defaultDate),
      });
    }
    setActiveTab('build');
  };
  const startNewOrderFromCart = () => {
    // Leave arrangement name blank — she types her own label (the "Contains" chip shows the recipe).
    const arrangementText = '';
    const ranges = computeMaterialRanges(cart.items, flowers, materials, bouquets);
    const effMid = (ranges.effMin + ranges.effMax) / 2;
    const costPerStr = effMid > 0 ? effMid.toFixed(2) : '';
    // CRITICAL: orderForm.items is editable CART-shape, not stored SNAPSHOT-shape.
    // The form (RecipeEditor) renders items via picker/cart conventions:
    // { kind, id, qty, included, unitPriceOverride? }. Putting snapshots here
    // breaks bouquet rendering (kind survives but contents / unitMin / etc.
    // don't match cart fields, so bouquets get mis-rendered as "removed" rows)
    // and drops per-item price overrides. The snapshot only happens at save
    // time (submitOrderForm), so we must keep cart-shape until then.
    const editableItems = cart.items.map(item => ({
      kind: item.kind, id: item.id, qty: item.qty,
      included: item.included !== false,
      ...(typeof item.unitPriceOverride === 'number' && isFinite(item.unitPriceOverride)
        ? { unitPriceOverride: item.unitPriceOverride } : {}),
    }));
    setOrderForm({
      customerName: cart.customerName.trim(), arrangement: arrangementText,
      quantity: '1', costPer: costPerStr,
      paymentMethod: 'venmo', pickupDateTime: defaultPickupISO(),
      paid: false, notes: '', cardMessage: '', cardMessages: [], payments: [], additionalBouquets: [],
      eventType: 'general',
      enableReminders: settings.remindersDefault,
      items: editableItems,
      extraCosts: Array.isArray(cart.extraCosts) ? cart.extraCosts.map(e => ({ ...e })) : [],
    });
    setEditingOrderId(null);
    cartFinalizeRef.current = true;
    setShowOrderForm(true);
  };
  // Convert a stored order's snapshot items back to editable cart-shape.
  const orderItemsToCart = (o) => (Array.isArray(o.items) ? o.items : []).map(it => ({
    kind: it.kind, id: it.id, qty: it.qty, included: it.included !== false,
    ...(it.priceOverridden ? { unitPriceOverride: it.unitMin } : {}),
  }));
  const startEditOrder = (o) => {
    // Edit opens a modal overlay (the old popup) — quick edits without
    // navigating away. Cart + orderForm hold the data; modal renders the
    // editable fields. Save calls submitOrderForm; cancel clears state.
    saveCart({
      customerName: o.customerName || '',
      items: orderItemsToCart(o),
      extraCosts: Array.isArray(o.extraCosts) ? o.extraCosts.map(e => ({ ...e })) : [],
      discount: o.discount || null,
    });
    setOrderForm({
      customerName: o.customerName, arrangement: o.arrangement,
      quantity: o.quantity.toString(), costPer: o.costPer.toString(),
      paymentMethod: o.paymentMethod, pickupDateTime: o.pickupDateTime,
      paid: o.paid, notes: o.notes || '', cardMessage: o.cardMessage || '',
      cardMessages: Array.isArray(o.cardMessages) ? o.cardMessages.slice() : (o.cardMessage ? [o.cardMessage] : []),
      payments: Array.isArray(o.payments) ? o.payments.map(p => ({ ...p })) : [],
      additionalBouquets: Array.isArray(o.additionalBouquets) ? o.additionalBouquets.map(b => ({
        ...b, cardMessages: Array.isArray(b.cardMessages) ? b.cardMessages.slice() : [],
      })) : [],
      eventType: o.eventType || 'general',
      enableReminders: o.enableReminders !== false,
      items: [], extraCosts: [], // legacy fields, unused now (cart is source of truth)
    });
    setEditingOrderId(o.id);
    setShowOrderForm(true);
  };
  // Duplicate — same as edit but creates a new order with a fresh pickup date
  // and opens the same modal so she can confirm the date before saving.
  const startDuplicateOrder = (o) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(settings.defaultPickupHour ?? 14, settings.defaultPickupMinute ?? 0, 0, 0);
    const pad = x => String(x).padStart(2, '0');
    const freshPickup = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    saveCart({
      customerName: o.customerName || '',
      items: orderItemsToCart(o),
      extraCosts: Array.isArray(o.extraCosts) ? o.extraCosts.map(e => ({ ...e })) : [],
      discount: o.discount || null,
    });
    setOrderForm({
      customerName: o.customerName, arrangement: o.arrangement,
      quantity: o.quantity.toString(), costPer: o.costPer.toString(),
      paymentMethod: o.paymentMethod, pickupDateTime: freshPickup,
      paid: false, notes: o.notes || '', cardMessage: '',
      cardMessages: [], payments: [], additionalBouquets: [],
      eventType: o.eventType || 'general',
      enableReminders: settings.remindersDefault !== false,
      items: [], extraCosts: [],
    });
    setEditingOrderId(null);
    setShowOrderForm(true);
    showToast(`Duplicated "${o.customerName}". Set the pickup time and save.`, 'success');
  };
  // Save the Build tab as an order. Cart is the source of truth for items,
  // customer, and extras. orderForm holds the order-specific fields (date,
  // payment, notes, etc). Snapshot is the only place shape conversion happens.
  const submitOrderForm = () => {
    const customerName = (cart.customerName || '').trim();
    if (!customerName) {
      showToast("Customer name is required.");
      return;
    }
    if (!orderForm.pickupDateTime) {
      showToast("Pickup date & time is required.");
      return;
    }
    const qty = parseInt(orderForm.quantity);
    if (!qty || qty < 1) { showToast("Quantity must be at least 1."); return; }
    // Derive costPer from cart items via the effective midpoint so overrides
    // on individual items flow into the order's per-bouquet price. Discount
    // is applied AFTER (qty + extras) at the order level — see submitOrderForm
    // logic below — so costPer remains the per-arrangement material cost.
    let costPer = 0;
    {
      const { effMin, effMax, hasAny } = computeMaterialRanges(cart.items, flowers, materials, bouquets);
      if (hasAny) costPer = (effMin + effMax) / 2;
      else {
        const fallback = parseFloat(orderForm.costPer);
        if (isFinite(fallback) && fallback >= 0) costPer = fallback;
      }
    }
    if (isNaN(costPer) || costPer < 0) { showToast("Price must be a number."); return; }
    const existing = editingOrderId ? orders.find(o => o.id === editingOrderId) : null;
    // Snapshot items from cart (the editable source of truth).
    const snapshot = (cart.items || []).map(it => snapshotItem(it, flowers, materials, bouquets));
    const cleanExtras = (cart.extraCosts || [])
      .map(e => ({ label: (e.label || '').trim(), amount: parseFloat(e.amount) }))
      .filter(e => e.label && isFinite(e.amount) && e.amount > 0);
    // Payments + cards come in as the new shape; derive legacy fields
    // (paymentMethod, paid, cardMessage) from them so Sheets sync, receipts,
    // stats, and calendar export keep working without schema-aware rewrites.
    const cleanPayments = (Array.isArray(orderForm.payments) ? orderForm.payments : [])
      .map(p => ({
        id: p.id || `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        method: p.method || 'cash',
        amount: Number(p.amount) || 0,
        paid: !!p.paid,
        paidAt: p.paid ? (p.paidAt || new Date().toISOString()) : null,
      }))
      .filter(p => p.amount > 0 || p.paid);
    const cleanCards = (Array.isArray(orderForm.cardMessages) ? orderForm.cardMessages : [])
      .map(m => (m || '').trim()).filter(Boolean);
    // Clean additional bouquets — drop empty names, coerce numbers, strip
    // blank card messages. Order total then sums main qty×costPer plus
    // all additional bouquets (see orderTotal / additionalBouquetsSum).
    const cleanAdditionalBouquets = (Array.isArray(orderForm.additionalBouquets) ? orderForm.additionalBouquets : [])
      .map(b => ({
        id: b.id || `bq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: (b.name || '').trim(),
        recipientLabel: (b.recipientLabel || '').trim(),
        quantity: Number(b.quantity) || 0,
        costPer: Number(b.costPer) || 0,
        cardMessages: (Array.isArray(b.cardMessages) ? b.cardMessages : [])
          .map(m => (m || '').trim()).filter(Boolean),
      }))
      .filter(b => b.name || b.quantity > 0 || b.costPer > 0 || b.cardMessages.length > 0);
    const additionalTotal = cleanAdditionalBouquets.reduce((s, b) => s + b.quantity * b.costPer, 0);
    const totalForLegacy = qty * costPer + additionalTotal;
    const paidSum = cleanPayments.reduce((s, p) => s + (p.paid ? p.amount : 0), 0);
    const fullyPaid = cleanPayments.length > 0 && paidSum + 0.001 >= totalForLegacy;
    const legacyMethod = cleanPayments[0]?.method || orderForm.paymentMethod || 'cash';

    const entry = {
      id: editingOrderId || `ord-${Date.now()}`,
      customerName, arrangement: (orderForm.arrangement || '').trim(),
      quantity: qty, costPer, paymentMethod: legacyMethod,
      pickupDateTime: orderForm.pickupDateTime, paid: cleanPayments.length > 0 ? fullyPaid : !!orderForm.paid,
      notes: (orderForm.notes || '').trim() || undefined,
      cardMessage: cleanCards[0] || undefined,
      cardMessages: cleanCards.length > 0 ? cleanCards : undefined,
      payments: cleanPayments.length > 0 ? cleanPayments : undefined,
      additionalBouquets: cleanAdditionalBouquets.length > 0 ? cleanAdditionalBouquets : undefined,
      eventType: orderForm.eventType || 'general',
      enableReminders: orderForm.enableReminders,
      items: snapshot.length > 0 ? snapshot : undefined,
      extraCosts: cleanExtras.length > 0 ? cleanExtras : undefined,
      // Discount: { kind: 'flat'|'percent', value: number } or undefined.
      // Only persist if value > 0 — empty/null discounts shouldn't bloat data.
      discount: (cart.discount && Number(cart.discount.value) > 0)
        ? { kind: cart.discount.kind === 'percent' ? 'percent' : 'flat', value: Number(cart.discount.value) }
        : undefined,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    saveOrders(editingOrderId ? orders.map(o => o.id === editingOrderId ? entry : o) : [...orders, entry]);
    const wasEditing = !!editingOrderId;
    const wasInModal = showOrderForm;
    clearCart();
    resetOrderForm();
    setShowOrderForm(false);
    showToast(wasEditing ? `Updated "${customerName}".` : `Order saved for ${customerName}.`, 'success');
    // If she saved from the Build tab, drop her on Orders to confirm.
    // If she saved from the edit modal, stay on Orders (where she came from).
    if (!wasInModal) setActiveTab('orders');
    focusOrderRef.current = entry.id;
  };
  const deleteOrder = (id) => {
    const o = orders.find(x => x.id === id);
    if (!o) return;
    const prevOrders = orders;
    saveOrders(orders.filter(x => x.id !== id));
    queueUndo(`Deleted order for ${o.customerName || 'customer'}`, () => saveOrders(prevOrders));
  };
  // Quick one-tap toggle. If the order has a payments array, we flip every
  // payment's paid flag to match the target state — "fully paid" becomes
  // "all unpaid" and vice versa. For legacy orders (no payments array)
  // it's a simple boolean flip.
  const toggleOrderPaid = (id) => saveOrders(orders.map(o => {
    if (o.id !== id) return o;
    const payments = Array.isArray(o.payments) ? o.payments : [];
    if (payments.length === 0) return { ...o, paid: !o.paid };
    const nowPaid = !o.paid;
    const nowISO = new Date().toISOString();
    const totalAmount = (Number(o.quantity) || 0) * (Number(o.costPer) || 0);
    const currentSum = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    // If marking paid but payments don't sum to the order total, top up the
    // last payment so the order closes out cleanly. (Partial balance of a
    // side-entered payment shouldn't block "mark paid" on the card.)
    let nextPayments = payments.map(p => ({
      ...p, paid: nowPaid,
      paidAt: nowPaid ? (p.paidAt || nowISO) : null,
    }));
    if (nowPaid && currentSum + 0.001 < totalAmount && nextPayments.length > 0) {
      const last = nextPayments[nextPayments.length - 1];
      nextPayments[nextPayments.length - 1] = {
        ...last,
        amount: Number(last.amount) + (totalAmount - currentSum),
      };
    }
    return { ...o, paid: nowPaid, payments: nextPayments };
  }));

  // --- Bouquets ---
  const resetBouquetForm = () => {
    setBouquetForm({ name: '', fixedPrice: '', imageUrl: '', imagePosition: '50% 50%', imageZoom: 1, items: [] });
    setEditingBouquetId(null); setShowBouquetForm(false);
  };
  const startNewBouquet = () => {
    setBouquetForm({ name: '', fixedPrice: '', imageUrl: '', imagePosition: '50% 50%', imageZoom: 1, items: [] });
    setEditingBouquetId(null); setShowBouquetForm(true);
  };
  // Open the bouquet editor pre-filled with the loose cart items, so the user
  // can save the bouquet she's currently assembling as a reusable preset.
  // Bouquets can't nest inside bouquets (data rule), so we drop any cart rows
  // whose kind is 'bouquet' before seeding.
  const startBouquetFromCart = () => {
    const seedItems = (cart.items || [])
      .filter(it => it.kind === 'flower' || it.kind === 'material')
      .map(it => ({ kind: it.kind, id: it.id, qty: it.qty }));
    setBouquetForm({
      name: '', fixedPrice: '', imageUrl: '', imagePosition: '50% 50%', imageZoom: 1,
      items: seedItems,
    });
    setEditingBouquetId(null); setShowBouquetForm(true);
  };
  const startEditBouquet = (b) => {
    setBouquetForm({
      name: b.name || '',
      fixedPrice: b.fixedPrice != null ? String(b.fixedPrice) : '',
      imageUrl: b.imageUrl || '',
      imagePosition: b.imagePosition || '50% 50%',
      imageZoom: typeof b.imageZoom === 'number' && b.imageZoom > 0 ? b.imageZoom : 1,
      items: (b.items || []).map(it => ({ ...it })),
    });
    setEditingBouquetId(b.id); setShowBouquetForm(true);
  };
  const submitBouquetForm = () => {
    if (!bouquetForm.name.trim()) { showToast("Bouquets need a name."); return; }
    const priceNum = parseFloat(bouquetForm.fixedPrice);
    const hasFixedPrice = isFinite(priceNum) && priceNum >= 0 && (bouquetForm.fixedPrice || '').trim() !== '';
    const existing = editingBouquetId ? bouquets.find(b => b.id === editingBouquetId) : null;
    const entry = {
      id: editingBouquetId || `bq-${Date.now()}`,
      name: bouquetForm.name.trim(),
      ...(hasFixedPrice ? { fixedPrice: priceNum } : {}),
      imageUrl: bouquetForm.imageUrl || '',
      imagePosition: bouquetForm.imagePosition || '50% 50%',
      imageZoom: typeof bouquetForm.imageZoom === 'number' && bouquetForm.imageZoom > 0 ? bouquetForm.imageZoom : 1,
      items: (bouquetForm.items || []).map(it => ({
        kind: it.kind, id: it.id, qty: it.qty,
        included: it.included !== false,
        ...(typeof it.unitPriceOverride === 'number' && isFinite(it.unitPriceOverride)
          ? { unitPriceOverride: it.unitPriceOverride } : {}),
      })),
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    saveBouquets(editingBouquetId
      ? bouquets.map(b => b.id === editingBouquetId ? entry : b)
      : [...bouquets, entry]);
    resetBouquetForm();
  };
  const deleteBouquet = (id) => {
    const b = bouquets.find(x => x.id === id);
    if (!b) return;
    const prevBouquets = bouquets, prevCart = cart, prevDraft = orderForm;
    saveBouquets(bouquets.filter(x => x.id !== id));
    if (cart.items.some(it => it.kind === 'bouquet' && it.id === id)) {
      saveCart({ ...cart, items: cart.items.filter(it => !(it.kind === 'bouquet' && it.id === id)) });
    }
    pruneOrderDraftItems('bouquet', new Set([id]));
    queueUndo(`Deleted bouquet "${b.name}"`, () => {
      saveBouquets(prevBouquets); saveCart(prevCart); setOrderForm(prevDraft);
    });
  };
  const bulkDeleteBouquets = (ids) => {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    const removed = bouquets.filter(b => idSet.has(b.id));
    if (removed.length === 0) return;
    const prevBouquets = bouquets, prevCart = cart, prevDraft = orderForm;
    saveBouquets(bouquets.filter(b => !idSet.has(b.id)));
    if (cart.items.some(it => it.kind === 'bouquet' && idSet.has(it.id))) {
      saveCart({ ...cart, items: cart.items.filter(it => !(it.kind === 'bouquet' && idSet.has(it.id))) });
    }
    pruneOrderDraftItems('bouquet', idSet);
    queueUndo(`Deleted ${removed.length} ${removed.length === 1 ? 'bouquet' : 'bouquets'}`, () => {
      saveBouquets(prevBouquets); saveCart(prevCart); setOrderForm(prevDraft);
    });
  };
  // Add a bouquet to cart. If it has a fixedPrice it bundles as a single
  // 'bouquet' line (incrementing qty if already present). Otherwise its items
  // are loaded individually so the user can tweak per customer.
  const useBouquet = (bouquet) => {
    const hasFixedPrice = typeof bouquet.fixedPrice === 'number' && isFinite(bouquet.fixedPrice);
    if (hasFixedPrice) {
      const existing = cart.items.find(it => it.kind === 'bouquet' && it.id === bouquet.id);
      const nextItems = existing
        ? cart.items.map(it => (it.kind === 'bouquet' && it.id === bouquet.id) ? { ...it, qty: it.qty + 1 } : it)
        : [...cart.items, { kind: 'bouquet', id: bouquet.id, qty: 1, included: true }];
      saveCart({ ...cart, items: nextItems });
      setActiveTab('build');
      showToast(`Added "${bouquet.name}" to the cart.`, 'success');
    } else {
      // Merge the bouquet's items into the cart, summing qtys if they already exist.
      const items = [...cart.items];
      (bouquet.items || []).forEach(src => {
        const existing = items.find(it => it.kind === src.kind && it.id === src.id);
        if (existing) existing.qty += src.qty;
        else items.push({ ...src });
      });
      saveCart({ ...cart, items });
      setActiveTab('build');
      showToast(`Loaded "${bouquet.name}" items into the cart.`, 'success');
    }
  };

  // --- Shopping sessions ---
  const activeShopping = shopping.find(s => s.status === 'active') || null;
  const scheduledShopping = shopping.filter(s => s.status === 'scheduled')
    .sort((a, b) => (a.scheduledFor || '').localeCompare(b.scheduledFor || ''));
  const pastShopping = shopping.filter(s => s.status !== 'active' && s.status !== 'scheduled')
    .sort((a, b) => new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt));
  // Allow deleting custom material types (defaults stay locked)
  const DEFAULT_MATERIAL_KEYS = useMemo(() => new Set(DEFAULT_MATERIAL_TYPES.map(t => t.key)), []);
  const deleteMaterialType = (key) => {
    if (DEFAULT_MATERIAL_KEYS.has(key)) return; // can't delete defaults
    const t = (settings.materialTypes || []).find(x => x.key === key);
    if (!t) return;
    const prevTypes = settings.materialTypes;
    const prevMaterials = materials;
    // Reassign any materials of this type to 'other' (default)
    const reassigned = materials.map(m => m.type === key ? { ...m, type: 'other' } : m);
    saveSettings({ ...settings, materialTypes: (settings.materialTypes || []).filter(x => x.key !== key) });
    if (reassigned.some((m, i) => m !== materials[i])) saveMaterials(reassigned);
    queueUndo(`Removed type "${t.label}"`, () => {
      saveSettings({ ...settings, materialTypes: prevTypes });
      saveMaterials(prevMaterials);
    });
  };

  const knownStoreTags = useMemo(() => {
    const set = new Set();
    (settings.stores || []).forEach(s => s.name && set.add(s.name));
    shopping.forEach(s => (s.storeTags || []).forEach(t => t && set.add(t)));
    materials.forEach(m => (m.storeTags || []).forEach(t => t && set.add(t)));
    return [...set].sort();
  }, [settings.stores, shopping, materials]);
  // Adds a new store entry by name (kind defaults to physical) and returns the name as the tag.
  const addStoreTag = ({ label }) => {
    const t = (label || '').trim();
    if (!t) return null;
    const exists = (settings.stores || []).some(s => (s.name || '').toLowerCase() === t.toLowerCase());
    if (!exists) {
      const entry = { id: `store-${Date.now()}`, name: t, kind: 'physical' };
      saveSettings({ ...settings, stores: [...(settings.stores || []), entry] });
    }
    return t;
  };
  const addStore = (kind, fields = {}) => {
    const name = (fields.name || '').trim();
    if (!name) return null;
    const entry = {
      id: `store-${Date.now()}`,
      name, kind,
      address: fields.address?.trim() || undefined,
      url: fields.url?.trim() || undefined,
      notes: fields.notes?.trim() || undefined,
    };
    saveSettings({ ...settings, stores: [...(settings.stores || []), entry] });
    return entry.id;
  };
  const updateStore = (id, patch) => {
    const next = (settings.stores || []).map(s => s.id === id ? { ...s, ...patch } : s);
    saveSettings({ ...settings, stores: next });
  };
  const deleteStore = (id) => {
    const s = (settings.stores || []).find(x => x.id === id);
    if (!s) return;
    // Cascade: also strip the matching tag name from materials & shopping trips
    // so a deleted store's tag doesn't reappear from those sources.
    const lc = (s.name || '').trim().toLowerCase();
    const prevStores = settings.stores;
    const prevMaterials = materials;
    const prevShopping = shopping;
    const nextMaterials = lc ? materials.map(m => {
      if (!Array.isArray(m.storeTags)) return m;
      const filtered = m.storeTags.filter(t => (t || '').trim().toLowerCase() !== lc);
      return filtered.length === m.storeTags.length ? m : { ...m, storeTags: filtered };
    }) : materials;
    const nextShopping = lc ? shopping.map(x => {
      if (!Array.isArray(x.storeTags)) return x;
      const filtered = x.storeTags.filter(t => (t || '').trim().toLowerCase() !== lc);
      return filtered.length === x.storeTags.length ? x : { ...x, storeTags: filtered };
    }) : shopping;
    const materialsChanged = nextMaterials.some((m, i) => m !== materials[i]);
    const shoppingChanged = nextShopping.some((x, i) => x !== shopping[i]);
    saveSettings({ ...settings, stores: (settings.stores || []).filter(x => x.id !== id) });
    if (materialsChanged) saveMaterials(nextMaterials);
    if (shoppingChanged) saveShopping(nextShopping);
    queueUndo(`Deleted store "${s.name}"`, () => {
      saveSettings({ ...settings, stores: prevStores });
      if (materialsChanged) saveMaterials(prevMaterials);
      if (shoppingChanged) saveShopping(prevShopping);
    });
  };
  // Delete a store tag by its visible name (used by MultiTagDropdown's inline X).
  // Cascades across all three sources that contribute to knownStoreTags:
  // settings.stores, materials[].storeTags, and shopping[].storeTags. Without
  // this, a tag like "Costco" present on a material or trip would re-appear
  // even after deleting the store, because knownStoreTags aggregates all three.
  const deleteStoreTag = (name) => {
    const lc = (name || '').trim().toLowerCase();
    if (!lc) return;
    const prevSettings = settings;
    const prevMaterials = materials;
    const prevShopping = shopping;
    let storeRemoved = null;

    const nextStores = (settings.stores || []).filter(s => {
      const match = (s.name || '').trim().toLowerCase() === lc;
      if (match) storeRemoved = s;
      return !match;
    });
    const nextMaterials = materials.map(m => {
      if (!Array.isArray(m.storeTags)) return m;
      const filtered = m.storeTags.filter(t => (t || '').trim().toLowerCase() !== lc);
      return filtered.length === m.storeTags.length ? m : { ...m, storeTags: filtered };
    });
    const nextShopping = shopping.map(s => {
      if (!Array.isArray(s.storeTags)) return s;
      const filtered = s.storeTags.filter(t => (t || '').trim().toLowerCase() !== lc);
      return filtered.length === s.storeTags.length ? s : { ...s, storeTags: filtered };
    });

    const settingsChanged = nextStores.length !== (settings.stores || []).length;
    const materialsChanged = nextMaterials.some((m, i) => m !== materials[i]);
    const shoppingChanged = nextShopping.some((s, i) => s !== shopping[i]);

    if (settingsChanged) saveSettings({ ...settings, stores: nextStores });
    if (materialsChanged) saveMaterials(nextMaterials);
    if (shoppingChanged) saveShopping(nextShopping);

    if (settingsChanged || materialsChanged || shoppingChanged) {
      const label = storeRemoved ? `Deleted store "${storeRemoved.name}"` : `Removed tag "${name}"`;
      queueUndo(label, () => {
        if (settingsChanged) saveSettings(prevSettings);
        if (materialsChanged) saveMaterials(prevMaterials);
        if (shoppingChanged) saveShopping(prevShopping);
      });
    }
  };
  const startNewStore = (kind) => {
    setStoreForm({ id: null, name: '', kind: kind || 'physical', address: '', url: '', notes: '' });
    setShowStoreForm(true);
  };
  const startEditStore = (store) => {
    setStoreForm({
      id: store.id, name: store.name || '', kind: store.kind || 'physical',
      address: store.address || '', url: store.url || '', notes: store.notes || '',
    });
    setShowStoreForm(true);
  };
  const submitStoreForm = () => {
    const name = storeForm.name.trim();
    if (!name) { showToast('Store needs a name.'); return; }
    const fields = {
      name,
      address: storeForm.address.trim() || undefined,
      url: storeForm.url.trim() || undefined,
      notes: storeForm.notes.trim() || undefined,
    };
    if (storeForm.id) {
      updateStore(storeForm.id, { ...fields, kind: storeForm.kind });
    } else {
      addStore(storeForm.kind, fields);
    }
    setShowStoreForm(false);
  };

  const todayDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const startShoppingSession = () => {
    if (activeShopping) return; // already one
    const entry = {
      id: `shop-${Date.now()}`,
      name: '', storeTags: [], items: [],
      scheduledFor: todayDateStr(),
      status: 'active', notes: '',
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    saveShopping([...shopping, entry]);
  };
  const scheduleShoppingTrip = () => {
    const entry = {
      id: `shop-${Date.now()}`,
      name: '', storeTags: [], items: [],
      scheduledFor: todayDateStr(),
      status: 'scheduled', notes: '',
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    saveShopping([...shopping, entry]);
  };
  const startScheduledTrip = (id) => {
    if (activeShopping) return; // only one active at a time
    saveShopping(shopping.map(s => s.id === id
      ? { ...s, status: 'active', startedAt: new Date().toISOString() }
      : s));
  };
  // Cancel an active trip — flip back to "scheduled" so progress is preserved
  // (checked items stay checked) and she can start it again later. We don't
  // delete; the discard trash icon up top handles full removal.
  const cancelActiveTrip = (id) => {
    saveShopping(shopping.map(s => s.id === id
      ? { ...s, status: 'scheduled', startedAt: null }
      : s));
  };
  // Auto-build a scheduled trip from every order in the next 14 days.
  // Walks order.items, expands bouquet snapshots into their flowers/materials,
  // and sums per-item quantities (multiplied by order.quantity, since items[]
  // describes one arrangement). Resolves names from the current catalog so a
  // renamed flower shows its latest name on the trip list.
  const buildRestockTrip = () => {
    const now = Date.now();
    // Horizon comes from settings (default 14 days). Clamped to 1-90 to keep
    // the aggregation sane.
    const horizonDays = Math.min(90, Math.max(1, parseInt(settings.restockHorizonDays) || 14));
    const horizon = now + horizonDays * 24 * 60 * 60 * 1000;
    const upcoming = orders.filter(o => {
      if (!o.pickupDateTime) return false;
      const t = new Date(o.pickupDateTime).getTime();
      return t >= now && t <= horizon;
    });
    if (upcoming.length === 0) {
      showToast(`No upcoming orders in the next ${horizonDays} day${horizonDays === 1 ? '' : 's'}.`, 'error');
      return;
    }
    const aggregated = new Map();
    const bumpKey = (kind, id, name, addQty, customerName, orderId) => {
      if (!addQty || addQty <= 0) return;
      const key = `${kind}:${id}`;
      const cur = aggregated.get(key) || { kind, id, name, qty: 0, forOrders: new Map() };
      cur.qty += addQty;
      // forOrders: orderId → customerName, so we can show "for Sarah, Maria"
      // on the trip line and tap-to-jump back to the originating order.
      if (orderId && customerName && !cur.forOrders.has(orderId)) {
        cur.forOrders.set(orderId, customerName);
      }
      aggregated.set(key, cur);
    };
    // Track every upcoming customer name regardless of whether their order
    // has tracked items. Even if Maria's order is just an arrangement label
    // with no items snapshot, we still want her in the customer rail so she
    // shows up as someone the user is shopping for (count 0 — they can tag
    // items to her manually).
    const allCustomers = new Set();
    for (const order of upcoming) {
      const orderQty = Math.max(1, parseInt(order.quantity) || 1);
      const cust = (order.customerName || '').trim();
      if (cust) allCustomers.add(cust);
      for (const item of (order.items || [])) {
        if (item.included === false) continue;
        if (item.kind === 'bouquet') {
          for (const sub of (item.contents || [])) {
            bumpKey(sub.kind, sub.id, sub.name, (sub.qty || 0) * (item.qty || 1) * orderQty, cust, order.id);
          }
        } else {
          bumpKey(item.kind, item.id, item.name, (item.qty || 0) * orderQty, cust, order.id);
        }
      }
    }
    // Even if no orders had tracked items, we still create the trip — the
    // user can manually add items and have all upcoming customers visible
    // in the rail to organize against.
    const noItemsAtAll = aggregated.size === 0;
    // Resolve current names; sort flowers above materials, then by name.
    const tripItems = Array.from(aggregated.values())
      .map((agg) => {
        const ref = agg.kind === 'flower'
          ? (flowers || []).find(x => x.id === agg.id)
          : (materials || []).find(x => x.id === agg.id);
        const name = ref?.name || agg.name || 'Item';
        return {
          kind: agg.kind, name, qty: agg.qty,
          forCustomers: Array.from(agg.forOrders.values()),
          forOrderIds: Array.from(agg.forOrders.keys()),
        };
      })
      .sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === 'flower' ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .map((it, i) => ({
        id: `si-${Date.now()}-${i}`,
        label: `${it.qty} ${it.name}`,
        forCustomers: it.forCustomers,
        forOrderIds: it.forOrderIds,
        qty: 1, unit: '', checked: false,
      }));
    const defaultStores = Array.isArray(settings.restockDefaultStores) ? [...settings.restockDefaultStores] : [];
    // Name encodes both the order count AND the horizon end date (computed
    // from "now" = the moment she taps Build). So the name is a dated
    // snapshot — useful when multiple restock trips coexist or when she
    // looks back at past trips.
    const horizonEnd = new Date(now + horizonDays * 24 * 60 * 60 * 1000);
    const horizonEndLabel = horizonEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const orderLabel = `${upcoming.length} order${upcoming.length === 1 ? '' : 's'}`;
    const entry = {
      id: `shop-${Date.now()}`,
      name: `Restock · ${orderLabel} through ${horizonEndLabel}`,
      storeTags: defaultStores,
      items: tripItems,
      // Every upcoming customer goes here — even those whose orders had no
      // tracked items. The rail merges this with item-derived customers so
      // Maria Lopez shows up even if her order is just an arrangement name.
      extraCustomers: Array.from(allCustomers),
      scheduledFor: todayDateStr(),
      status: 'scheduled',
      notes: noItemsAtAll
        ? `Auto-built from ${upcoming.length} upcoming order${upcoming.length === 1 ? '' : 's'} (next ${horizonDays} day${horizonDays === 1 ? '' : 's'}). None tracked specific items — add what you need manually.`
        : `Auto-built from upcoming orders (next ${horizonDays} day${horizonDays === 1 ? '' : 's'}). Tap any line to tweak.`,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    saveShopping([...shopping, entry]);
    showToast(noItemsAtAll
      ? `Built a trip for ${upcoming.length} customer${upcoming.length === 1 ? '' : 's'}. Add items manually.`
      : `Built a trip with ${tripItems.length} item${tripItems.length === 1 ? '' : 's'}.`, 'success');
  };
  const updateShoppingSession = (id, patch) => {
    saveShopping(shopping.map(s => s.id === id ? { ...s, ...patch } : s));
  };
  const addShoppingItem = (id, item) => {
    const session = shopping.find(s => s.id === id); if (!session) return;
    // Collapse duplicates at the point of adding — if an unchecked row with
    // the same noun AND the same customer tagging already exists, bump its
    // qty and merge prices instead of appending a second row. Keeps the trip
    // tidy when she re-adds the same flower mid-shop.
    const parseQtyNoun = (label) => {
      const m = (label || '').trim().match(/^(\d+)\s+(.+)$/);
      if (!m) return { qty: 1, noun: (label || '').trim().toLowerCase() };
      return { qty: parseInt(m[1]) || 1, noun: m[2].trim().toLowerCase() };
    };
    const tagKey = (arr) => Array.isArray(arr) && arr.length > 0
      ? [...arr].map(s => (s || '').toLowerCase()).sort().join('|')
      : '';
    const incomingParsed = parseQtyNoun(item.label || '');
    const incomingTag = tagKey(item.forCustomers);
    const items = session.items || [];
    const matchIdx = items.findIndex(ex => {
      if (ex.checked) return false;
      if (tagKey(ex.forCustomers) !== incomingTag) return false;
      const exParsed = parseQtyNoun(ex.label || '');
      return exParsed.noun && exParsed.noun === incomingParsed.noun;
    });
    if (matchIdx >= 0 && incomingParsed.noun) {
      const existing = items[matchIdx];
      const existingParsed = parseQtyNoun(existing.label || '');
      const newQty = existingParsed.qty + incomingParsed.qty;
      const newLabel = newQty > 1 ? `${newQty} ${existingParsed.noun === incomingParsed.noun ? (existing.label.match(/^\d+\s+(.+)$/)?.[1] || incomingParsed.noun) : incomingParsed.noun}` : incomingParsed.noun;
      const existingPrice = typeof existing.price === 'number' ? existing.price : 0;
      const incomingPrice = typeof item.price === 'number' ? item.price : 0;
      const mergedPrice = (existingPrice + incomingPrice) || null;
      const mergedOrderIds = Array.from(new Set([
        ...(Array.isArray(existing.forOrderIds) ? existing.forOrderIds : []),
        ...(Array.isArray(item.forOrderIds) ? item.forOrderIds : []),
      ]));
      const next = items.map((it, i) => i === matchIdx ? {
        ...it,
        label: newLabel,
        ...(mergedPrice != null ? { price: mergedPrice } : {}),
        ...(mergedOrderIds.length > 0 ? { forOrderIds: mergedOrderIds } : {}),
      } : it);
      updateShoppingSession(id, { items: next });
      return;
    }
    const next = [...items, { id: `si-${Date.now()}`, label: '', qty: 1, unit: '', checked: false, ...item }];
    updateShoppingSession(id, { items: next });
  };
  const updateShoppingItem = (sessionId, itemId, patch) => {
    const session = shopping.find(s => s.id === sessionId); if (!session) return;
    const next = (session.items || []).map(it => it.id === itemId ? { ...it, ...patch } : it);
    updateShoppingSession(sessionId, { items: next });
  };
  const removeShoppingItem = (sessionId, itemId) => {
    const session = shopping.find(s => s.id === sessionId); if (!session) return;
    const next = (session.items || []).filter(it => it.id !== itemId);
    updateShoppingSession(sessionId, { items: next });
  };
  const completeShoppingSession = (id) => {
    saveShopping(shopping.map(s => s.id === id
      ? { ...s, status: 'done', completedAt: new Date().toISOString() }
      : s));
  };
  // Clones a past (or scheduled) trip into a fresh scheduled trip for today:
  // same items + store tags, everything unchecked, no completion stamp. Lets
  // her re-shop a recurring list with one tap.
  const duplicateShoppingTrip = (sourceId) => {
    const source = shopping.find(x => x.id === sourceId);
    if (!source) return;
    const cloned = {
      id: `shop-${Date.now()}`,
      name: source.name ? `${source.name} (again)` : 'Repeat trip',
      storeTags: Array.isArray(source.storeTags) ? [...source.storeTags] : [],
      extraCustomers: Array.isArray(source.extraCustomers) ? [...source.extraCustomers] : [],
      items: (source.items || []).map((it, i) => ({
        ...it,
        id: `si-${Date.now()}-${i}`,
        checked: false,
      })),
      notes: source.notes || '',
      scheduledFor: todayDateStr(),
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    saveShopping([...shopping, cloned]);
    showToast(`Scheduled a repeat trip with ${cloned.items.length} item${cloned.items.length === 1 ? '' : 's'}.`, 'success');
  };

  const deleteShoppingSession = (id) => {
    const s = shopping.find(x => x.id === id);
    if (!s) return;
    const prev = shopping;
    saveShopping(shopping.filter(x => x.id !== id));
    queueUndo(`Deleted trip "${s.name || 'Untitled'}"`, () => saveShopping(prev));
  };

  const exportOrderToCalendar = (order) => {
    downloadICS([order], settings, `pickup-${sanitizeFilename(order.customerName)}.ics`);
  };
  const exportAllUpcomingToCalendar = () => {
    const now = new Date();
    const upcoming = orders.filter(o => new Date(o.pickupDateTime) >= now);
    if (upcoming.length === 0) return;
    const date = new Date().toISOString().split('T')[0];
    downloadICS(upcoming, settings, `${sanitizeFilename(settings.businessName)}-orders-${date}.ics`);
  };

  const logPrice = (flowerId, entry) => {
    const next = flowers.map(f => {
      if (f.id !== flowerId) return f;
      const updated = { ...f, priceHistory: [entry, ...(f.priceHistory || [])] };
      if (entry.bunchPrice !== undefined) { updated.bunchPrice = entry.bunchPrice; updated.bunchCount = entry.bunchCount; }
      else if (entry.flatMin !== undefined) { updated.flatMin = entry.flatMin; updated.flatMax = entry.flatMax; }
      return updated;
    });
    saveFlowers(next);
  };
  const deleteHistoryEntry = (flowerId, entryIndex) => {
    const next = flowers.map(f => {
      if (f.id !== flowerId) return f;
      const nh = [...(f.priceHistory || [])]; nh.splice(entryIndex, 1);
      return { ...f, priceHistory: nh };
    });
    saveFlowers(next);
  };
  const toggleHistory = (id) => setExpandedHistory(h => ({ ...h, [id]: !h[id] }));
  const setCartQty = (kind, id, n) => {
    const q = Math.max(0, n);
    const existing = cart.items.find(it => it.kind === kind && it.id === id);
    let nextItems;
    if (q === 0) {
      nextItems = cart.items.filter(it => !(it.kind === kind && it.id === id));
    } else if (existing) {
      nextItems = cart.items.map(it => (it.kind === kind && it.id === id) ? { ...it, qty: q } : it);
    } else {
      nextItems = [...cart.items, { kind, id, qty: q, included: true }];
    }
    saveCart({ ...cart, items: nextItems });
  };
  const setCartIncluded = (kind, id, included) => {
    const nextItems = cart.items.map(it =>
      (it.kind === kind && it.id === id) ? { ...it, included } : it
    );
    saveCart({ ...cart, items: nextItems });
  };
  const setCartPriceOverride = (kind, id, value) => {
    const nextItems = cart.items.map(it => {
      if (!(it.kind === kind && it.id === id)) return it;
      const { unitPriceOverride: _drop, ...rest } = it;
      if (value === '' || value == null) return rest;
      const num = parseFloat(value);
      if (!isFinite(num) || num < 0) return rest;
      return { ...rest, unitPriceOverride: num };
    });
    saveCart({ ...cart, items: nextItems });
  };
  const setCartCustomerName = (name) => saveCart({ ...cart, customerName: name });
  const setCartExtras = (extras) => saveCart({ ...cart, extraCosts: extras });
  // Discount on the cart/order — { kind: 'flat' | 'percent', value: number }.
  // Applies to the customer total in PricingPanel and persists on save.
  const setCartDiscount = (discount) => saveCart({ ...cart, discount });
  const clearCart = () => saveCart({ customerName: '', items: [], customerPrice: '', extraCosts: [], discount: null });

  const cartTotals = () => {
    let min = 0, max = 0, includedCount = 0, totalCount = 0;
    cart.items.forEach(item => {
      totalCount += item.qty;
      if (!item.included) return;
      const hasOverride = typeof item.unitPriceOverride === 'number' && isFinite(item.unitPriceOverride);
      if (item.kind === 'flower') {
        const f = flowers.find(x => x.id === item.id);
        if (!f) return;
        if (hasOverride) {
          const p = item.unitPriceOverride * item.qty;
          min += p; max += p;
        } else if (f.mode === 'perStem') {
          const p = (f.bunchPrice / f.bunchCount) * item.qty; min += p; max += p;
        } else {
          min += f.flatMin * item.qty; max += f.flatMax * item.qty;
        }
      } else {
        const m = materials.find(x => x.id === item.id);
        if (!m) return;
        const p = (hasOverride ? item.unitPriceOverride : (m.unitPrice || 0)) * item.qty;
        min += p; max += p;
      }
      includedCount += item.qty;
    });
    return { min, max, includedCount, totalCount };
  };
  const fmt = (n) => `$${n.toFixed(2)}`;
  const { min, max, totalCount: cartCount } = cartTotals();

  const upcomingOrderCount = useMemo(() => {
    const now = new Date();
    return orders.filter(o => new Date(o.pickupDateTime) >= now).length;
  }, [orders]);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: '"Inter", sans-serif', paddingBottom: '120px' }}>
      <style>{FONTS + `
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background: ${C.bg}; font-family: 'Inter', sans-serif; }
        .serif { font-family: 'Playfair Display', serif; }
        .italic { font-family: 'Playfair Display', serif; font-style: italic; }
        input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        .tab-btn { transition: all 180ms ease; }
        .tab-btn:hover { background: ${C.borderSoft}; }
        .flower-card, .material-card, .order-card { transition: box-shadow 160ms ease, border-color 160ms ease; }
        .flower-card:hover, .order-card:hover { box-shadow: 0 8px 24px rgba(42,53,40,0.08); }
        .material-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(42,53,40,0.08); }
        .icon-btn { transition: all 150ms ease; }
        .icon-btn:hover { background: ${C.borderSoft}; }
        .qty-btn { transition: all 150ms ease; }
        .qty-btn:hover:not(:disabled) { background: ${C.sageDeep}; transform: scale(1.08); }
        .qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .primary-btn { transition: all 180ms ease; }
        .primary-btn:hover { background: ${C.sageDeep}; transform: translateY(-1px); }
        .log-btn { transition: all 180ms ease; }
        .log-btn:hover { background: ${C.gold}; color: ${C.card}; transform: translateY(-1px); border-color: ${C.gold}; }
        .history-row { transition: background 140ms ease; }
        .history-row:hover { background: ${C.bgDeep}; }
        .lookup-btn { transition: all 160ms ease; }
        .lookup-btn:hover:not(:disabled) { background: ${C.ink}; color: ${C.card}; }
        .text-input { transition: border-color 160ms ease, background 160ms ease; }
        .text-input:focus { outline: none; border-color: ${C.sageDeep}; background: ${C.card}; }
        /* Hide browser-native "X" on type=search so SearchBar's own clear button
           doesn't double up. */
        .text-input[type="search"]::-webkit-search-cancel-button,
        .text-input[type="search"]::-webkit-search-decoration { -webkit-appearance: none; appearance: none; }
        .note-chip, .payment-chip { transition: all 140ms ease; }
        .note-chip:hover { background: ${C.sage}; color: ${C.card}; border-color: ${C.sage}; }
        .transfer-btn { transition: all 180ms ease; }
        .transfer-btn:hover { background: ${C.ink}; color: ${C.card}; transform: translateY(-1px); }
        .swatch-btn { transition: transform 140ms ease, box-shadow 140ms ease; cursor: pointer; }
        .swatch-btn:hover { transform: scale(1.12); z-index: 2; box-shadow: 0 4px 14px rgba(42,53,40,0.15); }
        .type-filter { transition: all 140ms ease; }
        .type-filter:hover { background: ${C.borderSoft}; }
        .cal-day { transition: all 140ms ease; cursor: pointer; }
        .cal-day:hover { background: ${C.bgDeep}; }
        .cal-export-btn { transition: all 180ms ease; }
        .cal-export-btn:hover { background: ${C.ink}; color: ${C.card}; border-color: ${C.ink}; }
        .cal-action-btn { transition: all 180ms ease; }
        .cal-action-btn:hover { background: ${C.sage}22; border-color: ${C.sageDeep}; color: ${C.sageDeep}; }
        .danger-btn { transition: all 180ms ease; }
        .danger-btn:hover { background: ${C.roseDeep}; color: ${C.card}; border-color: ${C.roseDeep}; }
        .desc-clamp { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 260ms ease; }
        @keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 500px; } }
        .slide-down { animation: slideDown 280ms ease; overflow: hidden; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        .modal-content { animation: scaleIn 220ms ease; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 900ms linear infinite; }
        /* Subtle pulsing glow — used by the "Start trip" CTA so a scheduled
           trip ready to go gently draws the eye without being distracting. */
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(91, 121, 83, 0.0); }
          50% { box-shadow: 0 0 0 5px rgba(91, 121, 83, 0.22); }
        }
        .pulse-glow { animation: pulseGlow 2200ms ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .pulse-glow { animation: none; } }

        /* Subtle hover lift — applied to interactive cards. Only on devices
           that can hover (skips touch). Brings the card forward 1px with a
           soft shadow so it feels tactile without being distracting. */
        @media (hover: hover) {
          .flower-card, .order-card, .material-card {
            transition: transform 180ms ease, box-shadow 180ms ease;
          }
          .flower-card:hover, .order-card:hover, .material-card:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 14px rgba(42,53,40,0.08);
          }
        }
        /* Button press feedback — gentle scale-down on active state. */
        button { transition: transform 100ms ease; }
        button:active:not(:disabled) { transform: scale(0.97); }
        @media (prefers-reduced-motion: reduce) {
          .flower-card, .order-card, .material-card,
          .flower-card:hover, .order-card:hover, .material-card:hover,
          button, button:active { transition: none; transform: none; box-shadow: none; }
        }
        /* Counter up animation — when a price changes, fade the new value in
           briefly. Apply via key prop on parent to retrigger. */
        @keyframes valueChange {
          0% { opacity: 0.4; transform: translateY(2px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .value-change { animation: valueChange 220ms ease-out; }

        /* Build (cart) layout: stacked on phones, two-column on \u2265720px */
        .build-grid { display: flex; flex-direction: column; gap: 16px; }
        .build-side-only-desktop { display: none; }
        .build-mobile-footer { display: block; }
        /* Mobile: keep the picker items list within ~half the viewport so the
           page stays short enough that the sticky Customer-Pays footer stays
           visible while she scrolls through flowers. */
        .build-picker-scroll {
          max-height: 55vh;
          overflow-y: auto;
          padding-right: 4px;
        }
        /* Hide scrollbars on the build panels — content still scrolls. */
        .build-picker-scroll, .build-side {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .build-picker-scroll::-webkit-scrollbar,
        .build-side::-webkit-scrollbar { display: none; width: 0; height: 0; }
        /* Generic invisible-scrollbar utility — used by trip card columns
           so each side scrolls independently without showing a track. */
        .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; width: 0; height: 0; }
        /* Desktop: Shopping trip card gets a taller fixed height so more
           items show before she has to scroll. Mobile keeps the 620px
           inline cap. */
        @media (min-width: 880px) {
          .trip-card {
            height: min(880px, calc(100vh - 80px)) !important;
          }
        }

        /* Page entrance — subtle stagger on the top-level chrome as the
           app hydrates. Plays once per page load. Disabled under
           prefers-reduced-motion. Desktop gets a slightly longer offset
           since the motion reads better on a bigger canvas. */
        @keyframes entranceUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .app-header { animation: entranceUp 360ms ease-out both; }
        .app-tabs   { animation: entranceUp 360ms ease-out 80ms both; }
        .app-main   { animation: entranceUp 420ms ease-out 140ms both; }
        @media (prefers-reduced-motion: reduce) {
          .app-header, .app-tabs, .app-main {
            animation: none !important;
          }
        }
        /* Breakpoint raised to 880px (matches main content max-width) so
           the 2-column layout only kicks in when there's actually room for
           both columns — at 720px, the side column was so narrow that the
           Order details grid overflowed and content got clipped. */
        @media (min-width: 880px) {
          .build-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            gap: 24px;
            align-items: start;
          }
          /* DOM order is side-first (mobile-friendly); grid flips columns on desktop. */
          /* Both columns lock to the viewport on desktop and scroll internally
             so the page itself stays put — picker's items list scrolls below
             its sticky search/tabs, side column's order details scroll below
             customer + arrangement. */
          .build-picker {
            grid-column: 1; grid-row: 1; min-width: 0;
            position: sticky;
            top: 16px;
            max-height: calc(100vh - 32px);
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          .build-picker-scroll {
            flex: 1; min-height: 0;
            max-height: none;
          }
          .build-side {
            grid-column: 2; grid-row: 1;
            position: sticky;
            top: 16px;
            max-height: calc(100vh - 32px);
            overflow-y: auto;
            overflow-x: hidden;
            display: flex;
            flex-direction: column;
            gap: 14px;
            min-width: 0;
          }
          .build-side-only-desktop { display: flex; }
          .build-mobile-footer { display: none; }
        }

        /* Print styles: when printing, hide everything except the receipt body. */
        @media print {
          /* Margin 0 on the page suppresses the browser-injected date/URL/page-number headers. */
          @page { margin: 0; }
          /* Force colored backgrounds (sage/gold tints, card cream) to render on paper. */
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            background: #ffffff !important; margin: 0 !important; padding: 0 !important;
            color: #2A3528 !important;
          }
          /* Neutralize the App container so its cream bg + min-height don't bleed onto the page */
          body > #root, body > #root > div {
            background: #ffffff !important;
            min-height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print { display: none !important; }
          .receipt-overlay {
            position: static !important; background: #ffffff !important;
            padding: 14mm 12mm !important; backdrop-filter: none !important; inset: auto !important;
            display: block !important; min-height: auto !important;
          }
          .receipt-printable {
            box-shadow: none !important; max-height: none !important;
            max-width: 480px !important; border-radius: 0 !important;
            margin: 0 auto !important;
            background: #ffffff !important;
            border: 1px solid #D9CEB6 !important;
          }
          /* Hide app shell while printing */
          body > #root > div > header,
          body > #root > div > main,
          body > #root > div > nav,
          body > #root > div > div:not(.receipt-overlay) {
            display: none !important;
          }
        }

        /* Narrow-phone overrides. Targets viewports <=500px so cards, tabs,
           and chrome stop fighting for horizontal space on real phones. */
        @media (max-width: 500px) {
          .app-header { padding: 18px 12px 10px !important; }
          .app-tabs { padding: 0 12px 12px !important; }
          .app-main { padding: 16px 12px !important; }
          .tab-btn {
            font-size: 13px !important;
            padding: 10px 4px !important;
            gap: 3px !important;
          }
          /* Flower/bouquet card thumbnails: from ~28% down to a tight fixed
             size so the text column has room to wrap at readable widths. */
          .card-thumb { width: 68px !important; }
          /* Pencil/trash/etc. — tighter padding so they stop eating card width. */
          .icon-btn { padding: 7px !important; }
          /* Build picker sub-tabs — same cramping story as the main tabs. */
          .build-sub-tabs button {
            font-size: 12px !important;
            padding: 8px 4px !important;
            gap: 3px !important;
          }
          /* Lift the scroll-to-top FAB above the Build sticky footer. */
          .fab-top { bottom: 100px !important; }
          /* Calendar: tighten padding and cell text so 7 days fit comfortably. */
          .cal-wrap { padding: 10px !important; }
          .cal-day { padding: 2px 1px !important; }
          .cal-day-num { font-size: 12px !important; }
          .cal-day-time { font-size: 8px !important; margin-top: 1px !important; }
          /* Restock (Shopping tab): stack customer filter above items so
             item names aren't squished by the side rail. Rail becomes a
             horizontal scroll-chip bar on top. */
          .restock-grid {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          .restock-rail {
            flex-direction: row !important;
            overflow-x: auto !important;
            overflow-y: visible !important;
            padding-right: 0 !important;
            border-right: none !important;
            padding-bottom: 4px !important;
            flex-shrink: 0;
          }
          .restock-rail button {
            flex-shrink: 0;
            justify-content: flex-start !important;
            gap: 6px !important;
            padding: 7px 11px !important;
          }
          /* The rail's "Customer" label becomes a chip too — keep it compact. */
          .restock-rail > div:first-child {
            padding: 8px 6px 8px 0 !important;
            align-self: center;
          }
        }

        /* Ultra-narrow tier for the smallest phones (iPhone SE 1st-gen and
           below, old Androids). Falls back gracefully from the 500px tier. */
        @media (max-width: 380px) {
          .app-header { padding: 14px 10px 8px !important; }
          .app-tabs { padding: 0 10px 10px !important; }
          .app-main { padding: 12px 10px !important; }
          .tab-btn {
            font-size: 11px !important;
            padding: 9px 2px !important;
            letter-spacing: -0.01em !important;
          }
          .card-thumb { width: 56px !important; }
          .build-sub-tabs button { font-size: 11px !important; padding: 7px 2px !important; }
          /* Calendar at this width: drop the time label entirely, just the dot. */
          .cal-wrap { padding: 8px !important; }
          .cal-day-num { font-size: 11px !important; }
          .cal-day-time { display: none !important; }
        }
      `}</style>

      {/* Sticky chrome: business header + tab strip stay pinned to the top
          while the page scrolls. Solid bg so cards scroll cleanly beneath. */}
      <div ref={chromeRef} style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: C.bg,
        borderBottom: `1px solid ${C.borderSoft}`,
      }}>
      <header className="app-header" style={{ padding: '24px 20px 14px', maxWidth: '880px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <div style={{ width: '40px', height: '40px', background: C.sageDeep, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Leaf size={20} color={C.card} strokeWidth={1.5} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="serif" style={{
              fontSize: settings.businessName.length > 16 ? '27px' : '31px',
              fontWeight: 500, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.05,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {settings.businessName || 'Petal & Stem'}
            </h1>
          </div>
          {!isOnline && (
            <div title="Offline — changes will sync when reconnected" style={{
              padding: '6px 10px', borderRadius: '20px',
              background: `${C.gold}1f`, color: C.gold,
              display: 'flex', alignItems: 'center', gap: '5px',
              fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em',
              border: `1px solid ${C.gold}66`,
            }}><WifiOff size={13} strokeWidth={2} /> Offline</div>
          )}
          <button className="transfer-btn" onClick={() => setShowStats(true)} title="Stats"
            style={{
              padding: '10px', background: C.card, border: `1px solid ${C.border}`,
              borderRadius: '10px', color: C.inkSoft, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
            <TrendingUp size={16} strokeWidth={1.8} />
          </button>
          <button className="transfer-btn" onClick={() => setShowSettings(true)} title="Settings"
            style={{
              padding: '10px', background: C.card, border: `1px solid ${C.border}`,
              borderRadius: '10px', color: C.inkSoft, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
            <Settings size={16} strokeWidth={1.8} />
          </button>
          <button className="transfer-btn" onClick={() => setShowTransfer(true)} title="Transfer data between devices"
            style={{
              padding: '10px', background: C.card, border: `1px solid ${C.border}`,
              borderRadius: '10px', color: C.inkSoft, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
            <ArrowLeftRight size={16} strokeWidth={1.8} />
          </button>
        </div>
        <p className="italic" style={{ color: C.inkSoft, fontSize: '17px', margin: '0 0 0 52px', fontWeight: 400 }}>
          a little pricing ledger for florists
        </p>
      </header>

      <div className="app-tabs" style={{ maxWidth: '880px', margin: '0 auto', padding: '0 20px 14px' }}>
        <div style={{ display: 'flex', gap: '3px', background: C.bgDeep, padding: '3px', borderRadius: '11px' }}>
          <TabButton active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} label="Flowers" />
          <TabButton active={activeTab === 'materials'} onClick={() => setActiveTab('materials')} label="Supplies" />
          <TabButton active={activeTab === 'build'} onClick={() => setActiveTab('build')} label="Build" badge={cartCount > 0 ? cartCount : null} />
          <TabButton active={activeTab === 'shopping'} onClick={() => setActiveTab('shopping')} label="Shopping" badge={activeShopping ? (activeShopping.items || []).filter(it => !it.checked).length || null : null} />
          <TabButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} label="Orders" badge={upcomingOrderCount > 0 ? upcomingOrderCount : null} />
        </div>
      </div>
      </div>

      <main className="app-main" style={{ maxWidth: '880px', margin: '0 auto', padding: '20px' }}>
        {/* Backup nudge — gentle reminder when she's accumulated meaningful
            data (>5 orders) and hasn't backed up in a while. Dismiss defers
            the next nudge for 7 days. */}
        {!loading && (() => {
          if (orders.length <= 5) return null;
          const now = Date.now();
          const exportedAt = lastExport ? new Date(lastExport).getTime() : 0;
          const dismissedAt = settings.lastBackupNudgeAt ? new Date(settings.lastBackupNudgeAt).getTime() : 0;
          const stale = !exportedAt || (now - exportedAt) > (30 * 24 * 60 * 60 * 1000);
          const dismissedRecently = dismissedAt && (now - dismissedAt) < (7 * 24 * 60 * 60 * 1000);
          if (!stale || dismissedRecently) return null;
          return (
            <div style={{
              marginBottom: '14px', padding: '12px 14px',
              background: `${C.gold}15`, border: `1px solid ${C.gold}66`,
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <Download size={16} color={C.gold} strokeWidth={2} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: C.ink }}>
                  It's been a while since your last backup
                </div>
                <div style={{ fontSize: '12px', color: C.inkSoft, lineHeight: 1.4 }}>
                  Your data lives on this device. Tap Transfer (top right) to back it up.
                </div>
              </div>
              <button onClick={() => saveSettings({ ...settings, lastBackupNudgeAt: new Date().toISOString() })}
                aria-label="Dismiss" style={{
                  background: 'transparent', border: 'none', padding: '6px',
                  cursor: 'pointer', color: C.inkSoft,
                  display: 'flex', alignItems: 'center',
                }}><X size={14} /></button>
            </div>
          );
        })()}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: C.inkSoft }}>Loading your garden…</div>
        ) : activeTab === 'inventory' ? (
          <InventoryView
            flowers={flowers} expandedHistory={expandedHistory}
            bouquets={bouquets}
            materials={materials}
            onAdd={() => { resetForm(); setShowForm(true); }}
            onEdit={startEdit} onDelete={deleteFlower}
            onBulkDelete={bulkDeleteFlowers}
            onLog={(f) => setLoggingFlower(f)}
            onToggleHistory={toggleHistory}
            onDeleteHistoryEntry={deleteHistoryEntry}
            onCreateBouquet={startNewBouquet}
            onEditBouquet={startEditBouquet}
            onDeleteBouquet={deleteBouquet}
            onBulkDeleteBouquet={bulkDeleteBouquets}
            onUseBouquet={useBouquet}
          />
        ) : activeTab === 'build' ? (
          <CartView
            cart={cart} flowers={flowers} materials={materials} bouquets={bouquets}
            orders={orders} settings={settings}
            totals={cartTotals()}
            setQty={setCartQty}
            setIncluded={setCartIncluded}
            setPriceOverride={setCartPriceOverride}
            setCustomerName={setCartCustomerName}
            setExtras={setCartExtras}
            setDiscount={setCartDiscount}
            clearCart={clearCart}
            orderForm={orderForm} setOrderForm={setOrderForm} editingOrderId={editingOrderId}
            onAddNewFlower={() => { resetForm(); setShowForm(true); }}
            onAddNewMaterial={() => { resetMaterialForm(); setShowMaterialForm(true); }}
            onAddNewBouquet={startNewBouquet}
            onSaveAsBouquet={startBouquetFromCart}
            onAddEventType={({ label, color }) => {
              const key = `evt-${Date.now()}`;
              const next = [...(settings.eventTypes || DEFAULT_EVENT_TYPES), { key, label, color: color || '#8FA68B' }];
              saveSettings({ ...settings, eventTypes: next });
              return key;
            }}
            onAddPaymentMethod={({ label }) => {
              const key = `pay-${Date.now()}`;
              const next = [...(settings.paymentMethods || DEFAULT_PAYMENT_METHODS), { key, label, color: '#8FA68B' }];
              saveSettings({ ...settings, paymentMethods: next });
              return key;
            }}
            onSaveOrder={() => submitOrderForm()}
            onCancelEdit={() => { setEditingOrderId(null); clearCart(); resetOrderForm(); }}
            onSwitchToInventory={() => setActiveTab('inventory')}
          />
        ) : activeTab === 'materials' ? (
          <MaterialsView
            materials={materials} settings={settings}
            onAdd={() => { resetMaterialForm(); setShowMaterialForm(true); }}
            onEdit={startEditMaterial} onDelete={deleteMaterial}
            onBulkDelete={bulkDeleteMaterials}
            onDeleteType={deleteMaterialType}
            onAddStore={startNewStore}
            onEditStore={startEditStore}
            onDeleteStore={deleteStore}
            onBulkDeleteStore={bulkDeleteStores}
          />
        ) : activeTab === 'shopping' ? (
          <ShoppingView
            active={activeShopping}
            scheduled={scheduledShopping}
            past={pastShopping}
            flowers={flowers} materials={materials} bouquets={bouquets}
            orders={orders} settings={settings}
            knownStoreTags={knownStoreTags}
            onAddStoreTag={addStoreTag}
            onDeleteStoreTag={deleteStoreTag}
            onStart={startShoppingSession}
            onSchedule={scheduleShoppingTrip}
            onStartScheduled={startScheduledTrip}
            onCancelActive={cancelActiveTrip}
            onRestock={buildRestockTrip}
            onUpdate={updateShoppingSession}
            onAddItem={addShoppingItem}
            onUpdateItem={updateShoppingItem}
            onRemoveItem={removeShoppingItem}
            onComplete={completeShoppingSession}
            onDelete={deleteShoppingSession}
            onDuplicate={duplicateShoppingTrip}
            onCreateFlower={quickCreateFlower}
            onCreateMaterial={quickCreateMaterial}
            showToast={showToast}
          />
        ) : (
          <OrdersView
            orders={orders} settings={settings} upcomingCount={upcomingOrderCount}
            focusOrderId={focusOrderRef.current}
            onClearFocus={() => { focusOrderRef.current = null; }}
            onAdd={(d) => startNewOrder(d)}
            onEdit={startEditOrder} onDuplicate={startDuplicateOrder} onDelete={deleteOrder}
            onTogglePaid={toggleOrderPaid}
            onExportOrder={exportOrderToCalendar}
            onExportAllUpcoming={exportAllUpcomingToCalendar}
          />
        )}
      </main>

      {showForm && (
        <FlowerFormModal form={form} setForm={setForm} editingId={editingId} lookupState={lookupState}
          onLookup={doLookup} onCancel={resetForm} onSubmit={submitForm} />
      )}
      {showMaterialForm && (
        <MaterialFormModal form={materialForm} setForm={setMaterialForm} editingId={editingMaterialId}
          settings={settings}
          knownStoreTags={knownStoreTags}
          onAddStoreTag={addStoreTag}
          onDeleteStoreTag={deleteStoreTag}
          onAddMaterialType={({ label }) => {
            const key = `mt-${Date.now()}`;
            const next = [...(settings.materialTypes || DEFAULT_MATERIAL_TYPES), { key, label }];
            saveSettings({ ...settings, materialTypes: next });
            return key;
          }}
          onCancel={resetMaterialForm} onSubmit={submitMaterialForm} />
      )}
      {/* Editing modal — restored for quick edits from the Orders tab.
          Reads cart + orderForm state directly so it shares the same source
          of truth as the merged Build flow. */}
      {showOrderForm && (
        <EditOrderModal
          cart={cart} orderForm={orderForm} setOrderForm={setOrderForm}
          orders={orders} settings={settings}
          flowers={flowers} materials={materials} bouquets={bouquets}
          editingOrderId={editingOrderId}
          setCustomerName={setCartCustomerName}
          setQty={setCartQty} setIncluded={setCartIncluded}
          setPriceOverride={setCartPriceOverride}
          setExtras={setCartExtras}
          setDiscount={setCartDiscount}
          onAddEventType={({ label, color }) => {
            const key = `evt-${Date.now()}`;
            const next = [...(settings.eventTypes || DEFAULT_EVENT_TYPES), { key, label, color: color || '#8FA68B' }];
            saveSettings({ ...settings, eventTypes: next });
            return key;
          }}
          onAddPaymentMethod={({ label }) => {
            const key = `pay-${Date.now()}`;
            const next = [...(settings.paymentMethods || DEFAULT_PAYMENT_METHODS), { key, label, color: '#8FA68B' }];
            saveSettings({ ...settings, paymentMethods: next });
            return key;
          }}
          onSubmit={submitOrderForm}
          onCancel={() => { setShowOrderForm(false); setEditingOrderId(null); clearCart(); resetOrderForm(); }}
        />
      )}
      {showBouquetForm && (
        <BouquetFormModal form={bouquetForm} setForm={setBouquetForm} editingId={editingBouquetId}
          flowers={flowers} materials={materials} bouquets={bouquets}
          onAddNewFlower={() => { resetForm(); setShowForm(true); }}
          onAddNewMaterial={() => { resetMaterialForm(); setShowMaterialForm(true); }}
          onCancel={resetBouquetForm} onSubmit={submitBouquetForm}
          showToast={showToast} />
      )}
      {showStoreForm && (
        <StoreFormModal form={storeForm} setForm={setStoreForm}
          onCancel={() => setShowStoreForm(false)}
          onSubmit={submitStoreForm} />
      )}
      {loggingFlower && (
        <LogPriceModal flower={loggingFlower} recentNotes={recentNotes}
          onCancel={() => setLoggingFlower(null)}
          onSave={(entry) => { logPrice(loggingFlower.id, entry); setLoggingFlower(null); }}
        />
      )}
      {showTransfer && (
        <TransferModal flowers={flowers} materials={materials} orders={orders} settings={settings}
          lastExport={lastExport} onClose={() => setShowTransfer(false)}
          onExported={markExported} onImport={handleImport} />
      )}
      {showSettings && (
        <SettingsModal settings={settings} onSave={saveSettings} onClearAll={clearAllData}
          onClose={() => setShowSettings(false)}
          permState={permState}
          onEnableNotifications={handleEnableNotifications}
          onTestNotification={handleTestNotification}
          sheetsState={sheetsState}
          isOnline={isOnline}
          onConnectSheets={handleConnectSheets}
          onDisconnectSheets={handleDisconnectSheets}
          onManualSync={handleManualSync}
          getSheetUrl={getSheetUrl}
          driveState={driveState}
          onPullFromDrive={handlePullFromDrive}
        />
      )}
      {showStats && (
        <StatsOverlay onClose={() => setShowStats(false)}>
          <StatsView
            orders={orders}
            shopping={shopping}
            settings={settings}
            onViewReceipt={(o) => setReceiptOrderId(o.id)}
            onUndoReset={() => saveSettings({ ...settings, statsResetAt: null })}
          />
        </StatsOverlay>
      )}
      {receiptOrderId && (() => {
        const order = orders.find(o => o.id === receiptOrderId);
        if (!order) return null;
        return (
          <ReceiptModal order={order} settings={settings} bouquets={bouquets}
            flowers={flowers} materials={materials}
            onClose={() => setReceiptOrderId(null)}
            onEdit={() => { setReceiptOrderId(null); startEditOrder(order); }}
          />
        );
      })()}
      <UndoSnackbar undo={pendingUndo} onUndo={runUndo} onDismiss={commitUndo} />
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <ScrollToTop />
      {restoreOffer && (
        <RestoreOfferModal offer={restoreOffer}
          onAccept={handleAcceptRestore} onDecline={handleDeclineRestore} />
      )}
      {!loading && !settings.onboardingComplete && (
        <OnboardingModal
          settings={settings}
          onSave={saveSettings}
          onDone={() => saveSettings({ ...settings, onboardingComplete: true })}
        />
      )}
    </div>
  );
}

function UndoSnackbar({ undo, onUndo, onDismiss }) {
  const [progress, setProgress] = useState(100);
  useEffect(() => {
    if (!undo) return;
    setProgress(100);
    const start = Date.now();
    const total = 10000;
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / total) * 100);
      setProgress(pct);
      if (pct <= 0) clearInterval(tick);
    }, 100);
    return () => clearInterval(tick);
  }, [undo && undo.id]);

  if (!undo) return null;

  return (
    <div role="status" aria-live="polite" style={{
      position: 'fixed', left: '50%', bottom: '24px', transform: 'translateX(-50%)',
      maxWidth: 'calc(100% - 32px)', minWidth: '280px', zIndex: 95,
      background: C.ink, color: C.card,
      borderRadius: '12px', overflow: 'hidden',
      boxShadow: '0 12px 32px rgba(42,53,40,0.35)',
      display: 'flex', flexDirection: 'column',
      animation: 'fadeIn 200ms ease',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 14px', fontFamily: 'inherit', fontSize: '14px',
      }}>
        <Trash2 size={15} strokeWidth={2} color={C.gold} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, lineHeight: 1.4 }}>{undo.label}</div>
        <button onClick={onUndo} style={{
          background: 'transparent', border: `1px solid ${C.inkFaint}`, padding: '6px 12px',
          borderRadius: '8px', color: C.card, fontFamily: 'inherit', fontSize: '12px',
          fontWeight: 600, cursor: 'pointer', letterSpacing: '0.04em',
        }}>UNDO</button>
        <button onClick={onDismiss} aria-label="Dismiss" style={{
          background: 'transparent', border: 'none', color: C.card, opacity: 0.6,
          padding: '4px', borderRadius: '6px', cursor: 'pointer',
          display: 'flex', alignItems: 'center',
        }}><X size={14} /></button>
      </div>
      <div style={{ height: '3px', background: `${C.inkFaint}66` }}>
        <div style={{
          width: `${progress}%`, height: '100%', background: C.gold,
          transition: 'width 100ms linear',
        }} />
      </div>
    </div>
  );
}

// 3-step welcome shown once on first launch (or until "Get started" is tapped).
// Sits over everything else with a high z-index. Each step is skippable so the
// user can bail and explore on her own; "Skip for now" on any step finishes.
function OnboardingModal({ settings, onSave, onDone }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(settings.businessName || '');

  const finish = () => onDone();
  const next = () => setStep(s => Math.min(2, s + 1));

  const saveName = () => {
    const clean = (name || '').trim() || 'My florals';
    onSave({ ...settings, businessName: clean });
    next();
  };

  // Two-step welcome: 1) set the business name (the only thing the app
  // can't infer), 2) a visual tour of the tabs so she knows where things
  // live. No required actions, no chance of getting stuck on an empty
  // catalog. Skippable from any step.
  const tourItems = [
    { icon: Flower2, label: 'Flowers', desc: 'Stems & their prices' },
    { icon: Tag, label: 'Supplies', desc: 'Wraps, ribbons, vases' },
    { icon: Sheet, label: 'Build', desc: 'Make a custom order' },
    { icon: Tag, label: 'Shopping', desc: 'Plan wholesaler trips' },
    { icon: CalendarDays, label: 'Orders', desc: 'Calendar of pickups' },
  ];
  const steps = [
    {
      icon: <Leaf size={22} color={C.card} strokeWidth={1.6} />,
      title: 'Welcome',
      body: 'Two quick steps. You can change anything later in Settings.',
      content: (
        <div>
          <div style={{
            fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: C.inkFaint, marginBottom: '6px',
          }}>Your business name</div>
          <input type="text" value={name} autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') saveName(); }}
            placeholder="e.g. Rosie's Flowers"
            maxLength={40}
            style={{
              width: '100%', padding: '12px 14px', fontSize: '16px', fontFamily: 'inherit',
              background: C.bg, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.ink,
            }} />
          <div style={{ fontSize: '12px', color: C.inkFaint, marginTop: '8px', lineHeight: 1.5 }}>
            Shows in the header and on calendar exports.
          </div>
        </div>
      ),
      primaryLabel: 'Continue',
      onPrimary: saveName,
    },
    {
      icon: <Sheet size={22} color={C.card} strokeWidth={1.6} />,
      title: "What's here",
      body: "We've seeded a few flowers, supplies, and a sample bouquet so you can poke around right away.",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {tourItems.map(({ icon: Icon, label, desc }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', background: C.bg, borderRadius: '10px',
            }}>
              <div style={{
                width: '30px', height: '30px', background: `${C.sage}33`, borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={15} color={C.sageDeep} strokeWidth={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: C.ink }}>{label}</div>
                <div style={{ fontSize: '12px', color: C.inkSoft, lineHeight: 1.3 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      ),
      primaryLabel: 'Got it',
      onPrimary: finish,
    },
  ];

  const cur = steps[step];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(42,53,40,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      // zIndex 45 — under form modals (70) and most overlays (50). When the
      // user taps a primary CTA we open a deeper modal on top; closing it
      // brings them back to the onboarding's next step.
      padding: '20px', zIndex: 45, backdropFilter: 'blur(4px)',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: C.card, borderRadius: '16px',
        width: '100%', maxWidth: '460px',
        boxShadow: '0 20px 60px rgba(42,53,40,0.3)',
        overflow: 'hidden',
      }}>
        {/* Step pips */}
        <div style={{
          display: 'flex', gap: '4px', padding: '14px 22px 0',
        }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: '3px', borderRadius: '2px',
              background: i <= step ? C.sageDeep : `${C.border}`,
              transition: 'background 200ms ease',
            }} />
          ))}
        </div>

        <div style={{ padding: '22px 24px 18px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px',
          }}>
            <div style={{
              width: '40px', height: '40px', background: C.sageDeep, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>{cur.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 className="serif" style={{
                fontSize: '20px', margin: 0, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.2,
              }}>{cur.title}</h2>
              <div style={{
                fontSize: '11px', color: C.inkFaint, marginTop: '2px',
                fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>Step {step + 1} of {steps.length}</div>
            </div>
          </div>
          <div style={{
            fontSize: '14px', color: C.inkSoft, lineHeight: 1.55, marginBottom: '16px',
          }}>{cur.body}</div>
          {cur.content}
        </div>

        <div style={{
          padding: '14px 22px', borderTop: `1px solid ${C.borderSoft}`,
          display: 'flex', gap: '10px', alignItems: 'center',
        }}>
          <button onClick={finish} style={{
            background: 'transparent', border: 'none', padding: '10px 4px',
            color: C.inkSoft, fontFamily: 'inherit', fontSize: '13px', fontWeight: 500,
            cursor: 'pointer',
          }}>Skip for now</button>
          <div style={{ flex: 1 }} />
          {step > 0 && (
            <button onClick={() => setStep(s => Math.max(0, s - 1))} style={{
              padding: '10px 14px', background: 'transparent', border: `1px solid ${C.border}`,
              borderRadius: '10px', color: C.inkSoft, fontFamily: 'inherit', fontSize: '13px',
              fontWeight: 500, cursor: 'pointer',
            }}>Back</button>
          )}
          {step < steps.length - 1 && step > 0 && (
            <button onClick={next} style={{
              padding: '10px 16px', background: C.bg, border: `1px solid ${C.border}`,
              borderRadius: '10px', color: C.inkSoft, fontFamily: 'inherit', fontSize: '13px',
              fontWeight: 600, cursor: 'pointer',
            }}>Next</button>
          )}
          <button onClick={cur.onPrimary} className="primary-btn" style={{
            padding: '10px 18px', background: C.sageDeep, border: 'none',
            borderRadius: '10px', color: C.card, fontFamily: 'inherit', fontSize: '13px',
            fontWeight: 600, cursor: 'pointer',
          }}>{cur.primaryLabel}</button>
        </div>
      </div>
    </div>
  );
}

// Floating "back to top" button — appears once the user has scrolled past
// ~320px on the main window. Sits bottom-right, out of the way of the bottom-
// center toast/snackbar. Smooth-scrolls to top on tap. Works for every tab
// since all tab views share the page's main scroll.
function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const goTop = () => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };
  return (
    <button onClick={goTop}
      aria-label="Back to top" title="Back to top"
      className="fab-top"
      style={{
        position: 'fixed', right: '18px', bottom: '24px', zIndex: 90,
        width: '44px', height: '44px', borderRadius: '12px',
        background: C.ink, color: C.card, border: `1.5px solid ${C.card}`,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 20px rgba(42,53,40,0.28)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 180ms ease, transform 180ms ease',
      }}>
      <ArrowUp size={20} strokeWidth={2.4} />
    </button>
  );
}

// Shown after "Connect Google" when a newer backup exists in her Drive
// (typical case: she signed in on a new device). Gives her a chance to
// pull it down before she makes local changes that would get pushed on
// top of the existing backup.
function RestoreOfferModal({ offer, onAccept, onDecline }) {
  const when = offer?.exportedAt ? new Date(offer.exportedAt) : null;
  const whenText = when ? when.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }) : 'unknown';
  const counts = offer?.data ? {
    flowers: (offer.data.flowers || []).length,
    materials: (offer.data.materials || []).length,
    orders: (offer.data.orders || []).length,
  } : null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(42,53,40,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', zIndex: 80, backdropFilter: 'blur(4px)',
    }}>
      <div className="modal-content" style={{
        background: C.card, borderRadius: '16px', padding: '24px',
        width: '100%', maxWidth: '440px',
        boxShadow: '0 20px 60px rgba(42,53,40,0.25)',
      }}>
        <h2 className="serif" style={{ fontSize: '22px', margin: '0 0 6px', fontWeight: 500, letterSpacing: '-0.01em' }}>
          Backup found in your Drive
        </h2>
        <div style={{ fontSize: '13px', color: C.inkSoft, lineHeight: 1.5, marginBottom: '14px' }}>
          A backup from <strong>{whenText}</strong> is waiting. Restore it to this device?
        </div>
        {counts && (
          <div style={{
            fontSize: '12px', color: C.inkFaint, background: C.bgDeep,
            padding: '10px 12px', borderRadius: '8px', marginBottom: '18px',
            letterSpacing: '0.02em',
          }}>
            {counts.flowers} flower{counts.flowers === 1 ? '' : 's'} · {counts.materials} suppl{counts.materials === 1 ? 'y' : 'ies'} · {counts.orders} order{counts.orders === 1 ? '' : 's'}
          </div>
        )}
        <div style={{
          fontSize: '12px', color: C.inkSoft, background: `${C.gold}1a`,
          padding: '10px 12px', borderRadius: '8px', marginBottom: '18px',
          lineHeight: 1.5,
        }}>
          Restoring <strong>replaces</strong> what's currently on this device. Skip if this device already has the data you want.
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onDecline} style={{
            padding: '10px 16px', background: 'transparent',
            border: `1px solid ${C.border}`, borderRadius: '10px',
            color: C.inkSoft, fontFamily: 'inherit', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
          }}>Skip</button>
          <button onClick={onAccept} className="primary-btn" style={{
            padding: '10px 18px', background: C.sageDeep, border: 'none', borderRadius: '10px',
            color: C.card, fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <Download size={14} strokeWidth={2.2} /> Restore
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  if (!toast) return null;
  const isError = toast.kind === 'error';
  return (
    <div role="status" aria-live="polite" style={{
      position: 'fixed', left: '50%', bottom: '24px', transform: 'translateX(-50%)',
      maxWidth: 'calc(100% - 32px)', minWidth: '260px', zIndex: 100,
      background: isError ? C.roseDeep : C.sageDeep, color: C.card,
      padding: '12px 16px', borderRadius: '12px',
      boxShadow: '0 12px 32px rgba(42,53,40,0.3)',
      display: 'flex', alignItems: 'center', gap: '10px',
      animation: 'fadeIn 200ms ease',
      fontFamily: 'inherit', fontSize: '14px', fontWeight: 500,
    }}>
      {isError ? <AlertCircle size={16} strokeWidth={2.2} /> : <Check size={16} strokeWidth={2.4} />}
      <div style={{ flex: 1, lineHeight: 1.4 }}>{toast.msg}</div>
      <button onClick={onDismiss} aria-label="Dismiss" style={{
        background: 'transparent', border: 'none', color: C.card, opacity: 0.8,
        padding: '4px', borderRadius: '6px', cursor: 'pointer',
        display: 'flex', alignItems: 'center',
      }}><X size={14} /></button>
    </div>
  );
}

function TabButton({ active, onClick, label, badge }) {
  return (
    <button className="tab-btn" onClick={onClick} style={{
      flex: 1, padding: '10px 6px', borderRadius: '9px', border: 'none',
      background: active ? C.card : 'transparent',
      color: active ? C.ink : C.inkSoft,
      fontFamily: 'inherit', fontSize: '16px', fontWeight: active ? 600 : 500, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
      boxShadow: active ? '0 2px 6px rgba(42,53,40,0.06)' : 'none',
      position: 'relative', minWidth: 0,
    }}>
      {label}
      {badge != null && (
        <span style={{
          background: C.roseDeep, color: C.card, fontSize: '10px', fontWeight: 600,
          padding: '1px 5px', borderRadius: '9px', minWidth: '16px', textAlign: 'center',
        }}>{badge}</span>
      )}
    </button>
  );
}

// Editor for split payments — method + amount + paid toggle per row.
// Order total and outstanding balance are derived on the fly so she can
// see exactly how much is still owed without doing math in her head.
function PaymentsEditor({ payments, onChange, total, paymentMethods }) {
  const rows = Array.isArray(payments) ? payments : [];
  const paid = rows.reduce((s, p) => s + (p.paid ? (Number(p.amount) || 0) : 0), 0);
  const allPaidAmount = rows.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const outstanding = Math.max(0, (Number(total) || 0) - paid);

  const updateRow = (i, patch) => {
    const next = rows.map((r, idx) => idx === i ? { ...r, ...patch } : r);
    onChange(next);
  };
  const removeRow = (i) => onChange(rows.filter((_, idx) => idx !== i));
  const addRow = () => {
    const remaining = (Number(total) || 0) - allPaidAmount;
    const suggested = remaining > 0.005 ? Math.round(remaining * 100) / 100 : 0;
    onChange([
      ...rows,
      { id: `pay-${Date.now()}-${rows.length}`, method: rows[0]?.method || (paymentMethods[0]?.key || 'cash'), amount: suggested, paid: false, paidAt: null },
    ]);
  };

  return (
    <div>
      {rows.length === 0 && (
        <div style={{
          padding: '12px', background: C.bg, border: `1px dashed ${C.border}`,
          borderRadius: '8px', fontSize: '12px', color: C.inkFaint, marginBottom: '8px',
          fontStyle: 'italic',
        }}>No payments yet. Tap + to add one.</div>
      )}
      {rows.map((row, i) => (
        <div key={row.id || i} style={{
          display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px',
          padding: '10px', background: C.bg, border: `1px solid ${C.borderSoft}`, borderRadius: '10px',
        }}>
          <TypeDropdown
            value={row.method || 'cash'} options={paymentMethods}
            onChange={(key) => updateRow(i, { method: key })}
            showColor placeholder="Method"
          />
          <div style={{ position: 'relative', flex: '0 0 95px' }}>
            <span style={{
              position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
              fontSize: '13px', color: C.inkFaint, pointerEvents: 'none',
            }}>$</span>
            <input className="text-input" type="number" inputMode="decimal" step="0.01" min="0"
              value={row.amount ?? ''}
              onChange={(e) => updateRow(i, { amount: e.target.value === '' ? '' : parseFloat(e.target.value) })}
              placeholder="0.00"
              style={{ ...inputStyle(), padding: '8px 8px 8px 22px', fontSize: '13px', width: '100%' }} />
          </div>
          <button onClick={() => updateRow(i, {
            paid: !row.paid,
            paidAt: !row.paid ? new Date().toISOString() : null,
          })}
            aria-label={row.paid ? 'Mark unpaid' : 'Mark paid'}
            style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: row.paid ? C.sageDeep : C.card,
              border: `1.5px solid ${row.paid ? C.sageDeep : C.border}`,
              cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            {row.paid && <Check size={16} strokeWidth={2.4} color={C.card} />}
          </button>
          <button onClick={() => removeRow(i)} aria-label="Remove payment" style={{
            background: 'transparent', border: 'none', padding: '6px',
            cursor: 'pointer', color: C.inkFaint, flexShrink: 0,
          }}><X size={14} /></button>
        </div>
      ))}
      <button onClick={addRow} style={{
        padding: '8px 12px', background: 'transparent',
        border: `1px dashed ${C.border}`, borderRadius: '8px',
        color: C.inkSoft, fontFamily: 'inherit', fontSize: '12px',
        fontWeight: 500, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: '6px',
      }}><Plus size={13} strokeWidth={2} /> Add payment</button>
      {rows.length > 0 && (
        <div style={{
          marginTop: '10px', padding: '8px 12px',
          background: outstanding > 0.005 ? `${C.gold}22` : `${C.sage}22`,
          border: `1px solid ${outstanding > 0.005 ? C.gold : C.sageDeep}44`,
          borderRadius: '8px', fontSize: '12px', color: C.inkSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
        }}>
          <span>Paid: <strong style={{ color: C.ink }}>${paid.toFixed(2)}</strong> of ${(Number(total) || 0).toFixed(2)}</span>
          {outstanding > 0.005 && (
            <span style={{ color: C.gold, fontWeight: 600 }}>
              ${outstanding.toFixed(2)} outstanding
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Editor for extra bouquets within a single order — each row has its
// own name, optional recipient label, qty, price, and card messages.
// Separate from the main arrangement (which has the full recipe editor)
// so mixed orders like weddings can have 5 centerpieces + 2 bridesmaid
// bouquets + 1 bridal bouquet as distinct line items without rebuilding
// the whole form.
function AdditionalBouquetsEditor({ bouquets, onChange }) {
  const rows = Array.isArray(bouquets) ? bouquets : [];
  const update = (i, patch) => onChange(rows.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  const remove = (i) => onChange(rows.filter((_, idx) => idx !== i));
  const add = () => onChange([
    ...rows,
    {
      id: `bq-${Date.now()}-${rows.length}`,
      name: '', recipientLabel: '',
      quantity: 1, costPer: 0,
      cardMessages: [],
    },
  ]);

  return (
    <div>
      {rows.map((row, i) => {
        const qty = Number(row.quantity) || 0;
        const price = Number(row.costPer) || 0;
        const lineTotal = qty * price;
        return (
          <div key={row.id || i} style={{
            padding: '12px', background: C.bg,
            border: `1px solid ${C.borderSoft}`, borderRadius: '10px',
            marginBottom: '10px',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '8px',
            }}>
              <div style={{
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: C.inkFaint,
              }}>Bouquet #{i + 2}</div>
              <button onClick={() => remove(i)} aria-label="Remove bouquet" style={{
                background: 'transparent', border: 'none', padding: '4px',
                cursor: 'pointer', color: C.inkFaint,
              }}><X size={14} /></button>
            </div>
            <input className="text-input" type="text" value={row.name || ''}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="Bouquet name (e.g. Centerpiece)"
              style={{ ...inputStyle(), marginBottom: '6px' }} />
            <input className="text-input" type="text" value={row.recipientLabel || ''}
              onChange={(e) => update(i, { recipientLabel: e.target.value })}
              placeholder="For (optional) — e.g. Maid of honor"
              style={{ ...inputStyle(), marginBottom: '8px', fontSize: '13px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr auto', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <input className="text-input" type="number" min="1" value={row.quantity ?? ''}
                onChange={(e) => update(i, { quantity: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                placeholder="Qty"
                style={{ ...inputStyle(), fontSize: '13px', padding: '8px' }} />
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                  fontSize: '13px', color: C.inkFaint, pointerEvents: 'none',
                }}>$</span>
                <input className="text-input" type="number" inputMode="decimal" step="0.01" min="0"
                  value={row.costPer ?? ''}
                  onChange={(e) => update(i, { costPer: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                  placeholder="0.00"
                  style={{ ...inputStyle(), padding: '8px 8px 8px 22px', fontSize: '13px' }} />
              </div>
              <div style={{
                fontSize: '13px', fontWeight: 600, color: C.sageDeep,
                minWidth: '60px', textAlign: 'right',
              }}>${lineTotal.toFixed(2)}</div>
            </div>
            <div style={{
              fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: C.inkFaint, marginBottom: '4px',
            }}>Cards for this bouquet</div>
            <CardMessagesEditor
              cardMessages={row.cardMessages || []}
              onChange={(next) => update(i, { cardMessages: next })}
            />
          </div>
        );
      })}
      <button onClick={add} style={{
        padding: '10px 14px', background: 'transparent',
        border: `1px dashed ${C.border}`, borderRadius: '10px',
        color: C.inkSoft, fontFamily: 'inherit', fontSize: '13px',
        fontWeight: 500, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: '6px',
      }}><Plus size={14} strokeWidth={2} /> Add another bouquet</button>
    </div>
  );
}

// Editor for multiple card messages — one textarea per note card, with
// + to add another and × to remove. Empty cards are fine in the editor;
// submitOrderForm filters them before saving.
function CardMessagesEditor({ cardMessages, onChange }) {
  const rows = Array.isArray(cardMessages) ? cardMessages : [];
  const updateRow = (i, v) => onChange(rows.map((m, idx) => idx === i ? v : m));
  const removeRow = (i) => onChange(rows.filter((_, idx) => idx !== i));
  const addRow = () => onChange([...rows, '']);
  return (
    <div>
      {rows.length === 0 && (
        <div style={{
          padding: '12px', background: C.bg, border: `1px dashed ${C.border}`,
          borderRadius: '8px', fontSize: '12px', color: C.inkFaint, marginBottom: '8px',
          fontStyle: 'italic',
        }}>No card messages. Tap + to add one.</div>
      )}
      {rows.map((msg, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '8px',
        }}>
          <div style={{
            fontSize: '10px', fontWeight: 600, color: C.inkFaint,
            padding: '10px 4px 0 2px', minWidth: '36px', letterSpacing: '0.04em',
            textAlign: 'right', flexShrink: 0,
          }}>Card {i + 1}</div>
          <textarea className="text-input" value={msg}
            onChange={(e) => updateRow(i, e.target.value)}
            placeholder="What should the card say?"
            rows={2}
            style={{ ...inputStyle(), fontSize: '13px', minHeight: '52px', resize: 'vertical', flex: 1 }} />
          <button onClick={() => removeRow(i)} aria-label="Remove card" style={{
            background: 'transparent', border: 'none', padding: '10px 6px',
            cursor: 'pointer', color: C.inkFaint, flexShrink: 0,
          }}><X size={14} /></button>
        </div>
      ))}
      <button onClick={addRow} style={{
        padding: '8px 12px', background: 'transparent',
        border: `1px dashed ${C.border}`, borderRadius: '8px',
        color: C.inkSoft, fontFamily: 'inherit', fontSize: '12px',
        fontWeight: 500, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: '6px',
      }}><Plus size={13} strokeWidth={2} /> Add card</button>
    </div>
  );
}

// Collapsible variant of Field — header is tappable, body shows when open.
// Auto-opens when there's already content (so editing existing orders shows
// what's there). Preview line on the closed header gives a tease of content.
function CollapsibleField({ label, hint, children, value }) {
  const hasContent = !!(value && String(value).trim());
  const [open, setOpen] = useState(hasContent);
  return (
    <div style={{ marginBottom: '14px' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        width: '100%', padding: '10px 12px', background: C.bg,
        border: `1px solid ${C.borderSoft}`, borderRadius: '8px',
        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '12px', fontWeight: 500, color: C.inkSoft,
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>{label}</div>
          {!open && hasContent && (
            <div style={{
              fontSize: '12px', color: C.inkSoft, marginTop: '4px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              fontStyle: 'italic',
            }}>{String(value).trim()}</div>
          )}
        </div>
        <ChevronDown size={14} strokeWidth={2} color={C.inkFaint} style={{
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 160ms ease', flexShrink: 0,
        }} />
      </button>
      {open && (
        <div style={{ marginTop: '8px' }}>
          {children}
          {hint && <div style={{ fontSize: '12px', color: C.inkFaint, marginTop: '6px', lineHeight: 1.4 }}>{hint}</div>}
        </div>
      )}
    </div>
  );
}

function Field({ label, children, hint, required, style }) {
  return (
    <div style={{ marginBottom: '14px', ...(style || {}) }}>
      <label style={{
        display: 'block', fontSize: '12px', fontWeight: 500, color: C.inkSoft,
        marginBottom: '6px', letterSpacing: '0.04em', textTransform: 'uppercase',
      }}>
        {label}
        {required && (
          <span style={{
            color: C.roseDeep, fontWeight: 700, marginLeft: '6px',
            fontSize: '10px', letterSpacing: '0.06em',
          }}>* required</span>
        )}
      </label>
      {children}
      {hint && <div style={{ fontSize: '12px', color: C.inkFaint, marginTop: '6px', lineHeight: 1.4 }}>{hint}</div>}
    </div>
  );
}

function inputStyle() {
  return {
    width: '100%', padding: '12px 14px', fontSize: '15px', fontFamily: 'inherit',
    background: C.bg, border: `1px solid ${C.border}`, borderRadius: '10px',
    color: C.ink,
  };
}

function ModeBtn({ active, onClick, title, sub }) {
  return (
    <button onClick={onClick} style={{
      padding: '12px 14px', borderRadius: '10px',
      border: `1.5px solid ${active ? C.sageDeep : C.border}`,
      background: active ? `${C.sage}22` : C.bg,
      color: C.ink, fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer',
      transition: 'all 160ms ease',
    }}>
      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>{title}</div>
      <div style={{ fontSize: '12px', color: C.inkSoft }}>{sub}</div>
    </button>
  );
}

function SectionLabel({ children, danger, style }) {
  return (
    <div style={{
      fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em',
      textTransform: 'uppercase', color: danger ? C.roseDeep : C.inkFaint,
      marginBottom: '10px', marginTop: '6px',
      ...(style || {}),
    }}>{children}</div>
  );
}

// Collapsible accordion section for the Settings modal. Tappable header shows
// the section title (uppercase, like SectionLabel) with a chevron that rotates
// when open. Closed by default — settings is rarely a "skim everything" UI;
// users come in to change one thing, so an accordion keeps the modal short.
function CollapsibleSection({ title, danger, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: '10px' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px', borderRadius: '10px',
        background: 'transparent', border: 'none',
        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
      }}>
        <span style={{
          fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: danger ? C.roseDeep : C.inkFaint,
        }}>{title}</span>
        <ChevronDown size={14} strokeWidth={2} color={danger ? C.roseDeep : C.inkSoft} style={{
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 160ms ease',
        }} />
      </button>
      {open && (
        <div style={{ padding: '14px 4px 4px' }}>{children}</div>
      )}
    </div>
  );
}

// Dropdown with colored options + "+ Add new" inline form.
// Used for event types and material types (any taxonomy where the user can extend the list).
function TypeDropdown({ value, options, onChange, onAdd, showColor = false, placeholder = 'Select…' }) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('#8FA68B');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setAdding(false); } };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const selected = (options || []).find(o => o.key === value);
  const handleAdd = () => {
    const label = newLabel.trim();
    if (!label || !onAdd) return;
    const newKey = onAdd({ label, color: showColor ? newColor : undefined });
    if (newKey) onChange(newKey);
    setAdding(false); setNewLabel(''); setNewColor('#8FA68B');
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        width: '100%', padding: '12px 14px', fontSize: '14px', fontFamily: 'inherit',
        background: C.bg, border: `1px solid ${C.border}`, borderRadius: '10px',
        color: C.ink, cursor: 'pointer', textAlign: 'left',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          {showColor && selected && (
            <span style={{
              width: '12px', height: '12px', borderRadius: '50%',
              background: selected.color, flexShrink: 0,
              border: isLight(selected.color) ? `1px solid ${C.border}` : 'none',
            }} />
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronDown size={16} strokeWidth={2} color={C.inkSoft} style={{
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease', flexShrink: 0,
        }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 80,
          background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px',
          boxShadow: '0 12px 32px rgba(42,53,40,0.18)',
          maxHeight: '320px', overflowY: 'auto', padding: '4px',
        }}>
          {!adding ? (
            <>
              {(options || []).map(opt => (
                <button key={opt.key} type="button"
                  onClick={() => { onChange(opt.key); setOpen(false); }}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: opt.key === value ? `${C.sage}18` : 'transparent',
                    border: 'none', borderRadius: '7px',
                    fontFamily: 'inherit', fontSize: '14px', color: C.ink,
                    cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: '10px',
                  }}>
                  {showColor && (
                    <span style={{
                      width: '14px', height: '14px', borderRadius: '50%',
                      background: opt.color, flexShrink: 0,
                      border: isLight(opt.color) ? `1px solid ${C.border}` : 'none',
                    }} />
                  )}
                  <span style={{ flex: 1 }}>{opt.label}</span>
                  {opt.key === value && <Check size={14} strokeWidth={2.4} color={C.sageDeep} />}
                </button>
              ))}
              {onAdd && (
                <>
                  <div style={{ height: '1px', background: C.borderSoft, margin: '4px 8px' }} />
                  <button type="button" onClick={() => setAdding(true)}
                    style={{
                      width: '100%', padding: '10px 12px', background: 'transparent',
                      border: 'none', borderRadius: '7px',
                      fontFamily: 'inherit', fontSize: '13px', color: C.sageDeep, fontWeight: 600,
                      cursor: 'pointer', textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                    <Plus size={14} strokeWidth={2.4} /> Add new
                  </button>
                </>
              )}
            </>
          ) : (
            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.inkFaint }}>
                New type
              </div>
              <input type="text" value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
                placeholder="Name"
                autoFocus
                style={{
                  width: '100%', padding: '10px', fontSize: '14px', fontFamily: 'inherit',
                  background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.ink,
                }} />
              {showColor && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)}
                    style={{
                      width: '44px', height: '40px', padding: 0, border: `1px solid ${C.border}`,
                      borderRadius: '8px', cursor: 'pointer', background: 'none',
                    }} />
                  <span style={{ fontSize: '12px', color: C.inkSoft }}>Pick a color</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button type="button" onClick={() => { setAdding(false); setNewLabel(''); }}
                  style={{
                    flex: 1, padding: '8px', background: 'transparent', border: `1px solid ${C.border}`,
                    borderRadius: '8px', fontFamily: 'inherit', fontSize: '12px', color: C.inkSoft, cursor: 'pointer',
                  }}>Cancel</button>
                <button type="button" onClick={handleAdd} disabled={!newLabel.trim()}
                  style={{
                    flex: 1, padding: '8px',
                    background: newLabel.trim() ? C.sageDeep : C.bgDeep, border: 'none', borderRadius: '8px',
                    fontFamily: 'inherit', fontSize: '12px',
                    color: newLabel.trim() ? C.card : C.inkFaint, fontWeight: 600,
                    cursor: newLabel.trim() ? 'pointer' : 'not-allowed',
                  }}>Save</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Multi-select dropdown for tag-like data (e.g. store tags).
// Shows selected as removable chips; the dropdown lists unselected options + an "+ Add new" form.
// onDeleteOption(value): if provided, each row in the dropdown gets an X to permanently delete the option.
// storeEntries: optional array of {name, kind, address?, url?} — when provided, dropdown shows
//               richer rows with kind icon + subtitle (address or URL).
function MultiTagDropdown({ values, options, onChange, onAdd, onDeleteOption, placeholder = 'Add tag…', storeEntries, addLabel = 'New tag', newPlaceholder = 'Store name', chipsBelow = false }) {
  const [open, setOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setNewLabel(''); } };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  // Auto-focus the inline input every time the dropdown opens so she can
  // type a store name immediately — no extra tap needed.
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const selected = Array.isArray(values) ? values : [];
  const available = (options || []).filter(o => !selected.includes(o));
  // Typeahead: existing tags matching what she's typed (case-insensitive).
  // When the query is empty, show all available.
  const q = newLabel.trim().toLowerCase();
  const filteredAvailable = q
    ? available.filter(o => o.toLowerCase().includes(q))
    : available;
  // Only offer "+ Add X" when her query doesn't exactly match an existing tag
  // (selected or available), so Enter on a known name just selects it.
  const exactMatch = q
    ? [...selected, ...available].some(o => o.toLowerCase() === q)
    : false;
  const canCreate = !!onAdd && q.length > 0 && !exactMatch;

  const add = (val) => { onChange([...selected, val]); };
  const remove = (val) => { onChange(selected.filter(v => v !== val)); };

  const commitInput = () => {
    const label = newLabel.trim();
    if (!label) return;
    // Prefer selecting an existing tag over creating a duplicate with different casing.
    const match = available.find(o => o.toLowerCase() === label.toLowerCase());
    if (match) {
      add(match);
      setNewLabel(''); setOpen(false);
      return;
    }
    if (onAdd) {
      const tag = onAdd({ label });
      if (tag && !selected.includes(tag)) add(tag);
      setNewLabel(''); setOpen(false);
    }
  };

  const chipStrip = selected.length > 0 ? (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '6px',
      marginTop: chipsBelow ? '8px' : 0,
      marginBottom: chipsBelow ? 0 : '6px',
    }}>
      {selected.map(t => (
        <span key={t} style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '4px 10px', fontSize: '12px',
          background: `${C.sage}22`, color: C.sageDeep, fontWeight: 600,
          borderRadius: '14px',
        }}>
          {t}
          <button type="button" onClick={() => remove(t)} aria-label={`Remove ${t}`}
            style={{
              background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
              color: C.sageDeep, display: 'flex', alignItems: 'center',
            }}><X size={12} /></button>
        </span>
      ))}
    </div>
  ) : null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {!chipsBelow && chipStrip}

      <button type="button" onClick={() => setOpen(o => !o)} style={{
        width: '100%', padding: '10px 14px', fontSize: '13px', fontFamily: 'inherit',
        background: C.bg, border: `1px dashed ${C.border}`, borderRadius: '10px',
        color: C.inkSoft, cursor: 'pointer', textAlign: 'left',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={13} strokeWidth={2.2} /> {placeholder}
        </span>
        <ChevronDown size={14} strokeWidth={2} style={{
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease',
        }} />
      </button>

      {chipsBelow && chipStrip}

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 80,
          background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px',
          boxShadow: '0 12px 32px rgba(42,53,40,0.18)',
          maxHeight: '280px', overflowY: 'auto', padding: '4px',
        }}>
          {/* Typeahead input — auto-focused so she can start typing the moment
              she opens the dropdown. Enter picks an existing match or creates
              a new tag from what she's typed. Escape closes. */}
          {onAdd && (
            <input ref={inputRef} type="text" value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); commitInput(); }
                else if (e.key === 'Escape') { setNewLabel(''); setOpen(false); }
              }}
              placeholder={newPlaceholder}
              style={{
                width: '100%', padding: '10px 12px', fontSize: '14px', fontFamily: 'inherit',
                background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px',
                color: C.ink, outline: 'none', marginBottom: '4px',
              }} />
          )}
          {canCreate && (
            <button type="button" onClick={commitInput}
              style={{
                width: '100%', padding: '10px 12px', background: 'transparent',
                border: 'none', borderRadius: '7px',
                fontFamily: 'inherit', fontSize: '13px', color: C.sageDeep, fontWeight: 600,
                cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
              <Plus size={14} strokeWidth={2.4} /> Add &ldquo;{newLabel.trim()}&rdquo;
            </button>
          )}
          {filteredAvailable.length === 0 && !canCreate && (
            <div style={{
              padding: '12px', fontSize: '12px', color: C.inkFaint, fontStyle: 'italic', textAlign: 'center',
            }}>
              {selected.length > 0 && !q ? 'All known tags already added.' : (q ? `No match for "${newLabel.trim()}".` : 'No tags yet.')}
            </div>
          )}
          {filteredAvailable.map(opt => (
            <div key={opt} style={{
              display: 'flex', alignItems: 'stretch', borderRadius: '7px', overflow: 'hidden',
            }}>
              <button type="button"
                onClick={() => { add(opt); setOpen(false); setNewLabel(''); }}
                style={{
                  flex: 1, padding: '10px 12px', background: 'transparent',
                  border: 'none', borderRadius: '7px',
                  fontFamily: 'inherit', fontSize: '14px', color: C.ink,
                  cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                <Plus size={13} strokeWidth={2} color={C.sageDeep} />
                {opt}
              </button>
              {onDeleteOption && (
                <button type="button"
                  onClick={(e) => { e.stopPropagation(); onDeleteOption(opt); }}
                  aria-label={`Delete ${opt}`}
                  title={`Delete "${opt}"`}
                  style={{
                    padding: '0 12px', background: 'transparent', border: 'none',
                    color: C.inkFaint, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', flexShrink: 0,
                  }}><X size={13} strokeWidth={2} /></button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Inline checkbox for mass-select mode on cards.
function SelectCheckbox({ checked }) {
  return (
    <span aria-checked={checked} role="checkbox" style={{
      width: '24px', height: '24px', borderRadius: '6px',
      background: checked ? C.sageDeep : C.card,
      border: `1.5px solid ${checked ? C.sageDeep : C.border}`,
      flexShrink: 0, marginTop: '4px',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 140ms ease',
    }}>
      {checked && <Check size={15} strokeWidth={3} color={C.card} />}
    </span>
  );
}

// Two-tap delete: first tap arms, second tap (within 3s) deletes.
function DeleteButton({ onConfirm, label = 'Delete', size = 16, padding = '11px', compact = false, fullWidth = false }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(id);
  }, [armed]);
  const handle = (e) => {
    e.stopPropagation();
    if (armed) { onConfirm(); setArmed(false); }
    else setArmed(true);
  };
  return (
    <button
      onClick={handle}
      title={armed ? 'Tap again to confirm' : label}
      aria-label={armed ? `Confirm ${label.toLowerCase()}` : label}
      style={{
        background: armed ? `${C.roseDeep}1f` : 'transparent',
        border: armed ? `1px solid ${C.rose}` : 'none',
        padding, borderRadius: '8px', cursor: 'pointer',
        color: armed ? C.roseDeep : C.inkSoft,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
        fontFamily: 'inherit', fontSize: '11px', fontWeight: 600,
        transition: 'all 140ms ease',
        width: fullWidth ? '100%' : undefined,
      }}
    >
      {armed
        ? (compact ? <Check size={size} strokeWidth={2.4} /> : <><Check size={size} strokeWidth={2.4} /> Confirm</>)
        : <Trash2 size={size} strokeWidth={1.8} />}
    </button>
  );
}

// --------------------- SETTINGS ---------------------

function SettingsModal({
  settings, onSave, onClearAll, onClose,
  permState, onEnableNotifications, onTestNotification,
  sheetsState, isOnline, onConnectSheets, onDisconnectSheets, onManualSync, getSheetUrl,
  driveState, onPullFromDrive,
}) {
  const [draft, setDraft] = useState(settings);
  const [confirmStage, setConfirmStage] = useState(0);
  const [savedFlash, setSavedFlash] = useState(false);
  const [sheetUrl, setSheetUrl] = useState(null);

  useEffect(() => {
    if (sheetsState.connected) getSheetUrl().then(setSheetUrl);
    else setSheetUrl(null);
  }, [sheetsState.connected, sheetsState.lastSync]);

  const updateDraft = (patch) => setDraft(d => ({ ...d, ...patch }));
  const updateOffset = (index, patch) => {
    const next = draft.reminderOffsets.map((o, i) => i === index ? { ...o, ...patch } : o);
    updateDraft({ reminderOffsets: next });
  };
  const removeOffset = (index) => updateDraft({ reminderOffsets: draft.reminderOffsets.filter((_, i) => i !== index) });
  const addOffset = () => updateDraft({ reminderOffsets: [...draft.reminderOffsets, { value: 1, unit: 'hours' }] });

  const handleSave = async () => {
    const cleanOffsets = sortOffsets(
      draft.reminderOffsets
        .map(o => ({ ...o, value: Math.max(1, parseInt(o.value) || 1) }))
        .filter(o => o.value > 0)
    );
    const clean = {
      ...draft,
      businessName: (draft.businessName || '').trim() || 'Petal & Stem',
      reminderOffsets: cleanOffsets,
      defaultPickupHour: Math.max(0, Math.min(23, parseInt(draft.defaultPickupHour) || 0)),
      defaultPickupMinute: Math.max(0, Math.min(59, parseInt(draft.defaultPickupMinute) || 0)),
    };
    await onSave(clean);
    setSavedFlash(true);
    setTimeout(() => { setSavedFlash(false); onClose(); }, 700);
  };

  const handleConfirmClear = async () => {
    if (confirmStage === 0) { setConfirmStage(1); return; }
    if (confirmStage === 1) { setConfirmStage(2); return; }
    await onClearAll();
    setConfirmStage(0);
    onClose();
  };

  const pickupTimeStr = (() => {
    const pad = x => String(x).padStart(2, '0');
    return `${pad(draft.defaultPickupHour)}:${pad(draft.defaultPickupMinute)}`;
  })();

  const sheetsConfigured = sheets.isConfigured();

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(42,53,40,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', zIndex: 50, backdropFilter: 'blur(4px)',
    }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
        background: C.card, borderRadius: '16px',
        width: '100%', maxWidth: '500px',
        // Fixed-size modal: body scrolls independently so opening/closing
        // sections never resizes the modal itself.
        height: 'min(720px, 92vh)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(42,53,40,0.25)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '24px 24px 18px', flexShrink: 0,
        }}>
          <div style={{
            width: '36px', height: '36px', background: `${C.sageDeep}22`, borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Settings size={16} color={C.sageDeep} strokeWidth={2} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 className="serif" style={{
              fontSize: '22px', margin: 0, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.2,
            }}>Settings</h2>
            <div style={{ fontSize: '13px', color: C.inkSoft, marginTop: '2px' }}>
              Customize your ledger
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close" style={{
            background: 'transparent', border: 'none', padding: '10px', borderRadius: '8px',
            cursor: 'pointer', color: C.inkSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={20} /></button>
        </div>

        <div style={{
          flex: 1, minHeight: 0, overflow: 'auto',
          padding: '0 24px',
        }}>

        <CollapsibleSection title="Business" defaultOpen>
          <Field label="Business name" hint="Shown in the header and on calendar exports.">
            <input className="text-input" type="text" value={draft.businessName}
              onChange={(e) => updateDraft({ businessName: e.target.value })}
              placeholder="e.g. Rosie's Flowers" maxLength={40} style={inputStyle()} />
          </Field>
        </CollapsibleSection>

        <CollapsibleSection title="Orders">
          <Field label="Default pickup time" hint="Pre-fills when you create a new order.">
            <input className="text-input" type="time" value={pickupTimeStr}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number);
                updateDraft({ defaultPickupHour: h || 0, defaultPickupMinute: m || 0 });
              }}
              style={{ ...inputStyle(), maxWidth: '160px' }} />
            <div style={{ fontSize: '12px', color: C.inkFaint, marginTop: '6px' }}>
              Currently {formatTime12(draft.defaultPickupHour, draft.defaultPickupMinute)}
            </div>
          </Field>
        </CollapsibleSection>

        <CollapsibleSection title="Reminders">

          <NotificationStatus
            permState={permState}
            onEnable={onEnableNotifications}
            onTest={onTestNotification}
          />

        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px',
          background: C.bg, borderRadius: '10px', marginBottom: '14px', cursor: 'pointer',
        }} onClick={() => updateDraft({ remindersDefault: !draft.remindersDefault })}>
          <div style={{
            width: '20px', height: '20px', borderRadius: '6px',
            background: draft.remindersDefault ? C.sageDeep : C.card,
            border: `1.5px solid ${draft.remindersDefault ? C.sageDeep : C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 160ms ease', flexShrink: 0,
          }}>
            {draft.remindersDefault && <Check size={13} strokeWidth={3} color={C.card} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 500 }}>Reminders on by default</div>
            <div style={{ fontSize: '12px', color: C.inkSoft }}>
              New orders will include reminders unless you uncheck them
            </div>
          </div>
        </div>

        <Field label="Reminder offsets" hint="When to alert you before each pickup. Used for both phone notifications and calendar exports.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {draft.reminderOffsets.length === 0 && (
              <div style={{
                padding: '12px', background: C.bg, borderRadius: '8px',
                fontSize: '12px', color: C.inkFaint, textAlign: 'center', fontStyle: 'italic',
              }}>No reminders set — calendar events will be silent.</div>
            )}
            {draft.reminderOffsets.map((o, i) => (
              <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <BellRing size={14} color={C.gold} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                <input type="number" min="1" value={o.value}
                  onChange={(e) => updateOffset(i, { value: e.target.value })}
                  style={{
                    width: '70px', padding: '8px 10px', fontSize: '14px', fontFamily: 'inherit',
                    background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px',
                    color: C.ink, textAlign: 'center',
                  }} />
                <select value={o.unit}
                  onChange={(e) => updateOffset(i, { unit: e.target.value })}
                  style={{
                    flex: 1, padding: '8px 10px', fontSize: '14px', fontFamily: 'inherit',
                    background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px',
                    color: C.ink, cursor: 'pointer',
                  }}>
                  {REMINDER_UNITS.map(u => (
                    <option key={u.key} value={u.key}>
                      {parseInt(o.value) === 1 ? u.singular : u.label} before
                    </option>
                  ))}
                </select>
                <button onClick={() => removeOffset(i)} title="Remove" style={{
                  background: 'transparent', border: 'none', padding: '8px',
                  borderRadius: '8px', cursor: 'pointer', color: C.inkSoft,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><X size={14} /></button>
              </div>
            ))}
            <button onClick={addOffset} style={{
              padding: '10px 14px', background: 'transparent',
              border: `1px dashed ${C.border}`, borderRadius: '8px',
              color: C.inkSoft, fontFamily: 'inherit', fontSize: '13px',
              cursor: 'pointer', fontWeight: 500, marginTop: '4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}>
              <Plus size={13} strokeWidth={2.2} /> Add another reminder
            </button>
          </div>
        </Field>
        </CollapsibleSection>

        <CollapsibleSection title="Calendar">
        <Field label="Week starts on" hint="Affects the calendar view in Orders.">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button onClick={() => updateDraft({ weekStartsOn: 0 })} style={{
              padding: '12px', borderRadius: '10px',
              border: `1.5px solid ${draft.weekStartsOn === 0 ? C.sageDeep : C.border}`,
              background: draft.weekStartsOn === 0 ? `${C.sage}22` : C.bg,
              color: C.ink, fontFamily: 'inherit', fontSize: '14px', fontWeight: 500,
              cursor: 'pointer', transition: 'all 160ms ease',
            }}>Sunday</button>
            <button onClick={() => updateDraft({ weekStartsOn: 1 })} style={{
              padding: '12px', borderRadius: '10px',
              border: `1.5px solid ${draft.weekStartsOn === 1 ? C.sageDeep : C.border}`,
              background: draft.weekStartsOn === 1 ? `${C.sage}22` : C.bg,
              color: C.ink, fontFamily: 'inherit', fontSize: '14px', fontWeight: 500,
              cursor: 'pointer', transition: 'all 160ms ease',
            }}>Monday</button>
          </div>
        </Field>

        <Field label="Event types" hint="Each order can be tagged with a type. The dot color shows on the calendar.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(draft.eventTypes || []).map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="color" value={t.color}
                  onChange={(e) => {
                    const next = [...draft.eventTypes];
                    next[i] = { ...next[i], color: e.target.value };
                    updateDraft({ eventTypes: next });
                  }}
                  style={{
                    width: '36px', height: '36px', border: 'none', borderRadius: '8px',
                    cursor: 'pointer', background: 'none', padding: 0, flexShrink: 0,
                  }} />
                <input type="text" value={t.label}
                  onChange={(e) => {
                    const next = [...draft.eventTypes];
                    next[i] = { ...next[i], label: e.target.value };
                    updateDraft({ eventTypes: next });
                  }}
                  placeholder="Event name"
                  style={{
                    flex: 1, padding: '8px 10px', fontSize: '13px', fontFamily: 'inherit',
                    background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px',
                    color: C.ink,
                  }} />
                <button onClick={() => updateDraft({ eventTypes: draft.eventTypes.filter((_, idx) => idx !== i) })}
                  aria-label="Remove event type" style={{
                    background: 'transparent', border: 'none', padding: '8px',
                    borderRadius: '8px', cursor: 'pointer', color: C.inkSoft,
                    display: 'flex', alignItems: 'center',
                  }}><X size={14} /></button>
              </div>
            ))}
            <button onClick={() => {
              const next = [...(draft.eventTypes || []), {
                key: `custom-${Date.now()}`, label: 'New event', color: '#8FA68B',
              }];
              updateDraft({ eventTypes: next });
            }} style={{
              padding: '10px 14px', background: 'transparent',
              border: `1px dashed ${C.border}`, borderRadius: '8px',
              color: C.inkSoft, fontFamily: 'inherit', fontSize: '13px',
              cursor: 'pointer', fontWeight: 500, marginTop: '4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}>
              <Plus size={13} strokeWidth={2.2} /> Add event type
            </button>
          </div>
        </Field>
        </CollapsibleSection>

        {sheetsConfigured && (
          <CollapsibleSection title="Google Sheets sync">
            <SheetsPanel
              state={sheetsState}
              isOnline={isOnline}
              sheetUrl={sheetUrl}
              onConnect={onConnectSheets}
              onDisconnect={onDisconnectSheets}
              onSync={onManualSync}
            />
          </CollapsibleSection>
        )}

        {sheetsConfigured && sheetsState.connected && (
          <CollapsibleSection title="Cloud backup">
            <DrivePanel
              state={driveState}
              isOnline={isOnline}
              onPull={onPullFromDrive}
            />
          </CollapsibleSection>
        )}

        <CollapsibleSection title="Shopping">
          <Field label="Restock horizon" hint="How many days of upcoming orders to scan when you tap “Restock from upcoming orders”.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
              {[3, 7, 14, 21, 30].map(days => {
                const active = (parseInt(draft.restockHorizonDays) || 14) === days;
                return (
                  <button key={days} onClick={() => updateDraft({ restockHorizonDays: days })}
                    style={{
                      padding: '10px 4px', borderRadius: '8px',
                      background: active ? C.sageDeep : C.bg,
                      border: `1.5px solid ${active ? C.sageDeep : C.border}`,
                      color: active ? C.card : C.ink,
                      fontFamily: 'inherit', fontSize: '13px', fontWeight: active ? 600 : 500,
                      cursor: 'pointer',
                    }}>{days}d</button>
                );
              })}
            </div>
          </Field>

          <Field label="Default restock stores (optional)" hint="Pre-tag every restock trip with these stores so you don't have to add them each time.">
            <MultiTagDropdown
              values={Array.isArray(draft.restockDefaultStores) ? draft.restockDefaultStores : []}
              options={(draft.stores || []).map(s => s.name).filter(Boolean)}
              onChange={(next) => updateDraft({ restockDefaultStores: next })}
              placeholder="Add store"
            />
          </Field>
        </CollapsibleSection>

        <CollapsibleSection title="Stats">
          <ResetEarningsCard
            statsResetAt={draft.statsResetAt}
            onReset={() => updateDraft({ statsResetAt: new Date().toISOString() })}
            onUndo={() => updateDraft({ statsResetAt: null })}
          />
        </CollapsibleSection>

        <CollapsibleSection title="About">
          <div style={{
            padding: '14px 16px', background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: '10px', marginBottom: '14px',
            display: 'flex', flexDirection: 'column', gap: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px', height: '34px', background: C.sageDeep, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Leaf size={16} color={C.card} strokeWidth={1.6} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="serif" style={{ fontSize: '15px', fontWeight: 500, color: C.ink }}>
                  Petal &amp; Stem
                </div>
                <div style={{ fontSize: '11px', color: C.inkFaint, fontWeight: 600, letterSpacing: '0.04em' }}>
                  Version {typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'}
                </div>
              </div>
            </div>
            <div style={{ height: '1px', background: C.borderSoft }} />
            <div style={{ fontSize: '12px', color: C.inkSoft, lineHeight: 1.55 }}>
              <strong style={{ color: C.ink }}>Your data lives on this device.</strong> Nothing
              is stored on our servers. Use the Transfer button (top right) to back it up
              or move it to another device.
            </div>
            <div style={{ fontSize: '12px', color: C.inkSoft, lineHeight: 1.55 }}>
              Made with care for florists. Pricing, calendar, reminders, and a shopping
              list — all in one place.
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Reset" danger>
        <div style={{
          padding: '14px 16px', background: confirmStage > 0 ? `${C.roseDeep}10` : C.bg,
          border: `1px solid ${confirmStage > 0 ? C.rose : C.border}`,
          borderRadius: '10px', marginBottom: '20px',
          transition: 'all 200ms ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
            <AlertTriangle size={16} color={C.roseDeep} strokeWidth={2} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: C.ink, marginBottom: '4px' }}>
                {confirmStage === 0 ? 'Clear all data'
                  : confirmStage === 1 ? 'Are you sure?'
                  : 'Last chance — really delete everything?'}
              </div>
              <div style={{ fontSize: '12px', color: C.inkSoft, lineHeight: 1.5 }}>
                {confirmStage === 0
                  ? 'Deletes every flower, material, and order. Settings stay. This cannot be undone — make a backup first via Transfer.'
                  : confirmStage === 1
                  ? 'This will erase everything in your ledger. The app will be empty when you reopen it.'
                  : "Tap once more to permanently clear all flowers, materials, and orders."}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {confirmStage > 0 && (
              <button onClick={() => setConfirmStage(0)} style={{
                flex: 1, padding: '10px', background: C.card, border: `1px solid ${C.border}`,
                borderRadius: '8px', color: C.inkSoft, fontFamily: 'inherit', fontSize: '13px',
                fontWeight: 500, cursor: 'pointer',
              }}>Cancel</button>
            )}
            <button className={confirmStage === 0 ? 'danger-btn' : ''} onClick={handleConfirmClear}
              style={{
                flex: 1, padding: '10px',
                background: confirmStage === 0 ? C.card : C.roseDeep,
                border: `1px solid ${confirmStage === 0 ? C.rose : C.roseDeep}`,
                borderRadius: '8px',
                color: confirmStage === 0 ? C.roseDeep : C.card,
                fontFamily: 'inherit', fontSize: '13px',
                fontWeight: 600, cursor: 'pointer',
              }}>
              {confirmStage === 0 ? 'Clear all data' : confirmStage === 1 ? 'Yes, continue' : 'Delete everything'}
            </button>
          </div>
        </div>
        </CollapsibleSection>

        </div>

        <div style={{
          padding: '16px 24px', flexShrink: 0,
          background: C.card,
          borderTop: `1px solid ${C.borderSoft}`, display: 'flex', gap: '10px',
        }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '14px', background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: '10px', color: C.inkSoft, fontFamily: 'inherit', fontSize: '15px',
            fontWeight: 500, cursor: 'pointer',
          }}>Cancel</button>
          <button className="primary-btn" onClick={handleSave} style={{
            flex: 2, padding: '14px',
            background: savedFlash ? C.sage : C.sageDeep,
            border: 'none', borderRadius: '10px',
            color: C.card, fontFamily: 'inherit', fontSize: '15px', fontWeight: 500,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
            {savedFlash ? <><Check size={16} strokeWidth={2.4} /> Saved</> : 'Save settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResetEarningsCard({ statsResetAt, onReset, onUndo }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(id);
  }, [armed]);

  const resetDate = statsResetAt ? new Date(statsResetAt) : null;
  const resetLabel = resetDate ? resetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

  return (
    <div style={{
      padding: '14px 16px', background: C.bg, border: `1px solid ${C.border}`,
      borderRadius: '10px', marginBottom: '14px',
    }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: C.ink, marginBottom: '4px',
        display: 'flex', alignItems: 'center', gap: '6px' }}>
        <RotateCw size={13} strokeWidth={2} color={C.sageDeep} />
        {statsResetAt ? `Earnings reset on ${resetLabel}` : 'Reset earnings'}
      </div>
      <div style={{ fontSize: '12px', color: C.inkSoft, lineHeight: 1.5, marginBottom: '10px' }}>
        {statsResetAt
          ? "Stats only count orders with pickup dates after the reset point. Past orders are still in the calendar."
          : "Sets the start date for the Stats tab — useful at year-end or when starting a new pricing season. Orders themselves stay intact."}
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {!statsResetAt && (
          <button onClick={() => {
            if (armed) { onReset(); setArmed(false); }
            else setArmed(true);
          }} style={{
            padding: '8px 14px',
            background: armed ? C.gold : C.card,
            border: `1px solid ${armed ? C.gold : C.border}`,
            borderRadius: '8px',
            color: armed ? C.card : C.inkSoft, fontFamily: 'inherit', fontSize: '13px',
            fontWeight: 600, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: '5px',
          }}>
            {armed ? <><Check size={13} strokeWidth={2.4} /> Tap again to confirm</> : 'Reset earnings now'}
          </button>
        )}
        {statsResetAt && (
          <button onClick={onUndo} style={{
            padding: '8px 14px', background: C.card, border: `1px solid ${C.border}`,
            borderRadius: '8px', color: C.inkSoft, fontFamily: 'inherit', fontSize: '13px',
            fontWeight: 500, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: '5px',
          }}>
            Undo reset
          </button>
        )}
      </div>
    </div>
  );
}

function NotificationStatus({ permState, onEnable, onTest }) {
  if (permState === 'unsupported') {
    return (
      <div style={{
        padding: '12px 14px', background: C.bg, borderRadius: '10px',
        marginBottom: '14px', fontSize: '12px', color: C.inkSoft, lineHeight: 1.5,
      }}>
        <strong>This browser doesn't support notifications.</strong> Try installing the app to your home screen and reopening, or use Chrome on Android.
      </div>
    );
  }
  if (permState === 'denied') {
    return (
      <div style={{
        padding: '12px 14px', background: `${C.gold}15`, border: `1px solid ${C.gold}66`,
        borderRadius: '10px', marginBottom: '14px',
      }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: C.ink, marginBottom: '4px',
          display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BellOff size={13} strokeWidth={2} /> Reminders blocked
        </div>
        <div style={{ fontSize: '12px', color: C.inkSoft, lineHeight: 1.5 }}>
          Browser notifications are turned off for this site. To re-enable: tap the lock icon in your browser's address bar and allow notifications.
        </div>
      </div>
    );
  }
  if (permState === 'default') {
    return (
      <div style={{
        padding: '14px', background: `${C.sage}15`, border: `1px solid ${C.sage}66`,
        borderRadius: '10px', marginBottom: '14px',
      }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: C.ink, marginBottom: '4px',
          display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BellRing size={13} strokeWidth={2} color={C.sageDeep} /> Phone notifications need permission
        </div>
        <div style={{ fontSize: '12px', color: C.inkSoft, lineHeight: 1.5, marginBottom: '10px' }}>
          Enable to get pickup alerts even when the app isn't open.
        </div>
        <button onClick={onEnable} className="primary-btn" style={{
          padding: '10px 14px', background: C.sageDeep, border: 'none', borderRadius: '8px',
          color: C.card, fontFamily: 'inherit', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
        }}>Enable reminders</button>
      </div>
    );
  }
  // granted
  const osConfigured = onesignal.isConfigured();
  return (
    <div style={{
      padding: '12px 14px', background: `${C.sage}15`, border: `1px solid ${C.sage}66`,
      borderRadius: '10px', marginBottom: '14px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: C.sageDeep,
          display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Check size={13} strokeWidth={2.4} /> Phone reminders enabled
        </div>
        <button onClick={onTest} style={{
          padding: '6px 12px', background: 'transparent', border: `1px solid ${C.sage}`,
          borderRadius: '8px', color: C.sageDeep, fontFamily: 'inherit', fontSize: '12px',
          fontWeight: 500, cursor: 'pointer',
        }}>Test it</button>
      </div>
      {osConfigured && (
        <div style={{ fontSize: '11px', color: C.sageDeep, marginTop: '6px', lineHeight: 1.5 }}>
          Server-backed delivery active — reminders will fire even if this app is closed.
        </div>
      )}
    </div>
  );
}

function SheetsPanel({ state, isOnline, sheetUrl, onConnect, onDisconnect, onSync }) {
  if (!state.connected) {
    return (
      <div style={{
        padding: '14px', background: C.bg, borderRadius: '10px', marginBottom: '14px',
      }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: C.ink, marginBottom: '4px',
          display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sheet size={13} strokeWidth={2} color={C.sageDeep} /> Sync to Google Sheets
        </div>
        <div style={{ fontSize: '12px', color: C.inkSoft, lineHeight: 1.5, marginBottom: '10px' }}>
          Auto-creates a spreadsheet in your Drive that mirrors your ledger. Useful for printing, sharing, or viewing on PC.
          You'll see a one-time "unverified app" warning — tap Advanced → Continue.
        </div>
        <button onClick={onConnect} className="primary-btn" style={{
          padding: '10px 14px', background: C.sageDeep, border: 'none', borderRadius: '8px',
          color: C.card, fontFamily: 'inherit', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}><Sheet size={13} strokeWidth={2} /> Connect Google</button>
      </div>
    );
  }

  return (
    <div style={{
      padding: '14px', background: `${C.sage}15`, border: `1px solid ${C.sage}66`,
      borderRadius: '10px', marginBottom: '14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '10px', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: C.sageDeep,
          display: 'flex', alignItems: 'center', gap: '6px' }}>
          {state.syncing ? <RotateCw size={13} className="spin" strokeWidth={2.2} />
            : !isOnline ? <WifiOff size={13} strokeWidth={2} color={C.gold} />
            : <Check size={13} strokeWidth={2.4} />}
          {state.syncing ? 'Syncing…'
            : !isOnline ? 'Offline — will sync when reconnected'
            : 'Connected'}
        </div>
        {state.lastSync && (
          <div style={{ fontSize: '11px', color: C.inkSoft }}>
            Last synced {formatRelative(state.lastSync)}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {sheetUrl && (
          <a href={sheetUrl} target="_blank" rel="noopener noreferrer" style={{
            padding: '8px 12px', background: C.card, border: `1px solid ${C.border}`,
            borderRadius: '8px', color: C.ink, textDecoration: 'none',
            fontFamily: 'inherit', fontSize: '12px', fontWeight: 500,
            display: 'inline-flex', alignItems: 'center', gap: '5px',
          }}><ExternalLink size={12} strokeWidth={2} /> View Sheet</a>
        )}
        <button onClick={onSync} disabled={state.syncing || !isOnline} style={{
          padding: '8px 12px', background: C.card, border: `1px solid ${C.border}`,
          borderRadius: '8px', color: state.syncing || !isOnline ? C.inkFaint : C.ink,
          fontFamily: 'inherit', fontSize: '12px', fontWeight: 500,
          cursor: state.syncing || !isOnline ? 'not-allowed' : 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: '5px',
        }}><RotateCw size={12} strokeWidth={2} className={state.syncing ? 'spin' : ''} /> Sync now</button>
        <button onClick={onDisconnect} style={{
          padding: '8px 12px', background: 'transparent', border: `1px solid ${C.border}`,
          borderRadius: '8px', color: C.inkSoft, fontFamily: 'inherit', fontSize: '12px',
          fontWeight: 500, cursor: 'pointer',
        }}>Disconnect</button>
      </div>
      {state.lastError && state.lastError !== 'offline' && (
        <div style={{
          marginTop: '10px', padding: '8px 10px', background: `${C.roseDeep}15`,
          border: `1px solid ${C.rose}`, borderRadius: '6px',
          fontSize: '11px', color: C.roseDeep,
        }}>Last sync failed. Tap "Sync now" to retry.</div>
      )}
    </div>
  );
}

// Cloud backup (Drive JSON) settings panel. Renders under the Google
// Sheets sync section since they share auth — if sheets is connected,
// drive is too. Auto-push is invisible; the manual "Pull from cloud"
// button is the primary UX for restoring on a second device.
function DrivePanel({ state, isOnline, onPull }) {
  const lastSync = state.lastSync ? new Date(state.lastSync) : null;
  const whenText = lastSync
    ? lastSync.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'never';
  const statusDot = state.syncing ? C.gold
    : state.lastError ? C.roseDeep
    : lastSync ? C.sageDeep
    : C.inkFaint;
  return (
    <div>
      <div style={{
        padding: '12px 14px', background: C.bg,
        border: `1px solid ${C.border}`, borderRadius: '10px',
        display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px',
      }}>
        <span style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: statusDot, flexShrink: 0,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: C.ink }}>
            {state.syncing ? 'Syncing to Drive…'
              : state.lastError ? 'Sync failed'
              : 'Auto-backup active'}
          </div>
          <div style={{ fontSize: '11px', color: C.inkFaint, marginTop: '2px' }}>
            Last synced: {whenText}
          </div>
        </div>
      </div>
      <div style={{
        fontSize: '12px', color: C.inkSoft, lineHeight: 1.5, marginBottom: '12px',
      }}>
        Every change auto-uploads a full backup (including photos) to a file in your Drive.
        On a new phone or PC, sign in with the same Google account and tap below to pull it down.
      </div>
      <button onClick={onPull} disabled={!isOnline || state.syncing} style={{
        padding: '10px 14px', background: C.card,
        border: `1px solid ${C.border}`, borderRadius: '10px',
        color: (!isOnline || state.syncing) ? C.inkFaint : C.ink,
        fontFamily: 'inherit', fontSize: '13px', fontWeight: 500,
        cursor: (!isOnline || state.syncing) ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <Download size={14} strokeWidth={2} /> Pull latest from Drive
      </button>
      {state.lastError && (
        <div style={{
          marginTop: '10px', padding: '8px 10px',
          background: `${C.roseDeep}15`, border: `1px solid ${C.roseDeep}44`,
          borderRadius: '8px', fontSize: '11px', color: C.roseDeep,
          lineHeight: 1.4,
        }}>{state.lastError}</div>
      )}
    </div>
  );
}

// --------------------- ORDERS ---------------------

function OrdersView({ orders, settings, upcomingCount, focusOrderId, onClearFocus, onAdd, onEdit, onDuplicate, onDelete, onTogglePaid, onExportOrder, onExportAllUpcoming }) {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [exportAllState, setExportAllState] = useState('');
  const [highlightedId, setHighlightedId] = useState(null);

  const grid = useMemo(() => getMonthGrid(viewDate.getFullYear(), viewDate.getMonth(), settings.weekStartsOn), [viewDate, settings.weekStartsOn]);
  const dayLabels = useMemo(() => getDayLabels(settings.weekStartsOn), [settings.weekStartsOn]);
  const today = new Date();

  const ordersByDay = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      const d = new Date(o.pickupDateTime);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map[key] = map[key] || [];
      map[key].push(o);
    });
    return map;
  }, [orders]);

  const getOrdersForDate = (date) => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const list = ordersByDay[key] || [];
    return [...list].sort((a, b) => new Date(a.pickupDateTime) - new Date(b.pickupDateTime));
  };

  // Handle focus from notification click
  useEffect(() => {
    if (!focusOrderId) return;
    const order = orders.find(o => o.id === focusOrderId);
    if (!order) { onClearFocus(); return; }
    const d = new Date(order.pickupDateTime);
    setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelectedDate(d);
    setHighlightedId(focusOrderId);
    onClearFocus();
    setTimeout(() => setHighlightedId(null), 2400);
  }, [focusOrderId, orders, onClearFocus]);

  const selectedOrders = getOrdersForDate(selectedDate);
  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const goPrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const goNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  const goToday = () => { const t = new Date(); setViewDate(t); setSelectedDate(t); };

  const handleExportAll = () => {
    onExportAllUpcoming();
    setExportAllState('done');
    setTimeout(() => setExportAllState(''), 2400);
  };

  const reminderSummary = settings.reminderOffsets.length === 0 ? 'no reminders'
    : settings.reminderOffsets.map(offsetToShortLabel).join(' + ') + ' before';

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
        <div style={{ fontSize: '13px', color: C.inkSoft, letterSpacing: '0.04em' }}>
          {orders.length} {orders.length === 1 ? 'order' : 'orders'} total
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {upcomingCount > 0 && (
            <button className="cal-export-btn" onClick={handleExportAll}
              title={`Export upcoming orders to your phone's Calendar (${reminderSummary})`}
              style={{
                padding: '10px 12px', background: C.card, border: `1px solid ${C.border}`,
                borderRadius: '10px', color: C.inkSoft, fontFamily: 'inherit', fontSize: '13px',
                fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
              {exportAllState === 'done'
                ? <><Check size={14} strokeWidth={2.4} color={C.sageDeep} /> Downloaded</>
                : <><BellRing size={14} strokeWidth={1.8} /> To Calendar</>}
            </button>
          )}
          <button className="primary-btn" onClick={() => onAdd(selectedDate)} style={{
            padding: '10px 14px', background: C.sageDeep, border: 'none', borderRadius: '10px',
            color: C.card, fontFamily: 'inherit', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <Plus size={15} strokeWidth={2.2} /> New order
          </button>
        </div>
      </div>

      {orders.length > 0 && upcomingCount > 0 && settings.reminderOffsets.length > 0 && (
        <div style={{
          padding: '8px 12px', background: `${C.sage}15`, border: `1px solid ${C.sage}44`,
          borderRadius: '8px', fontSize: '11px', color: C.sageDeep, lineHeight: 1.5,
          marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <BellRing size={12} strokeWidth={2} style={{ flexShrink: 0 }} />
          <span>
            <strong>Reminders:</strong> alerts fire {settings.reminderOffsets.map(offsetToLabel).join(', ')} on this device, plus calendar exports include them.
          </span>
        </div>
      )}

      {/* Legend bubble — sits above the calendar so the grid stays uncluttered. */}
      <div style={{
        background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: '12px',
        padding: '10px 14px', marginBottom: '12px',
        display: 'flex', flexDirection: 'column', gap: '6px',
      }}>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '6px 14px', justifyContent: 'center',
          fontSize: '10px', color: C.inkSoft, letterSpacing: '0.04em',
        }}>
          <CalLegendChip color={C.roseDeep} label="Today" shape="circle" />
          <CalLegendChip color={C.sageDeep} label="All paid" />
          <CalLegendChip color={C.plumDeep} label="Mixed" />
          <CalLegendChip color={C.roseDeep} label="Unpaid" />
        </div>
        {(settings.eventTypes || DEFAULT_EVENT_TYPES).length > 0 && (
          <>
            <div style={{ height: '1px', background: C.borderSoft, margin: '2px 0' }} />
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '4px 12px', justifyContent: 'center',
              fontSize: '10px', color: C.inkFaint, letterSpacing: '0.04em',
            }}>
              {(settings.eventTypes || DEFAULT_EVENT_TYPES).map(t => (
                <CalDotChip key={t.key} color={t.color} label={t.label} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="cal-wrap" style={{
        background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: '14px',
        padding: '16px', marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <button onClick={goPrevMonth} className="icon-btn" style={{
            background: 'transparent', border: 'none', padding: '8px', borderRadius: '8px',
            cursor: 'pointer', color: C.inkSoft, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><ChevronLeft size={18} /></button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="serif" style={{ fontSize: '18px', fontWeight: 500, letterSpacing: '-0.01em' }}>
              {monthLabel}
            </div>
            {!sameDay(viewDate, today) && (
              <button onClick={goToday} style={{
                padding: '4px 10px', fontSize: '11px', fontFamily: 'inherit',
                background: C.bg, border: `1px solid ${C.border}`, borderRadius: '10px',
                color: C.inkSoft, cursor: 'pointer', fontWeight: 500,
              }}>Today</button>
            )}
          </div>
          <button onClick={goNextMonth} className="icon-btn" style={{
            background: 'transparent', border: 'none', padding: '8px', borderRadius: '8px',
            cursor: 'pointer', color: C.inkSoft, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><ChevronRight size={18} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '6px' }}>
          {dayLabels.map((d, i) => (
            <div key={i} style={{
              textAlign: 'center', fontSize: '11px', fontWeight: 600,
              color: C.inkFaint, padding: '4px 0', letterSpacing: '0.1em',
            }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
          {grid.map((cell, i) => {
            const isToday = sameDay(cell.date, today);
            const isSelected = sameDay(cell.date, selectedDate);
            const isPast = cell.date < today && !isToday;
            const dayOrders = getOrdersForDate(cell.date);
            const hasOrders = dayOrders.length > 0;
            const hasUnpaid = dayOrders.some(o => !o.paid);
            const earliestTime = hasOrders
              ? new Date(dayOrders[0].pickupDateTime).toLocaleTimeString('en-US', { hour: 'numeric' }).toLowerCase().replace(' ', '')
              : null;
            const timeLabel = !hasOrders ? null
              : dayOrders.length === 1 ? earliestTime
              : `${dayOrders.length}×`;
            // Event-type dots (up to 3 unique colors)
            const eventTypes = settings.eventTypes || DEFAULT_EVENT_TYPES;
            const findColor = (key) => (eventTypes.find(t => t.key === key)?.color) || C.sageDeep;
            const dotColors = [];
            const seen = new Set();
            for (const o of dayOrders) {
              const c = findColor(o.eventType || 'general');
              if (!seen.has(c)) { seen.add(c); dotColors.push(c); }
              if (dotColors.length >= 3) break;
            }
            // Ring color signals payment status:
            //   sage  = all paid
            //   rose  = all unpaid
            //   purple = mixed (some paid, some unpaid)
            // Selected day uses solid bg instead of a ring.
            // Today is marked separately by a red circle overlay (see below) so
            // the "you are here" cue stays distinct from order/payment status.
            const hasPaid = dayOrders.some(o => o.paid);
            const isMixed = hasOrders && hasPaid && hasUnpaid;
            const ringColor = !cell.inMonth ? null
              : isSelected ? null
              : isMixed ? C.plumDeep
              : hasOrders && hasUnpaid ? C.roseDeep
              : hasOrders ? C.sageDeep
              : null;
            const dayNumberColor = isSelected ? C.card
              : !cell.inMonth ? C.inkFaint
              : isPast ? C.inkSoft
              : C.ink;
            // Soft tint inside the ring (uses the ring color at low opacity).
            const ringTint = ringColor ? `${ringColor}1f` : 'transparent';
            return (
              <button key={i} className="cal-day" onClick={() => setSelectedDate(cell.date)}
                aria-label={`${cell.date.toDateString()}${hasOrders ? `, ${dayOrders.length} order${dayOrders.length === 1 ? '' : 's'}, ${hasUnpaid ? 'has unpaid' : 'all paid'}` : ''}`}
                style={{
                  aspectRatio: '1', border: 'none', padding: '4px 2px',
                  background: isSelected ? C.sageDeep : ringTint,
                  color: dayNumberColor,
                  opacity: !cell.inMonth ? 0.4 : 1,
                  borderRadius: '8px', position: 'relative',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', fontFamily: 'inherit',
                  // Inset ring keeps the cell's outer shape exactly the same and never bleeds into neighbors.
                  boxShadow: ringColor ? `inset 0 0 0 3px ${ringColor}` : 'none',
                }}>
                {/* Today marker: a big red circle inscribed inside the square cell.
                    Sits underneath the day number/dots so they read on top of it. */}
                {isToday && cell.inMonth && (
                  <div style={{
                    position: 'absolute', inset: '4px',
                    borderRadius: '50%',
                    border: `2.5px solid ${C.roseDeep}`,
                    pointerEvents: 'none',
                  }} />
                )}
                <div className="cal-day-num" style={{
                  fontSize: '13px', fontWeight: hasOrders || isToday || isSelected ? 700 : 500, lineHeight: 1,
                  color: isToday && !isSelected ? C.roseDeep : undefined,
                  position: 'relative',
                }}>{cell.date.getDate()}</div>
                {hasOrders && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px',
                  }}>
                    {dotColors.map((color, idx) => (
                      <span key={idx} style={{
                        width: '9px', height: '9px', borderRadius: '50%',
                        background: color,
                        display: 'inline-block',
                      }} />
                    ))}
                  </div>
                )}
                {hasOrders && (
                  <div className="cal-day-time" style={{
                    fontSize: '9px', fontWeight: 600, marginTop: '2px', lineHeight: 1,
                    letterSpacing: '0.02em',
                    color: isSelected ? C.card : C.inkSoft,
                  }}>{timeLabel}</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '10px', gap: '10px',
        }}>
          <div className="serif" style={{ fontSize: '26px', fontWeight: 500, letterSpacing: '-0.015em', lineHeight: 1.15 }}>
            {sameDay(selectedDate, today) ? 'Today · ' : ''}{formatLongDate(selectedDate)}
          </div>
          <div style={{ fontSize: '12px', color: C.inkFaint }}>
            {selectedOrders.length} {selectedOrders.length === 1 ? 'order' : 'orders'}
          </div>
        </div>

        {selectedOrders.length === 0 ? (
          <div style={{
            background: C.card, border: `1px dashed ${C.border}`, borderRadius: '12px',
            padding: '32px 20px', textAlign: 'center',
            color: C.inkSoft, fontSize: '14px',
          }}>
            No orders on this day.
            <div style={{ marginTop: '10px' }}>
              <button onClick={() => onAdd(selectedDate)} style={{
                padding: '8px 14px', background: C.sageDeep, border: 'none', borderRadius: '8px',
                color: C.card, fontFamily: 'inherit', fontSize: '13px', fontWeight: 500,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px',
              }}>
                <Plus size={14} strokeWidth={2.2} /> Schedule one
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {selectedOrders.map(o => (
              <OrderCard key={o.id} order={o} settings={settings} highlighted={highlightedId === o.id}
                onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete}
                onTogglePaid={onTogglePaid} onExportOrder={onExportOrder} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CalLegendChip({ color, label, shape = 'square' }) {
  const isCircle = shape === 'circle';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span style={{
        width: '14px', height: '14px',
        borderRadius: isCircle ? '50%' : '4px',
        background: 'transparent',
        // Circles use a real border so the ring sits inside the bounds
        // (matching the inscribed today-circle on the calendar cell).
        border: isCircle ? `2px solid ${color}` : 'none',
        boxShadow: isCircle ? 'none' : `0 0 0 2px ${color}`,
        display: 'inline-block', flexShrink: 0,
      }} />
      {label}
    </span>
  );
}

function CalDotChip({ color, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
      <span style={{
        width: '9px', height: '9px', borderRadius: '50%',
        background: color, display: 'inline-block', flexShrink: 0,
        border: isLight(color) ? `1px solid ${C.border}` : 'none',
      }} />
      {label}
    </span>
  );
}

function OrderCard({ order, settings, highlighted, onEdit, onDuplicate, onDelete, onTogglePaid, onExportOrder }) {
  const extrasSum = (order.extraCosts || []).reduce((s, e) => {
    const n = Number(e.amount);
    return s + (isFinite(n) && n > 0 ? n : 0);
  }, 0);
  const addSum = additionalBouquetsSum(order);
  const additionalBouquets = Array.isArray(order.additionalBouquets) ? order.additionalBouquets : [];
  const subtotalRaw = order.quantity * order.costPer + addSum + extrasSum;
  const discAmount = discountAmountOf(subtotalRaw, order.discount);
  const total = Math.max(0, subtotalRaw - discAmount);
  const paymentList = (settings && settings.paymentMethods) || PAYMENT_METHODS;
  const payment = paymentList.find(p => p.key === order.paymentMethod) || paymentList[paymentList.length - 1];
  // Split-payment aware status. Falls back to legacy `order.paid` if the
  // order hasn't been migrated yet.
  const payments = Array.isArray(order.payments) ? order.payments : [];
  const paidSum = payments.reduce((s, p) => s + (p.paid ? (Number(p.amount) || 0) : 0), 0);
  const paidState = payments.length > 0
    ? (paidSum <= 0 ? 'unpaid' : (paidSum + 0.001 >= total ? 'paid' : 'partial'))
    : (order.paid ? 'paid' : 'unpaid');
  const outstanding = Math.max(0, total - paidSum);
  const cardMessages = Array.isArray(order.cardMessages) && order.cardMessages.length > 0
    ? order.cardMessages
    : (order.cardMessage ? [order.cardMessage] : []);
  const eventTypes = (settings && settings.eventTypes) || DEFAULT_EVENT_TYPES;
  const eventType = eventTypes.find(t => t.key === (order.eventType || 'general'));
  const isPast = new Date(order.pickupDateTime) < new Date();
  const remindersOn = order.enableReminders !== false;
  const [calState, setCalState] = useState('');

  const handleCal = () => {
    onExportOrder(order);
    setCalState('done');
    setTimeout(() => setCalState(''), 2400);
  };

  return (
    <div className="order-card" style={{
      background: C.card,
      border: `1px solid ${
        highlighted ? C.sageDeep
        : paidState === 'partial' ? C.roseDeep
        : paidState === 'paid' ? C.borderSoft
        : C.gold
      }`,
      boxShadow: highlighted ? `0 0 0 3px ${C.sage}44`
        : paidState === 'partial' ? `0 0 0 3px ${C.roseDeep}33`
        : 'none',
      borderRadius: '12px', padding: '14px 16px',
      opacity: isPast ? 0.78 : 1,
      display: 'flex', flexDirection: 'column', gap: '10px',
      transition: 'all 300ms ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
            <div className="serif" style={{
              fontSize: '18px', fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.2,
            }}>{order.customerName}</div>
            {paidState === 'paid' ? (
              <span style={{
                fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: C.sageDeep, background: `${C.sage}22`,
                padding: '2px 7px', borderRadius: '4px',
                display: 'inline-flex', alignItems: 'center', gap: '3px',
              }}><Check size={10} strokeWidth={3} /> Paid</span>
            ) : paidState === 'partial' ? (
              <span style={{
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: C.card, background: C.roseDeep,
                padding: '2px 7px', borderRadius: '4px',
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                boxShadow: `0 0 0 2px ${C.roseDeep}33`,
              }}><AlertCircle size={10} strokeWidth={2.6} /> ${outstanding.toFixed(2)} owed</span>
            ) : (
              <span style={{
                fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: C.gold, background: `${C.gold}22`,
                padding: '2px 7px', borderRadius: '4px',
              }}>Unpaid</span>
            )}
            {eventType && (
              <span title={`Event: ${eventType.label}`} style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                color: C.inkSoft, background: `${eventType.color}33`,
                padding: '2px 7px', borderRadius: '4px',
              }}>
                <span style={{
                  width: '7px', height: '7px', borderRadius: '50%', background: eventType.color,
                  border: isLight(eventType.color) ? `1px solid ${C.border}` : 'none',
                  display: 'inline-block', flexShrink: 0,
                }} />
                {eventType.label}
              </span>
            )}
            {!remindersOn && !isPast && (
              <span title="Reminders off for this order" style={{
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: C.inkFaint, background: C.bg,
                padding: '2px 7px', borderRadius: '4px',
              }}><BellOff size={10} strokeWidth={2.2} /> Silent</span>
            )}
          </div>
          {order.arrangement && (
            <div style={{ fontSize: '13px', color: C.inkSoft, marginBottom: '2px' }}>
              {order.arrangement}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          {onDuplicate && (
            <button className="icon-btn" onClick={() => onDuplicate(order)} title="Duplicate order" aria-label="Duplicate order" style={{
              background: 'transparent', border: 'none', padding: '11px', borderRadius: '8px',
              cursor: 'pointer', color: C.inkSoft,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Copy size={16} strokeWidth={1.8} /></button>
          )}
          <button className="icon-btn" onClick={() => onEdit(order)} title="Edit" aria-label="Edit order" style={{
            background: 'transparent', border: 'none', padding: '11px', borderRadius: '8px',
            cursor: 'pointer', color: C.inkSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Pencil size={16} strokeWidth={1.8} /></button>
          <DeleteButton onConfirm={() => onDelete(order.id)} label="Delete order" compact />
        </div>
      </div>

      {/* Info grid on the left, big Total on the right. Total is the
          headline number — should pop visually. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          flex: 1, minWidth: 0,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 14px',
        }}>
          <InfoRow icon={<Clock size={12} strokeWidth={1.8} />} label="Pickup" value={formatPickupTime(order.pickupDateTime)} />
          <InfoRow
            icon={(() => { const I = paymentIconFor(payment.key); return <I size={12} strokeWidth={1.8} />; })()}
            label="Payment" value={payment.label}
          />
          <InfoRow
            icon={<Flower2 size={12} strokeWidth={1.8} />}
            label="Quantity" value={`${order.quantity} × $${order.costPer.toFixed(2)}`}
          />
        </div>
        <div style={{
          flexShrink: 0, textAlign: 'right',
          padding: '6px 0',
        }}>
          <div style={{
            fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: C.inkFaint, marginBottom: '2px',
          }}>Total</div>
          <div className="serif" style={{
            fontSize: '26px', fontWeight: 600, color: C.ink,
            letterSpacing: '-0.01em', lineHeight: 1.05,
          }}>${total.toFixed(2)}</div>
          {order.discount && Number(order.discount.value) > 0 && discAmount > 0 && (
            <div style={{
              marginTop: '2px', fontSize: '11px', fontWeight: 600, color: C.gold,
            }}>
              {order.discount.kind === 'percent'
                ? `${order.discount.value}% off`
                : `$${Number(order.discount.value).toFixed(2)} off`}
            </div>
          )}
        </div>
      </div>

      {additionalBouquets.length > 0 && (
        <div style={{
          padding: '10px 12px', background: C.bg,
          border: `1px solid ${C.borderSoft}`, borderRadius: '8px',
        }}>
          <div style={{
            fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: C.inkFaint, marginBottom: '6px',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <Sheet size={11} strokeWidth={2} /> {additionalBouquets.length} more bouquet{additionalBouquets.length === 1 ? '' : 's'} in this order
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {additionalBouquets.map((b, i) => {
              const qty = Number(b.quantity) || 0;
              const price = Number(b.costPer) || 0;
              const lineTotal = qty * price;
              const bqCards = Array.isArray(b.cardMessages) ? b.cardMessages.filter(Boolean) : [];
              return (
                <div key={b.id || i} style={{
                  paddingTop: i > 0 ? '6px' : 0,
                  borderTop: i > 0 ? `1px dashed ${C.borderSoft}` : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: C.ink, lineHeight: 1.3 }}>
                        {b.name || <span style={{ fontStyle: 'italic', color: C.inkFaint }}>Unnamed bouquet</span>}
                        {b.recipientLabel && (
                          <span style={{ color: C.inkFaint, fontWeight: 400 }}> — For {b.recipientLabel}</span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: C.inkFaint, marginTop: '2px' }}>
                        {qty} × ${price.toFixed(2)}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '14px', fontWeight: 600, color: C.sageDeep,
                      flexShrink: 0, alignSelf: 'center',
                    }}>${lineTotal.toFixed(2)}</div>
                  </div>
                  {bqCards.length > 0 && (
                    <div style={{
                      marginTop: '6px', paddingLeft: '10px',
                      borderLeft: `2px solid ${C.gold}55`,
                    }}>
                      {bqCards.map((m, ci) => (
                        <div key={ci} className="italic" style={{
                          fontSize: '12px', color: C.inkSoft, lineHeight: 1.4,
                          marginBottom: ci < bqCards.length - 1 ? '3px' : 0,
                        }}>"{m}"</div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {((order.items && order.items.length > 0) || (order.extraCosts && order.extraCosts.length > 0)) && (
        <details style={{
          fontSize: '12px', color: C.inkSoft, lineHeight: 1.5,
          padding: '8px 10px', background: C.bg, borderRadius: '8px',
        }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600, color: C.inkSoft, listStyle: 'none' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Flower2 size={11} strokeWidth={2} /> Arrangement
            </span>
          </summary>
          {order.items && order.items.length > 0 && (
            <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {order.items.map((it, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', gap: '8px',
                  opacity: it.included === false ? 0.55 : 1,
                  textDecoration: it.included === false ? 'line-through' : 'none',
                }}>
                  <span>{it.qty}× {it.name}</span>
                  {it.included === false && <span style={{ fontSize: '10px', fontStyle: 'italic' }}>not counted</span>}
                </div>
              ))}
            </div>
          )}
          {order.extraCosts && order.extraCosts.length > 0 && (
            <div style={{
              marginTop: '6px', paddingTop: '6px',
              borderTop: order.items && order.items.length > 0 ? `1px solid ${C.borderSoft}` : 'none',
              display: 'flex', flexDirection: 'column', gap: '3px',
            }}>
              {order.extraCosts.map((e, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <span>+ {e.label}</span>
                  <span style={{ fontWeight: 600 }}>${Number(e.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </details>
      )}

      {cardMessages.length > 0 && (
        <div style={{
          padding: '10px 12px', background: `${C.gold}10`, border: `1px dashed ${C.gold}66`,
          borderRadius: '8px',
        }}>
          <div style={{
            fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: C.gold, marginBottom: '6px',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <Pencil size={11} strokeWidth={2} />
            {cardMessages.length === 1 ? 'Card message' : `${cardMessages.length} card messages`}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {cardMessages.map((m, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px',
                paddingTop: i > 0 ? '6px' : 0,
                borderTop: i > 0 ? `1px dashed ${C.gold}33` : 'none',
              }}>
                {cardMessages.length > 1 && (
                  <div style={{
                    fontSize: '10px', fontWeight: 700, color: C.gold, letterSpacing: '0.04em',
                    flexShrink: 0, paddingTop: '2px', minWidth: '20px',
                  }}>#{i + 1}</div>
                )}
                <div className="italic" style={{
                  fontSize: '14px', color: C.ink, lineHeight: 1.5,
                  whiteSpace: 'pre-wrap', flex: 1, minWidth: 0,
                }}>"{m}"</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {order.notes && (
        <div style={{
          fontSize: '12px', color: C.inkSoft, lineHeight: 1.5,
          padding: '8px 10px', background: C.bg, borderRadius: '8px', fontStyle: 'italic',
        }}>{order.notes}</div>
      )}

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: '8px', borderTop: `1px solid ${C.borderSoft}`, gap: '8px', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button onClick={() => onTogglePaid(order.id)} style={{
            padding: '6px 12px', fontSize: '12px', fontFamily: 'inherit',
            background: paidState === 'paid' ? C.card : C.sageDeep,
            border: `1px solid ${paidState === 'paid' ? C.border : C.sageDeep}`,
            borderRadius: '8px',
            color: paidState === 'paid' ? C.inkSoft : C.card,
            cursor: 'pointer', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            {paidState === 'paid' ? <>Mark unpaid</>
              : paidState === 'partial' ? <><Check size={12} strokeWidth={2.4} /> Mark fully paid</>
              : <><Check size={12} strokeWidth={2.4} /> Mark paid</>}
          </button>
          {!isPast && (
            <button className="cal-action-btn" onClick={handleCal}
              title="Add this pickup to your phone's Calendar"
              style={{
                padding: '6px 12px', fontSize: '12px', fontFamily: 'inherit',
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: '8px', color: C.inkSoft,
                cursor: 'pointer', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: '5px',
              }}>
              {calState === 'done'
                ? <><Check size={12} strokeWidth={2.4} color={C.sageDeep} /> Saved</>
                : <><CalendarPlus size={12} strokeWidth={2} /> To Calendar</>}
            </button>
          )}
        </div>
        {isPast && (
          <div style={{ fontSize: '11px', color: C.inkFaint, fontStyle: 'italic' }}>
            Pickup was {formatRelative(order.pickupDateTime)}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: C.inkFaint, marginBottom: '2px',
      }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: '13px', color: C.ink, fontWeight: 500 }}>{value}</div>
    </div>
  );
}

// Compute per-bouquet base (catalog) and effective (override-or-catalog) ranges.
// "base" = what materials actually cost her. "effective" = what she's charging for them.
// Items may include kind:'bouquet' which expands to its internal items, with the
// bouquet's fixedPrice (if set) replacing the effective contribution.
function computeMaterialRanges(items, flowers, materials, bouquets) {
  let baseMin = 0, baseMax = 0;
  let effMin = 0, effMax = 0;
  let hasAny = false;
  (items || []).forEach(it => {
    if (!it.included) return;

    if (it.kind === 'bouquet') {
      const bq = (bouquets || []).find(x => x.id === it.id);
      if (!bq) return;
      // Recurse into the bouquet's contents for BASE cost.
      const inner = computeMaterialRanges(bq.items || [], flowers, materials, bouquets);
      baseMin += inner.baseMin * it.qty;
      baseMax += inner.baseMax * it.qty;
      // Effective: if bouquet has a fixedPrice, use it; otherwise use inner effective.
      if (typeof bq.fixedPrice === 'number' && isFinite(bq.fixedPrice)) {
        effMin += bq.fixedPrice * it.qty;
        effMax += bq.fixedPrice * it.qty;
      } else {
        effMin += inner.effMin * it.qty;
        effMax += inner.effMax * it.qty;
      }
      hasAny = true;
      return;
    }

    const ref = it.kind === 'flower'
      ? (flowers || []).find(x => x.id === it.id)
      : (materials || []).find(x => x.id === it.id);
    let bMin = 0, bMax = 0;
    if (it.kind === 'flower' && ref) {
      if (ref.mode === 'perStem') { const p = ref.bunchPrice / ref.bunchCount; bMin = p; bMax = p; }
      else { bMin = ref.flatMin; bMax = ref.flatMax; }
    } else if (ref) {
      bMin = ref.unitPrice || 0; bMax = ref.unitPrice || 0;
    } else {
      // Item references a deleted catalog entry; skip
      return;
    }
    baseMin += bMin * it.qty;
    baseMax += bMax * it.qty;
    const hasOverride = typeof it.unitPriceOverride === 'number' && isFinite(it.unitPriceOverride);
    if (hasOverride) {
      effMin += it.unitPriceOverride * it.qty;
      effMax += it.unitPriceOverride * it.qty;
    } else {
      effMin += bMin * it.qty;
      effMax += bMax * it.qty;
    }
    hasAny = true;
  });
  return { baseMin, baseMax, effMin, effMax, hasAny };
}

// Resize + JPEG-compress an uploaded image to a data URL (max 800px wide, ~0.8 quality).
function compressImageFile(file, maxWidth = 800, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        try { resolve(canvas.toDataURL('image/jpeg', quality)); }
        catch (err) { reject(err); }
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function sumExtras(extras) {
  return (extras || []).reduce((s, e) => {
    const n = parseFloat(e.amount);
    return s + (isFinite(n) && n > 0 ? n : 0);
  }, 0);
}

// Apply a discount object to a subtotal. Returns the dollar amount to deduct
// (capped at the subtotal so it can never go negative).
function discountAmountOf(subtotal, discount) {
  if (!discount) return 0;
  const v = Number(discount.value) || 0;
  if (v <= 0) return 0;
  if (discount.kind === 'percent') {
    return Math.min(subtotal, subtotal * Math.min(100, Math.max(0, v)) / 100);
  }
  return Math.min(subtotal, Math.max(0, v));
}

// Single source of truth for "what the customer pays" on a saved order.
// Used by OrderCard, ReceiptModal, calendar exports, and Stats so the
// discount field is honored everywhere consistently.
function orderCustomerTotal(order) {
  const qty = Number(order.quantity) || 0;
  const costPer = Number(order.costPer) || 0;
  const subtotal = qty * costPer + sumExtras(order.extraCosts);
  return Math.max(0, subtotal - discountAmountOf(subtotal, order.discount));
}

// Build a price-stable snapshot of a cart-shape item for storage on an order.
// Captures current catalog prices so historical orders stay accurate even if
// the catalog changes later. Bouquet kind also captures its inner contents.
function snapshotItem(item, flowers, materials, bouquets) {
  const hasOverride = typeof item.unitPriceOverride === 'number' && isFinite(item.unitPriceOverride);

  if (item.kind === 'bouquet') {
    const bq = (bouquets || []).find(x => x.id === item.id);
    const inner = computeMaterialRanges(bq?.items || [], flowers, materials, bouquets);
    const innerEffMid = (inner.effMin + inner.effMax) / 2;
    const hasFixedPrice = bq && typeof bq.fixedPrice === 'number' && isFinite(bq.fixedPrice);
    const unitPrice = hasFixedPrice ? bq.fixedPrice : innerEffMid;
    const unitBase = (inner.baseMin + inner.baseMax) / 2;
    return {
      kind: 'bouquet', id: item.id,
      name: bq ? bq.name : 'Removed bouquet',
      qty: item.qty, included: item.included !== false,
      unitMin: unitPrice, unitMax: unitPrice,
      unitBase,
      ...(hasFixedPrice ? { fixedPrice: bq.fixedPrice, isBundled: true } : {}),
      contents: (bq?.items || []).map(sub => {
        const subRef = sub.kind === 'flower'
          ? (flowers || []).find(x => x.id === sub.id)
          : (materials || []).find(x => x.id === sub.id);
        return { kind: sub.kind, id: sub.id, name: subRef ? subRef.name : 'Removed', qty: sub.qty };
      }),
    };
  }

  const ref = item.kind === 'flower'
    ? (flowers || []).find(x => x.id === item.id)
    : (materials || []).find(x => x.id === item.id);
  let unitMin = 0, unitMax = 0, unitBase = 0;
  if (item.kind === 'flower' && ref) {
    if (ref.mode === 'perStem') { const p = ref.bunchPrice / ref.bunchCount; unitMin = p; unitMax = p; unitBase = p; }
    else { unitMin = ref.flatMin; unitMax = ref.flatMax; unitBase = (ref.flatMin + ref.flatMax) / 2; }
  } else if (ref) {
    const p = ref.unitPrice || 0;
    unitMin = p; unitMax = p; unitBase = p;
  }
  if (hasOverride) { unitMin = item.unitPriceOverride; unitMax = item.unitPriceOverride; }
  return {
    kind: item.kind, id: item.id,
    name: ref ? ref.name : (item.name || 'Removed item'),
    qty: item.qty, included: item.included !== false,
    unitMin, unitMax, unitBase,
    ...(hasOverride ? { priceOverridden: true } : {}),
  };
}

// Aggregate orders into profit + catalog stats for a given time period.
// period: { mode: 'all' } | { mode: 'year', year } | { mode: 'month', year, month }
// resetAt: ISO string — orders with pickup before this are excluded from stats.
function computeStats(orders, period = { mode: 'month' }, resetAt = null) {
  let startMs = -Infinity, endMs = Infinity;
  if (period.mode === 'year' && Number.isFinite(period.year)) {
    startMs = new Date(period.year, 0, 1).getTime();
    endMs = new Date(period.year + 1, 0, 1).getTime();
  } else if (period.mode === 'month' && Number.isFinite(period.year) && Number.isFinite(period.month)) {
    startMs = new Date(period.year, period.month, 1).getTime();
    endMs = new Date(period.year, period.month + 1, 1).getTime();
  }
  const resetMs = resetAt ? new Date(resetAt).getTime() : -Infinity;
  const effectiveStartMs = Math.max(startMs, isFinite(resetMs) ? resetMs : -Infinity);

  const filtered = (orders || []).filter(o => {
    if (!o.pickupDateTime) return false;
    const ms = new Date(o.pickupDateTime).getTime();
    return isFinite(ms) && ms >= effectiveStartMs && ms < endMs;
  });

  let revenue = 0, cost = 0, paidRevenue = 0, unpaidRevenue = 0;
  const flowerUse = {};   // id -> { name, qty, revenue }
  const materialUse = {}; // id -> { name, qty, revenue }
  const customers = {};   // name -> { count, revenue }
  const payments = {};    // method -> { count, revenue }

  filtered.forEach(o => {
    const orderQty = Number(o.quantity) || 0;
    const orderExtras = sumExtras(o.extraCosts);
    const orderSubtotal = orderQty * (Number(o.costPer) || 0) + orderExtras;
    // Revenue = what the customer actually pays (post-discount).
    const orderRevenue = Math.max(0, orderSubtotal - discountAmountOf(orderSubtotal, o.discount));
    revenue += orderRevenue;
    if (o.paid) paidRevenue += orderRevenue; else unpaidRevenue += orderRevenue;

    let orderCost = 0;
    (o.items || []).forEach(it => {
      if (it.included === false) return;
      // Prefer unitBase (added in v5+); fall back to unitMin for legacy snapshots.
      const baseUnit = typeof it.unitBase === 'number' ? it.unitBase : (Number(it.unitMin) || 0);
      orderCost += baseUnit * Number(it.qty || 0) * orderQty;

      const useMap = it.kind === 'flower' ? flowerUse : materialUse;
      const entry = useMap[it.id] || { name: it.name, qty: 0, revenue: 0 };
      entry.qty += Number(it.qty || 0) * orderQty;
      useMap[it.id] = entry;
    });
    cost += orderCost;

    const cust = (o.customerName || '').trim() || '(unnamed)';
    customers[cust] = customers[cust] || { count: 0, revenue: 0 };
    customers[cust].count += 1;
    customers[cust].revenue += orderRevenue;

    const pay = o.paymentMethod || 'other';
    payments[pay] = payments[pay] || { count: 0, revenue: 0 };
    payments[pay].count += 1;
    payments[pay].revenue += orderRevenue;
  });

  const profit = revenue - cost;
  const avgOrderRevenue = filtered.length > 0 ? revenue / filtered.length : 0;
  const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0;

  const byQty = (a, b) => b[1].qty - a[1].qty;
  const byRevenue = (a, b) => b[1].revenue - a[1].revenue;

  return {
    count: filtered.length,
    revenue, cost, profit, paidRevenue, unpaidRevenue,
    avgOrderRevenue, marginPct,
    topFlowers: Object.entries(flowerUse).sort(byQty).slice(0, 5),
    topMaterials: Object.entries(materialUse).sort(byQty).slice(0, 5),
    topCustomers: Object.entries(customers).sort(byRevenue).slice(0, 5),
    paymentBreakdown: Object.entries(payments).sort(byRevenue),
    orders: filtered.slice().sort((a, b) => new Date(b.pickupDateTime) - new Date(a.pickupDateTime)),
  };
}

function PricingPanel({
  quantity, items, flowers, materials, bouquets,
  extraCosts, onChangeExtras,
  discount, onChangeDiscount,
  hideQty = false, // when true, treats quantity as 1 (used in cart)
  hideTotal = false, // when true, hides the "Customer pays $X" row (cart shows it in the footer)
}) {
  const qty = hideQty ? 1 : (parseInt(quantity) || 0);
  const validQty = qty > 0;
  const effQty = validQty ? qty : 1;
  const { baseMin, baseMax, effMin, effMax, hasAny: hasMaterial } = computeMaterialRanges(items, flowers, materials, bouquets);
  const effMidPer = (effMin + effMax) / 2;
  const extrasTotal = sumExtras(extraCosts);

  // Pre-discount customer total
  const subtotal = effMidPer * effQty + extrasTotal;
  // Discount: { kind: 'flat'|'percent', value: number }. Flat = $ off, Percent = % off.
  // Capped so total can't go below $0.
  const discountKind = (discount && discount.kind === 'percent') ? 'percent' : 'flat';
  const discountValue = Number(discount && discount.value) || 0;
  const discountAmount = discountKind === 'percent'
    ? Math.min(subtotal, subtotal * Math.min(100, Math.max(0, discountValue)) / 100)
    : Math.min(subtotal, Math.max(0, discountValue));
  const customerTotal = Math.max(0, subtotal - discountAmount);

  // Material cost (her actual cost) ranges, scaled to qty
  const matBaseTotalMin = baseMin * effQty;
  const matBaseTotalMax = baseMax * effQty;
  const matEffTotalMin = effMin * effQty;
  const matEffTotalMax = effMax * effQty;
  // Margin = (effective × qty + extras − discount) − (base × qty)
  const marginMin = matEffTotalMin + extrasTotal - discountAmount - matBaseTotalMax;
  const marginMax = matEffTotalMax + extrasTotal - discountAmount - matBaseTotalMin;

  const fmt = (n) => `$${n.toFixed(2)}`;
  const fmtRange = (lo, hi) => Math.abs(lo - hi) < 0.005 ? fmt(lo) : `${fmt(lo)} – ${fmt(hi)}`;
  const marginColor = !hasMaterial && extrasTotal === 0 ? C.inkSoft
    : marginMin < 0 ? C.roseDeep
    : marginMin < (matBaseTotalMax || 0) * 0.25 ? C.gold
    : C.sageDeep;

  const updateExtra = (index, patch) => {
    const next = (extraCosts || []).map((e, i) => i === index ? { ...e, ...patch } : e);
    onChangeExtras(next);
  };
  const addExtra = () => onChangeExtras([...(extraCosts || []), { label: '', amount: '' }]);
  const removeExtra = (index) => onChangeExtras((extraCosts || []).filter((_, i) => i !== index));

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.borderSoft}`,
      borderRadius: '14px', padding: '14px', marginBottom: '12px',
    }}>
      <div style={{
        fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: C.inkFaint, marginBottom: '10px',
      }}>Pricing</div>

      {hasMaterial && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          gap: '8px', marginBottom: '6px',
        }}>
          <span style={{ fontSize: '12px', color: C.inkSoft }}>
            Material cost{!hideQty && validQty && qty > 1 ? ` (${qty}×)` : ''}
          </span>
          <span style={{ fontSize: '13px', fontWeight: 500, color: C.inkSoft }}>
            {fmtRange(matBaseTotalMin, matBaseTotalMax)}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
        {(extraCosts || []).map((e, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <input
              type="text" value={e.label || ''}
              onChange={(ev) => updateExtra(i, { label: ev.target.value })}
              placeholder="e.g. Labor, delivery"
              style={{
                flex: 1, minWidth: 0, padding: '7px 10px', fontSize: '12px',
                fontFamily: 'inherit', background: C.card,
                border: `1px solid ${C.border}`, borderRadius: '7px', color: C.ink,
              }}
            />
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <span style={{
                position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
                fontSize: '12px', color: C.inkFaint, pointerEvents: 'none',
              }}>$</span>
              <input
                type="number" min="0" step="0.01" inputMode="decimal"
                value={e.amount ?? ''}
                onChange={(ev) => updateExtra(i, { amount: ev.target.value })}
                placeholder="0.00"
                style={{
                  width: '90px', padding: '7px 8px 7px 18px', fontSize: '12px',
                  fontFamily: 'inherit', background: C.card,
                  border: `1px solid ${C.border}`, borderRadius: '7px',
                  color: C.ink, textAlign: 'right',
                }}
              />
            </div>
            <button type="button" onClick={() => removeExtra(i)} aria-label="Remove extra"
              style={{
                background: 'transparent', border: 'none', padding: '6px',
                cursor: 'pointer', color: C.inkFaint,
                display: 'flex', alignItems: 'center',
              }}><X size={14} /></button>
          </div>
        ))}
        <button type="button" onClick={addExtra} style={{
          padding: '6px 10px', background: 'transparent',
          border: `1px dashed ${C.border}`, borderRadius: '7px',
          color: C.inkSoft, fontFamily: 'inherit', fontSize: '11px', fontWeight: 500,
          cursor: 'pointer', alignSelf: 'flex-start',
          display: 'inline-flex', alignItems: 'center', gap: '4px',
        }}>
          <Plus size={12} strokeWidth={2.2} /> Add extra cost
        </button>
      </div>

      {/* Discount — opt-in. Hidden behind a small "+ Add discount" button
          until activated. Once active, stays visible even when the input is
          empty (clearing the field shouldn't dismiss the editor — only the
          X button or pressing the active $/% toggle removes it). */}
      {onChangeDiscount && !discount && (
        <button type="button"
          onClick={() => onChangeDiscount({ kind: 'flat', value: 0 })}
          style={{
            marginBottom: '8px', padding: '6px 10px', background: 'transparent',
            border: `1px dashed ${C.border}`, borderRadius: '7px',
            color: C.inkSoft, fontFamily: 'inherit', fontSize: '11px', fontWeight: 500,
            cursor: 'pointer', alignSelf: 'flex-start',
            display: 'inline-flex', alignItems: 'center', gap: '4px',
          }}>
          <Plus size={12} strokeWidth={2.2} /> Add discount
        </button>
      )}
      {onChangeDiscount && discount && (
        <div style={{
          marginBottom: '8px', padding: '8px 10px',
          background: C.bg,
          border: `1px solid ${C.borderSoft}`,
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: C.inkSoft, letterSpacing: '0.04em', flexShrink: 0 }}>
            DISCOUNT
          </span>
          {/* Flat / Percent toggle — highlights the active mode immediately
              on press (regardless of value). The X button is the dismiss; the
              toggle is just for switching kind. */}
          <div style={{ display: 'flex', gap: '2px', background: C.card, borderRadius: '6px', padding: '2px' }}>
            <button type="button"
              title="$ off"
              onClick={() => onChangeDiscount({ kind: 'flat', value: discountValue })}
              style={{
                padding: '3px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                background: discountKind === 'flat' ? C.sageDeep : 'transparent',
                color: discountKind === 'flat' ? C.card : C.inkSoft,
                fontFamily: 'inherit', fontSize: '11px', fontWeight: 600,
              }}>$</button>
            <button type="button"
              title="% off"
              onClick={() => onChangeDiscount({ kind: 'percent', value: discountValue })}
              style={{
                padding: '3px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                background: discountKind === 'percent' ? C.sageDeep : 'transparent',
                color: discountKind === 'percent' ? C.card : C.inkSoft,
                fontFamily: 'inherit', fontSize: '11px', fontWeight: 600,
              }}>%</button>
          </div>
          <input type="number" min="0" step={discountKind === 'percent' ? '1' : '0.01'}
            value={discountValue || ''}
            placeholder={discountKind === 'percent' ? '10' : '5.00'}
            onChange={(e) => {
              const v = e.target.value;
              // Empty field keeps the editor open (value goes to 0). The X
              // button is the only way to fully remove the discount, so
              // backspacing doesn't accidentally dismiss the field.
              if (v === '') onChangeDiscount({ kind: discountKind, value: 0 });
              else {
                const n = parseFloat(v);
                if (isFinite(n) && n >= 0) onChangeDiscount({ kind: discountKind, value: n });
              }
            }}
            style={{
              flex: 1, minWidth: 0, padding: '4px 8px', fontSize: '13px', fontFamily: 'inherit',
              background: C.card, border: `1px solid ${C.border}`, borderRadius: '6px',
              color: C.ink, textAlign: 'right',
            }} />
          {discountAmount > 0 && (
            <span style={{ fontSize: '12px', fontWeight: 600, color: C.gold, flexShrink: 0 }}>
              −${discountAmount.toFixed(2)}
            </span>
          )}
          <button type="button" onClick={() => onChangeDiscount(null)}
            aria-label="Remove discount" title="Remove discount"
            style={{
              background: 'transparent', border: 'none', padding: '4px',
              cursor: 'pointer', color: C.inkFaint,
              display: 'flex', alignItems: 'center', flexShrink: 0,
            }}><X size={14} /></button>
        </div>
      )}

      {!hideTotal && (
        <>
          <div style={{ height: '1px', background: C.borderSoft, margin: '8px 0' }} />
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px',
          }}>
            <span style={{ fontSize: '13px', color: C.inkSoft, fontWeight: 500 }}>Customer pays</span>
            <span className="serif" style={{
              fontSize: '22px', fontWeight: 600, color: C.ink, letterSpacing: '-0.01em',
            }}>{fmt(customerTotal)}</span>
          </div>
          {!hideQty && validQty && qty > 1 && (
            <div style={{ fontSize: '11px', color: C.inkFaint, textAlign: 'right', marginTop: '2px' }}>
              {qty} × {fmt(effMidPer)}{extrasTotal > 0 ? ` + ${fmt(extrasTotal)} extras` : ''}
            </div>
          )}
          {(hideQty || qty <= 1) && extrasTotal > 0 && (
            <div style={{ fontSize: '11px', color: C.inkFaint, textAlign: 'right', marginTop: '2px' }}>
              {fmt(effMidPer)} materials + {fmt(extrasTotal)} extras
            </div>
          )}
        </>
      )}

      {(hasMaterial || extrasTotal > 0) && (
        <div style={{
          marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${C.borderSoft}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px',
        }}>
          <span style={{ fontSize: '12px', color: C.inkSoft }}>Margin</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: marginColor }}>
            {fmtRange(marginMin, marginMax)}
            {marginMax < 0 && ' (below cost)'}
          </span>
        </div>
      )}
    </div>
  );
}

function RecipeEditor({
  items, flowers, materials, bouquets, itemsByKey,
  setItemQty, setItemIncluded, setItemOverride,
  onAddNewFlower, onAddNewMaterial,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const renderItemRow = (it) => {
    const ref = it.kind === 'flower'
      ? (flowers || []).find(x => x.id === it.id)
      : (materials || []).find(x => x.id === it.id);
    const name = ref ? ref.name : '(removed from catalog)';
    const hasOverride = typeof it.unitPriceOverride === 'number' && isFinite(it.unitPriceOverride);
    let unitNoun = 'each', catalogPlaceholder = '0.00';
    if (it.kind === 'flower' && ref) {
      if (ref.mode === 'perStem') { unitNoun = 'stem'; catalogPlaceholder = (ref.bunchPrice / ref.bunchCount).toFixed(2); }
      else { unitNoun = 'bunch'; catalogPlaceholder = ((ref.flatMin + ref.flatMax) / 2).toFixed(2); }
    } else if (ref) {
      catalogPlaceholder = (ref.unitPrice || 0).toFixed(2);
    }
    return (
      <div key={`${it.kind}:${it.id}`} style={{
        background: it.included ? `${C.sage}10` : C.bg,
        border: `1px solid ${it.included ? C.sage : C.border}`,
        borderRadius: '10px', padding: '10px 12px',
        display: 'flex', flexDirection: 'column', gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="serif" style={{
              fontSize: '14px', fontWeight: 500, color: C.ink,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              {name}
              {hasOverride && (
                <span title="Adjusted price" style={{
                  fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em',
                  color: C.gold, background: `${C.gold}22`,
                  padding: '1px 5px', borderRadius: '3px', flexShrink: 0,
                }}>ADJ</span>
              )}
            </div>
            <div style={{ fontSize: '11px', color: C.inkFaint, marginTop: '1px' }}>
              {it.kind === 'flower' ? 'Flower' : 'Supply'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button onClick={() => setItemQty(it.kind, it.id, it.qty - 1)} aria-label="Less"
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: C.sageDeep, border: 'none', color: C.card, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Minus size={14} strokeWidth={2.5} /></button>
            <div style={{
              minWidth: '22px', textAlign: 'center', fontSize: '14px', fontWeight: 600,
            }}>{it.qty}</div>
            <button onClick={() => setItemQty(it.kind, it.id, it.qty + 1)} aria-label="More"
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: C.sageDeep, border: 'none', color: C.card, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Plus size={14} strokeWidth={2.5} /></button>
            <button onClick={() => setItemQty(it.kind, it.id, 0)} aria-label="Remove from arrangement"
              style={{
                background: 'transparent', border: 'none', padding: '8px',
                cursor: 'pointer', color: C.inkFaint,
                display: 'flex', alignItems: 'center', marginLeft: '2px',
              }}><X size={14} /></button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button onClick={() => setItemIncluded(it.kind, it.id, !it.included)}
            style={{
              padding: '5px 10px', fontSize: '11px', fontFamily: 'inherit',
              background: it.included ? C.sageDeep : C.card,
              border: `1px solid ${it.included ? C.sageDeep : C.border}`,
              borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
              color: it.included ? C.card : C.inkSoft,
              display: 'inline-flex', alignItems: 'center', gap: '4px',
            }}>
            {it.included ? <><Check size={11} strokeWidth={3} /> Counted</> : 'Not counted'}
          </button>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '4px 8px', background: hasOverride ? `${C.gold}15` : C.bg,
            border: `1px solid ${hasOverride ? C.gold : C.border}`, borderRadius: '6px',
          }}>
            <span style={{ fontSize: '11px', color: C.inkSoft }}>$</span>
            <input
              type="number" min="0" step="0.01"
              value={hasOverride ? it.unitPriceOverride : ''}
              onChange={(e) => setItemOverride(it.kind, it.id, e.target.value)}
              placeholder={catalogPlaceholder}
              aria-label="Override unit price"
              style={{
                width: '60px', padding: '2px 0', fontSize: '12px',
                fontFamily: 'inherit', background: 'transparent',
                border: 'none', color: C.ink, textAlign: 'right',
                outline: 'none',
              }}
            />
            <span style={{ fontSize: '11px', color: C.inkFaint }}>/{unitNoun}</span>
            {hasOverride && (
              <button onClick={() => setItemOverride(it.kind, it.id, '')}
                aria-label="Reset to catalog price"
                style={{
                  background: 'transparent', border: 'none', padding: '0 2px', marginLeft: '2px',
                  cursor: 'pointer', color: C.inkFaint, fontSize: '10px',
                  textDecoration: 'underline', fontFamily: 'inherit',
                }}>reset</button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Field label="Arrangement (optional)" hint="What goes in the bouquet. Used to calculate the suggested price.">
      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
          {items.map(renderItemRow)}
        </div>
      )}

      <button type="button" onClick={() => setPickerOpen(true)} style={{
        width: '100%', padding: '12px 14px', background: 'transparent',
        border: `1px dashed ${C.border}`, borderRadius: '10px',
        color: C.inkSoft, fontFamily: 'inherit', fontSize: '13px', fontWeight: 500,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      }}>
        <Plus size={14} strokeWidth={2.2} /> {items.length === 0 ? 'Add flowers & supplies' : 'Add more items'}
      </button>

      {pickerOpen && (
        <PickerOverlay
          flowers={flowers} materials={materials} bouquets={bouquets} itemsByKey={itemsByKey}
          setItemQty={setItemQty}
          onAddNewFlower={onAddNewFlower}
          onAddNewMaterial={onAddNewMaterial}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </Field>
  );
}

// Look up a shopping item's price from the catalog by matching its
// label against flower and supply names (case-insensitive, trimmed).
// Flowers use bunch-level price; supplies use unitPrice. Returns null
// if no match or the matched entry has no price set. Used to auto-fill
// the $ input on shopping rows so she doesn't re-type catalog prices.
function matchCatalogPrice(label, flowers, materials) {
  const key = (label || '').trim().toLowerCase();
  if (!key) return null;
  const f = (flowers || []).find(x => (x.name || '').toLowerCase() === key);
  if (f) {
    if (f.mode === 'perStem') {
      const bp = Number(f.bunchPrice);
      if (isFinite(bp) && bp > 0) return bp;
    } else {
      const mn = Number(f.flatMin) || 0;
      const mx = Number(f.flatMax) || 0;
      if (mn > 0 || mx > 0) return (mn + mx) / 2;
    }
  }
  const m = (materials || []).find(x => (x.name || '').toLowerCase() === key);
  if (m) {
    const p = Number(m.unitPrice);
    if (isFinite(p) && p > 0) return p;
  }
  return null;
}

// Full-screen catalog picker for the Shopping list. Tabs between flowers,
// supplies, and bouquets. Flowers/supplies add a single line; bouquets
// expand into their ingredients so a "Spring mix" pulls in all its
// flowers + supplies as separate shopping lines with their catalog
// prices pre-filled. Overlay stays open so she can add several items
// before tapping Done.
function ShoppingCatalogOverlay({ options, bouquets, flowers, materials, search, setSearch, existingByName, onCommit, onPickBouquet, onCreateFlower, onCreateMaterial, onClose }) {
  const [tab, setTab] = useState('flowers');
  // Staged selections — { "flower:Roses": { qty: 3, price: 12.00, initialQty, initialPrice, existingItemId } }
  // Seeded from what's already on the trip so she sees her current state;
  // tweaking qty/price up or down syncs back to that row on commit.
  // existingItemId (if any) flags the entry as an update target — qty=0 means
  // "remove it". Entries without existingItemId are new additions.
  const [staged, setStaged] = useState(() => {
    if (!existingByName || existingByName.size === 0) return {};
    const initial = {};
    for (const opt of (options || [])) {
      const match = existingByName.get((opt.name || '').toLowerCase());
      if (!match) continue;
      initial[`${opt.kind}:${opt.name}`] = {
        qty: match.qty,
        price: match.price,
        initialQty: match.qty,
        initialPrice: match.price,
        existingItemId: match.itemId,
      };
    }
    return initial;
  });

  const flowerOpts = useMemo(() => options.filter(o => o.kind === 'flower'), [options]);
  const supplyOpts = useMemo(() => options.filter(o => o.kind === 'material'), [options]);
  // Dictionary suggestions scoped by tab — common florist names she hasn't
  // added to her catalog yet. Only surfaced while she's searching so the
  // idle view stays focused on her real catalog.
  const suggestionOpts = useMemo(() => {
    const have = new Set(options.map(o => `${o.kind}:${o.name.toLowerCase()}`));
    const list = [];
    for (const name of COMMON_FLOWER_NAMES) {
      if (!have.has(`flower:${name.toLowerCase()}`)) {
        list.push({ kind: 'flower', name, hint: '/bunch', price: null, isSuggestion: true });
      }
    }
    for (const name of COMMON_SUPPLY_NAMES) {
      if (!have.has(`material:${name.toLowerCase()}`)) {
        list.push({ kind: 'material', name, hint: 'each', price: null, isSuggestion: true });
      }
    }
    return list;
  }, [options]);
  const sortedBouquets = useMemo(() =>
    [...(bouquets || [])].sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))
  , [bouquets]);
  const rawList = tab === 'flowers' ? flowerOpts
    : tab === 'supplies' ? supplyOpts
    : null;
  const visible = useMemo(() => {
    if (!rawList) return [];
    const q = search.trim().toLowerCase();
    if (!q) return rawList;
    // Pool = her catalog for this tab + dictionary suggestions for this tab.
    // Rank: catalog starts-with, catalog contains, suggestion starts-with,
    // suggestion contains — so her own entries always float to the top.
    const suggestionsForTab = tab === 'flowers'
      ? suggestionOpts.filter(o => o.kind === 'flower')
      : (tab === 'supplies' ? suggestionOpts.filter(o => o.kind === 'material') : []);
    const pool = [...rawList, ...suggestionsForTab];
    return pool
      .filter(o => o.name.toLowerCase().includes(q))
      .map(o => ({
        o,
        cat: o.isSuggestion ? 1 : 0,
        starts: o.name.toLowerCase().startsWith(q) ? 0 : 1,
      }))
      .sort((a, b) => a.cat - b.cat || a.starts - b.starts || a.o.name.localeCompare(b.o.name))
      .slice(0, 40)
      .map(x => x.o);
  }, [rawList, suggestionOpts, search, tab]);
  // Quick-create is offered when she's typed a name the catalog doesn't have
  // (case-insensitive). Bouquets are skipped — those live behind the full
  // bouquet builder.
  const trimmedSearch = search.trim();
  const canQuickCreate = tab !== 'bouquets' && trimmedSearch.length > 0
    && !(rawList || []).some(o => o.name.toLowerCase() === trimmedSearch.toLowerCase())
    && ((tab === 'flowers' && typeof onCreateFlower === 'function')
      || (tab === 'supplies' && typeof onCreateMaterial === 'function'));
  const handleQuickCreate = () => {
    if (!canQuickCreate) return;
    const kind = tab === 'flowers' ? 'flower' : 'material';
    const created = kind === 'flower'
      ? onCreateFlower(trimmedSearch)
      : onCreateMaterial(trimmedSearch);
    if (!created) return;
    // Stage with qty=1 so the row appears pre-added the moment the catalog
    // refreshes — she can tweak price in the same spot before tapping Done.
    const opt = { kind, name: created.name, hint: kind === 'flower' ? '/bunch' : 'each', price: null };
    setStagedFor(opt, { qty: 1 });
  };
  const visibleBouquets = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedBouquets;
    return sortedBouquets.filter(b => (b.name || '').toLowerCase().includes(q));
  }, [sortedBouquets, search]);
  const existingKeys = useMemo(() => {
    // Keys of options whose name is already on the trip — drives the "already
    // on list" visual. Built from options+existingByName rather than a raw
    // name set so catalog kind is honored (flower vs material same name).
    const set = new Set();
    if (!existingByName) return set;
    for (const opt of (options || [])) {
      if (existingByName.has((opt.name || '').toLowerCase())) {
        set.add(`${opt.kind}:${opt.name}`);
      }
    }
    return set;
  }, [options, existingByName]);

  const keyOf = (opt) => `${opt.kind}:${opt.name}`;
  const getStaged = (opt) => staged[keyOf(opt)];
  const setStagedFor = (opt, patch) => setStaged(prev => {
    const k = keyOf(opt);
    const cur = prev[k] || { qty: 0, price: typeof opt.price === 'number' ? opt.price : null };
    const next = { ...cur, ...patch };
    // Keep entries for existing trip items even at qty=0 — qty=0 signals
    // "remove this row on commit". Non-existing rows at qty=0 are pure no-ops
    // and can be dropped to keep staged tidy.
    if ((next.qty || 0) <= 0 && !cur.existingItemId) {
      const { [k]: _, ...rest } = prev;
      return rest;
    }
    return { ...prev, [k]: next };
  });
  const incQty = (opt) => {
    const cur = getStaged(opt);
    setStagedFor(opt, { qty: (cur?.qty || 0) + 1 });
  };
  const decQty = (opt) => {
    const cur = getStaged(opt);
    setStagedFor(opt, { qty: Math.max(0, (cur?.qty || 0) - 1) });
  };
  // Footer counts reflect the full post-commit state (what the trip will hold
  // after Save), not net additions. Simpler mental model: match the numbers
  // she's looking at in the rows.
  const stagedCount = Object.values(staged).reduce((s, v) => s + (v.qty || 0), 0);
  const stagedSum = Object.values(staged).reduce((s, v) => s + (v.qty || 0) * (Number(v.price) || 0), 0);
  const hasChanges = Object.values(staged).some(v => {
    const qty = v.qty || 0;
    const initQty = v.initialQty || 0;
    if (qty !== initQty) return true;
    const p = Number(v.price);
    const ip = Number(v.initialPrice);
    const pn = isFinite(p) ? p : null;
    const ipn = isFinite(ip) ? ip : null;
    return pn !== ipn;
  });

  const commitStaged = () => {
    for (const [key, val] of Object.entries(staged)) {
      const [kind, ...rest] = key.split(':');
      const name = rest.join(':');
      const qty = val.qty || 0;
      const initQty = val.initialQty || 0;
      const unchanged = qty === initQty && Number(val.price) === Number(val.initialPrice);
      if (unchanged) continue;
      const opt = { kind, name, price: Number(val.price) || null };
      const lineTotal = qty * (Number(val.price) || 0);
      // Label carries qty prefix so the trip row reads naturally (e.g. "3 Roses").
      const label = qty > 1 ? `${qty} ${name}` : name;
      onCommit({
        opt,
        qty,
        label,
        price: lineTotal > 0 ? lineTotal : null,
        existingItemId: val.existingItemId,
      });
    }
    setStaged({});
    onClose();
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(42,53,40,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', zIndex: 70, backdropFilter: 'blur(4px)',
    }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
        background: C.card, borderRadius: '16px', padding: '18px',
        width: '100%', maxWidth: '460px',
        height: 'min(88vh, 640px)', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(42,53,40,0.3)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
          <div>
            <h2 className="serif" style={{ fontSize: '20px', margin: '0 0 2px', fontWeight: 500, letterSpacing: '-0.01em' }}>
              Add to trip
            </h2>
            <div style={{ fontSize: '12px', color: C.inkSoft }}>
              Tap items to add — prices come from your catalog.
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            background: 'transparent', border: 'none', padding: '8px', borderRadius: '8px',
            cursor: 'pointer', color: C.inkSoft,
          }}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', gap: '4px', background: C.bgDeep, padding: '4px', borderRadius: '10px', marginBottom: '10px', flexShrink: 0 }}>
          <button onClick={() => setTab('flowers')} style={{
            flex: 1, padding: '8px 4px', borderRadius: '8px', border: 'none',
            background: tab === 'flowers' ? C.card : 'transparent',
            color: tab === 'flowers' ? C.ink : C.inkSoft,
            fontFamily: 'inherit', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          }}>
            <Flower2 size={12} strokeWidth={2} /> Flowers <span style={{ opacity: 0.55, fontWeight: 400 }}>{flowerOpts.length}</span>
          </button>
          <button onClick={() => setTab('supplies')} style={{
            flex: 1, padding: '8px 4px', borderRadius: '8px', border: 'none',
            background: tab === 'supplies' ? C.card : 'transparent',
            color: tab === 'supplies' ? C.ink : C.inkSoft,
            fontFamily: 'inherit', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          }}>
            <Tag size={12} strokeWidth={2} /> Supplies <span style={{ opacity: 0.55, fontWeight: 400 }}>{supplyOpts.length}</span>
          </button>
          <button onClick={() => setTab('bouquets')} style={{
            flex: 1, padding: '8px 4px', borderRadius: '8px', border: 'none',
            background: tab === 'bouquets' ? C.card : 'transparent',
            color: tab === 'bouquets' ? C.ink : C.inkSoft,
            fontFamily: 'inherit', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          }}>
            <Sheet size={12} strokeWidth={2} /> Bouquets <span style={{ opacity: 0.55, fontWeight: 400 }}>{sortedBouquets.length}</span>
          </button>
        </div>

        <div style={{ marginBottom: '10px', flexShrink: 0 }}>
          <SearchBar value={search} onChange={setSearch}
            placeholder={tab === 'flowers' ? 'Search flowers…'
              : tab === 'supplies' ? 'Search supplies…'
              : 'Search bouquets…'} />
        </div>

        <div className="no-scrollbar" style={{
          flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px',
        }}>
          {tab === 'bouquets' ? (
            visibleBouquets.length === 0 ? (
              <div style={{ padding: '24px', fontSize: '13px', color: C.inkFaint, fontStyle: 'italic', textAlign: 'center' }}>
                {search.trim()
                  ? `No bouquet matches "${search}".`
                  : 'No saved bouquets yet. Save arrangements as bouquets on the Flowers tab to reuse them here.'}
              </div>
            ) : visibleBouquets.map(bq => {
              const itemCount = (bq.items || []).filter(it => it.included !== false && it.kind !== 'bouquet').length;
              return (
                <button key={bq.id} type="button"
                  onClick={() => onPickBouquet(bq)}
                  style={{
                    width: '100%', padding: '10px 12px', marginBottom: '4px',
                    background: 'transparent',
                    border: `1px solid ${C.borderSoft}`, borderRadius: '8px',
                    fontFamily: 'inherit', fontSize: '14px', color: C.ink,
                    cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: '10px',
                  }}>
                  <Sheet size={14} strokeWidth={2} color={C.sageDeep} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }}>{bq.name || 'Untitled bouquet'}</div>
                    <div style={{ fontSize: '11px', color: C.inkFaint, marginTop: '2px' }}>
                      Drops {itemCount} item{itemCount === 1 ? '' : 's'} into the trip
                    </div>
                  </div>
                  <Plus size={14} strokeWidth={2.4} color={C.sageDeep} />
                </button>
              );
            })
          ) : (
            <>
            {visible.length === 0 && !canQuickCreate ? (
              <div style={{ padding: '24px', fontSize: '13px', color: C.inkFaint, fontStyle: 'italic', textAlign: 'center' }}>
                {search.trim()
                  ? `No ${tab === 'flowers' ? 'flower' : 'supply'} matches "${search}".`
                  : `No ${tab === 'flowers' ? 'flowers' : 'supplies'} yet. Add some on the ${tab === 'flowers' ? 'Flowers' : 'Supplies'} tab first.`}
              </div>
            ) : visible.map(opt => {
              const isAdded = existingKeys.has(`${opt.kind}:${opt.name}`);
              const st = getStaged(opt);
              const qty = st?.qty || 0;
              const price = st ? st.price : (typeof opt.price === 'number' ? opt.price : null);
              const isStaged = qty > 0;
              // Existing items with qty=0 are pending removal — fade the row
              // so she can see what's about to disappear before tapping Save.
              const isPendingRemoval = !!st?.existingItemId && qty === 0;
              return (
                <div key={`${opt.kind}:${opt.name}`} style={{
                  padding: '8px 10px', marginBottom: '4px',
                  background: isPendingRemoval ? `${C.gold}0e`
                    : isStaged ? `${C.sage}22`
                    : (isAdded ? `${C.gold}11` : 'transparent'),
                  border: `1px solid ${isPendingRemoval ? C.gold + '55'
                    : isStaged ? C.sageDeep
                    : (isAdded ? C.gold + '55' : C.borderSoft)}`,
                  borderRadius: '8px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  opacity: isPendingRemoval ? 0.6 : 1,
                }}>
                  {opt.kind === 'flower'
                    ? <Flower2 size={13} strokeWidth={2} color={opt.isSuggestion ? C.inkFaint : C.sageDeep} style={{ flexShrink: 0 }} />
                    : <Tag size={13} strokeWidth={2} color={C.inkSoft} style={{ flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px', fontWeight: 500,
                      color: opt.isSuggestion ? C.inkSoft : C.ink,
                      fontStyle: opt.isSuggestion ? 'italic' : 'normal',
                      lineHeight: 1.2,
                      textDecoration: isPendingRemoval ? 'line-through' : 'none',
                    }}>
                      {opt.name}
                      {isPendingRemoval && <span style={{ fontSize: '10px', color: C.gold, marginLeft: '6px' }}>· will remove</span>}
                      {!isPendingRemoval && isAdded && <span style={{ fontSize: '10px', color: C.gold, marginLeft: '6px' }}>· on list</span>}
                      {!isPendingRemoval && !isAdded && opt.isSuggestion && (
                        <span style={{ fontSize: '10px', color: C.inkFaint, marginLeft: '6px', fontStyle: 'normal' }}>· suggestion</span>
                      )}
                    </div>
                    {/* Editable price input — defaults to catalog price. */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      marginTop: '2px',
                    }}>
                      <span style={{ fontSize: '11px', color: C.inkFaint }}>$</span>
                      <input type="text" inputMode="decimal"
                        value={price != null ? String(price) : ''}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return;
                          const n = raw === '' ? null : parseFloat(raw);
                          setStagedFor(opt, {
                            price: (n != null && isFinite(n)) ? n : null,
                            // Stage the row on first edit if the user is entering
                            // a price without tapping + first.
                            qty: qty > 0 ? qty : 1,
                          });
                        }}
                        placeholder="0.00"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '60px', padding: '2px 4px', fontSize: '11px',
                          fontFamily: 'inherit',
                          background: 'transparent',
                          border: `1px solid ${C.borderSoft}`, borderRadius: '4px',
                          outline: 'none',
                          color: C.ink, textAlign: 'right',
                        }} />
                      <span style={{ fontSize: '10px', color: C.inkFaint }}>{opt.hint}</span>
                    </div>
                  </div>
                  {/* Qty stepper */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                    <button type="button" onClick={() => decQty(opt)} disabled={qty === 0}
                      aria-label="Decrease"
                      style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: qty > 0 ? C.bgDeep : 'transparent',
                        border: `1px solid ${C.borderSoft}`,
                        color: qty > 0 ? C.ink : C.inkFaint,
                        cursor: qty > 0 ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: qty > 0 ? 1 : 0.4,
                      }}>
                      <Minus size={12} strokeWidth={2.4} />
                    </button>
                    <div style={{
                      minWidth: '22px', textAlign: 'center',
                      fontSize: '13px', fontWeight: 600,
                      color: qty > 0 ? C.sageDeep : C.inkFaint,
                    }}>{qty}</div>
                    <button type="button" onClick={() => incQty(opt)}
                      aria-label="Increase"
                      style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: C.sageDeep, border: 'none',
                        color: C.card, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                      <Plus size={12} strokeWidth={2.6} />
                    </button>
                  </div>
                </div>
              );
            })}
            {canQuickCreate && (
              <button type="button" onClick={handleQuickCreate}
                style={{
                  width: '100%', marginTop: '4px', padding: '11px 12px',
                  background: 'transparent',
                  border: `1px dashed ${C.sageDeep}88`, borderRadius: '8px',
                  color: C.sageDeep, fontFamily: 'inherit', fontSize: '13px', fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}>
                <Plus size={14} strokeWidth={2.4} />
                Add <strong style={{ fontWeight: 600 }}>&ldquo;{trimmedSearch}&rdquo;</strong> as new {tab === 'flowers' ? 'flower' : 'supply'}
              </button>
            )}
            </>
          )}
        </div>

        <div style={{
          paddingTop: '10px', marginTop: '8px',
          borderTop: `1px solid ${C.borderSoft}`, flexShrink: 0,
          display: 'flex', gap: '8px', alignItems: 'stretch',
        }}>
          {tab !== 'bouquets' && stagedCount > 0 && (
            <div style={{
              padding: '10px 12px',
              background: `${C.sage}14`, border: `1px solid ${C.sageDeep}44`,
              borderRadius: '10px', fontSize: '12px', color: C.inkSoft,
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <span style={{ fontWeight: 600, color: C.sageDeep }}>{stagedCount}</span>
              <span>· ${stagedSum.toFixed(2)}</span>
            </div>
          )}
          <button
            onClick={tab !== 'bouquets' && hasChanges ? commitStaged : onClose}
            className="primary-btn"
            style={{
              flex: 1, padding: '12px',
              background: C.sageDeep, border: 'none',
              borderRadius: '10px', color: C.card, fontFamily: 'inherit', fontSize: '14px',
              fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}>
            <Check size={14} strokeWidth={2.4} />
            {tab !== 'bouquets' && hasChanges ? 'Save changes' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PickerOverlay({ flowers, materials, bouquets, itemsByKey, setItemQty, onAddNewFlower, onAddNewMaterial, onClose }) {
  const [pickerTab, setPickerTab] = useState('flowers');
  const [search, setSearch] = useState('');

  const rawList = pickerTab === 'flowers' ? (flowers || [])
    : pickerTab === 'materials' ? (materials || [])
    : (bouquets || []);
  // Alphabetical sort so the picker stays predictable as the catalog grows.
  const list = useMemo(() =>
    [...rawList].sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))
  , [rawList]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(it =>
      it.name.toLowerCase().includes(q)
      || (it.description && it.description.toLowerCase().includes(q))
      || (it.note && it.note.toLowerCase().includes(q))
    );
  }, [list, search]);

  const itemsArray = Object.values(itemsByKey);
  const totalPicked = itemsArray.reduce((s, it) => s + (it.qty || 0), 0);
  // Live material cost (effective per-bouquet, qty=1 in cart)
  const ranges = computeMaterialRanges(itemsArray, flowers, materials, bouquets);
  const effMid = (ranges.effMin + ranges.effMax) / 2;
  const baseMid = (ranges.baseMin + ranges.baseMax) / 2;
  const fmtRange = (lo, hi) => Math.abs(lo - hi) < 0.005 ? `$${lo.toFixed(2)}` : `$${lo.toFixed(2)}–$${hi.toFixed(2)}`;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(42,53,40,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', zIndex: 60, backdropFilter: 'blur(4px)',
    }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
        background: C.card, borderRadius: '16px', padding: '20px',
        width: '100%', maxWidth: '480px',
        height: 'min(88vh, 640px)', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(42,53,40,0.3)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          marginBottom: '14px', gap: '12px',
        }}>
          <div>
            <h2 className="serif" style={{
              fontSize: '20px', margin: '0 0 2px', fontWeight: 500, letterSpacing: '-0.01em',
            }}>Add to arrangement</h2>
            <div style={{ fontSize: '12px', color: C.inkSoft }}>
              Tap an item to add. {totalPicked > 0 && <strong style={{ color: C.sageDeep }}>{totalPicked} in arrangement</strong>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close picker" style={{
            background: 'transparent', border: 'none', padding: '10px', borderRadius: '8px',
            cursor: 'pointer', color: C.inkSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={20} /></button>
        </div>

        <div style={{
          display: 'flex', gap: '4px', background: C.bgDeep, padding: '4px',
          borderRadius: '10px', marginBottom: '10px',
        }}>
          <button type="button" onClick={() => setPickerTab('flowers')} style={{
            flex: 1, padding: '9px', borderRadius: '8px', border: 'none',
            background: pickerTab === 'flowers' ? C.card : 'transparent',
            color: pickerTab === 'flowers' ? C.ink : C.inkSoft,
            fontFamily: 'inherit', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
            <Flower2 size={13} strokeWidth={2} /> Flowers <span style={{ opacity: 0.55, fontWeight: 400 }}>{(flowers || []).length}</span>
          </button>
          <button type="button" onClick={() => setPickerTab('materials')} style={{
            flex: 1, padding: '9px', borderRadius: '8px', border: 'none',
            background: pickerTab === 'materials' ? C.card : 'transparent',
            color: pickerTab === 'materials' ? C.ink : C.inkSoft,
            fontFamily: 'inherit', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
            <Tag size={13} strokeWidth={2} /> Supplies <span style={{ opacity: 0.55, fontWeight: 400 }}>{(materials || []).length}</span>
          </button>
          <button type="button" onClick={() => setPickerTab('bouquets')} style={{
            flex: 1, padding: '9px', borderRadius: '8px', border: 'none',
            background: pickerTab === 'bouquets' ? C.card : 'transparent',
            color: pickerTab === 'bouquets' ? C.ink : C.inkSoft,
            fontFamily: 'inherit', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
            <Sheet size={13} strokeWidth={2} /> Bouquets <span style={{ opacity: 0.55, fontWeight: 400 }}>{(bouquets || []).length}</span>
          </button>
        </div>

        <SearchBar value={search} onChange={setSearch}
          placeholder={pickerTab === 'flowers' ? 'Search flowers…'
            : pickerTab === 'materials' ? 'Search supplies…'
            : 'Search bouquets…'} />

        <div style={{
          flex: 1, overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px',
          paddingRight: '4px',
        }}>
          {filtered.length === 0 ? (
            <div style={{
              padding: '24px', fontSize: '13px', color: C.inkFaint,
              textAlign: 'center', fontStyle: 'italic',
            }}>
              {search.trim() ? `Nothing matches "${search}".` : 'Nothing in catalog.'}
            </div>
          ) : filtered.map(item => {
            const kind = pickerTab === 'flowers' ? 'flower'
              : pickerTab === 'materials' ? 'material'
              : 'bouquet';
            const cartItem = itemsByKey[`${kind}:${item.id}`];
            const inRecipe = !!cartItem;
            let priceLabel;
            if (kind === 'flower') {
              priceLabel = item.mode === 'perStem'
                ? `$${(item.bunchPrice / item.bunchCount).toFixed(2)}/stem`
                : `$${item.flatMin.toFixed(2)}–$${item.flatMax.toFixed(2)}/bunch`;
            } else if (kind === 'material') {
              priceLabel = item.unitPrice > 0 ? `$${item.unitPrice.toFixed(2)} each` : 'no price';
            } else {
              const hasFixed = typeof item.fixedPrice === 'number' && isFinite(item.fixedPrice);
              const itemCount = (item.items || []).length;
              priceLabel = hasFixed
                ? `$${item.fixedPrice.toFixed(2)} bundle`
                : `Loose · ${itemCount} item${itemCount === 1 ? '' : 's'}`;
            }
            return (
              <div key={item.id}
                onClick={() => { if (!inRecipe) setItemQty(kind, item.id, 1); }}
                style={{
                  padding: '10px 10px 10px 12px',
                  background: inRecipe ? `${C.sage}10` : C.card,
                  border: `1px solid ${inRecipe ? C.sage : C.borderSoft}`, borderRadius: '10px',
                  cursor: inRecipe ? 'default' : 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                }}>
                <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {kind === 'material' && (
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%', background: item.color,
                      border: isLight(item.color) ? `1px solid ${C.border}` : 'none', flexShrink: 0,
                    }} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px', fontWeight: 500, color: C.ink,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: C.inkFaint }}>{priceLabel}</div>
                  </div>
                </div>
                {inRecipe ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <button type="button"
                      onClick={(e) => { e.stopPropagation(); setItemQty(kind, item.id, cartItem.qty - 1); }}
                      aria-label="Less"
                      style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: C.sageDeep, border: 'none', color: C.card, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}><Minus size={14} strokeWidth={2.5} /></button>
                    <div style={{
                      minWidth: '24px', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: C.ink,
                    }}>{cartItem.qty}</div>
                    <button type="button"
                      onClick={(e) => { e.stopPropagation(); setItemQty(kind, item.id, cartItem.qty + 1); }}
                      aria-label="More"
                      style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: C.sageDeep, border: 'none', color: C.card, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}><Plus size={14} strokeWidth={2.5} /></button>
                  </div>
                ) : (
                  <button type="button"
                    onClick={(e) => { e.stopPropagation(); setItemQty(kind, item.id, 1); }}
                    aria-label="Add to arrangement"
                    style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: C.sageDeep, border: 'none', color: C.card, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}><Plus size={16} strokeWidth={2.4} /></button>
                )}
              </div>
            );
          })}

          {(pickerTab === 'flowers' ? onAddNewFlower : onAddNewMaterial) && (
            <button type="button"
              onClick={() => {
                onClose();
                if (pickerTab === 'flowers') onAddNewFlower();
                else onAddNewMaterial();
              }}
              style={{
                marginTop: '4px', padding: '11px 12px', background: 'transparent',
                border: `1px dashed ${C.border}`, borderRadius: '10px',
                color: C.inkSoft, fontFamily: 'inherit', fontSize: '13px', fontWeight: 500,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}>
              <Plus size={14} strokeWidth={2.2} /> New {pickerTab === 'flowers' ? 'flower' : 'supply'}
            </button>
          )}
        </div>

        <div style={{
          marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${C.borderSoft}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: C.inkFaint, marginBottom: '2px',
            }}>Material cost</div>
            <div className="serif" style={{
              fontSize: '20px', fontWeight: 600, color: C.ink, letterSpacing: '-0.01em', lineHeight: 1.1,
            }}>
              {ranges.hasAny ? fmtRange(ranges.baseMin, ranges.baseMax) : '$0.00'}
            </div>
            {ranges.hasAny && Math.abs(effMid - baseMid) > 0.005 && (
              <div style={{ fontSize: '10px', color: C.sageDeep, marginTop: '2px' }}>
                Charging {fmtRange(ranges.effMin, ranges.effMax)} (margin {fmtRange(ranges.effMin - ranges.baseMax, ranges.effMax - ranges.baseMin)})
              </div>
            )}
          </div>
          <button onClick={onClose} className="primary-btn" style={{
            padding: '10px 18px', background: C.sageDeep, border: 'none', borderRadius: '10px',
            color: C.card, fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
          }}>
            <Check size={14} strokeWidth={2.4} /> Done
          </button>
        </div>
      </div>
    </div>
  );
}

// Customer-name input with typeahead pulled from past orders. Suggests up to
// 6 unique names that loosely match what the user is typing. Tap to fill.
// Closes the suggestion list on outside click or after a pick.
function CustomerNameInput({ value, onChange, orders, currentEditingId, autoFocus = true, placeholder = 'e.g. Sarah Chen' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const pastNames = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const o of (orders || [])) {
      if (currentEditingId && o.id === currentEditingId) continue;
      const n = (o.customerName || '').trim();
      if (!n) continue;
      const key = n.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(n);
    }
    return out;
  }, [orders, currentEditingId]);

  const q = (value || '').trim().toLowerCase();
  const matches = useMemo(() => {
    if (!open) return [];
    const filtered = q
      ? pastNames.filter(n => n.toLowerCase().includes(q) && n.toLowerCase() !== q)
      : pastNames;
    return filtered.slice(0, 6);
  }, [open, q, pastNames]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input className="text-input" type="text" value={value}
        onChange={(e) => { onChange(e.target.value); if (!open) setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder} {...(autoFocus ? { autoFocus: true } : {})}
        style={inputStyle()} />
      {open && matches.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 20,
          background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px',
          boxShadow: '0 12px 32px rgba(42,53,40,0.12)',
          maxHeight: '220px', overflowY: 'auto', padding: '4px',
        }}>
          {matches.map(n => (
            <button key={n} type="button"
              onClick={() => { onChange(n); setOpen(false); }}
              style={{
                width: '100%', padding: '10px 12px', background: 'transparent',
                border: 'none', borderRadius: '7px',
                fontFamily: 'inherit', fontSize: '14px', color: C.ink,
                cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
              <Clock size={12} strokeWidth={2} color={C.inkFaint} />
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderFormModal({ form, setForm, editingId, settings, flowers, materials, bouquets, orders, onAddNewFlower, onAddNewMaterial, onAddEventType, onAddPaymentMethod, onCancel, onClose, onSubmit }) {
  const remindersOn = form.enableReminders !== false;
  const previewTime = form.pickupDateTime
    ? new Date(form.pickupDateTime).toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit',
      })
    : null;

  const items = Array.isArray(form.items) ? form.items : [];
  const itemsByKey = useMemo(() => {
    const map = {};
    items.forEach(it => { map[`${it.kind}:${it.id}`] = it; });
    return map;
  }, [items]);

  const setItemQty = (kind, id, n) => {
    const q = Math.max(0, n);
    const existing = items.find(it => it.kind === kind && it.id === id);
    let next;
    if (q === 0) next = items.filter(it => !(it.kind === kind && it.id === id));
    else if (existing) next = items.map(it => (it.kind === kind && it.id === id) ? { ...it, qty: q } : it);
    else next = [...items, { kind, id, qty: q, included: true }];
    setForm({ ...form, items: next });
  };
  const setItemIncluded = (kind, id, included) => {
    setForm({ ...form, items: items.map(it => (it.kind === kind && it.id === id) ? { ...it, included } : it) });
  };
  const setItemOverride = (kind, id, value) => {
    const next = items.map(it => {
      if (!(it.kind === kind && it.id === id)) return it;
      const { unitPriceOverride: _drop, ...rest } = it;
      if (value === '' || value == null) return rest;
      const num = parseFloat(value);
      if (!isFinite(num) || num < 0) return rest;
      return { ...rest, unitPriceOverride: num };
    });
    setForm({ ...form, items: next });
  };


  const handleClose = onClose || onCancel;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(42,53,40,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', zIndex: 50, backdropFilter: 'blur(4px)',
    }}>
      {/* Floating close button — fixed top-right of viewport, always tappable */}
      <button onClick={handleClose} aria-label="Close (saves draft)" title="Close (your draft is saved)" style={{
        position: 'fixed', top: '14px', right: '14px', zIndex: 55,
        width: '44px', height: '44px', borderRadius: '50%',
        background: C.ink, color: C.card, border: `2px solid ${C.card}`,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 6px 16px rgba(42,53,40,0.3)',
      }}><X size={20} strokeWidth={2.4} /></button>

      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
        background: C.card, borderRadius: '16px', padding: '24px',
        width: '100%', maxWidth: '500px', maxHeight: '92vh', overflow: 'auto',
        boxShadow: '0 20px 60px rgba(42,53,40,0.25)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div>
            <h2 className="serif" style={{ fontSize: '22px', margin: '0 0 4px', fontWeight: 500, letterSpacing: '-0.01em' }}>
              {editingId ? 'Edit order' : 'New order'}
            </h2>
            <div style={{ fontSize: '13px', color: C.inkSoft }}>For a customer pickup. Closing saves your draft.</div>
          </div>
        </div>

        <Field label="Customer name" required>
          <CustomerNameInput
            value={form.customerName}
            onChange={(v) => setForm({ ...form, customerName: v })}
            orders={orders || []}
            currentEditingId={editingId}
          />
        </Field>

        <Field label="Arrangement name (optional)" hint="A short label for this bouquet.">
          <input className="text-input" type="text" value={form.arrangement}
            onChange={(e) => setForm({ ...form, arrangement: e.target.value })}
            placeholder="e.g. Mixed spring bouquet" style={inputStyle()} />
          {items.length > 0 && (
            <div style={{
              marginTop: '8px', padding: '8px 12px',
              background: C.bg, border: `1px solid ${C.borderSoft}`, borderRadius: '8px',
              fontSize: '12px', color: C.inkSoft, lineHeight: 1.5,
            }}>
              <div style={{
                fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: C.inkFaint, marginBottom: '4px',
              }}>Contains</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px' }}>
                {items.map((it) => {
                  const ref = it.kind === 'flower'
                    ? (flowers || []).find(x => x.id === it.id)
                    : it.kind === 'material'
                      ? (materials || []).find(x => x.id === it.id)
                      : (bouquets || []).find(x => x.id === it.id);
                  // Skip dangling references to deleted catalog entries.
                  if (!ref) return null;
                  return { it, name: ref.name };
                }).filter(Boolean).map(({ it, name }, i, arr) => (
                  <React.Fragment key={i}>
                    <span style={{
                      opacity: it.included === false ? 0.55 : 1,
                      textDecoration: it.included === false ? 'line-through' : 'none',
                    }}>
                      <span style={{ fontWeight: 600, color: C.ink }}>{it.qty}×</span>{' '}{name}
                    </span>
                    {i < arr.length - 1 && <span style={{ color: C.inkFaint }}>·</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </Field>

        <RecipeEditor
          items={items} flowers={flowers} materials={materials} bouquets={bouquets} itemsByKey={itemsByKey}
          setItemQty={setItemQty} setItemIncluded={setItemIncluded} setItemOverride={setItemOverride}
          onAddNewFlower={onAddNewFlower} onAddNewMaterial={onAddNewMaterial}
        />

        <Field label="Quantity">
          <input className="text-input" type="number" min="1" value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            placeholder="1" style={{ ...inputStyle(), maxWidth: '120px' }} />
        </Field>

        <PricingPanel
          quantity={form.quantity}
          items={items} flowers={flowers} materials={materials} bouquets={bouquets}
          extraCosts={form.extraCosts}
          onChangeExtras={(extras) => setForm({ ...form, extraCosts: extras })}
        />

        <Field label="Event type" hint="Sets the colored dot on the calendar.">
          <TypeDropdown
            value={form.eventType || 'general'}
            options={settings.eventTypes || DEFAULT_EVENT_TYPES}
            onChange={(key) => setForm({ ...form, eventType: key })}
            onAdd={onAddEventType}
            showColor
            placeholder="Select event type…"
          />
        </Field>

        <Field label="Pickup date & time" required>
          <input className="text-input" type="datetime-local" value={form.pickupDateTime}
            min={(() => {
              const n = new Date();
              const pad = x => String(x).padStart(2, '0');
              return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}T${pad(n.getHours())}:${pad(n.getMinutes())}`;
            })()}
            onChange={(e) => setForm({ ...form, pickupDateTime: e.target.value })}
            style={inputStyle()} />
          {form.pickupDateTime && new Date(form.pickupDateTime) < new Date() && (
            <div style={{
              marginTop: '6px', fontSize: '12px', color: C.gold,
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              <AlertCircle size={12} strokeWidth={2} />
              This time is already in the past — pick a future time.
            </div>
          )}
        </Field>

        <Field label="Payments" hint="Add one row per payment. Split across methods if needed.">
          <PaymentsEditor
            payments={form.payments || []}
            onChange={(next) => setForm({ ...form, payments: next })}
            total={(parseFloat(form.quantity) || 0) * (parseFloat(form.costPer) || 0)}
            paymentMethods={settings.paymentMethods || DEFAULT_PAYMENT_METHODS}
          />
        </Field>

        <div style={{
          padding: '12px 14px', background: C.bg, borderRadius: '10px', marginBottom: '14px',
          cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '10px',
        }} onClick={() => setForm({ ...form, enableReminders: !remindersOn })}>
          <div style={{
            width: '20px', height: '20px', borderRadius: '6px',
            background: remindersOn ? C.sageDeep : C.card,
            border: `1.5px solid ${remindersOn ? C.sageDeep : C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 160ms ease', flexShrink: 0, marginTop: '1px',
          }}>
            {remindersOn && <Check size={13} strokeWidth={3} color={C.card} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {remindersOn ? <BellRing size={13} color={C.gold} strokeWidth={2} />
                : <BellOff size={13} color={C.inkFaint} strokeWidth={2} />}
              Pickup reminders
            </div>
            <div style={{ fontSize: '12px', color: C.inkSoft, lineHeight: 1.5 }}>
              {remindersOn && settings.reminderOffsets.length > 0 && previewTime
                ? `Alerts ${settings.reminderOffsets.map(offsetToLabel).join(', then ')} pickup`
                : remindersOn && settings.reminderOffsets.length === 0
                ? 'No reminders set in Settings — this order will be silent'
                : 'No alerts will fire for this order'}
            </div>
          </div>
        </div>

        <Field label="Notes (optional)" hint="Anything you want to remember.">
          <textarea className="text-input" value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="e.g. Her sister's birthday"
            rows="2"
            style={{ ...inputStyle(), resize: 'vertical', minHeight: '60px' }} />
        </Field>

        <Field label="Card messages (optional)" hint="One per bouquet that needs a card. Tap + to add more.">
          <CardMessagesEditor
            cardMessages={form.cardMessages || []}
            onChange={(next) => setForm({ ...form, cardMessages: next })}
          />
        </Field>

        <Field label="More bouquets in this order (optional)" hint="Add extra bouquets that ship with this order — e.g. centerpieces, bridesmaid bouquets. Each can have its own name, price, and card messages.">
          <AdditionalBouquetsEditor
            bouquets={form.additionalBouquets || []}
            onChange={(next) => setForm({ ...form, additionalBouquets: next })}
          />
        </Field>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '14px', background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: '10px', color: C.inkSoft, fontFamily: 'inherit', fontSize: '15px',
            fontWeight: 500, cursor: 'pointer',
          }}>Cancel</button>
          <button className="primary-btn" onClick={onSubmit} style={{
            flex: 2, padding: '14px', background: C.sageDeep, border: 'none',
            borderRadius: '10px', color: C.card, fontFamily: 'inherit', fontSize: '15px',
            fontWeight: 500, cursor: 'pointer',
          }}>{editingId ? 'Save changes' : 'Add order'}</button>
        </div>
      </div>
    </div>
  );
}

// --------------------- MATERIALS ---------------------

function MaterialsView({
  materials, settings, onAdd, onEdit, onDelete, onBulkDelete, onDeleteType,
  onAddStore, onEditStore, onDeleteStore, onBulkDeleteStore,
}) {
  const [subTab, setSubTab] = useState('materials');
  const stores = settings.stores || [];
  const physicalStores = stores.filter(s => s.kind === 'physical');
  const onlineStores = stores.filter(s => s.kind === 'online');

  return (
    <div className="fade-in">
      {/* Sub-tabs */}
      <div style={{
        display: 'flex', gap: '3px', background: C.bgDeep, padding: '3px',
        borderRadius: '11px', marginBottom: '16px',
      }}>
        <SupplySubTab active={subTab === 'materials'} onClick={() => setSubTab('materials')} label="Materials" count={materials.length} />
        <SupplySubTab active={subTab === 'stores'} onClick={() => setSubTab('stores')} label="Stores" count={physicalStores.length} />
        <SupplySubTab active={subTab === 'online'} onClick={() => setSubTab('online')} label="Online" count={onlineStores.length} />
      </div>

      {subTab === 'materials' ? (
        <MaterialsList
          materials={materials} settings={settings}
          onAdd={onAdd} onEdit={onEdit} onDelete={onDelete}
          onBulkDelete={onBulkDelete}
          onDeleteType={onDeleteType}
        />
      ) : subTab === 'stores' ? (
        <StoresList
          stores={physicalStores} kind="physical"
          onAdd={() => onAddStore('physical')}
          onEdit={onEditStore} onDelete={onDeleteStore}
          onBulkDelete={onBulkDeleteStore}
        />
      ) : (
        <StoresList
          stores={onlineStores} kind="online"
          onAdd={() => onAddStore('online')}
          onEdit={onEditStore} onDelete={onDeleteStore}
          onBulkDelete={onBulkDeleteStore}
        />
      )}
    </div>
  );
}

function SupplySubTab({ active, onClick, label, count }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '10px 6px', borderRadius: '9px', border: 'none',
      background: active ? C.card : 'transparent',
      color: active ? C.ink : C.inkSoft,
      fontFamily: 'inherit', fontSize: '14px', fontWeight: active ? 600 : 500, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
      boxShadow: active ? '0 2px 6px rgba(42,53,40,0.06)' : 'none',
    }}>
      {label}
      {count > 0 && (
        <span style={{ opacity: 0.55, fontSize: '12px', fontWeight: 400 }}>{count}</span>
      )}
    </button>
  );
}

function MaterialsList({ materials, settings, onAdd, onEdit, onDelete, onBulkDelete, onDeleteType }) {
  const defaultKeys = useMemo(() => new Set(DEFAULT_MATERIAL_TYPES.map(t => t.key)), []);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  useEffect(() => { if (!editMode) setSelected(new Set()); }, [editMode]);
  const toggleSelect = (id) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const handleBulkDelete = () => {
    if (selected.size === 0 || !onBulkDelete) return;
    onBulkDelete([...selected]);
    setSelected(new Set()); setEditMode(false);
  };
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const types = (settings && settings.materialTypes) || MATERIAL_TYPES;
  const counts = useMemo(() => {
    const c = { all: materials.length };
    types.forEach(t => { c[t.key] = materials.filter(m => m.type === t.key).length; });
    return c;
  }, [materials, types]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = filter === 'all' ? materials : materials.filter(m => m.type === filter);
    if (q) {
      list = list.filter(m =>
        m.name.toLowerCase().includes(q)
        || (m.note && m.note.toLowerCase().includes(q))
        || (m.storeTags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [materials, filter, search]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '8px' }}>
        <div style={{ fontSize: '13px', color: C.inkSoft, letterSpacing: '0.04em' }}>
          {editMode && selected.size > 0
            ? `${selected.size} selected`
            : `${materials.length} ${materials.length === 1 ? 'supply' : 'supplies'}`}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setEditMode(e => !e)} style={{
            padding: '10px 14px',
            background: editMode ? C.sageDeep : 'transparent',
            border: `1px solid ${editMode ? C.sageDeep : C.border}`,
            borderRadius: '10px',
            color: editMode ? C.card : C.inkSoft,
            fontFamily: 'inherit', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            {editMode ? <><Check size={14} strokeWidth={2.4} /> Done</> : <><Pencil size={14} strokeWidth={2} /> Edit</>}
          </button>
          {editMode && selected.size > 0 && (
            <button onClick={handleBulkDelete} style={{
              padding: '10px 14px', background: C.roseDeep, border: 'none', borderRadius: '10px',
              color: C.card, fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <Trash2 size={14} strokeWidth={2} /> Delete {selected.size}
            </button>
          )}
          {!editMode && (
            <button className="primary-btn" onClick={onAdd} style={{
              padding: '10px 16px', background: C.sageDeep, border: 'none', borderRadius: '10px',
              color: C.card, fontFamily: 'inherit', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <Plus size={16} strokeWidth={2.2} /> Add supply
            </button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search supplies…" />
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="All" count={counts.all} />
        {types.map(t => {
          const removable = editMode && onDeleteType && !defaultKeys.has(t.key);
          return (
            <FilterChip key={t.key} active={filter === t.key} onClick={() => setFilter(t.key)}
              label={t.label} count={counts[t.key]}
              onRemove={removable ? () => {
                if (filter === t.key) setFilter('all');
                onDeleteType(t.key);
              } : null} />
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div style={{
          background: C.card, border: `1px dashed ${C.border}`, borderRadius: '14px',
          padding: '40px 20px', textAlign: 'center', color: C.inkSoft,
        }}>
          <Tag size={28} strokeWidth={1.4} color={C.inkFaint} style={{ marginBottom: '10px' }} />
          <div style={{ fontSize: '14px', marginBottom: '4px' }}>
            {materials.length === 0 ? 'No supplies yet' : 'No supplies match'}
          </div>
          <div style={{ fontSize: '12px', color: C.inkFaint }}>
            {materials.length === 0 ? 'Add wrapping, ribbon, or anything else.' : `Try a different search.`}
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px',
        }}>
          {filtered.map(m => (
            <MaterialCard key={m.id} material={m} types={types}
              editMode={editMode}
              selected={selected.has(m.id)}
              onToggleSelect={() => toggleSelect(m.id)}
              onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function StoresList({ stores, kind, onAdd, onEdit, onDelete, onBulkDelete }) {
  const [search, setSearch] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  useEffect(() => { if (!editMode) setSelected(new Set()); }, [editMode]);
  useEffect(() => { setSelected(new Set()); setEditMode(false); }, [kind]);
  const toggleSelect = (id) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const handleBulkDelete = () => {
    if (selected.size === 0 || !onBulkDelete) return;
    onBulkDelete([...selected]);
    setSelected(new Set()); setEditMode(false);
  };
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stores;
    return stores.filter(s =>
      s.name.toLowerCase().includes(q)
      || (s.address && s.address.toLowerCase().includes(q))
      || (s.url && s.url.toLowerCase().includes(q))
      || (s.notes && s.notes.toLowerCase().includes(q))
    );
  }, [stores, search]);

  const noun = kind === 'physical' ? 'store' : 'link';
  const nounPlural = kind === 'physical' ? 'stores' : 'links';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '8px' }}>
        <div style={{ fontSize: '13px', color: C.inkSoft, letterSpacing: '0.04em' }}>
          {editMode && selected.size > 0
            ? `${selected.size} selected`
            : `${stores.length} ${stores.length === 1 ? noun : nounPlural}`}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {stores.length > 0 && (
            <button onClick={() => setEditMode(e => !e)} style={{
              padding: '10px 14px',
              background: editMode ? C.sageDeep : 'transparent',
              border: `1px solid ${editMode ? C.sageDeep : C.border}`,
              borderRadius: '10px',
              color: editMode ? C.card : C.inkSoft,
              fontFamily: 'inherit', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              {editMode ? <><Check size={14} strokeWidth={2.4} /> Done</> : <><Pencil size={14} strokeWidth={2} /> Edit</>}
            </button>
          )}
          {editMode && selected.size > 0 && (
            <button onClick={handleBulkDelete} style={{
              padding: '10px 14px', background: C.roseDeep, border: 'none', borderRadius: '10px',
              color: C.card, fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <Trash2 size={14} strokeWidth={2} /> Delete {selected.size}
            </button>
          )}
          {!editMode && (
            <button className="primary-btn" onClick={onAdd} style={{
              padding: '10px 16px', background: C.sageDeep, border: 'none', borderRadius: '10px',
              color: C.card, fontFamily: 'inherit', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <Plus size={16} strokeWidth={2.2} /> Add {noun}
            </button>
          )}
        </div>
      </div>

      {stores.length >= 3 && (
        <div style={{ marginBottom: '12px' }}>
          <SearchBar value={search} onChange={setSearch} placeholder={`Search ${nounPlural}…`} />
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{
          background: C.card, border: `1px dashed ${C.border}`, borderRadius: '14px',
          padding: '40px 20px', textAlign: 'center', color: C.inkSoft,
        }}>
          {kind === 'physical'
            ? <Tag size={28} strokeWidth={1.4} color={C.inkFaint} style={{ marginBottom: '10px' }} />
            : <ExternalLink size={28} strokeWidth={1.4} color={C.inkFaint} style={{ marginBottom: '10px' }} />}
          <div style={{ fontSize: '14px', marginBottom: '4px' }}>
            {stores.length === 0 ? `No ${nounPlural} yet` : `No ${nounPlural} match`}
          </div>
          <div style={{ fontSize: '12px', color: C.inkFaint }}>
            {kind === 'physical'
              ? 'Add a store with address — tap it to open in Maps.'
              : 'Add a wholesale website or any online shop.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(s => (
            <StoreCard key={s.id} store={s}
              editMode={editMode}
              selected={selected.has(s.id)}
              onToggleSelect={() => toggleSelect(s.id)}
              onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function StoreCard({ store, editMode, selected, onToggleSelect, onEdit, onDelete }) {
  const isPhysical = store.kind === 'physical';
  const mapsHref = isPhysical && store.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`
    : null;
  const urlHref = !isPhysical && store.url
    ? (/^https?:\/\//i.test(store.url) ? store.url : `https://${store.url}`)
    : null;

  return (
    <div onClick={editMode ? onToggleSelect : undefined} style={{
      background: editMode && selected ? `${C.sage}1f` : C.card,
      border: `1px solid ${editMode && selected ? C.sageDeep : C.borderSoft}`,
      borderRadius: '12px',
      padding: '14px 16px',
      cursor: editMode ? 'pointer' : 'default',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
        {editMode && <SelectCheckbox checked={!!selected} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="serif" style={{
            fontSize: '17px', fontWeight: 500, margin: 0, letterSpacing: '-0.01em', color: C.ink,
          }}>{store.name}</h3>
          {isPhysical && store.address && (
            <div style={{ fontSize: '12px', color: C.inkSoft, marginTop: '4px', lineHeight: 1.5 }}>
              {store.address}
            </div>
          )}
          {!isPhysical && store.url && (
            <div style={{
              fontSize: '12px', color: C.inkSoft, marginTop: '4px', lineHeight: 1.5,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{store.url}</div>
          )}
          {store.notes && (
            <div style={{ fontSize: '12px', color: C.inkSoft, marginTop: '6px', lineHeight: 1.5, fontStyle: 'italic' }}>
              {store.notes}
            </div>
          )}
        </div>
        {!editMode && (
          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
            <button className="icon-btn" onClick={() => onEdit(store)} title="Edit" aria-label="Edit store"
              style={{
                background: 'transparent', border: 'none', padding: '10px', borderRadius: '8px',
                cursor: 'pointer', color: C.inkSoft,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <Pencil size={15} strokeWidth={1.8} />
            </button>
            <DeleteButton onConfirm={() => onDelete(store.id)} label="Delete store" compact size={15} padding="10px" />
          </div>
        )}
      </div>

      {!editMode && (mapsHref || urlHref) && (
        <div style={{
          marginTop: '12px', paddingTop: '10px', borderTop: `1px solid ${C.borderSoft}`,
        }}>
          <a href={mapsHref || urlHref} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', background: C.sageDeep, color: C.card,
              borderRadius: '8px', textDecoration: 'none',
              fontFamily: 'inherit', fontSize: '13px', fontWeight: 600,
            }}>
            {isPhysical
              ? <><CalendarDays size={13} strokeWidth={2} /> Open in Maps</>
              : <><ExternalLink size={13} strokeWidth={2} /> Visit site</>}
          </a>
        </div>
      )}
    </div>
  );
}

function StoreFormModal({ form, setForm, onCancel, onSubmit }) {
  const isPhysical = form.kind === 'physical';
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(42,53,40,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', zIndex: 50, backdropFilter: 'blur(4px)',
    }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
        background: C.card, borderRadius: '16px', padding: '24px',
        width: '100%', maxWidth: '480px', maxHeight: '92vh', overflow: 'auto',
        boxShadow: '0 20px 60px rgba(42,53,40,0.25)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div>
            <h2 className="serif" style={{ fontSize: '22px', margin: '0 0 4px', fontWeight: 500, letterSpacing: '-0.01em' }}>
              {form.id ? (isPhysical ? 'Edit store' : 'Edit link') : (isPhysical ? 'New store' : 'New link')}
            </h2>
            <div style={{ fontSize: '13px', color: C.inkSoft }}>
              {isPhysical ? 'Where you pick up supplies in person.' : 'A website you order from.'}
            </div>
          </div>
          <button className="icon-btn" onClick={onCancel} aria-label="Close" style={{
            background: 'transparent', border: 'none', padding: '10px', borderRadius: '8px',
            cursor: 'pointer', color: C.inkSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={20} /></button>
        </div>

        <Field label="Name" required>
          <input className="text-input" type="text" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={isPhysical ? 'e.g. TJ Brookside' : 'e.g. Wholesale Florist'}
            autoFocus style={inputStyle()} />
        </Field>

        {isPhysical ? (
          <Field label="Address" hint="Tap on the store card later to open in Maps.">
            <input className="text-input" type="text" value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="e.g. 4844 E 51st St, Tulsa, OK" style={inputStyle()} />
          </Field>
        ) : (
          <Field label="Website URL" hint="Tap the card later to open the site.">
            <input className="text-input" type="url" value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="e.g. https://wholesaleflorist.com" style={inputStyle()} />
          </Field>
        )}

        <Field label="Notes (optional)"
          hint={isPhysical ? 'Hours, who to ask for, anything else.' : 'Login, shipping, account info, anything else.'}>
          <textarea className="text-input" value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder={isPhysical
              ? 'e.g. Open 7 days, ask for Lila'
              : 'e.g. Free shipping over $50, login: lila@…'}
            rows="2"
            style={{ ...inputStyle(), resize: 'vertical', minHeight: '60px' }} />
        </Field>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '14px', background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: '10px', color: C.inkSoft, fontFamily: 'inherit', fontSize: '15px',
            fontWeight: 500, cursor: 'pointer',
          }}>Cancel</button>
          <button className="primary-btn" onClick={onSubmit} style={{
            flex: 2, padding: '14px', background: C.sageDeep, border: 'none',
            borderRadius: '10px', color: C.card, fontFamily: 'inherit', fontSize: '15px',
            fontWeight: 500, cursor: 'pointer',
          }}>{form.id ? 'Save changes' : (isPhysical ? 'Add store' : 'Add link')}</button>
        </div>
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, label, count, onRemove }) {
  return (
    <div className="type-filter" style={{
      display: 'inline-flex', alignItems: 'stretch',
      borderRadius: '20px', overflow: 'hidden', flexShrink: 0,
      border: `1px solid ${active ? C.ink : C.border}`,
      background: active ? C.ink : C.card,
    }}>
      <button onClick={onClick} style={{
        padding: '7px 12px', fontSize: '13px', fontFamily: 'inherit',
        background: 'transparent', border: 'none',
        color: active ? C.card : C.inkSoft,
        cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap',
        display: 'flex', alignItems: 'center', gap: '6px',
        paddingRight: onRemove ? '8px' : '12px',
      }}>
        {label}
        {count > 0 && (
          <span style={{
            fontSize: '11px', opacity: active ? 0.7 : 0.55, fontWeight: 400,
          }}>{count}</span>
        )}
      </button>
      {onRemove && (
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }}
          aria-label={`Remove ${label}`} title={`Remove "${label}" type`}
          style={{
            padding: '0 8px', background: 'transparent', border: 'none',
            borderLeft: `1px solid ${active ? `${C.card}33` : C.border}`,
            color: active ? `${C.card}cc` : C.inkFaint, cursor: 'pointer',
            display: 'flex', alignItems: 'center',
          }}><X size={11} strokeWidth={2.4} /></button>
      )}
    </div>
  );
}

function MaterialCard({ material, types, editMode, selected, onToggleSelect, onEdit, onDelete }) {
  const colorName = getPaletteName(material.color);
  const lightSwatch = isLight(material.color);
  const list = types || MATERIAL_TYPES;
  const typeLabel = list.find(t => t.key === material.type)?.label || 'Other';

  return (
    <div className="material-card" onClick={editMode ? onToggleSelect : undefined} style={{
      background: editMode && selected ? `${C.sage}1f` : C.card,
      border: `1px solid ${editMode && selected ? C.sageDeep : C.borderSoft}`,
      borderRadius: '14px',
      padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px',
      position: 'relative',
      cursor: editMode ? 'pointer' : 'default',
    }}>
      {editMode && (
        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 2 }}>
          <SelectCheckbox checked={!!selected} />
        </div>
      )}
      {/* Banner: photo if uploaded, else the color swatch. Color hex chip
          stays visible in either case so the user can ID by color too. */}
      {material.imageUrl ? (
        <div style={{
          height: '120px', borderRadius: '10px',
          background: `url(${material.imageUrl}) ${material.imagePosition || '50% 50%'} / ${(material.imageZoom || 1) * 100}% no-repeat`,
          border: `1px solid ${C.borderSoft}`,
          position: 'relative',
        }} aria-label={material.name}>
          <div style={{
            position: 'absolute', bottom: '8px', right: '8px',
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '3px 7px', borderRadius: '5px',
            background: `${C.ink}cc`, color: C.card, backdropFilter: 'blur(4px)',
            fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em',
          }}>
            <span style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: material.color,
              border: lightSwatch ? `1px solid ${C.card}` : 'none',
            }} />
            {material.color.toUpperCase()}
          </div>
        </div>
      ) : (
        <div style={{
          height: '70px', background: material.color,
          border: lightSwatch ? `1px solid ${C.border}` : 'none',
          borderRadius: '10px', display: 'flex', alignItems: 'flex-end',
          justifyContent: 'flex-end', padding: '8px',
        }}>
          <div style={{
            fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em',
            padding: '3px 7px', borderRadius: '5px',
            background: lightSwatch ? `${C.ink}cc` : `${C.card}cc`,
            color: lightSwatch ? C.card : C.ink, backdropFilter: 'blur(4px)',
          }}>{material.color.toUpperCase()}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '15px', fontWeight: 600, color: C.ink, lineHeight: 1.25,
            marginBottom: '4px', wordBreak: 'break-word',
          }}>
            {material.name}
          </div>
          {material.unitPrice > 0 ? (
            <div className="serif" style={{
              fontSize: '17px', fontWeight: 600, color: C.sageDeep,
              letterSpacing: '-0.01em', marginBottom: '4px', lineHeight: 1.1,
            }}>${material.unitPrice.toFixed(2)}</div>
          ) : (
            <div style={{
              fontSize: '11px', fontWeight: 500, color: C.inkFaint, fontStyle: 'italic',
              marginBottom: '4px',
            }}>no price set</div>
          )}
          <div style={{ fontSize: '11px', color: C.inkFaint, letterSpacing: '0.04em' }}>
            {typeLabel} · {colorName}
          </div>
          {material.note && (
            <div style={{ fontSize: '12px', color: C.inkSoft, marginTop: '6px', lineHeight: 1.4 }}>
              {material.note}
            </div>
          )}
        </div>
        {Array.isArray(material.storeTags) && material.storeTags.length > 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '4px',
            alignItems: 'flex-end', flexShrink: 0, maxWidth: '45%',
          }}>
            {material.storeTags.map((tag, i) => (
              <div key={i} style={{
                fontSize: '10px', fontWeight: 500, color: C.inkSoft,
                background: C.bgDeep, padding: '3px 8px', borderRadius: '5px',
                letterSpacing: '0.02em', whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
              }}>{tag}</div>
            ))}
          </div>
        )}
      </div>

      {!editMode && (
      <div style={{ display: 'flex', gap: '4px', marginTop: 'auto' }}>
        <button className="icon-btn" onClick={() => onEdit(material)} title="Edit" aria-label="Edit supply" style={{
          flex: 1, padding: '10px', background: 'transparent', border: 'none',
          borderRadius: '8px', cursor: 'pointer', color: C.inkSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '11px',
        }}>
          <Pencil size={14} strokeWidth={1.8} />
        </button>
        <div style={{ flex: 1, display: 'flex' }}>
          <DeleteButton onConfirm={() => onDelete(material.id)} label="Delete supply" padding="10px" size={14} compact fullWidth />
        </div>
      </div>
      )}
    </div>
  );
}

function MaterialFormModal({ form, setForm, editingId, settings, knownStoreTags, onAddStoreTag, onDeleteStoreTag, onAddMaterialType, onCancel, onSubmit }) {
  const [showCustom, setShowCustom] = useState(!PALETTE.find(p => p.hex.toLowerCase() === form.color.toLowerCase()));
  const colorName = getPaletteName(form.color);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(42,53,40,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', zIndex: 70, backdropFilter: 'blur(4px)',
    }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
        background: C.card, borderRadius: '16px', padding: '24px',
        width: '100%', maxWidth: '500px', maxHeight: '92vh', overflow: 'auto',
        boxShadow: '0 20px 60px rgba(42,53,40,0.25)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div>
            <h2 className="serif" style={{ fontSize: '22px', margin: '0 0 4px', fontWeight: 500, letterSpacing: '-0.01em' }}>
              {editingId ? 'Edit supply' : 'New supply'}
            </h2>
            <div style={{ fontSize: '13px', color: C.inkSoft }}>Wrapping, ribbon, or anything else</div>
          </div>
          <button className="icon-btn" onClick={onCancel} aria-label="Close" style={{
            background: 'transparent', border: 'none', padding: '10px', borderRadius: '8px',
            cursor: 'pointer', color: C.inkSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={20} /></button>
        </div>

        <Field label="Name">
          <input className="text-input" type="text" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Cellophane wrap" autoFocus style={inputStyle()} />
        </Field>

        <Field label="Photo (optional)" hint="A picture of the supply so it's easy to identify in the catalog.">
          {form.imageUrl ? (
            <PhotoEditor
              imageUrl={form.imageUrl}
              position={form.imagePosition || '50% 50%'}
              zoom={form.imageZoom || 1}
              onChange={({ position, zoom }) => setForm({ ...form, imagePosition: position, imageZoom: zoom })}
              onRemove={() => setForm({ ...form, imageUrl: '', imagePosition: '50% 50%', imageZoom: 1 })}
            />
          ) : (
            <FlowerPhotoUpload onUpload={(dataUrl) => setForm({ ...form, imageUrl: dataUrl, imagePosition: '50% 50%', imageZoom: 1 })} />
          )}
        </Field>

        <Field label="Type">
          <TypeDropdown
            value={form.type || 'wrapping'}
            options={(settings && settings.materialTypes) || MATERIAL_TYPES}
            onChange={(key) => setForm({ ...form, type: key })}
            onAdd={onAddMaterialType}
            placeholder="Select type…"
          />
        </Field>

        <Field label={`Color · ${colorName}`}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '8px',
            marginBottom: '12px',
          }}>
            {PALETTE.map(p => {
              const selected = form.color.toLowerCase() === p.hex.toLowerCase();
              const lightSwatch = isLight(p.hex);
              return (
                <button key={p.hex} className="swatch-btn" type="button"
                  onClick={() => { setForm({ ...form, color: p.hex }); setShowCustom(false); }}
                  title={p.name}
                  style={{
                    aspectRatio: '1', borderRadius: '50%',
                    background: p.hex,
                    border: lightSwatch ? `1px solid ${C.border}` : 'none',
                    boxShadow: selected ? `0 0 0 2.5px ${C.ink}` : 'none',
                    padding: 0, position: 'relative',
                  }}>
                  {selected && <Check size={14} strokeWidth={3} color={lightSwatch ? C.ink : C.card} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />}
                </button>
              );
            })}
          </div>

          <div>
            <button type="button" onClick={() => setShowCustom(!showCustom)} style={{
              fontSize: '12px', color: C.inkSoft, background: 'transparent', border: 'none',
              padding: '4px 0', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              <Pipette size={12} strokeWidth={1.8} />
              {showCustom ? 'Hide' : 'Other'} custom color
            </button>
            {showCustom && (
              <div className="slide-down" style={{
                marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px', background: C.bg, borderRadius: '10px',
              }}>
                <input type="color" value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  style={{
                    width: '50px', height: '40px', border: 'none', borderRadius: '8px',
                    cursor: 'pointer', background: 'none', padding: 0,
                  }} />
                <input type="text" value={form.color}
                  onChange={(e) => { let v = e.target.value; if (!v.startsWith('#')) v = '#' + v; setForm({ ...form, color: v.slice(0, 7) }); }}
                  style={{ ...inputStyle(), fontSize: '13px', fontFamily: 'monospace' }}
                  placeholder="#FFFFFF" />
              </div>
            )}
          </div>
        </Field>

        <Field label="Price per use (optional)" hint="What this costs per bouquet (e.g. one length of ribbon). Leave blank if you don't track it.">
          <div style={{ position: 'relative', maxWidth: '160px' }}>
            <span style={{
              position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
              fontSize: '15px', color: C.inkFaint, pointerEvents: 'none',
            }}>$</span>
            <input className="text-input" type="number" min="0" step="0.01" value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
              placeholder="0.50" style={{ ...inputStyle(), paddingLeft: '26px' }} />
          </div>
        </Field>

        <Field label="Description (optional)" hint="Width, finish, anything else.">
          <input className="text-input" type="text" value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder='e.g. 1.5" wide, satin' style={inputStyle()} />
        </Field>

        <Field label="Where to buy (optional)" hint="Tag with the store(s) you get this from. Reused on shopping trips.">
          <MultiTagDropdown
            values={Array.isArray(form.storeTags) ? form.storeTags : []}
            options={knownStoreTags || []}
            onChange={(next) => setForm({ ...form, storeTags: next })}
            onAdd={onAddStoreTag}
            onDeleteOption={onDeleteStoreTag}
            placeholder="Add store"
          />
        </Field>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '14px', background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: '10px', color: C.inkSoft, fontFamily: 'inherit', fontSize: '15px',
            fontWeight: 500, cursor: 'pointer',
          }}>Cancel</button>
          <button className="primary-btn" onClick={onSubmit} style={{
            flex: 2, padding: '14px', background: C.sageDeep, border: 'none',
            borderRadius: '10px', color: C.card, fontFamily: 'inherit', fontSize: '15px',
            fontWeight: 500, cursor: 'pointer',
          }}>{editingId ? 'Save changes' : 'Add supply'}</button>
        </div>
      </div>
    </div>
  );
}

// --------------------- INVENTORY ---------------------

function InventoryView({
  flowers, expandedHistory, bouquets, materials,
  onAdd, onEdit, onDelete, onBulkDelete, onLog, onToggleHistory, onDeleteHistoryEntry,
  onCreateBouquet, onEditBouquet, onDeleteBouquet, onBulkDeleteBouquet, onUseBouquet,
}) {
  const [subTab, setSubTab] = useState('flowers');
  const [search, setSearch] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid' — flowers only

  // Reset selection when leaving edit mode or switching sub-tabs
  useEffect(() => { if (!editMode) setSelected(new Set()); }, [editMode]);
  useEffect(() => { setSelected(new Set()); setEditMode(false); }, [subTab]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const handleBulkDelete = () => {
    if (selected.size === 0) return;
    if (isFlowers && onBulkDelete) onBulkDelete([...selected]);
    else if (!isFlowers && onBulkDeleteBouquet) onBulkDeleteBouquet([...selected]);
    setSelected(new Set());
    setEditMode(false);
  };

  // Alphabetical sort by name so long lists stay scannable; search
  // filters the already-sorted list (preserves order).
  const sortByName = (a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
  const filteredFlowers = useMemo(() => {
    const sorted = [...(flowers || [])].sort(sortByName);
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(f =>
      f.name.toLowerCase().includes(q)
      || (f.description && f.description.toLowerCase().includes(q))
      || (f.priceHistory || []).some(h => h.note && h.note.toLowerCase().includes(q))
    );
  }, [flowers, search]);
  const filteredBouquets = useMemo(() => {
    const sorted = [...(bouquets || [])].sort(sortByName);
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(b => b.name.toLowerCase().includes(q));
  }, [bouquets, search]);

  const listSize = subTab === 'flowers' ? flowers.length : (bouquets || []).length;
  const showSearch = listSize >= 1;
  const isFlowers = subTab === 'flowers';

  return (
    <div className="fade-in">
      <div style={{
        display: 'flex', gap: '4px', background: C.bgDeep, padding: '4px',
        borderRadius: '11px', marginBottom: '16px',
      }}>
        <button onClick={() => setSubTab('flowers')} style={{
          flex: 1, padding: '10px', borderRadius: '9px', border: 'none',
          background: isFlowers ? C.card : 'transparent',
          color: isFlowers ? C.ink : C.inkSoft,
          fontFamily: 'inherit', fontSize: '14px', fontWeight: isFlowers ? 600 : 500, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          boxShadow: isFlowers ? '0 2px 6px rgba(42,53,40,0.06)' : 'none',
        }}>
          <Flower2 size={14} strokeWidth={2} /> Flowers
          <span style={{ opacity: 0.55, fontWeight: 400, fontSize: '12px' }}>{flowers.length}</span>
        </button>
        <button onClick={() => setSubTab('bouquets')} style={{
          flex: 1, padding: '10px', borderRadius: '9px', border: 'none',
          background: !isFlowers ? C.card : 'transparent',
          color: !isFlowers ? C.ink : C.inkSoft,
          fontFamily: 'inherit', fontSize: '14px', fontWeight: !isFlowers ? 600 : 500, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          boxShadow: !isFlowers ? '0 2px 6px rgba(42,53,40,0.06)' : 'none',
        }}>
          <Sheet size={14} strokeWidth={2} /> Bouquets
          <span style={{ opacity: 0.55, fontWeight: 400, fontSize: '12px' }}>{(bouquets || []).length}</span>
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '8px' }}>
        <div style={{ fontSize: '14px', color: C.inkSoft, letterSpacing: '0.04em' }}>
          {editMode && selected.size > 0
            ? `${selected.size} selected`
            : isFlowers
              ? `${flowers.length} ${flowers.length === 1 ? 'flower' : 'flowers'}`
              : `${(bouquets || []).length} ${(bouquets || []).length === 1 ? 'bouquet' : 'bouquets'}`}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {isFlowers && !editMode && (
            <button onClick={() => setViewMode(m => m === 'list' ? 'grid' : 'list')}
              aria-label={viewMode === 'list' ? 'Switch to grid view' : 'Switch to list view'}
              title={viewMode === 'list' ? 'Grid view' : 'List view'}
              style={{
                padding: '10px', background: 'transparent',
                border: `1px solid ${C.border}`, borderRadius: '10px',
                color: C.inkSoft, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              {viewMode === 'list'
                ? <LayoutGrid size={15} strokeWidth={2} />
                : <List size={15} strokeWidth={2} />}
            </button>
          )}
          <button onClick={() => setEditMode(e => !e)} style={{
            padding: '10px 14px',
            background: editMode ? C.sageDeep : 'transparent',
            border: `1px solid ${editMode ? C.sageDeep : C.border}`,
            borderRadius: '10px',
            color: editMode ? C.card : C.inkSoft,
            fontFamily: 'inherit', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            {editMode ? <><Check size={14} strokeWidth={2.4} /> Done</> : <><Pencil size={14} strokeWidth={2} /> Edit</>}
          </button>
          {editMode && selected.size > 0 && (
            <button onClick={handleBulkDelete} style={{
              padding: '10px 14px',
              background: C.roseDeep, border: 'none', borderRadius: '10px',
              color: C.card, fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <Trash2 size={14} strokeWidth={2} /> Delete {selected.size}
            </button>
          )}
          {!editMode && (
            <button className="primary-btn" onClick={isFlowers ? onAdd : onCreateBouquet} style={{
              padding: '10px 16px', background: C.sageDeep, border: 'none', borderRadius: '10px',
              color: C.card, fontFamily: 'inherit', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <Plus size={16} strokeWidth={2.2} /> {isFlowers ? 'Add flower' : 'Create bouquet'}
            </button>
          )}
        </div>
      </div>

      {showSearch && (
        <div style={{ marginBottom: '14px' }}>
          <SearchBar value={search} onChange={setSearch}
            placeholder={isFlowers ? 'Search flowers…' : 'Search bouquets…'} />
        </div>
      )}

      {isFlowers ? (
        flowers.length === 0 ? (
          <div style={{
            background: C.card, border: `1px dashed ${C.border}`, borderRadius: '14px',
            padding: '48px 20px', textAlign: 'center', color: C.inkSoft,
          }}>
            <Flower2 size={32} strokeWidth={1.4} color={C.inkFaint} style={{ marginBottom: '12px' }} />
            <div style={{ fontSize: '14px', marginBottom: '4px' }}>Your garden is empty</div>
            <div style={{ fontSize: '12px', color: C.inkFaint }}>Add your first flower to get started.</div>
          </div>
        ) : filteredFlowers.length === 0 ? (
          <div style={{
            background: C.card, border: `1px dashed ${C.border}`, borderRadius: '14px',
            padding: '32px 20px', textAlign: 'center', color: C.inkSoft, fontSize: '14px',
          }}>
            No flowers match "{search}".
          </div>
        ) : viewMode === 'grid' && !editMode ? (
          <div className="flower-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '10px',
          }}>
            {filteredFlowers.map(f => (
              <FlowerTile key={f.id} flower={f} onEdit={onEdit} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredFlowers.map(f => (
              <FlowerCard key={f.id} flower={f}
                expanded={expandedHistory[f.id]}
                editMode={editMode}
                selected={selected.has(f.id)}
                onToggleSelect={() => toggleSelect(f.id)}
                onEdit={onEdit} onDelete={onDelete} onLog={onLog}
                onToggleHistory={onToggleHistory} onDeleteHistoryEntry={onDeleteHistoryEntry} />
            ))}
          </div>
        )
      ) : (
        (bouquets || []).length === 0 ? (
          <div style={{
            background: C.card, border: `1px dashed ${C.border}`, borderRadius: '14px',
            padding: '48px 20px', textAlign: 'center', color: C.inkSoft,
          }}>
            <Sheet size={32} strokeWidth={1.4} color={C.inkFaint} style={{ marginBottom: '12px' }} />
            <div style={{ fontSize: '14px', marginBottom: '4px' }}>No bouquets yet</div>
            <div style={{ fontSize: '12px', color: C.inkFaint, marginBottom: '14px' }}>
              Save an arrangement as a bouquet to drop it into the cart with one tap.
            </div>
            <button onClick={onCreateBouquet} style={{
              padding: '10px 18px', background: C.sageDeep, border: 'none', borderRadius: '8px',
              color: C.card, fontFamily: 'inherit', fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
            }}><Plus size={14} strokeWidth={2.2} /> Create bouquet</button>
          </div>
        ) : filteredBouquets.length === 0 ? (
          <div style={{
            background: C.card, border: `1px dashed ${C.border}`, borderRadius: '14px',
            padding: '32px 20px', textAlign: 'center', color: C.inkSoft, fontSize: '14px',
          }}>
            No bouquets match "{search}".
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredBouquets.map(b => (
              <BouquetCard key={b.id} bouquet={b}
                flowers={flowers} materials={materials} bouquets={bouquets}
                editMode={editMode}
                selected={selected.has(b.id)}
                onToggleSelect={() => toggleSelect(b.id)}
                onUse={onUseBouquet} onEdit={onEditBouquet} onDelete={onDeleteBouquet} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

function BouquetCard({ bouquet, flowers, materials, bouquets, editMode, selected, onToggleSelect, onUse, onEdit, onDelete }) {
  const hasFixedPrice = typeof bouquet.fixedPrice === 'number' && isFinite(bouquet.fixedPrice);
  const ranges = computeMaterialRanges(bouquet.items, flowers, materials, bouquets);
  const effMid = (ranges.effMin + ranges.effMax) / 2;
  const displayPrice = hasFixedPrice ? bouquet.fixedPrice : effMid;
  const totalItems = (bouquet.items || []).reduce((s, it) => s + it.qty, 0);

  const itemSummary = (bouquet.items || []).map(it => {
    const ref = it.kind === 'flower'
      ? (flowers || []).find(x => x.id === it.id)
      : (materials || []).find(x => x.id === it.id);
    return `${it.qty}× ${ref ? ref.name : '(removed)'}`;
  }).join(' · ');

  const imgPos = bouquet.imagePosition || '50% 50%';
  const imgZoom = typeof bouquet.imageZoom === 'number' && bouquet.imageZoom > 0 ? bouquet.imageZoom : 1;

  return (
    <div className="flower-card" onClick={editMode ? onToggleSelect : undefined} style={{
      background: editMode && selected ? `${C.sage}1f` : C.card,
      border: `1px solid ${editMode && selected ? C.sageDeep : C.borderSoft}`,
      borderRadius: '14px',
      padding: '14px 16px', overflow: 'hidden',
      cursor: editMode ? 'pointer' : 'default',
    }}>
      {/* Top row: square image (matches Flower cards) + name/price/items + actions */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        {editMode && <SelectCheckbox checked={!!selected} />}
        {bouquet.imageUrl && (
          <div className="card-thumb" style={{
            width: 'min(28%, 160px)', aspectRatio: '1', borderRadius: '12px',
            background: `url(${bouquet.imageUrl}) ${imgPos} / ${imgZoom * 100}% no-repeat`,
            flexShrink: 0, border: `1px solid ${C.borderSoft}`,
            alignSelf: 'flex-start',
          }} aria-label={bouquet.name} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 className="serif" style={{
                fontSize: '20px', fontWeight: 500, margin: 0, letterSpacing: '-0.01em',
                color: C.ink, lineHeight: 1.2,
              }}>{bouquet.name}</h3>
              <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {displayPrice > 0 && (
                  <span className="serif" style={{ fontSize: '18px', fontWeight: 600, color: C.sageDeep }}>
                    ${displayPrice.toFixed(2)}
                  </span>
                )}
                <span style={{
                  fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: hasFixedPrice ? C.sageDeep : C.inkFaint,
                  background: hasFixedPrice ? `${C.sage}22` : C.bg,
                  padding: '3px 8px', borderRadius: '4px',
                }}>
                  {hasFixedPrice ? 'Bundled' : 'Loose arrangement'}
                </span>
                <span style={{ fontSize: '12px', color: C.inkFaint }}>
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </span>
              </div>
              {itemSummary && (
                <div style={{
                  marginTop: '8px', fontSize: '13px', lineHeight: 1.5, color: C.inkSoft,
                }}>{itemSummary}</div>
              )}
            </div>
            {!editMode && (
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <button className="icon-btn" onClick={() => onEdit(bouquet)} title="Edit" aria-label="Edit bouquet"
                  style={{
                    background: 'transparent', border: 'none', padding: '11px', borderRadius: '8px',
                    cursor: 'pointer', color: C.inkSoft,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  <Pencil size={16} strokeWidth={1.8} />
                </button>
                <DeleteButton onConfirm={() => onDelete(bouquet.id)} label="Delete bouquet" compact />
              </div>
            )}
          </div>
        </div>
      </div>

      {!editMode && (
        <div style={{
          marginTop: '12px', paddingTop: '10px', borderTop: `1px solid ${C.borderSoft}`,
        }}>
          <button className="primary-btn" onClick={() => onUse(bouquet)} style={{
            width: '100%', padding: '10px', background: C.sageDeep, border: 'none', borderRadius: '8px',
            color: C.card, fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
            <Plus size={14} strokeWidth={2.4} /> Add to cart
          </button>
        </div>
      )}
    </div>
  );
}

function FlowerPhotoUpload({ onUpload }) {
  const [busy, setBusy] = useState(false);
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await compressImageFile(file, 800, 0.82);
      onUpload(dataUrl);
    } catch (err) {} finally {
      setBusy(false);
      e.target.value = '';
    }
  };
  return (
    <label style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      padding: '14px 16px', background: 'transparent',
      border: `1px dashed ${C.border}`, borderRadius: '10px',
      color: C.inkSoft, fontFamily: 'inherit', fontSize: '13px', fontWeight: 500,
      cursor: busy ? 'wait' : 'pointer',
    }}>
      {busy ? <><Loader2 size={14} className="spin" /> Resizing…</> : <><Upload size={14} strokeWidth={2} /> Upload photo</>}
      <input type="file" accept="image/*" onChange={handleFile} disabled={busy} style={{ display: 'none' }} />
    </label>
  );
}

function PhotoEditor({ imageUrl, position, zoom, onChange, onRemove }) {
  const [pos, setPos] = useState(() => {
    const m = /(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/.exec(position || '50% 50%');
    return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : { x: 50, y: 50 };
  });
  const [z, setZ] = useState(zoom || 1);
  const containerRef = useRef(null);
  const draggingRef = useRef(null);

  const commit = (nx, ny, nz) => {
    setPos({ x: nx, y: ny });
    setZ(nz);
    onChange({ position: `${nx.toFixed(1)}% ${ny.toFixed(1)}%`, zoom: nz });
  };

  const onPointerDown = (e) => {
    // Don't intercept taps on overlay buttons (trash, etc.)
    if (e.target.closest('button')) return;
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    draggingRef.current = {
      startX: e.clientX, startY: e.clientY,
      startPos: { ...pos },
      width: rect.width, height: rect.height,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    const d = draggingRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    // Convert pixel delta to percentage delta of container size. Invert so dragging right moves image right.
    const nextX = Math.max(0, Math.min(100, d.startPos.x - (dx / d.width) * 100));
    const nextY = Math.max(0, Math.min(100, d.startPos.y - (dy / d.height) * 100));
    setPos({ x: nextX, y: nextY });
  };
  const onPointerUp = (e) => {
    if (draggingRef.current) {
      onChange({ position: `${pos.x.toFixed(1)}% ${pos.y.toFixed(1)}%`, zoom: z });
      draggingRef.current = null;
    }
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
  };
  const onZoomChange = (e) => {
    const newZ = parseFloat(e.target.value);
    setZ(newZ);
    onChange({ position: `${pos.x.toFixed(1)}% ${pos.y.toFixed(1)}%`, zoom: newZ });
  };
  const reset = () => {
    setPos({ x: 50, y: 50 }); setZ(1);
    onChange({ position: '50% 50%', zoom: 1 });
  };

  return (
    <div>
      <div ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          position: 'relative', borderRadius: '12px', overflow: 'hidden',
          border: `1px solid ${C.border}`,
          background: `url(${imageUrl}) ${pos.x}% ${pos.y}% / ${z * 100}% no-repeat`,
          height: '220px', width: '100%',
          cursor: draggingRef.current ? 'grabbing' : 'grab',
          touchAction: 'none', userSelect: 'none',
        }}
      >
        <button type="button" onClick={onRemove} aria-label="Remove photo"
          style={{
            position: 'absolute', top: '8px', right: '8px',
            background: `${C.ink}cc`, color: C.card, border: 'none', borderRadius: '8px',
            padding: '8px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
          }}><Trash2 size={14} strokeWidth={2} /></button>
        <div style={{
          position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)',
          background: `${C.ink}aa`, color: C.card, padding: '3px 10px', borderRadius: '4px',
          fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
          pointerEvents: 'none',
        }}>Drag to reposition</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
        <span style={{ fontSize: '11px', color: C.inkSoft, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Zoom</span>
        <input type="range" min="1" max="3" step="0.05" value={z}
          onChange={onZoomChange}
          style={{ flex: 1, accentColor: C.sageDeep }} />
        <span style={{ fontSize: '12px', color: C.ink, fontWeight: 600, minWidth: '36px', textAlign: 'right' }}>
          {(z * 100).toFixed(0)}%
        </span>
        <button type="button" onClick={reset} style={{
          background: 'transparent', border: 'none', padding: '4px 8px',
          color: C.inkFaint, fontSize: '11px', fontFamily: 'inherit',
          textDecoration: 'underline', cursor: 'pointer',
        }}>reset</button>
      </div>
    </div>
  );
}

function BouquetFormModal({ form, setForm, editingId, flowers, materials, bouquets, onAddNewFlower, onAddNewMaterial, onCancel, onSubmit, showToast }) {
  const [uploading, setUploading] = useState(false);
  const items = Array.isArray(form.items) ? form.items : [];
  const itemsByKey = useMemo(() => {
    const map = {};
    items.forEach(it => { map[`${it.kind}:${it.id}`] = it; });
    return map;
  }, [items]);

  const setItemQty = (kind, id, n) => {
    const q = Math.max(0, n);
    const existing = items.find(it => it.kind === kind && it.id === id);
    let next;
    if (q === 0) next = items.filter(it => !(it.kind === kind && it.id === id));
    else if (existing) next = items.map(it => (it.kind === kind && it.id === id) ? { ...it, qty: q } : it);
    else next = [...items, { kind, id, qty: q, included: true }];
    setForm({ ...form, items: next });
  };
  const setItemIncluded = (kind, id, included) => {
    setForm({ ...form, items: items.map(it => (it.kind === kind && it.id === id) ? { ...it, included } : it) });
  };
  const setItemOverride = (kind, id, value) => {
    const next = items.map(it => {
      if (!(it.kind === kind && it.id === id)) return it;
      const { unitPriceOverride: _drop, ...rest } = it;
      if (value === '' || value == null) return rest;
      const num = parseFloat(value);
      if (!isFinite(num) || num < 0) return rest;
      return { ...rest, unitPriceOverride: num };
    });
    setForm({ ...form, items: next });
  };

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await compressImageFile(file, 800, 0.82);
      setForm({ ...form, imageUrl: dataUrl });
    } catch (err) {
      if (showToast) showToast("Couldn't read that image.");
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const recipeMid = useMemo(() => {
    const r = computeMaterialRanges(items, flowers, materials, bouquets);
    return (r.effMin + r.effMax) / 2;
  }, [items, flowers, materials, bouquets]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(42,53,40,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', zIndex: 50, backdropFilter: 'blur(4px)',
    }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
        background: C.card, borderRadius: '16px', padding: '24px',
        width: '100%', maxWidth: '500px', maxHeight: '92vh', overflow: 'auto',
        boxShadow: '0 20px 60px rgba(42,53,40,0.25)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div>
            <h2 className="serif" style={{ fontSize: '22px', margin: '0 0 4px', fontWeight: 500, letterSpacing: '-0.01em' }}>
              {editingId ? 'Edit bouquet' : 'New bouquet'}
            </h2>
            <div style={{ fontSize: '13px', color: C.inkSoft }}>A reusable arrangement she can drop into any cart</div>
          </div>
          <button className="icon-btn" onClick={onCancel} aria-label="Close" style={{
            background: 'transparent', border: 'none', padding: '10px', borderRadius: '8px',
            cursor: 'pointer', color: C.inkSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={20} /></button>
        </div>

        <Field label="Bouquet name">
          <input className="text-input" type="text" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Spring market mix" autoFocus style={inputStyle()} />
        </Field>

        <Field label="Photo (optional)" hint="Drag to reposition. Use the slider to zoom.">
          {form.imageUrl ? (
            <PhotoEditor
              imageUrl={form.imageUrl}
              position={form.imagePosition || '50% 50%'}
              zoom={form.imageZoom || 1}
              onChange={({ position, zoom }) => setForm({ ...form, imagePosition: position, imageZoom: zoom })}
              onRemove={() => setForm({ ...form, imageUrl: '', imagePosition: '50% 50%', imageZoom: 1 })}
            />
          ) : (
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '14px 16px', background: 'transparent',
              border: `1px dashed ${C.border}`, borderRadius: '10px',
              color: C.inkSoft, fontFamily: 'inherit', fontSize: '13px', fontWeight: 500,
              cursor: uploading ? 'wait' : 'pointer',
            }}>
              {uploading ? <><Loader2 size={14} className="spin" /> Resizing…</> : <><Upload size={14} strokeWidth={2} /> Choose photo</>}
              <input type="file" accept="image/*" onChange={handleImageFile} disabled={uploading} style={{ display: 'none' }} />
            </label>
          )}
        </Field>

        <Field label="Fixed price (optional)" hint="Set a price → the bouquet bundles into the cart as one line. Leave blank → its items load individually so you can tweak.">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative', maxWidth: '160px' }}>
              <span style={{
                position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                fontSize: '15px', color: C.inkFaint, pointerEvents: 'none',
              }}>$</span>
              <input className="text-input" type="number" min="0" step="0.01"
                inputMode="decimal" value={form.fixedPrice}
                onChange={(e) => setForm({ ...form, fixedPrice: e.target.value })}
                placeholder={recipeMid > 0 ? recipeMid.toFixed(2) : '0.00'}
                style={{ ...inputStyle(), paddingLeft: '26px' }} />
            </div>
            {recipeMid > 0 && (
              <button type="button" onClick={() => setForm({ ...form, fixedPrice: recipeMid.toFixed(2) })}
                style={{
                  padding: '8px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px',
                  color: C.inkSoft, fontFamily: 'inherit', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                }}>Use arrangement ${recipeMid.toFixed(2)}</button>
            )}
          </div>
        </Field>

        <RecipeEditor
          items={items} flowers={flowers} materials={materials} bouquets={bouquets} itemsByKey={itemsByKey}
          setItemQty={setItemQty} setItemIncluded={setItemIncluded} setItemOverride={setItemOverride}
          onAddNewFlower={onAddNewFlower} onAddNewMaterial={onAddNewMaterial}
        />

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '14px', background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: '10px', color: C.inkSoft, fontFamily: 'inherit', fontSize: '15px',
            fontWeight: 500, cursor: 'pointer',
          }}>Cancel</button>
          <button className="primary-btn" onClick={onSubmit} style={{
            flex: 2, padding: '14px', background: C.sageDeep, border: 'none',
            borderRadius: '10px', color: C.card, fontFamily: 'inherit', fontSize: '15px',
            fontWeight: 500, cursor: 'pointer',
          }}>{editingId ? 'Save changes' : 'Create bouquet'}</button>
        </div>
      </div>
    </div>
  );
}

function FlowerCard({ flower, expanded, editMode, selected, onToggleSelect, onEdit, onDelete, onLog, onToggleHistory, onDeleteHistoryEntry }) {
  const isPer = flower.mode === 'perStem';
  const stemPrice = isPer ? flower.bunchPrice / flower.bunchCount : null;
  const history = flower.priceHistory || [];
  const lastEntry = history[0];
  let trend = null;
  if (history.length >= 2) {
    const prev = history[1];
    const curr = isPer ? (flower.bunchPrice / flower.bunchCount) : ((flower.flatMin + flower.flatMax) / 2);
    const prevVal = prev.bunchPrice !== undefined ? (prev.bunchPrice / prev.bunchCount) : ((prev.flatMin + prev.flatMax) / 2);
    if (curr > prevVal * 1.03) trend = 'up';
    else if (curr < prevVal * 0.97) trend = 'down';
  }

  const imgPos = flower.imagePosition || '50% 50%';
  const imgZoom = typeof flower.imageZoom === 'number' && flower.imageZoom > 0 ? flower.imageZoom : 1;

  return (
    <div className="flower-card" onClick={editMode ? onToggleSelect : undefined} style={{
      background: editMode && selected ? `${C.sage}1f` : C.card,
      border: `1px solid ${editMode && selected ? C.sageDeep : C.borderSoft}`,
      borderRadius: '14px',
      padding: '14px 16px', overflow: 'hidden',
      cursor: editMode ? 'pointer' : 'default',
    }}>
      {/* Top row: square image + name/price/details + actions — matches BouquetCard */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        {editMode && <SelectCheckbox checked={!!selected} />}
        {flower.imageUrl && (
          <div className="card-thumb" style={{
            width: 'min(28%, 160px)', aspectRatio: '1', borderRadius: '12px',
            background: `url(${flower.imageUrl}) ${imgPos} / ${imgZoom * 100}% no-repeat`,
            flexShrink: 0, border: `1px solid ${C.borderSoft}`,
            alignSelf: 'flex-start',
          }} aria-label={flower.name} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 className="serif" style={{
                fontSize: '20px', fontWeight: 500, margin: 0, letterSpacing: '-0.01em', color: C.ink, lineHeight: 1.2,
              }}>{flower.name}</h3>
              <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {isPer ? (
                  <>
                    <span className="serif" style={{ fontSize: '18px', fontWeight: 600, color: C.sageDeep }}>
                      ${stemPrice.toFixed(2)}
                    </span>
                    <span style={{ fontSize: '12px', color: C.inkFaint }}>
                      /stem · ${flower.bunchPrice.toFixed(2)} for {flower.bunchCount}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="serif" style={{ fontSize: '18px', fontWeight: 600, color: C.sageDeep }}>
                      ${flower.flatMin.toFixed(2)}–${flower.flatMax.toFixed(2)}
                    </span>
                    <span style={{ fontSize: '12px', color: C.inkFaint }}>/bunch</span>
                  </>
                )}
                {trend === 'up' && <TrendingUp size={13} color={C.rose} strokeWidth={2} />}
                {trend === 'down' && <TrendingDown size={13} color={C.sageDeep} strokeWidth={2} />}
              </div>
              {lastEntry && (
                <div style={{ fontSize: '11px', color: C.inkFaint, marginTop: '3px', fontStyle: 'italic' }}>
                  Logged {formatRelative(lastEntry.date)}{lastEntry.note ? ` · ${lastEntry.note}` : ''}
                </div>
              )}
              {flower.description && (
                <div style={{
                  marginTop: '8px', fontSize: '13px', lineHeight: 1.5, color: C.inkSoft,
                }} className="desc-clamp">{flower.description}</div>
              )}
            </div>
            {!editMode && (
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <button className="icon-btn" onClick={() => onEdit(flower)} title="Edit" aria-label="Edit flower"
                  style={{
                    background: 'transparent', border: 'none', padding: '11px', borderRadius: '8px',
                    cursor: 'pointer', color: C.inkSoft,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  <Pencil size={16} strokeWidth={1.8} />
                </button>
                <DeleteButton onConfirm={() => onDelete(flower.id)} label="Delete flower" compact />
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '12px', paddingTop: '10px', borderTop: `1px solid ${C.borderSoft}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
      }}>
        <button className="log-btn" onClick={() => onLog(flower)} style={{
          padding: '6px 12px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '8px',
          color: C.inkSoft, fontFamily: 'inherit', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '5px',
        }}>
          <Tag size={12} strokeWidth={2} /> Log price
        </button>
        {history.length > 0 && (
          <button onClick={() => onToggleHistory(flower.id)} style={{
            background: 'transparent', border: 'none', padding: '4px 8px',
            color: C.inkSoft, fontFamily: 'inherit', fontSize: '14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            {history.length} {history.length === 1 ? 'entry' : 'entries'}
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}
      </div>

      {expanded && history.length > 0 && (
        <div className="slide-down" style={{ marginTop: '10px' }}>
          {history.map((h, idx) => {
            const display = h.bunchPrice !== undefined
              ? `$${h.bunchPrice.toFixed(2)} / ${h.bunchCount} stems · $${(h.bunchPrice / h.bunchCount).toFixed(2)}/stem`
              : `$${h.flatMin.toFixed(2)}–$${h.flatMax.toFixed(2)} per bunch`;
            return (
              <div key={idx} className="history-row" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 10px', borderRadius: '8px', gap: '10px',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', color: C.ink, fontWeight: 500 }}>{display}</div>
                  <div style={{ fontSize: '11px', color: C.inkFaint, marginTop: '2px' }}>
                    {formatShortDate(h.date)} · {formatRelative(h.date)}{h.note ? ` · ${h.note}` : ''}
                  </div>
                </div>
                <button className="icon-btn" onClick={() => onDeleteHistoryEntry(flower.id, idx)} title="Remove entry"
                  aria-label="Remove price entry"
                  style={{
                    background: 'transparent', border: 'none', padding: '10px', borderRadius: '8px',
                    cursor: 'pointer', color: C.inkFaint,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Compact photo-first tile used by the flowers grid view. Tap opens the
// same edit modal that the list view's pencil opens, so she can act on
// any flower without losing grid context (no extra "details" sheet).
function FlowerTile({ flower, onEdit }) {
  const isPer = flower.mode === 'perStem';
  const stemPrice = isPer ? flower.bunchPrice / flower.bunchCount : null;
  const imgPos = flower.imagePosition || '50% 50%';
  const imgZoom = typeof flower.imageZoom === 'number' && flower.imageZoom > 0 ? flower.imageZoom : 1;
  const initial = (flower.name || '?').charAt(0).toUpperCase();

  return (
    <button onClick={() => onEdit(flower)}
      className="flower-card"
      aria-label={`Edit ${flower.name}`}
      style={{
        background: C.card, border: `1px solid ${C.borderSoft}`,
        borderRadius: '12px', padding: '8px',
        display: 'flex', flexDirection: 'column', gap: '8px',
        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        overflow: 'hidden',
      }}>
      {flower.imageUrl ? (
        <div style={{
          aspectRatio: '1', borderRadius: '8px',
          background: `url(${flower.imageUrl}) ${imgPos} / ${imgZoom * 100}% no-repeat`,
          border: `1px solid ${C.borderSoft}`,
        }} aria-hidden />
      ) : (
        <div style={{
          aspectRatio: '1', borderRadius: '8px',
          background: C.bgDeep, border: `1px dashed ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: C.inkFaint, fontSize: '28px', fontWeight: 500,
        }} className="serif" aria-hidden>{initial}</div>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: '13px', fontWeight: 600, color: C.ink, lineHeight: 1.2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{flower.name}</div>
        <div className="serif" style={{
          fontSize: '14px', fontWeight: 600, color: C.sageDeep,
          letterSpacing: '-0.01em', marginTop: '2px', lineHeight: 1.1,
        }}>
          {isPer
            ? `$${stemPrice.toFixed(2)}`
            : `$${flower.flatMin.toFixed(2)}–${flower.flatMax.toFixed(2)}`}
        </div>
      </div>
    </button>
  );
}

// --------------------- CART (BUILD) ---------------------

// --------------------- STATS ---------------------

function StatsView({ orders, shopping, settings, onViewReceipt, onUndoReset }) {
  const now = new Date();
  const [mode, setMode] = useState('month'); // 'month' | 'year' | 'all'
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  // Build year options from all orders, plus current year, descending
  const yearOptions = useMemo(() => {
    const years = new Set([now.getFullYear()]);
    (orders || []).forEach(o => {
      if (!o.pickupDateTime) return;
      const d = new Date(o.pickupDateTime);
      if (isFinite(d.getTime())) years.add(d.getFullYear());
    });
    return [...years].sort((a, b) => b - a);
  }, [orders, now.getFullYear()]);

  const period = mode === 'all' ? { mode: 'all' }
    : mode === 'year' ? { mode: 'year', year }
    : { mode: 'month', year, month };
  const statsResetAt = settings && settings.statsResetAt;
  const stats = useMemo(() => computeStats(orders, period, statsResetAt), [orders, mode, year, month, statsResetAt]);
  // Top stores — count completed shopping trips by their storeTags. Trips
  // with multiple tags get one count per tag (a Costco+TJ trip = +1 each).
  // Falls back to all-time since shopping data isn't tied to the period
  // selector (trips don't have pickup dates that map cleanly to month/year).
  const topStores = useMemo(() => {
    const map = new Map();
    for (const trip of (shopping || [])) {
      // Only completed trips count as "favorites" — incomplete trips are
      // intent, not actual visits.
      if (trip.status !== 'done') continue;
      for (const tag of (trip.storeTags || [])) {
        if (!tag) continue;
        map.set(tag, (map.get(tag) || 0) + 1);
      }
    }
    return Array.from(map.entries())
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [shopping]);
  const [logSort, setLogSort] = useState('newest');
  const [logFilter, setLogFilter] = useState('all');

  const fmt = (n) => `$${n.toFixed(2)}`;
  const fmtPct = (n) => `${n.toFixed(1)}%`;
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const periodLabel = mode === 'all' ? 'All time'
    : mode === 'year' ? `${year}`
    : `${monthNames[month]} ${year}`;

  const logOrders = useMemo(() => {
    let list = stats.orders;
    if (logFilter === 'paid') list = list.filter(o => o.paid);
    else if (logFilter === 'unpaid') list = list.filter(o => !o.paid);
    const comparators = {
      newest: (a, b) => new Date(b.pickupDateTime) - new Date(a.pickupDateTime),
      oldest: (a, b) => new Date(a.pickupDateTime) - new Date(b.pickupDateTime),
      highest: (a, b) => (b.quantity * b.costPer + sumExtras(b.extraCosts)) - (a.quantity * a.costPer + sumExtras(a.extraCosts)),
      lowest: (a, b) => (a.quantity * a.costPer + sumExtras(a.extraCosts)) - (b.quantity * b.costPer + sumExtras(b.extraCosts)),
    };
    return [...list].sort(comparators[logSort] || comparators.newest);
  }, [stats.orders, logSort, logFilter]);

  const resetDate = statsResetAt ? new Date(statsResetAt) : null;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {statsResetAt && (
        <div style={{
          padding: '10px 14px', background: `${C.gold}15`, border: `1px solid ${C.gold}66`,
          borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '10px', flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: '12px', color: C.inkSoft, lineHeight: 1.5,
            display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RotateCw size={13} strokeWidth={2} color={C.gold} />
            Counting earnings since <strong style={{ color: C.ink }}>
              {resetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </strong>
          </div>
          <button onClick={onUndoReset} style={{
            padding: '4px 10px', fontSize: '11px', fontFamily: 'inherit',
            background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '6px',
            color: C.inkSoft, cursor: 'pointer', fontWeight: 500,
          }}>Undo reset</button>
        </div>
      )}
      <div style={{
        background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: '12px',
        padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px',
      }}>
        <div style={{
          display: 'flex', gap: '4px', background: C.bgDeep, padding: '4px',
          borderRadius: '9px',
        }}>
          {[
            { key: 'month', label: 'By month' },
            { key: 'year', label: 'By year' },
            { key: 'all', label: 'All time' },
          ].map(p => (
            <button key={p.key} onClick={() => setMode(p.key)} style={{
              flex: 1, padding: '8px', borderRadius: '7px', border: 'none',
              background: mode === p.key ? C.card : 'transparent',
              color: mode === p.key ? C.ink : C.inkSoft,
              fontFamily: 'inherit', fontSize: '12px', fontWeight: mode === p.key ? 600 : 500, cursor: 'pointer',
            }}>{p.label}</button>
          ))}
        </div>
        {(mode === 'month' || mode === 'year') && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {mode === 'month' && (
              <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}
                style={{
                  flex: 2, padding: '10px 12px', fontSize: '14px', fontFamily: 'inherit',
                  background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px',
                  color: C.ink, cursor: 'pointer',
                }}>
                {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            )}
            <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}
              style={{
                flex: 1, padding: '10px 12px', fontSize: '14px', fontFamily: 'inherit',
                background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px',
                color: C.ink, cursor: 'pointer',
              }}>
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}
      </div>

      <ProfitCard stats={stats} periodLabel={periodLabel} fmt={fmt} fmtPct={fmtPct} />

      {stats.count > 0 && (
        <>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px',
          }}>
            <TopList title="Top flowers" subtitle="by stems used" entries={stats.topFlowers}
              valueFmt={(v) => `${v.qty} stems`} emptyText="No flowers tracked yet." />
            <TopList title="Top supplies" subtitle="by units used" entries={stats.topMaterials}
              valueFmt={(v) => `${v.qty}×`} emptyText="No supplies tracked yet." />
            <TopList title="Top customers" subtitle="by revenue" entries={stats.topCustomers}
              valueFmt={(v) => fmt(v.revenue)} emptyText="No customers yet." />
            <TopList title="Favorite stores" subtitle="by completed trips" entries={topStores}
              valueFmt={(v) => `${v.qty} trip${v.qty === 1 ? '' : 's'}`}
              emptyText="No completed trips yet." />
            <PaymentBreakdownCard breakdown={stats.paymentBreakdown} total={stats.revenue} fmt={fmt}
              paymentMethods={settings && settings.paymentMethods} />
          </div>

          <OrderLog orders={logOrders}
            sort={logSort} setSort={setLogSort}
            filter={logFilter} setFilter={setLogFilter}
            onViewReceipt={onViewReceipt} fmt={fmt} />
        </>
      )}
    </div>
  );
}

function ProfitCard({ stats, periodLabel, fmt, fmtPct }) {
  const marginColor = stats.profit < 0 ? C.roseDeep : stats.marginPct < 25 ? C.gold : C.sageDeep;
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: '14px',
      padding: '18px',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: '14px', gap: '8px', flexWrap: 'wrap',
      }}>
        <div className="serif" style={{ fontSize: '18px', fontWeight: 500, letterSpacing: '-0.01em' }}>
          {periodLabel}
        </div>
        <div style={{ fontSize: '12px', color: C.inkFaint }}>
          {stats.count} {stats.count === 1 ? 'order' : 'orders'}
        </div>
      </div>

      {stats.count === 0 ? (
        <div style={{
          padding: '24px', textAlign: 'center', color: C.inkFaint, fontSize: '13px',
          fontStyle: 'italic',
        }}>No orders in this period yet.</div>
      ) : (
        <>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px',
            marginBottom: '14px',
          }}>
            <Stat label="Revenue" value={fmt(stats.revenue)} />
            <Stat label="Cost" value={fmt(stats.cost)} />
            <Stat label="Profit" value={fmt(stats.profit)} color={marginColor} big />
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px',
          }}>
            <Stat label="Avg order" value={fmt(stats.avgOrderRevenue)} />
            <Stat label="Margin" value={fmtPct(stats.marginPct)} color={marginColor} />
            <Stat label="Unpaid" value={fmt(stats.unpaidRevenue)}
              color={stats.unpaidRevenue > 0 ? C.gold : C.inkSoft} />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, color, big }) {
  return (
    <div>
      <div style={{
        fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: C.inkFaint, marginBottom: '4px',
      }}>{label}</div>
      <div className="serif" style={{
        fontSize: big ? '24px' : '18px', fontWeight: 600,
        color: color || C.ink, letterSpacing: '-0.01em', lineHeight: 1.1,
      }}>{value}</div>
    </div>
  );
}

function TopList({ title, subtitle, entries, valueFmt, emptyText }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: '12px',
      padding: '14px',
    }}>
      <div style={{ marginBottom: '10px' }}>
        <div className="serif" style={{ fontSize: '15px', fontWeight: 500 }}>{title}</div>
        {subtitle && <div style={{ fontSize: '11px', color: C.inkFaint }}>{subtitle}</div>}
      </div>
      {entries.length === 0 ? (
        <div style={{ fontSize: '12px', color: C.inkFaint, fontStyle: 'italic', padding: '8px 0' }}>
          {emptyText}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {entries.map(([key, v], i) => (
            <div key={key} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px',
              fontSize: '13px',
            }}>
              <div style={{
                flex: 1, minWidth: 0, color: C.ink,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                <span style={{ color: C.inkFaint, marginRight: '6px', fontWeight: 600 }}>{i + 1}.</span>
                {v.name || key}
              </div>
              <div style={{ color: C.sageDeep, fontWeight: 600, flexShrink: 0 }}>
                {valueFmt(v)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentBreakdownCard({ breakdown, total, fmt, paymentMethods }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: '12px',
      padding: '14px',
    }}>
      <div style={{ marginBottom: '10px' }}>
        <div className="serif" style={{ fontSize: '15px', fontWeight: 500 }}>Payment methods</div>
        <div style={{ fontSize: '11px', color: C.inkFaint }}>share of revenue</div>
      </div>
      {breakdown.length === 0 ? (
        <div style={{ fontSize: '12px', color: C.inkFaint, fontStyle: 'italic', padding: '8px 0' }}>
          No payments yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {breakdown.map(([key, v]) => {
            const method = (paymentMethods || PAYMENT_METHODS).find(p => p.key === key);
            const pct = total > 0 ? (v.revenue / total) * 100 : 0;
            return (
              <div key={key}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  fontSize: '12px', marginBottom: '3px', gap: '8px',
                }}>
                  <span style={{
                    color: C.ink, fontWeight: 500,
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                  }}>
                    <span style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: method?.color || C.inkFaint, display: 'inline-block',
                    }} />
                    {method?.label || key}
                  </span>
                  <span style={{ color: C.inkSoft }}>
                    {fmt(v.revenue)} <span style={{ color: C.inkFaint, fontSize: '11px' }}>({pct.toFixed(0)}%)</span>
                  </span>
                </div>
                <div style={{ background: C.bg, borderRadius: '3px', height: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.max(2, pct)}%`, height: '100%',
                    background: method?.color || C.sageDeep,
                    transition: 'width 240ms ease',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrderLog({ orders, sort, setSort, filter, setFilter, onViewReceipt, fmt }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(o =>
      (o.customerName || '').toLowerCase().includes(q)
      || (o.arrangement || '').toLowerCase().includes(q)
      || (o.notes || '').toLowerCase().includes(q)
      || (o.cardMessage || '').toLowerCase().includes(q)
    );
  }, [orders, search]);

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: '14px',
      padding: '16px',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        gap: '8px', flexWrap: 'wrap', marginBottom: '12px',
      }}>
        <div>
          <div className="serif" style={{ fontSize: '17px', fontWeight: 500, letterSpacing: '-0.01em' }}>
            Order log
          </div>
          <div style={{ fontSize: '12px', color: C.inkFaint }}>
            {filtered.length}{filtered.length !== orders.length ? ` of ${orders.length}` : ''} {orders.length === 1 ? 'order' : 'orders'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '6px 10px', fontSize: '12px', fontFamily: 'inherit',
              background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px',
              color: C.ink, cursor: 'pointer',
            }}>
            <option value="all">All orders</option>
            <option value="paid">Paid only</option>
            <option value="unpaid">Unpaid only</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            style={{
              padding: '6px 10px', fontSize: '12px', fontFamily: 'inherit',
              background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px',
              color: C.ink, cursor: 'pointer',
            }}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highest">Highest $</option>
            <option value="lowest">Lowest $</option>
          </select>
          <button onClick={() => { if (searchOpen && search) setSearch(''); setSearchOpen(o => !o); }}
            aria-label="Toggle search" title="Search orders"
            style={{
              padding: '6px', width: '30px', height: '30px',
              background: searchOpen || search ? C.sageDeep : C.bg,
              border: `1px solid ${searchOpen || search ? C.sageDeep : C.border}`, borderRadius: '8px',
              color: searchOpen || search ? C.card : C.inkSoft, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <Search size={14} strokeWidth={2} />
          </button>
        </div>
      </div>

      {searchOpen && (
        <div style={{ marginBottom: '12px' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by customer, arrangement, notes, message…" />
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{
          padding: '20px', textAlign: 'center', color: C.inkFaint, fontSize: '13px',
          fontStyle: 'italic',
        }}>No orders match.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px',
          maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px',
        }}>
          {filtered.map(o => {
            const total = o.quantity * o.costPer + sumExtras(o.extraCosts);
            const d = new Date(o.pickupDateTime);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            return (
              <button key={o.id} onClick={() => onViewReceipt(o)} style={{
                padding: '10px 12px', background: C.bg, border: `1px solid ${C.borderSoft}`,
                borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: '10px',
                transition: 'all 140ms ease',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '13px', fontWeight: 600, color: C.ink,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{o.customerName || '(no name)'}</div>
                  <div style={{ fontSize: '11px', color: C.inkFaint, marginTop: '2px' }}>
                    {dateStr} · {timeStr}{o.arrangement ? ` · ${o.arrangement}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="serif" style={{ fontSize: '14px', fontWeight: 600, color: C.ink }}>
                    {fmt(total)}
                  </div>
                  <div style={{
                    fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: o.paid ? C.sageDeep : C.gold, marginTop: '2px',
                  }}>{o.paid ? 'Paid' : 'Unpaid'}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --------------------- SHOPPING ---------------------

// Tap-to-edit modal for a single shopping-trip row. Opens when the user taps
// an item's name — lets her adjust qty and rename without fighting with the
// inline label input. Saves back as a single qty-prefixed label so the data
// shape stays compatible with the rest of the trip machinery.
function ShoppingItemEditModal({ item, onSave, onDelete, onClose, suggestionNames }) {
  // Parse the current label into qty + noun on open. Label-stored qty is how
  // every other part of the app reads it, so we keep that contract.
  const parse = (label) => {
    const m = (label || '').trim().match(/^(\d+)\s+(.+)$/);
    if (!m) return { qty: 1, name: (label || '').trim() };
    return { qty: parseInt(m[1]) || 1, name: m[2].trim() };
  };
  const initial = parse(item.label || '');
  const [name, setName] = useState(initial.name);
  const [qty, setQty] = useState(initial.qty);
  const [priority, setPriority] = useState(!!item.priority);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [nameFocus, setNameFocus] = useState(false);
  // Typeahead matches for the name input — the parent passes a combined list
  // of her catalog names and dictionary suggestions. We rank starts-with
  // ahead of contains and cap to 8 so the dropdown never dominates the modal.
  const nameMatches = useMemo(() => {
    const q = (name || '').trim().toLowerCase();
    if (!q || !Array.isArray(suggestionNames)) return [];
    const lowerInitial = (initial.name || '').toLowerCase();
    return suggestionNames
      .filter(n => {
        const ln = n.toLowerCase();
        return ln !== q && ln !== lowerInitial && ln.includes(q);
      })
      .map(n => ({ n, starts: n.toLowerCase().startsWith(q) ? 0 : 1 }))
      .sort((a, b) => a.starts - b.starts || a.n.localeCompare(b.n))
      .slice(0, 8)
      .map(x => x.n);
  }, [name, suggestionNames, initial.name]);

  const handleSave = () => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const cleanQty = Math.max(1, parseInt(qty) || 1);
    const nextLabel = cleanQty > 1 ? `${cleanQty} ${cleanName}` : cleanName;
    onSave({ label: nextLabel, priority });
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(42,53,40,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', zIndex: 75, backdropFilter: 'blur(4px)',
    }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
        background: C.card, borderRadius: '16px', padding: '20px',
        width: '100%', maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(42,53,40,0.3)',
        display: 'flex', flexDirection: 'column', gap: '14px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <h2 className="serif" style={{ fontSize: '20px', margin: 0, fontWeight: 500, letterSpacing: '-0.01em' }}>
            Edit item
          </h2>
          <button onClick={onClose} aria-label="Close" style={{
            background: 'transparent', border: 'none', padding: '6px', borderRadius: '8px',
            cursor: 'pointer', color: C.inkSoft,
          }}><X size={16} /></button>
        </div>

        <div style={{ position: 'relative' }}>
          <label style={{
            display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: C.inkFaint, marginBottom: '6px',
          }}>Name</label>
          <input className="text-input" type="text" value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            onFocus={() => setNameFocus(true)}
            onBlur={() => setTimeout(() => setNameFocus(false), 120)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
              else if (e.key === 'Escape') setNameFocus(false);
            }}
            style={{ ...inputStyle(), width: '100%' }} />
          {nameFocus && nameMatches.length > 0 && (
            <div className="no-scrollbar" style={{
              position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, zIndex: 5,
              background: C.card, border: `1px solid ${C.border}`, borderRadius: '8px',
              boxShadow: '0 8px 20px rgba(42,53,40,0.14)',
              maxHeight: '180px', overflowY: 'auto', padding: '4px',
            }}>
              {nameMatches.map(n => (
                <button key={n} type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { setName(n); setNameFocus(false); }}
                  style={{
                    width: '100%', padding: '8px 10px', background: 'transparent',
                    border: 'none', borderRadius: '6px',
                    fontFamily: 'inherit', fontSize: '13px', color: C.ink,
                    cursor: 'pointer', textAlign: 'left',
                  }}>{n}</button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label style={{
            display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: C.inkFaint, marginBottom: '6px',
          }}>Quantity</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button type="button" onClick={() => setQty(q => Math.max(1, (parseInt(q) || 1) - 1))}
              aria-label="Decrease" style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: C.bgDeep, border: `1px solid ${C.borderSoft}`,
                color: C.ink, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Minus size={16} strokeWidth={2.4} /></button>
            <input type="text" inputMode="numeric" value={qty}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '');
                setQty(raw === '' ? '' : parseInt(raw));
              }}
              onBlur={() => { if (!qty) setQty(1); }}
              style={{
                ...inputStyle(),
                flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: 600,
              }} />
            <button type="button" onClick={() => setQty(q => (parseInt(q) || 0) + 1)}
              aria-label="Increase" style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: C.sageDeep, border: 'none',
                color: C.card, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Plus size={16} strokeWidth={2.6} /></button>
          </div>
        </div>

        <button type="button" onClick={() => setPriority(p => !p)}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '10px',
            background: priority ? `${C.gold}14` : 'transparent',
            border: `1px solid ${priority ? C.gold + '66' : C.borderSoft}`,
            color: priority ? C.ink : C.inkSoft,
            fontFamily: 'inherit', fontSize: '13px', fontWeight: 500,
            cursor: 'pointer', textAlign: 'left',
          }}>
          <Star size={16} strokeWidth={2} fill={priority ? C.gold : 'none'} color={priority ? C.gold : C.inkFaint} />
          <span style={{ flex: 1 }}>Mark as priority</span>
          <span style={{ fontSize: '11px', color: C.inkFaint }}>
            {priority ? 'On · grabs first' : 'Off'}
          </span>
        </button>

        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          {confirmingDelete ? (
            <>
              <button onClick={() => setConfirmingDelete(false)} style={{
                flex: 1, padding: '11px', background: 'transparent', border: `1px solid ${C.border}`,
                borderRadius: '10px', color: C.inkSoft, fontFamily: 'inherit', fontSize: '13px',
                fontWeight: 500, cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={onDelete} style={{
                flex: 1, padding: '11px', background: C.gold, border: 'none',
                borderRadius: '10px', color: C.card, fontFamily: 'inherit', fontSize: '13px',
                fontWeight: 600, cursor: 'pointer',
              }}>Delete item</button>
            </>
          ) : (
            <>
              <button onClick={() => setConfirmingDelete(true)} aria-label="Delete" style={{
                padding: '11px 14px', background: 'transparent',
                border: `1px solid ${C.borderSoft}`, borderRadius: '10px',
                color: C.inkFaint, fontFamily: 'inherit', fontSize: '13px',
                fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}><Trash2 size={14} strokeWidth={2} /> Delete</button>
              <button onClick={onClose} style={{
                flex: 1, padding: '11px', background: 'transparent', border: `1px solid ${C.border}`,
                borderRadius: '10px', color: C.inkSoft, fontFamily: 'inherit', fontSize: '13px',
                fontWeight: 500, cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={handleSave} className="primary-btn" style={{
                flex: 1, padding: '11px', background: C.sageDeep, border: 'none',
                borderRadius: '10px', color: C.card, fontFamily: 'inherit', fontSize: '13px',
                fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}>
                <Check size={14} strokeWidth={2.4} /> Save
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Render an ISO date string (YYYY-MM-DD) as "Today", "Tomorrow", or a friendly weekday-month-day.
// Falls back gracefully on missing/invalid input. Year is shown only when it isn't this year.
function formatTripDate(iso) {
  if (!iso) return 'No date set';
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return iso;
  const [y, m, d] = parts;
  const date = new Date(y, m - 1, d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(y, m - 1, d); target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  const sameYear = date.getFullYear() === today.getFullYear();
  return date.toLocaleDateString('en-US', sameYear
    ? { weekday: 'short', month: 'short', day: 'numeric' }
    : { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

// Bell-icon control sitting next to the trash on each TripCard. Toggle reminder
// on/off and pick a wake-up time. Defaults to 9:00 AM on the trip's scheduled
// day. Closes on outside click.
function TripReminderControl({ trip, onUpdate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const enabled = trip.enableReminders !== false;
  const time = (trip.reminderTime && /^\d{2}:\d{2}$/.test(trip.reminderTime)) ? trip.reminderTime : '09:00';

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const formatTime12 = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        title={enabled ? `Reminder at ${formatTime12(time)}` : 'Reminder off'}
        aria-label="Trip reminder"
        style={{
          background: enabled ? `${C.sage}22` : 'transparent',
          border: 'none', padding: '8px', borderRadius: '8px',
          cursor: 'pointer',
          color: enabled ? C.sageDeep : C.inkFaint,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
        {enabled ? <BellRing size={14} strokeWidth={2} /> : <BellOff size={14} strokeWidth={2} />}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 30,
          background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px',
          boxShadow: '0 12px 32px rgba(42,53,40,0.18)',
          padding: '12px', minWidth: '220px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '10px', marginBottom: '10px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: C.ink }}>Remind me</div>
            <button onClick={() => onUpdate(trip.id, { enableReminders: !enabled })}
              aria-label={enabled ? 'Turn off reminder' : 'Turn on reminder'}
              style={{
                width: '36px', height: '20px', borderRadius: '10px',
                background: enabled ? C.sageDeep : C.bgDeep, border: 'none',
                cursor: 'pointer', position: 'relative', flexShrink: 0,
                transition: 'background 160ms ease',
              }}>
              <div style={{
                width: '16px', height: '16px', borderRadius: '50%', background: C.card,
                position: 'absolute', top: '2px',
                left: enabled ? '18px' : '2px',
                transition: 'left 160ms ease',
              }} />
            </button>
          </div>
          <div style={{
            fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: C.inkFaint, marginBottom: '6px',
          }}>Time on shopping day</div>
          <input type="time" value={time}
            disabled={!enabled}
            onChange={(e) => onUpdate(trip.id, { reminderTime: e.target.value })}
            style={{
              width: '100%', padding: '8px 10px', fontSize: '13px', fontFamily: 'inherit',
              background: enabled ? C.bg : C.bgDeep,
              border: `1px solid ${C.border}`, borderRadius: '8px', color: C.ink,
              opacity: enabled ? 1 : 0.5,
              colorScheme: 'light',
            }} />
          <div style={{
            fontSize: '11px', color: C.inkFaint, marginTop: '8px', lineHeight: 1.4,
          }}>
            {enabled
              ? `Phone alert at ${formatTime12(time)} on the shopping day.`
              : 'No reminder will fire for this trip.'}
          </div>
        </div>
      )}
    </div>
  );
}

// Shared card editor for both 'active' and 'scheduled' trips. The only differences:
//   - Header label color/text
//   - Footer button: "Complete trip" (active) vs "Start trip" (scheduled, gated by canStart)
function TripCard({
  trip, variant, canStart,
  flowers, materials, bouquets, upcomingCustomers,
  knownStoreTags, onAddStoreTag, onDeleteStoreTag,
  onUpdate, onAddItem, onUpdateItem, onRemoveItem,
  onComplete, onStartScheduled, onDelete, onCancelActive,
  onCreateFlower, onCreateMaterial, showToast,
}) {
  // Build a plain-text version of the still-to-buy list and ship it to the
  // clipboard (or the native share sheet where available). Lets her dump the
  // list into SMS/Messages/Notes for a helper in two taps. Skips checked rows
  // since those are already in the cart.
  const shareList = async () => {
    const unchecked = (trip.items || []).filter(it => !it.checked);
    if (unchecked.length === 0) {
      showToast && showToast('Nothing unchecked to share.', 'error');
      return;
    }
    const title = trip.name || 'Shopping list';
    const lines = unchecked.map(it => {
      const lbl = (it.label || '').trim();
      return lbl ? `• ${lbl}` : null;
    }).filter(Boolean);
    const text = `${title}\n${lines.join('\n')}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, text });
        return;
      }
    } catch {}
    try {
      await navigator.clipboard.writeText(text);
      showToast && showToast(`Copied ${lines.length} item${lines.length === 1 ? '' : 's'} to clipboard.`, 'success');
    } catch {
      showToast && showToast('Could not share the list on this device.', 'error');
    }
  };
  const [newItemLabel, setNewItemLabel] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlaySearch, setOverlaySearch] = useState('');
  const pickerRef = useRef(null);
  const [confirmingComplete, setConfirmingComplete] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [filterCustomer, setFilterCustomer] = useState('all');
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  // Which row is open in the edit modal. Kept as id so the lookup stays
  // live — if the underlying item changes (e.g. qty bumped from outside),
  // the modal reflects it on next render.
  const [editingItemId, setEditingItemId] = useState(null);
  const editingItem = editingItemId
    ? (trip.items || []).find(it => it.id === editingItemId)
    : null;
  // Id of the row currently being dragged. Written on dragstart, read by
  // other rows to style their drop indicator, cleared on dragend.
  const [draggingId, setDraggingId] = useState(null);
  // Drop-target id — the row the cursor is currently over while dragging.
  // Drives a subtle highlight so she can see where the drop will land.
  const [dropTargetId, setDropTargetId] = useState(null);

  // Rewrites trip.items into a new order. Shared by the sort buttons and
  // the drag-reorder handler — both ultimately mutate the stored order.
  const reorderItems = (nextItems) => {
    onUpdate(trip.id, { items: nextItems });
  };

  // Tier = 0 (priority unchecked), 1 (plain unchecked), 2 (checked). Used to
  // place a row at the end of its tier after a check/star toggle, so toggles
  // still "bump" the row into the right section without clobbering drag
  // order elsewhere.
  const tierOf = (it) => it.checked ? 2 : (it.priority ? 0 : 1);
  const toggleWithTierSettle = (itemId, patch) => {
    const items = [...(trip.items || [])];
    const idx = items.findIndex(x => x.id === itemId);
    if (idx < 0) return;
    const updated = { ...items[idx], ...patch };
    const rest = items.filter(x => x.id !== itemId);
    const updTier = tierOf(updated);
    // Insert at the END of the updated item's tier (last position where
    // neighbor's tier is <= updTier).
    let insertIdx = 0;
    for (let i = 0; i < rest.length; i++) {
      if (tierOf(rest[i]) <= updTier) insertIdx = i + 1;
      else break;
    }
    rest.splice(insertIdx, 0, updated);
    onUpdate(trip.id, { items: rest });
  };

  // Drop handler — moves the dragged row to just before the drop target,
  // or to the end if targetId is null. No-op if the dragged row would
  // land in the same spot.
  const handleDrop = (targetId) => {
    if (!draggingId || draggingId === targetId) return;
    const items = [...(trip.items || [])];
    const fromIdx = items.findIndex(it => it.id === draggingId);
    if (fromIdx < 0) return;
    const [moved] = items.splice(fromIdx, 1);
    const toIdx = targetId == null
      ? items.length
      : items.findIndex(it => it.id === targetId);
    if (toIdx < 0) items.push(moved);
    else items.splice(toIdx, 0, moved);
    reorderItems(items);
    setDraggingId(null);
    setDropTargetId(null);
  };
  const isActive = variant === 'active';

  // Catalog options for the Add-item picker — flowers + supplies, sorted by
  // kind then name. Each option carries its current catalog price so adding
  // an item from here auto-fills the shopping row's $ input (she can still
  // override after). Flowers use bunch price since she shops by the bunch;
  // flats use the midpoint. Materials use unitPrice.
  const catalogOptions = useMemo(() => {
    const out = [];
    for (const f of (flowers || [])) {
      let price = null;
      if (f.mode === 'perStem') {
        const bp = Number(f.bunchPrice);
        if (isFinite(bp) && bp > 0) price = bp;
      } else {
        const mn = Number(f.flatMin) || 0;
        const mx = Number(f.flatMax) || 0;
        if (mn > 0 || mx > 0) price = (mn + mx) / 2;
      }
      out.push({
        kind: 'flower', name: f.name,
        hint: f.mode === 'perStem' ? '/bunch' : '/bunch',
        price,
      });
    }
    for (const m of (materials || [])) {
      const p = Number(m.unitPrice);
      out.push({
        kind: 'material', name: m.name, hint: 'each',
        price: isFinite(p) && p > 0 ? p : null,
      });
    }
    return out.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'flower' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [flowers, materials]);
  // Typeahead pool: her catalog + any common florist name she hasn't added
  // yet, flagged with isSuggestion so the UI can style/label them. Dictionary
  // rows only show while she's actively typing, so an empty input still lists
  // just her catalog.
  const typeaheadOptions = useMemo(() => {
    const catNames = new Set(catalogOptions.map(o => o.name.toLowerCase()));
    const dict = [];
    for (const name of COMMON_FLOWER_NAMES) {
      if (!catNames.has(name.toLowerCase())) {
        dict.push({ kind: 'flower', name, hint: '/bunch', price: null, isSuggestion: true });
      }
    }
    for (const name of COMMON_SUPPLY_NAMES) {
      if (!catNames.has(name.toLowerCase())) {
        dict.push({ kind: 'material', name, hint: 'each', price: null, isSuggestion: true });
      }
    }
    return [...catalogOptions, ...dict];
  }, [catalogOptions]);
  const filteredOptions = useMemo(() => {
    const q = newItemLabel.trim().toLowerCase();
    if (!q) return catalogOptions;
    // Rank starts-with matches above contains-matches so "Li" surfaces "Lily"
    // before "Calla lily". Cap to 12 rows to keep the popover scannable.
    const ranked = typeaheadOptions
      .filter(o => o.name.toLowerCase().includes(q))
      .map(o => ({ o, starts: o.name.toLowerCase().startsWith(q) ? 0 : 1 }))
      .sort((a, b) => a.starts - b.starts || a.o.name.localeCompare(b.o.name))
      .slice(0, 12)
      .map(x => x.o);
    return ranked;
  }, [catalogOptions, typeaheadOptions, newItemLabel]);
  useEffect(() => {
    if (!pickerOpen) return;
    const onDoc = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [pickerOpen]);
  const addCatalogItem = (opt) => {
    const taggedCustomers = (filterCustomer !== 'all' && filterCustomer !== '__other__')
      ? [filterCustomer] : undefined;
    onAddItem(trip.id, {
      label: opt.name,
      forCustomers: taggedCustomers,
      ...(typeof opt.price === 'number' && opt.price > 0 ? { price: opt.price } : {}),
    });
    setNewItemLabel('');
    setPickerOpen(false);
    setOverlayOpen(false);
    setOverlaySearch('');
  };

  // Build a list of unique customer names — merges item-derived (restock-
  // linked) customers with trip.extraCustomers (added manually via the rail).
  // Extra customers without items show count 0 so the user can pick them as
  // a filter and any items added while filtered get auto-tagged.
  const { customerCounts, hasUntagged, untaggedCount } = useMemo(() => {
    const map = new Map();
    let untagged = 0;
    // Seed with extraCustomers (saved on the trip) AND live upcoming
    // customers from the orders array — so even old trips pick up new
    // customers once those orders exist.
    for (const c of (trip.extraCustomers || [])) {
      if (c && !map.has(c)) map.set(c, 0);
    }
    for (const c of (upcomingCustomers || [])) {
      if (c && !map.has(c)) map.set(c, 0);
    }
    for (const it of (trip.items || [])) {
      const cs = Array.isArray(it.forCustomers) ? it.forCustomers.filter(Boolean) : [];
      if (cs.length === 0) untagged++;
      for (const c of cs) {
        map.set(c, (map.get(c) || 0) + 1);
      }
    }
    return {
      customerCounts: Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])),
      hasUntagged: untagged > 0,
      untaggedCount: untagged,
    };
  }, [trip.items, trip.extraCustomers, upcomingCustomers]);
  // Show the rail whenever there's anything to organize (items exist). It
  // always offers "All" + any customers + "Other" if applicable, so the
  // section feels stable across restock and manual trips alike.
  const showCustomerSplit = (trip.items || []).length > 0;
  // Parse a label like "12 Roses" or "3 bunches Roses" into qty + noun.
  // Used to group same-named items under the "All" view.
  const parseLabel = (label) => {
    if (!label) return { qty: 1, noun: '', display: '' };
    const trimmed = label.trim();
    const m = trimmed.match(/^(\d+)\s+(.+)$/);
    if (!m) return { qty: 1, noun: trimmed.toLowerCase(), display: trimmed };
    let qty = parseInt(m[1]) || 1;
    let rest = m[2].trim();
    const unit = rest.match(/^(stems?|bunches?|bunch|each|units?|dozens?|pcs|pieces?)\s+(.+)$/i);
    if (unit) rest = unit[2].trim();
    return { qty, noun: rest.toLowerCase(), display: rest };
  };
  const filteredItems = filterCustomer === 'all'
    ? (trip.items || [])
    : filterCustomer === '__other__'
    ? (trip.items || []).filter(it => !Array.isArray(it.forCustomers) || it.forCustomers.length === 0)
    : (trip.items || []).filter(it =>
        Array.isArray(it.forCustomers) && it.forCustomers.includes(filterCustomer));
  // Under "All", group items with the same noun so duplicate flowers across
  // customers fold into one row with combined qty. Other filters keep items
  // separate so the user can see/edit each individually.
  // Show every item as its own row. Prior versions merged duplicate labels
  // in the "all customers" view to reduce clutter, but that broke per-row
  // check/price edits (only the first underlying item got toggled, and
  // the input had to be read-only to stay consistent). Individual rows
  // are simpler; she can still filter by customer if the list gets long.
  // Render in stored order — drag reorders win. Tier changes (check / star)
  // re-settle the row via settleTierAfterToggle below, so toggling still
  // bumps a row up or down, but otherwise the user's manual drag order
  // stays exactly as she left it.
  const visibleItems = useMemo(() =>
    filteredItems.map(it => ({ ...it, _ids: [it.id] }))
  , [filteredItems]);

  // Complete-trip with unchecked items: show a confirmation modal unless the
  // user has previously checked "don't show again" (stored in localStorage).
  const handleComplete = () => {
    const items = trip.items || [];
    const unchecked = items.filter(i => !i.checked).length;
    const dontWarn = (() => {
      try { return localStorage.getItem('shop_dontWarnIncomplete_v1') === '1'; }
      catch (e) { return false; }
    })();
    if (unchecked === 0 || dontWarn) { onComplete(trip.id); return; }
    setConfirmingComplete(true);
  };
  // Cancel = revert active trip back to scheduled (progress preserved).
  // Same don't-show-again pattern, separate localStorage key.
  const handleCancel = () => {
    const dontWarn = (() => {
      try { return localStorage.getItem('shop_dontWarnCancel_v1') === '1'; }
      catch (e) { return false; }
    })();
    if (dontWarn) { onCancelActive && onCancelActive(trip.id); return; }
    setConfirmingCancel(true);
  };

  const addItem = () => {
    if (!newItemLabel.trim()) return;
    // Auto-tag the new item with the active customer filter (if any) so it
    // stays grouped under the rail entry the user is currently viewing.
    const taggedCustomers = (filterCustomer !== 'all' && filterCustomer !== '__other__')
      ? [filterCustomer] : undefined;
    onAddItem(trip.id, { label: newItemLabel.trim(), forCustomers: taggedCustomers });
    setNewItemLabel('');
  };

  const headerColor = isActive ? C.sageDeep : C.gold;
  const headerLabel = isActive ? 'Active trip' : 'Scheduled';

  return (
    <div className="trip-card" style={{
      background: C.card,
      border: `1px solid ${isActive ? C.sage + '88' : C.borderSoft}`,
      borderRadius: '14px', padding: '16px',
      // Fixed card height — items scroll inside. Cap is lifted on
      // wider viewports (see .trip-card media rule) so desktop users
      // see more of the list at once without needing to scroll.
      height: 'min(620px, calc(100vh - 120px))',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '12px', flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: headerColor, marginBottom: '4px',
          }}>{headerLabel}</div>
          <input type="text" value={trip.name}
            onChange={(e) => onUpdate(trip.id, { name: e.target.value })}
            placeholder="Untitled trip"
            className="serif"
            style={{
              width: '100%', padding: '6px 0', fontSize: '20px', fontWeight: 500,
              background: 'transparent', border: 'none', color: C.ink,
              fontFamily: '"Playfair Display", serif', letterSpacing: '-0.01em',
              outline: 'none',
            }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
          {(trip.items || []).some(it => !it.checked) && (
            <button onClick={shareList}
              title="Copy the unchecked list to share with a helper"
              aria-label="Share shopping list"
              style={{
                padding: '8px', borderRadius: '8px',
                background: 'transparent', border: 'none',
                color: C.inkSoft, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <Upload size={14} strokeWidth={2} />
            </button>
          )}
          <TripReminderControl trip={trip} onUpdate={onUpdate} />
          <DeleteButton onConfirm={() => onDelete(trip.id)} label={isActive ? 'Discard trip' : 'Delete scheduled trip'} compact />
        </div>
      </div>

      {/* Date + Store tags row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'minmax(140px, 1fr) 2fr',
        gap: '12px', marginBottom: '14px', alignItems: 'flex-start',
        flexShrink: 0,
      }}>
        <div>
          <div style={{
            fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: C.inkFaint, marginBottom: '6px',
          }}>Shopping day</div>
          <input type="date" value={trip.scheduledFor || ''}
            min={(() => {
              const d = new Date();
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            })()}
            onChange={(e) => {
              const next = e.target.value;
              if (next) {
                // Hard guard: if someone types an earlier date past the picker's
                // greyed-out cells, pin it to today so a past day never persists.
                const d = new Date();
                const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                if (next < today) { onUpdate(trip.id, { scheduledFor: today }); return; }
              }
              onUpdate(trip.id, { scheduledFor: next });
            }}
            style={{
              width: '100%', padding: '8px 10px', fontSize: '13px', fontFamily: 'inherit',
              background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.ink,
              colorScheme: 'light',
            }} />
          {trip.scheduledFor && (
            <div style={{ fontSize: '11px', color: C.inkFaint, marginTop: '4px' }}>
              {formatTripDate(trip.scheduledFor)}
            </div>
          )}
        </div>
        <div>
          <div style={{
            fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: C.inkFaint, marginBottom: '6px',
          }}>Store(s)</div>
          <MultiTagDropdown
            values={trip.storeTags || []}
            options={knownStoreTags || []}
            onChange={(next) => onUpdate(trip.id, { storeTags: next })}
            onAdd={onAddStoreTag}
            onDeleteOption={onDeleteStoreTag}
            placeholder="Add store"
            chipsBelow
          />
        </div>
      </div>

      {/* Middle area — DOESN'T scroll itself. Inside, the items grid takes
          remaining space and each column (customer rail + items list) scrolls
          independently with hidden scrollbars. The Add-item row sits pinned
          at the bottom of this section. */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>

      {/* Items list — Apple-Notes / AnyList feel: one editable line per item.
           Quantity & unit are merged into the visible label so the user types
           naturally ("3 bunches Roses"). Old structured items render combined
           on first display; on edit, we collapse qty/unit into the label and
           reset them to defaults so the data shape stays simple.

           When restock-built items exist (have forCustomers), the section
           splits into a customer filter on the left + items on the right —
           tap "All" or a customer to scope the visible list. The underlying
           data is unchanged; this is purely a view filter. */}
      <div style={{
        fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: C.inkFaint, marginBottom: '6px',
        flexShrink: 0,
      }}>To buy</div>
      <div className="restock-grid" style={{
        display: 'grid',
        // Slim customer rail (~25%) so the actual checklist gets the room.
        gridTemplateColumns: showCustomerSplit ? 'minmax(100px, 0.4fr) minmax(0, 1.6fr)' : '1fr',
        gap: '10px', marginBottom: '8px',
        // Grid takes remaining space inside the middle wrapper so its columns
        // can have a defined height to scroll within.
        flex: 1, minHeight: 0,
      }}>
        {showCustomerSplit && (
          <div className="no-scrollbar restock-rail" style={{
            display: 'flex', flexDirection: 'column', gap: '4px',
            paddingRight: '6px', borderRight: `1px solid ${C.borderSoft}`,
            overflowY: 'auto', minHeight: 0,
          }}>
            <div style={{
              fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: C.inkFaint, padding: '0 4px 4px',
            }}>Customer</div>
            {(() => {
              const allActive = filterCustomer === 'all';
              const totalCount = (trip.items || []).length;
              return (
                <button onClick={() => setFilterCustomer('all')} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 10px', borderRadius: '8px',
                  background: allActive ? C.sageDeep : 'transparent',
                  border: 'none', cursor: 'pointer',
                  color: allActive ? C.card : C.ink,
                  fontFamily: 'inherit', fontSize: '13px',
                  fontWeight: allActive ? 600 : 500, textAlign: 'left',
                }}>
                  <span>All</span>
                  <span style={{
                    fontSize: '11px', fontWeight: 600,
                    color: allActive ? C.card : C.inkFaint,
                    opacity: allActive ? 0.85 : 1,
                  }}>{totalCount}</span>
                </button>
              );
            })()}
            {customerCounts.map(([name, count]) => {
              const active = filterCustomer === name;
              return (
                <button key={name} onClick={() => setFilterCustomer(name)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 10px', borderRadius: '8px',
                  background: active ? C.sageDeep : 'transparent',
                  border: 'none', cursor: 'pointer',
                  color: active ? C.card : C.ink,
                  fontFamily: 'inherit', fontSize: '13px',
                  fontWeight: active ? 600 : 500, textAlign: 'left',
                  minWidth: 0,
                }}>
                  <span style={{
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    minWidth: 0,
                  }}>{name}</span>
                  <span style={{
                    fontSize: '11px', fontWeight: 600,
                    color: active ? C.card : C.inkFaint,
                    opacity: active ? 0.85 : 1, flexShrink: 0, marginLeft: '6px',
                  }}>{count}</span>
                </button>
              );
            })}
            {hasUntagged && customerCounts.length > 0 && (() => {
              // "Other" — items added manually that aren't linked to any
              // customer. Hidden when ALL items are untagged (would just
              // duplicate the "All" pill).
              const active = filterCustomer === '__other__';
              return (
                <button onClick={() => setFilterCustomer('__other__')} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 10px', borderRadius: '8px',
                  background: active ? C.sageDeep : 'transparent',
                  border: 'none', cursor: 'pointer',
                  color: active ? C.card : C.inkSoft,
                  fontFamily: 'inherit', fontSize: '13px',
                  fontWeight: active ? 600 : 500, textAlign: 'left',
                  fontStyle: 'italic',
                }}>
                  <span>Other</span>
                  <span style={{
                    fontSize: '11px', fontWeight: 600,
                    color: active ? C.card : C.inkFaint,
                    opacity: active ? 0.85 : 1,
                  }}>{untaggedCount}</span>
                </button>
              );
            })()}
            {/* Add a customer to the rail. Newly-added items get tagged to
                whichever customer is currently the active filter. */}
            {addingCustomer ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px 0' }}>
                <input type="text" value={newCustomerName} autoFocus
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const name = newCustomerName.trim();
                      if (name) {
                        const cur = Array.isArray(trip.extraCustomers) ? trip.extraCustomers : [];
                        if (!cur.includes(name)) {
                          onUpdate(trip.id, { extraCustomers: [...cur, name] });
                        }
                        setFilterCustomer(name);
                      }
                      setNewCustomerName(''); setAddingCustomer(false);
                    } else if (e.key === 'Escape') {
                      setNewCustomerName(''); setAddingCustomer(false);
                    }
                  }}
                  onBlur={() => {
                    const name = newCustomerName.trim();
                    if (name) {
                      const cur = Array.isArray(trip.extraCustomers) ? trip.extraCustomers : [];
                      if (!cur.includes(name)) {
                        onUpdate(trip.id, { extraCustomers: [...cur, name] });
                      }
                      setFilterCustomer(name);
                    }
                    setNewCustomerName(''); setAddingCustomer(false);
                  }}
                  placeholder="Customer name"
                  style={{
                    width: '100%', padding: '8px 10px', fontSize: '13px', fontFamily: 'inherit',
                    background: C.card, border: `1px solid ${C.border}`, borderRadius: '8px',
                    color: C.ink, outline: 'none',
                  }} />
              </div>
            ) : (
              <button onClick={() => setAddingCustomer(true)} style={{
                marginTop: '4px', padding: '8px 10px', borderRadius: '8px',
                background: 'transparent', border: `1px dashed ${C.border}`,
                color: C.inkSoft, fontFamily: 'inherit', fontSize: '12px', fontWeight: 500,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
              }}>
                <Plus size={11} strokeWidth={2.2} /> Add customer
              </button>
            )}
          </div>
        )}
        <div className="no-scrollbar" style={{
          display: 'flex', flexDirection: 'column', gap: '2px',
          overflowY: 'auto', minHeight: 0,
        }}>
        {visibleItems.length === 0 && (
          <div style={{ padding: '14px', fontSize: '13px', color: C.inkFaint, fontStyle: 'italic', textAlign: 'center' }}>
            {(trip.items || []).length === 0
              ? 'Nothing on the list yet.'
              : `No items for ${filterCustomer}.`}
          </div>
        )}
        {visibleItems.map(it => {
          const hasLegacyExtras = (typeof it.qty === 'number' && it.qty > 1) || (it.unit && it.unit.trim());
          const displayValue = hasLegacyExtras
            ? `${it.qty > 1 ? it.qty + ' ' : ''}${it.unit ? it.unit + ' ' : ''}${it.label || ''}`
            : (it.label || '');
          const customers = Array.isArray(it.forCustomers) ? it.forCustomers.filter(Boolean) : [];
          // If the user hasn't set a price but the item's label matches a
          // flower or supply in the catalog, show that catalog price as the
          // default. Tapping the input commits it to the item so she can
          // edit from there without re-typing.
          const catalogPrice = matchCatalogPrice(it.label, flowers, materials);
          const hasSetPrice = typeof it.price === 'number' && isFinite(it.price);
          const inputValue = hasSetPrice
            ? String(it.price)
            : (it.priceRaw !== undefined
              ? it.priceRaw
              : (typeof catalogPrice === 'number' ? catalogPrice.toFixed(2) : ''));
          const isDragging = draggingId === it.id;
          const isDropTarget = dropTargetId === it.id && draggingId && draggingId !== it.id;
          return (
            <div key={it.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move';
                // Required for Firefox to initiate drag.
                try { e.dataTransfer.setData('text/plain', it.id); } catch {}
                setDraggingId(it.id);
              }}
              onDragOver={(e) => {
                if (!draggingId || draggingId === it.id) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dropTargetId !== it.id) setDropTargetId(it.id);
              }}
              onDragLeave={(e) => {
                if (dropTargetId === it.id) setDropTargetId(null);
              }}
              onDrop={(e) => { e.preventDefault(); handleDrop(it.id); }}
              onDragEnd={() => { setDraggingId(null); setDropTargetId(null); }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '6px 8px', borderRadius: '8px',
                background: isDropTarget ? `${C.sageDeep}1a`
                  : it.checked ? `${C.sage}14` : 'transparent',
                borderTop: isDropTarget ? `2px solid ${C.sageDeep}` : '2px solid transparent',
                opacity: isDragging ? 0.4 : 1,
                transition: 'background 140ms ease, opacity 140ms ease',
              }}>
              <button onClick={() => toggleWithTierSettle(it.id, { checked: !it.checked })}
                aria-label={it.checked ? 'Mark not bought' : 'Mark bought'}
                style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: it.checked ? C.sageDeep : 'transparent',
                  border: `1.5px solid ${it.checked ? C.sageDeep : C.border}`,
                  cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 140ms ease',
                  marginTop: '4px',
                }}>
                {it.checked && <Check size={14} strokeWidth={3} color={C.card} />}
              </button>
              {/* Priority star — tap to flag a must-grab item. Filled gold when
                  set; outlined and faint otherwise. Drives the Priority sort. */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWithTierSettle(it.id, { priority: !it.priority });
                }}
                aria-label={it.priority ? 'Unmark priority' : 'Mark as priority'}
                title={it.priority ? 'Priority — tap to clear' : 'Mark as priority'}
                style={{
                  width: '24px', height: '24px', padding: 0,
                  background: 'transparent', border: 'none',
                  cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: '4px',
                  color: it.priority ? C.gold : C.inkFaint,
                  opacity: it.priority ? 1 : 0.45,
                  transition: 'opacity 140ms ease, color 140ms ease',
                }}>
                <Star size={15} strokeWidth={2} fill={it.priority ? C.gold : 'none'} />
              </button>
              <div
                onClick={() => setEditingItemId(it.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditingItemId(it.id); } }}
                style={{
                  flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
                  padding: '6px 4px', cursor: 'pointer', borderRadius: '4px',
                  // Subtle affordance so the row reads as tappable.
                  transition: 'background 140ms ease',
                }}>
                <div style={{
                  fontSize: '14px', fontFamily: 'inherit',
                  color: it.checked ? C.inkFaint : (displayValue ? C.ink : C.inkFaint),
                  textDecoration: it.checked ? 'line-through' : 'none',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {displayValue || 'Item'}
                </div>
                {/* Restock provenance — which orders this line was generated for. */}
                {customers.length > 0 && (
                  <div style={{
                    fontSize: '11px', color: C.inkFaint,
                    lineHeight: 1.4, marginTop: '2px',
                    textDecoration: it.checked ? 'line-through' : 'none',
                  }}>
                    for {customers.length <= 3
                      ? customers.join(', ')
                      : `${customers.slice(0, 2).join(', ')} +${customers.length - 2} more`}
                  </div>
                )}
              </div>
              {/* Price per line — optional. Running total at the bottom of
                  the trip includes all items, checked or not, so she sees
                  the full trip cost. `type=text` + inputMode=decimal gives
                  a decimal keypad on mobile without the HTML5 number-input
                  quirks (lost keystrokes when typing ".50"). */}
              <div style={{ position: 'relative', width: '82px', flexShrink: 0, marginTop: '1px' }}>
                <span style={{
                  position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
                  fontSize: '12px', color: C.inkFaint, pointerEvents: 'none',
                }}>$</span>
                <input type="text" inputMode="decimal"
                  value={inputValue}
                  onFocus={() => {
                    // First tap on an auto-filled (catalog) price commits it to
                    // the item so subsequent edits flow from the displayed value
                    // rather than blanking when she types.
                    if (!hasSetPrice && it.priceRaw === undefined && typeof catalogPrice === 'number') {
                      onUpdateItem(trip.id, it.id, {
                        price: catalogPrice,
                        priceRaw: catalogPrice.toFixed(2),
                      });
                    }
                  }}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return;
                    const n = raw === '' ? null : parseFloat(raw);
                    onUpdateItem(trip.id, it.id, {
                      price: (n != null && isFinite(n)) ? n : undefined,
                      priceRaw: raw === '' ? undefined : raw,
                    });
                  }}
                  placeholder="0.00"
                  style={{
                    width: '100%', padding: '6px 4px 6px 18px', fontSize: '13px',
                    fontFamily: 'inherit', textAlign: 'right',
                    background: (!hasSetPrice && typeof catalogPrice === 'number') ? `${C.sage}0f` : 'transparent',
                    border: `1px solid ${C.borderSoft}`, borderRadius: '6px',
                    outline: 'none',
                    color: it.checked ? C.inkFaint : (hasSetPrice ? C.ink : C.inkSoft),
                  }} />
              </div>
              <button onClick={() => onRemoveItem(trip.id, it.id)} aria-label="Remove"
                style={{
                  background: 'transparent', border: 'none', padding: '6px',
                  cursor: 'pointer', color: C.inkFaint, opacity: 0.6,
                  display: 'flex', alignItems: 'center',
                  marginTop: '2px',
                }}><X size={14} /></button>
            </div>
          );
        })}
        {/* End-of-list drop zone — lets her drag a row past the last item to
            pin it to the bottom, since the per-row drop targets only cover
            existing rows. Only shows a visible hint while a drag is active. */}
        {draggingId && visibleItems.length > 0 && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (dropTargetId !== '__end__') setDropTargetId('__end__');
            }}
            onDragLeave={() => { if (dropTargetId === '__end__') setDropTargetId(null); }}
            onDrop={(e) => { e.preventDefault(); handleDrop(null); }}
            style={{
              minHeight: '56px', marginTop: '4px',
              border: `2px dashed ${dropTargetId === '__end__' ? C.sageDeep : C.borderSoft}`,
              background: dropTargetId === '__end__' ? `${C.sageDeep}1a` : 'transparent',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', color: C.inkFaint, fontStyle: 'italic',
              transition: 'background 140ms ease, border-color 140ms ease',
            }}>
            Drop here to move to bottom
          </div>
        )}
        </div>
      </div>

      {(() => {
        const itemsForTotal = trip.items || [];
        // Effective price = user-set price OR the catalog price for a
        // matching flower/supply name. This way auto-filled prices still
        // count toward the running total before she taps into any row.
        const effective = (it) => {
          const n = Number(it.price);
          if (isFinite(n) && n > 0) return n;
          const cat = matchCatalogPrice(it.label, flowers, materials);
          return typeof cat === 'number' ? cat : 0;
        };
        const sum = itemsForTotal.reduce((s, it) => s + effective(it), 0);
        const priced = itemsForTotal.filter(it => effective(it) > 0).length;
        if (priced === 0) return null;
        return (
          <div style={{
            marginTop: '8px', padding: '10px 12px',
            background: `${C.sage}18`, border: `1px solid ${C.sageDeep}44`,
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ fontSize: '12px', color: C.inkSoft, letterSpacing: '0.02em' }}>
              Trip total · {priced} of {itemsForTotal.length} priced
            </div>
            <div className="serif" style={{
              fontSize: '20px', fontWeight: 600, color: C.sageDeep,
              letterSpacing: '-0.01em',
            }}>${sum.toFixed(2)}</div>
          </div>
        );
      })()}

      </div>{/* end middle (items grid only) */}

      {/* Add new item — pinned section. Tap the + to open the catalog popup;
          Enter on the input adds free text for things not in the catalog. */}
      <div ref={pickerRef} style={{ position: 'relative', marginTop: '8px', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '6px 8px', borderRadius: '8px',
          background: C.bg, border: `1px dashed ${C.border}`,
        }}>
          <button onClick={() => {
              // Typed text → add it. Empty → open full catalog overlay so she
              // can browse tabs/search and add multiple items in one pass.
              if (newItemLabel.trim()) { addItem(); setPickerOpen(false); }
              else if (catalogOptions.length > 0) setOverlayOpen(true);
            }}
            aria-label={newItemLabel.trim() ? 'Add item' : 'Pick from catalog'}
            style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: newItemLabel.trim() || pickerOpen ? C.sageDeep : 'transparent',
              border: `1.5px dashed ${newItemLabel.trim() || pickerOpen ? C.sageDeep : C.border}`,
              cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 140ms ease',
            }}>
            <Plus size={14} strokeWidth={2.6} color={newItemLabel.trim() || pickerOpen ? C.card : C.sageDeep} />
          </button>
          <input type="text" value={newItemLabel}
            onChange={(e) => { setNewItemLabel(e.target.value); if (!pickerOpen) setPickerOpen(true); }}
            onFocus={() => setPickerOpen(true)}
            onKeyDown={(e) => { if (e.key === 'Enter') { addItem(); setPickerOpen(false); } }}
            placeholder={catalogOptions.length > 0 ? 'Tap + for catalog · or type your own' : 'Add item — try "3 bunches Roses"'}
            style={{
              flex: 1, minWidth: 0, padding: '6px 4px', fontSize: '14px', fontFamily: 'inherit',
              background: 'transparent', border: 'none', outline: 'none', color: C.ink,
            }} />
        </div>
        {/* Inline typeahead (small) — shown ONLY while she's typing, so a
            partial name surfaces matches as she types. Tapping the + with
            an empty input opens the full-screen catalog overlay below for
            browsing everything. */}
        {pickerOpen && newItemLabel.trim() && catalogOptions.length > 0 && (
          <div className="no-scrollbar" style={{
            position: 'absolute', bottom: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 30,
            background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px',
            boxShadow: '0 -8px 24px rgba(42,53,40,0.14)',
            maxHeight: '220px', overflowY: 'auto', padding: '4px',
          }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px', fontSize: '12px', color: C.inkFaint, fontStyle: 'italic', textAlign: 'center' }}>
                No catalog match. Hit Enter to add "{newItemLabel.trim()}".
              </div>
            ) : filteredOptions.map(opt => (
              <button key={`${opt.kind}:${opt.name}${opt.isSuggestion ? ':sug' : ''}`} type="button"
                onClick={() => addCatalogItem(opt)}
                style={{
                  width: '100%', padding: '9px 12px', background: 'transparent',
                  border: 'none', borderRadius: '7px',
                  fontFamily: 'inherit', fontSize: '14px',
                  color: opt.isSuggestion ? C.inkSoft : C.ink,
                  cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                {opt.kind === 'flower'
                  ? <Flower2 size={13} strokeWidth={2} color={opt.isSuggestion ? C.inkFaint : C.sageDeep} />
                  : <Tag size={13} strokeWidth={2} color={C.inkSoft} />}
                <span style={{ flex: 1, minWidth: 0, fontStyle: opt.isSuggestion ? 'italic' : 'normal' }}>{opt.name}</span>
                <span style={{ fontSize: '11px', color: C.inkFaint }}>
                  {opt.isSuggestion
                    ? 'suggestion'
                    : `${opt.hint}${typeof opt.price === 'number' ? ` · $${opt.price.toFixed(2)}` : ''}`}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {overlayOpen && (
        <ShoppingCatalogOverlay
          options={catalogOptions}
          bouquets={bouquets || []}
          flowers={flowers || []}
          materials={materials || []}
          search={overlaySearch}
          setSearch={setOverlaySearch}
          onCreateFlower={onCreateFlower}
          onCreateMaterial={onCreateMaterial}
          existingByName={(() => {
            // Map of lowercase-noun → { itemIds[], qty, perUnitPrice } aggregated
            // across every matching unchecked row on the trip. The overlay seeds
            // its stepper from the summed qty so "1 wwe" + "2 wwe" + "2 wwe"
            // reads as qty 5, and commits consolidate those rows back into one.
            // Checked rows are excluded — those are "already bought" and should
            // not fold into pending edits.
            const map = new Map();
            for (const it of (trip.items || [])) {
              if (it.checked) continue;
              const parsed = parseLabel(it.label || '');
              const noun = (parsed.noun || it.label || '').trim().toLowerCase();
              if (!noun) continue;
              const qty = parsed.qty || 1;
              const lineTotal = typeof it.price === 'number' ? it.price : null;
              const cur = map.get(noun);
              if (cur) {
                cur.itemIds.push(it.id);
                cur.qty += qty;
                if (lineTotal != null) cur.totalPrice = (cur.totalPrice || 0) + lineTotal;
              } else {
                map.set(noun, {
                  itemIds: [it.id],
                  qty,
                  totalPrice: lineTotal,
                });
              }
            }
            // Derive per-unit price from aggregate so the overlay's $ field
            // reads the weighted unit cost.
            for (const v of map.values()) {
              v.itemId = v.itemIds[0];
              v.price = (v.totalPrice != null && v.qty > 0) ? v.totalPrice / v.qty : null;
            }
            return map;
          })()}
          onCommit={({ qty, label, price, existingItemId }) => {
            // Three paths: update an existing row, remove it (qty=0), or add
            // a brand-new row. For items aggregated across duplicates, update
            // the first id and sweep the rest so save consolidates the list.
            if (existingItemId) {
              const name = (parseLabel(label || '').noun || label || '').trim().toLowerCase();
              const dupIds = (trip.items || [])
                .filter(it => !it.checked && it.id !== existingItemId)
                .filter(it => {
                  const n = (parseLabel(it.label || '').noun || it.label || '').trim().toLowerCase();
                  return n && n === name;
                })
                .map(it => it.id);
              if (!qty || qty <= 0) {
                onRemoveItem(trip.id, existingItemId);
                for (const id of dupIds) onRemoveItem(trip.id, id);
              } else {
                onUpdateItem(trip.id, existingItemId, {
                  label,
                  price: (typeof price === 'number' && price > 0) ? price : null,
                });
                for (const id of dupIds) onRemoveItem(trip.id, id);
              }
              return;
            }
            if (!qty || qty <= 0) return;
            const taggedCustomers = (filterCustomer !== 'all' && filterCustomer !== '__other__')
              ? [filterCustomer] : undefined;
            onAddItem(trip.id, {
              label,
              forCustomers: taggedCustomers,
              ...(typeof price === 'number' && price > 0 ? { price } : {}),
            });
          }}
          onPickBouquet={(bouquet) => {
            // Expand each ingredient into its own shopping line with
            // auto-filled price from the flower/supply catalog. Nested
            // bouquets inside bouquets are skipped — she shops for raw
            // flowers, not built bouquets.
            const taggedCustomers = (filterCustomer !== 'all' && filterCustomer !== '__other__')
              ? [filterCustomer] : undefined;
            const seen = new Map();
            for (const it of (bouquet.items || [])) {
              if (it.included === false) continue;
              if (it.kind === 'bouquet') continue;
              const ref = it.kind === 'flower'
                ? (flowers || []).find(f => f.id === it.id)
                : (materials || []).find(m => m.id === it.id);
              if (!ref) continue;
              const price = matchCatalogPrice(ref.name, flowers, materials);
              // Merge duplicates (if a bouquet lists the same ingredient
              // twice) so she gets one consolidated line per item.
              const key = ref.name.toLowerCase();
              if (seen.has(key)) continue;
              seen.set(key, true);
              onAddItem(trip.id, {
                label: ref.name,
                forCustomers: taggedCustomers,
                fromBouquet: bouquet.name,
                ...(typeof price === 'number' && price > 0 ? { price } : {}),
              });
            }
          }}
          onClose={() => { setOverlayOpen(false); setOverlaySearch(''); }}
        />
      )}

      {editingItem && (
        <ShoppingItemEditModal
          item={editingItem}
          suggestionNames={(() => {
            // Combined pool: her catalog names + dictionary names not in catalog.
            // Given to the modal so the name field can autocomplete the same way
            // the inline add-item popover does.
            const have = new Set(catalogOptions.map(o => o.name.toLowerCase()));
            const out = catalogOptions.map(o => o.name);
            for (const n of COMMON_FLOWER_NAMES) if (!have.has(n.toLowerCase())) out.push(n);
            for (const n of COMMON_SUPPLY_NAMES) if (!have.has(n.toLowerCase())) out.push(n);
            return out;
          })()}
          onSave={(patch) => {
            // If the modal flipped priority, re-settle the tier so it jumps
            // to the right section of the list like a direct star tap would.
            const priorityChanged = ('priority' in patch)
              && (!!patch.priority !== !!editingItem.priority);
            if (priorityChanged) {
              toggleWithTierSettle(editingItem.id, patch);
            } else {
              onUpdateItem(trip.id, editingItem.id, patch);
            }
            setEditingItemId(null);
          }}
          onDelete={() => {
            onRemoveItem(trip.id, editingItem.id);
            setEditingItemId(null);
          }}
          onClose={() => setEditingItemId(null)}
        />
      )}

      {/* Notes — pinned above the footer at a fixed height. resize: none so
          the textarea can't be dragged taller (which would eat into the
          items list above, since the bubble itself is fixed height). Long
          notes scroll internally inside the textarea. */}
      <textarea value={trip.notes || ''}
        onChange={(e) => onUpdate(trip.id, { notes: e.target.value })}
        placeholder="Notes for the trip…"
        rows="3"
        style={{
          width: '100%', marginTop: '12px', padding: '10px 12px', fontSize: '13px',
          fontFamily: 'inherit', background: C.bg, border: `1px solid ${C.border}`,
          borderRadius: '8px', color: C.ink, resize: 'none', height: '90px',
          flexShrink: 0,
        }} />

      {/* Footer */}
      <div style={{
        marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${C.borderSoft}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: '12px', color: C.inkSoft }}>
          {isActive
            ? `${(trip.items || []).filter(i => i.checked).length}/${(trip.items || []).length} done`
            : `${(trip.items || []).length} item${(trip.items || []).length === 1 ? '' : 's'} planned`}
        </div>
        {isActive ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {onCancelActive && (
              <button onClick={handleCancel} style={{
                padding: '10px 14px', background: 'transparent',
                border: `1px solid ${C.border}`, borderRadius: '10px',
                color: C.inkSoft, fontFamily: 'inherit', fontSize: '13px',
                fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}>
                <X size={13} strokeWidth={2.2} /> Cancel
              </button>
            )}
            <button onClick={handleComplete}
              disabled={(trip.items || []).length === 0}
              className="primary-btn"
              style={{
                padding: '10px 16px',
                background: (trip.items || []).length === 0 ? C.bgDeep : C.sageDeep,
                border: 'none', borderRadius: '10px',
                color: (trip.items || []).length === 0 ? C.inkFaint : C.card,
                fontFamily: 'inherit', fontSize: '13px', fontWeight: 600,
                cursor: (trip.items || []).length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
              <Check size={14} strokeWidth={2.4} /> Complete trip
            </button>
          </div>
        ) : (
          <button onClick={() => canStart && onStartScheduled(trip.id)}
            disabled={!canStart}
            title={!canStart ? 'Finish the active trip first' : ''}
            className={canStart ? 'pulse-glow' : ''}
            style={{
              padding: '10px 16px',
              background: canStart ? C.sageDeep : C.bgDeep,
              border: 'none', borderRadius: '10px',
              color: canStart ? C.card : C.inkFaint,
              fontFamily: 'inherit', fontSize: '13px', fontWeight: 600,
              cursor: canStart ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
            <Plus size={14} strokeWidth={2.4} /> Start trip
          </button>
        )}
      </div>

      {confirmingComplete && (
        <CompleteTripWarning
          uncheckedCount={(trip.items || []).filter(i => !i.checked).length}
          totalCount={(trip.items || []).length}
          onCancel={() => setConfirmingComplete(false)}
          onConfirm={(dontShowAgain) => {
            if (dontShowAgain) {
              try { localStorage.setItem('shop_dontWarnIncomplete_v1', '1'); } catch (e) {}
            }
            setConfirmingComplete(false);
            onComplete(trip.id);
          }}
        />
      )}
      {confirmingCancel && (
        <CancelTripWarning
          onCancel={() => setConfirmingCancel(false)}
          onConfirm={(dontShowAgain) => {
            if (dontShowAgain) {
              try { localStorage.setItem('shop_dontWarnCancel_v1', '1'); } catch (e) {}
            }
            setConfirmingCancel(false);
            onCancelActive && onCancelActive(trip.id);
          }}
        />
      )}
    </div>
  );
}

// Modal that confirms cancelling an active trip — explains that progress
// is preserved (the trip moves back to Scheduled). Same don't-show-again
// pattern as the complete-trip warning, separate localStorage key.
function CancelTripWarning({ onCancel, onConfirm }) {
  const [dontShow, setDontShow] = useState(false);
  return (
    <div onClick={onCancel} style={{
      position: 'fixed', inset: 0, background: 'rgba(42,53,40,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', zIndex: 75, backdropFilter: 'blur(4px)',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: C.card, borderRadius: '14px', padding: '20px',
        width: '100%', maxWidth: '380px',
        boxShadow: '0 20px 60px rgba(42,53,40,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '32px', height: '32px', background: `${C.gold}22`, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <AlertTriangle size={16} color={C.gold} strokeWidth={2} />
          </div>
          <h3 className="serif" style={{
            fontSize: '17px', margin: 0, fontWeight: 500, letterSpacing: '-0.01em',
          }}>Cancel this trip?</h3>
        </div>
        <div style={{ fontSize: '13px', color: C.inkSoft, lineHeight: 1.55, marginBottom: '14px' }}>
          The trip moves back to <strong>Scheduled</strong> — your checked items stay checked, so you can pick up where you left off.
        </div>
        <label style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px', background: C.bg, borderRadius: '8px',
          cursor: 'pointer', marginBottom: '14px',
        }}>
          <div style={{
            width: '18px', height: '18px', borderRadius: '4px',
            background: dontShow ? C.sageDeep : C.card,
            border: `1.5px solid ${dontShow ? C.sageDeep : C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 140ms ease', flexShrink: 0,
          }}>
            {dontShow && <Check size={11} strokeWidth={3} color={C.card} />}
          </div>
          <input type="checkbox" checked={dontShow}
            onChange={(e) => setDontShow(e.target.checked)}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />
          <span style={{ fontSize: '13px', color: C.inkSoft }}>Don't show this again</span>
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '11px', background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: '10px', color: C.inkSoft, fontFamily: 'inherit', fontSize: '13px',
            fontWeight: 500, cursor: 'pointer',
          }}>Keep trip active</button>
          <button onClick={() => onConfirm(dontShow)} style={{
            flex: 1, padding: '11px', background: C.gold, border: 'none',
            borderRadius: '10px', color: C.card, fontFamily: 'inherit', fontSize: '13px',
            fontWeight: 600, cursor: 'pointer',
          }}>Cancel trip</button>
        </div>
      </div>
    </div>
  );
}

// Modal that confirms completing a trip when not every item is checked.
// Includes an opt-in "don't show again" checkbox stored in localStorage.
function CompleteTripWarning({ uncheckedCount, totalCount, onCancel, onConfirm }) {
  const [dontShow, setDontShow] = useState(false);
  return (
    <div onClick={onCancel} style={{
      position: 'fixed', inset: 0, background: 'rgba(42,53,40,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', zIndex: 75, backdropFilter: 'blur(4px)',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: C.card, borderRadius: '14px', padding: '20px',
        width: '100%', maxWidth: '380px',
        boxShadow: '0 20px 60px rgba(42,53,40,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '32px', height: '32px', background: `${C.gold}22`, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <AlertTriangle size={16} color={C.gold} strokeWidth={2} />
          </div>
          <h3 className="serif" style={{
            fontSize: '17px', margin: 0, fontWeight: 500, letterSpacing: '-0.01em',
          }}>Some items aren't checked</h3>
        </div>
        <div style={{ fontSize: '13px', color: C.inkSoft, lineHeight: 1.55, marginBottom: '14px' }}>
          {uncheckedCount} of {totalCount} item{totalCount === 1 ? '' : 's'} {uncheckedCount === 1 ? 'is' : 'are'} still unchecked. Complete the trip anyway?
        </div>
        <label style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px', background: C.bg, borderRadius: '8px',
          cursor: 'pointer', marginBottom: '14px',
        }}>
          <div style={{
            width: '18px', height: '18px', borderRadius: '4px',
            background: dontShow ? C.sageDeep : C.card,
            border: `1.5px solid ${dontShow ? C.sageDeep : C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 140ms ease', flexShrink: 0,
          }}>
            {dontShow && <Check size={11} strokeWidth={3} color={C.card} />}
          </div>
          <input type="checkbox" checked={dontShow}
            onChange={(e) => setDontShow(e.target.checked)}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />
          <span style={{ fontSize: '13px', color: C.inkSoft }}>Don't show this again</span>
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '11px', background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: '10px', color: C.inkSoft, fontFamily: 'inherit', fontSize: '13px',
            fontWeight: 500, cursor: 'pointer',
          }}>Keep shopping</button>
          <button onClick={() => onConfirm(dontShow)} style={{
            flex: 1, padding: '11px', background: C.sageDeep, border: 'none',
            borderRadius: '10px', color: C.card, fontFamily: 'inherit', fontSize: '13px',
            fontWeight: 600, cursor: 'pointer',
          }}>Complete anyway</button>
        </div>
      </div>
    </div>
  );
}

function ShoppingView({ active, scheduled, past, flowers, materials, bouquets, orders, settings, knownStoreTags, onAddStoreTag, onDeleteStoreTag, onStart, onSchedule, onStartScheduled, onCancelActive, onRestock, onUpdate, onAddItem, onUpdateItem, onRemoveItem, onComplete, onDelete, onDuplicate, onCreateFlower, onCreateMaterial, showToast }) {
  // Live list of customer names with upcoming orders within the restock
  // horizon. Threaded into every TripCard so the rail reflects current
  // pickups even on trips created before extraCustomers was tracked.
  const upcomingCustomerNames = useMemo(() => {
    const horizonDays = Math.min(90, Math.max(1, parseInt(settings?.restockHorizonDays) || 14));
    const now = Date.now();
    const horizon = now + horizonDays * 24 * 60 * 60 * 1000;
    const set = new Set();
    for (const o of (orders || [])) {
      if (!o.pickupDateTime) continue;
      const t = new Date(o.pickupDateTime).getTime();
      if (t < now || t > horizon) continue;
      const c = (o.customerName || '').trim();
      if (c) set.add(c);
    }
    return Array.from(set);
  }, [orders, settings?.restockHorizonDays]);
  const [showPast, setShowPast] = useState(false);

  // Aggregate stats across completed trips: spend this month + which stores
  // she leans on most, with an avg per trip at each. Small tracking footprint,
  // derived purely from existing trip data.
  const stats = useMemo(() => {
    const now = new Date();
    const m = now.getMonth(), y = now.getFullYear();
    const tripTotal = (t) => (t.items || []).reduce((s, it) =>
      s + (typeof it.price === 'number' ? it.price : 0), 0);
    const completed = (past || []).filter(t => t.status === 'done');
    const thisMonth = completed.filter(t => {
      const d = t.completedAt ? new Date(t.completedAt) : null;
      return d && d.getMonth() === m && d.getFullYear() === y;
    });
    const monthSpent = thisMonth.reduce((s, t) => s + tripTotal(t), 0);
    const monthAvg = thisMonth.length > 0 ? monthSpent / thisMonth.length : 0;
    // Lifetime total across every completed trip — the running "total cost"
    // that lets her compare this month against the big-picture spend.
    const allTimeSpent = completed.reduce((s, t) => s + tripTotal(t), 0);
    const allTimeTrips = completed.length;
    // Store rollup across all completed trips — which stores she uses and
    // how much she typically drops at each. Trips with multiple store tags
    // attribute their total evenly across the tags (simple split).
    const byStore = new Map();
    for (const t of completed) {
      const tags = Array.isArray(t.storeTags) && t.storeTags.length > 0 ? t.storeTags : [];
      if (tags.length === 0) continue;
      const total = tripTotal(t);
      const share = total / tags.length;
      for (const tag of tags) {
        const cur = byStore.get(tag) || { trips: 0, spent: 0 };
        cur.trips += 1;
        cur.spent += share;
        byStore.set(tag, cur);
      }
    }
    const stores = Array.from(byStore.entries())
      .map(([name, v]) => ({ name, trips: v.trips, spent: v.spent, avg: v.trips > 0 ? v.spent / v.trips : 0 }))
      .sort((a, b) => b.trips - a.trips)
      .slice(0, 3);
    return {
      monthLabel: now.toLocaleString('en-US', { month: 'long' }),
      monthTrips: thisMonth.length,
      monthSpent,
      monthAvg,
      allTimeSpent,
      allTimeTrips,
      stores,
      anyCompleted: completed.length > 0,
    };
  }, [past]);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {stats.anyCompleted && (
        <div style={{
          background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: '12px',
          padding: '12px 14px',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{
              fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: C.inkFaint,
            }}>{stats.monthLabel} so far</div>
            {stats.monthTrips > 0 && (
              <div style={{ fontSize: '11px', color: C.inkFaint }}>
                avg ${stats.monthAvg.toFixed(2)}/trip
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <div className="serif" style={{ fontSize: '26px', fontWeight: 500, color: C.ink, letterSpacing: '-0.01em', lineHeight: 1 }}>
              ${stats.monthSpent.toFixed(2)}
            </div>
            <div style={{ fontSize: '12px', color: C.inkSoft }}>
              across {stats.monthTrips} trip{stats.monthTrips === 1 ? '' : 's'}
            </div>
          </div>
          {stats.allTimeTrips > stats.monthTrips && (
            <div style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              gap: '8px', fontSize: '11px', color: C.inkFaint,
              paddingTop: '6px', borderTop: `1px solid ${C.borderSoft}`,
            }}>
              <span style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>All time</span>
              <span>
                <span style={{ color: C.inkSoft, fontWeight: 600 }}>${stats.allTimeSpent.toFixed(2)}</span>
                {' '}across {stats.allTimeTrips} trip{stats.allTimeTrips === 1 ? '' : 's'}
              </span>
            </div>
          )}
          {stats.stores.length > 0 && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '6px',
              paddingTop: '8px', borderTop: `1px solid ${C.borderSoft}`,
            }}>
              {stats.stores.map(s => (
                <div key={s.name} title={`${s.trips} trip${s.trips === 1 ? '' : 's'} · $${s.spent.toFixed(2)} total`}
                  style={{
                    padding: '4px 10px', borderRadius: '999px',
                    background: `${C.sage}14`, border: `1px solid ${C.sage}55`,
                    fontSize: '11px', color: C.inkSoft,
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
                  <span style={{ fontWeight: 600, color: C.ink }}>{s.name}</span>
                  <span>·</span>
                  <span>${s.avg.toFixed(0)} avg</span>
                  <span style={{ color: C.inkFaint }}>({s.trips})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Auto-restock banner — pinned below the app chrome so she can tap it
          from anywhere in the Shopping tab even when an active trip pushes
          the list down. --chrome-h is set by the App once the sticky chrome
          mounts; falls back to a reasonable default until measurement lands. */}
      {onRestock && (
        <button onClick={onRestock} style={{
          // Solid background so content scrolling behind the sticky banner
          // doesn't bleed through. Card cream + subtle sage accent via the
          // border reads as a callout without being see-through.
          position: 'sticky', top: 'var(--chrome-h, 156px)', zIndex: 20,
          padding: '14px 16px', background: C.card,
          border: `1px solid ${C.sage}`, borderRadius: '12px',
          color: C.ink, fontFamily: 'inherit', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left',
          boxShadow: '0 6px 16px rgba(42,53,40,0.08)',
        }}>
          <div style={{
            width: '34px', height: '34px', background: C.sageDeep, borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <CalendarDays size={16} color={C.card} strokeWidth={2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: C.ink, marginBottom: '2px' }}>
              Restock from upcoming orders
            </div>
            <div style={{ fontSize: '12px', color: C.inkSoft, lineHeight: 1.4 }}>
              Build a trip with everything you need for the next 14 days of orders.
            </div>
          </div>
          <Plus size={16} strokeWidth={2.2} color={C.sageDeep} style={{ flexShrink: 0 }} />
        </button>
      )}

      {!active && (scheduled || []).length === 0 ? (
        <div style={{
          background: C.card, border: `1px dashed ${C.border}`, borderRadius: '14px',
          padding: '40px 20px', textAlign: 'center', color: C.inkSoft,
        }}>
          <Tag size={28} strokeWidth={1.4} color={C.inkFaint} style={{ marginBottom: '12px' }} />
          <div style={{ fontSize: '14px', marginBottom: '4px' }}>No shopping trips planned</div>
          <div style={{ fontSize: '12px', color: C.inkFaint, marginBottom: '14px' }}>
            Schedule a trip ahead, or start one now to check off as you shop.
          </div>
          <div style={{ display: 'inline-flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={onSchedule} style={{
              padding: '10px 18px', background: C.sageDeep, border: 'none', borderRadius: '8px',
              color: C.card, fontFamily: 'inherit', fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
            }}><CalendarDays size={14} strokeWidth={2.2} /> Schedule a trip</button>
            <button onClick={onStart} style={{
              padding: '10px 18px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '8px',
              color: C.inkSoft, fontFamily: 'inherit', fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
            }}><Plus size={14} strokeWidth={2.2} /> Start now</button>
          </div>
        </div>
      ) : (
        <>
          {active && (
            <TripCard
              trip={active} variant="active"
              flowers={flowers} materials={materials} bouquets={bouquets}
              upcomingCustomers={upcomingCustomerNames}
              knownStoreTags={knownStoreTags}
              onAddStoreTag={onAddStoreTag} onDeleteStoreTag={onDeleteStoreTag}
              onUpdate={onUpdate} onAddItem={onAddItem} onUpdateItem={onUpdateItem}
              onRemoveItem={onRemoveItem} onComplete={onComplete} onDelete={onDelete}
              onCancelActive={onCancelActive}
              onCreateFlower={onCreateFlower} onCreateMaterial={onCreateMaterial}
              showToast={showToast}
            />
          )}

          {/* Scheduled trips */}
          {(scheduled || []).length > 0 && (
            <div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '8px',
              }}>
                <div style={{
                  fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: C.inkFaint,
                }}>Scheduled</div>
                <button onClick={onSchedule} style={{
                  padding: '6px 10px', background: 'transparent',
                  border: `1px dashed ${C.border}`, borderRadius: '8px',
                  color: C.inkSoft, fontFamily: 'inherit', fontSize: '12px', fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '5px',
                }}><Plus size={12} strokeWidth={2.2} /> Schedule a trip</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {scheduled.map(trip => (
                  <TripCard
                    key={trip.id} trip={trip} variant="scheduled"
                    canStart={!active}
                    flowers={flowers} materials={materials}
                    upcomingCustomers={upcomingCustomerNames}
                    knownStoreTags={knownStoreTags}
                    onAddStoreTag={onAddStoreTag} onDeleteStoreTag={onDeleteStoreTag}
                    onUpdate={onUpdate} onAddItem={onAddItem} onUpdateItem={onUpdateItem}
                    onRemoveItem={onRemoveItem} onStartScheduled={onStartScheduled} onDelete={onDelete}
                    onCreateFlower={onCreateFlower} onCreateMaterial={onCreateMaterial}
              showToast={showToast}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Schedule another (when active exists but no scheduled list yet) */}
          {active && (scheduled || []).length === 0 && (
            <button onClick={onSchedule} style={{
              padding: '12px 14px', background: 'transparent',
              border: `1px dashed ${C.border}`, borderRadius: '10px',
              color: C.inkSoft, fontFamily: 'inherit', fontSize: '13px', fontWeight: 500,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}><CalendarDays size={14} strokeWidth={2.2} /> Schedule another trip ahead</button>
          )}
        </>
      )}

      {/* Past trips log */}
      {past.length > 0 && (
        <div>
          <button onClick={() => setShowPast(p => !p)} style={{
            width: '100%', padding: '12px 14px', background: C.card,
            border: `1px solid ${C.borderSoft}`, borderRadius: '10px',
            color: C.inkSoft, fontFamily: 'inherit', fontSize: '13px', fontWeight: 500,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={13} strokeWidth={2} /> Past trips ({past.length})
            </span>
            {showPast ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showPast && (
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {past.map(s => (
                <div key={s.id} style={{
                  background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: '10px',
                  padding: '12px 14px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="serif" style={{ fontSize: '15px', fontWeight: 500, color: C.ink }}>
                        {s.name || 'Untitled trip'}
                      </div>
                      <div style={{ fontSize: '11px', color: C.inkFaint, marginTop: '2px' }}>
                        {s.scheduledFor
                          ? formatTripDate(s.scheduledFor)
                          : (s.completedAt ? new Date(s.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '')}
                        {(s.storeTags || []).length > 0 && ` · ${s.storeTags.join(', ')}`}
                        {' · '}{(s.items || []).length} item{(s.items || []).length === 1 ? '' : 's'}
                      </div>
                      {(s.items || []).length > 0 && (
                        <div style={{ fontSize: '12px', color: C.inkSoft, marginTop: '6px' }}>
                          {(s.items || []).map(i => `${i.qty || 1}× ${i.label}`).join(' · ')}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      {onDuplicate && (s.items || []).length > 0 && (
                        <button onClick={() => onDuplicate(s.id)}
                          title="Schedule a repeat trip with the same items"
                          aria-label="Shop again"
                          style={{
                            padding: '6px 10px', fontSize: '11px', fontWeight: 600,
                            background: 'transparent', border: `1px solid ${C.borderSoft}`,
                            borderRadius: '6px', color: C.inkSoft,
                            fontFamily: 'inherit', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '4px',
                          }}>
                          <Copy size={12} strokeWidth={2} /> Shop again
                        </button>
                      )}
                      <DeleteButton onConfirm={() => onDelete(s.id)} label="Delete trip" compact size={14} padding="8px" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatsOverlay({ onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(42,53,40,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', zIndex: 50, backdropFilter: 'blur(4px)',
    }}>
      <button onClick={onClose} aria-label="Close" style={{
        position: 'fixed', top: '14px', right: '14px', zIndex: 55,
        width: '44px', height: '44px', borderRadius: '50%',
        background: C.ink, color: C.card, border: `2px solid ${C.card}`,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 6px 16px rgba(42,53,40,0.3)',
      }}><X size={20} strokeWidth={2.4} /></button>

      <div onClick={(e) => e.stopPropagation()} style={{
        background: C.bg, borderRadius: '16px',
        width: '100%', maxWidth: '880px', maxHeight: '92vh', overflow: 'auto',
        boxShadow: '0 20px 60px rgba(42,53,40,0.3)',
        padding: '22px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px',
        }}>
          <div style={{
            width: '36px', height: '36px', background: `${C.sageDeep}22`, borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp size={18} color={C.sageDeep} strokeWidth={2} />
          </div>
          <div>
            <h2 className="serif" style={{
              fontSize: '22px', margin: 0, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.2,
            }}>Stats</h2>
            <div style={{ fontSize: '13px', color: C.inkSoft, marginTop: '2px' }}>
              Profit, top items, payment breakdown, log
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function ReceiptModal({ order, settings, bouquets, flowers, materials, onClose, onEdit }) {
  const payment = PAYMENT_METHODS.find(p => p.key === order.paymentMethod) || PAYMENT_METHODS[5];
  const eventTypes = settings.eventTypes || DEFAULT_EVENT_TYPES;
  const eventType = eventTypes.find(t => t.key === (order.eventType || 'general'));
  const extrasSum = sumExtras(order.extraCosts);
  const lineSubtotal = order.quantity * order.costPer;
  const subtotalRaw = lineSubtotal + extrasSum;
  const discAmount = discountAmountOf(subtotalRaw, order.discount);
  const total = Math.max(0, subtotalRaw - discAmount);
  const pickup = new Date(order.pickupDateTime);
  const fmt = (n) => `$${n.toFixed(2)}`;

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  // Build a clean text receipt for the native share sheet (text/email/SMS).
  // Web Share API works on all modern mobile browsers; falls back to clipboard
  // copy on desktop where navigator.share isn't available.
  const buildShareText = () => {
    const lines = [];
    const business = (settings.businessName || 'Petal & Stem').trim();
    lines.push(`${business} — order for ${order.customerName}`);
    lines.push('');
    lines.push(`Pickup: ${pickup.toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })}`);
    if (order.arrangement) lines.push(`Arrangement: ${order.arrangement}`);
    if (eventType && eventType.label !== 'General') lines.push(`Event: ${eventType.label}`);
    lines.push('');
    lines.push(`${order.quantity}× @ ${fmt(order.costPer)} = ${fmt(lineSubtotal)}`);
    if (Array.isArray(order.extraCosts) && order.extraCosts.length > 0) {
      for (const e of order.extraCosts) {
        const n = parseFloat(e.amount);
        if (isFinite(n) && n > 0) lines.push(`+ ${e.label}: ${fmt(n)}`);
      }
    }
    if (order.discount && Number(order.discount.value) > 0 && discAmount > 0) {
      const dLabel = order.discount.kind === 'percent'
        ? `Discount (${order.discount.value}% off)`
        : `Discount`;
      lines.push(`− ${dLabel}: −${fmt(discAmount)}`);
    }
    lines.push(`Total: ${fmt(total)} · ${order.paid ? 'PAID' : 'Due'} (${payment.label})`);
    if (order.cardMessage) {
      lines.push('');
      lines.push(`Card: "${order.cardMessage}"`);
    }
    if (order.notes) {
      lines.push('');
      lines.push(`Notes: ${order.notes}`);
    }
    return lines.join('\n');
  };

  const [shareState, setShareState] = useState(''); // '' | 'copied' | 'shared' | 'failed'
  const handleShare = async () => {
    const text = buildShareText();
    const title = `${(settings.businessName || 'Petal & Stem').trim()} — ${order.customerName}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text });
        setShareState('shared');
      } catch (e) {
        // User cancelled or share failed — silently no-op
        if (e.name !== 'AbortError') setShareState('failed');
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        setShareState('copied');
      } catch (e) { setShareState('failed'); }
    } else {
      setShareState('failed');
    }
    setTimeout(() => setShareState(''), 2400);
  };

  return (
    <div className="receipt-overlay" style={{
      position: 'fixed', inset: 0, background: 'rgba(42,53,40,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', zIndex: 60, backdropFilter: 'blur(4px)',
    }}>
      <button onClick={onClose} aria-label="Close" className="no-print" style={{
        position: 'fixed', top: '14px', right: '14px', zIndex: 65,
        width: '44px', height: '44px', borderRadius: '50%',
        background: C.ink, color: C.card, border: `2px solid ${C.card}`,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 6px 16px rgba(42,53,40,0.3)',
      }}><X size={20} strokeWidth={2.4} /></button>

      <div onClick={(e) => e.stopPropagation()} className="receipt-printable" style={{
        background: C.card, borderRadius: '16px',
        width: '100%', maxWidth: '440px', maxHeight: '92vh', overflow: 'auto',
        boxShadow: '0 20px 60px rgba(42,53,40,0.25)',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 24px 16px', textAlign: 'center',
          borderBottom: `1px dashed ${C.border}`,
        }}>
          <div className="serif" style={{
            fontSize: '24px', fontWeight: 600, letterSpacing: '-0.01em', color: C.ink,
          }}>{settings.businessName || 'Petal & Stem'}</div>
          <div style={{
            fontSize: '11px', color: C.inkFaint, marginTop: '4px',
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>Order receipt</div>
        </div>

        {/* Customer + event */}
        <div style={{ padding: '18px 24px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <h2 className="serif" style={{
              fontSize: '20px', fontWeight: 500, margin: 0, letterSpacing: '-0.01em', color: C.ink,
            }}>{order.customerName}</h2>
            {eventType && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em',
                color: C.inkSoft, padding: '2px 8px', borderRadius: '4px',
                background: `${eventType.color}33`,
              }}>
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%', background: eventType.color,
                  border: isLight(eventType.color) ? `1px solid ${C.border}` : 'none',
                }} />
                {eventType.label}
              </span>
            )}
          </div>
          {order.arrangement && (
            <div style={{ fontSize: '14px', color: C.inkSoft, marginTop: '4px' }}>
              {order.arrangement}
            </div>
          )}
          <div style={{ fontSize: '12px', color: C.inkFaint, marginTop: '8px' }}>
            Pickup: <strong style={{ color: C.ink }}>
              {pickup.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              {' · '}
              {pickup.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </strong>
          </div>
        </div>

        {/* Recipe items */}
        {order.items && order.items.length > 0 && (
          <div style={{
            padding: '12px 24px', borderTop: `1px dashed ${C.border}`,
          }}>
            <div style={{
              fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: C.inkFaint, marginBottom: '8px',
            }}>Arrangement</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {order.items.map((it, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', gap: '8px',
                  fontSize: '13px', color: it.included === false ? C.inkFaint : C.ink,
                  textDecoration: it.included === false ? 'line-through' : 'none',
                }}>
                  <span>
                    <strong>{it.qty}×</strong> {it.name}
                    {it.isBundled && <span style={{
                      fontSize: '9px', fontWeight: 700, marginLeft: '6px',
                      color: C.sageDeep, background: `${C.sage}22`,
                      padding: '1px 5px', borderRadius: '3px',
                    }}>BUNDLE</span>}
                  </span>
                  {it.included !== false && (
                    <span style={{ color: C.inkSoft }}>
                      {fmt((it.unitMin || 0) * it.qty)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Card message */}
        {order.cardMessage && (
          <div style={{
            margin: '0 24px 12px', padding: '12px 14px',
            background: `${C.gold}15`, border: `1px dashed ${C.gold}66`,
            borderRadius: '8px',
          }}>
            <div style={{
              fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: C.gold, marginBottom: '4px',
            }}>Card message</div>
            <div className="italic" style={{
              fontSize: '14px', color: C.ink, lineHeight: 1.5, whiteSpace: 'pre-wrap',
            }}>"{order.cardMessage}"</div>
          </div>
        )}

        {/* Totals */}
        <div style={{
          padding: '16px 24px', borderTop: `1px dashed ${C.border}`,
          display: 'flex', flexDirection: 'column', gap: '6px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: C.inkSoft }}>
            <span>{order.quantity} × {fmt(order.costPer)}</span>
            <span>{fmt(lineSubtotal)}</span>
          </div>
          {(order.extraCosts || []).map((e, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: C.inkSoft }}>
              <span>+ {e.label}</span>
              <span>{fmt(Number(e.amount) || 0)}</span>
            </div>
          ))}
          {order.discount && Number(order.discount.value) > 0 && discAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: C.gold, fontWeight: 600 }}>
              <span>− Discount {order.discount.kind === 'percent' ? `(${order.discount.value}%)` : ''}</span>
              <span>−{fmt(discAmount)}</span>
            </div>
          )}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            fontSize: '18px', fontWeight: 600, color: C.ink,
            paddingTop: '8px', borderTop: `1px solid ${C.borderSoft}`, marginTop: '4px',
          }}>
            <span>Total</span>
            <span className="serif" style={{ fontSize: '22px', letterSpacing: '-0.01em' }}>{fmt(total)}</span>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: '12px', color: C.inkSoft, marginTop: '4px',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {(() => { const I = paymentIconFor(payment.key); return <I size={13} strokeWidth={1.8} />; })()}
              {payment.label}
            </span>
            <span style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: order.paid ? C.sageDeep : C.gold,
            }}>{order.paid ? 'Paid' : 'Unpaid'}</span>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div style={{
            padding: '12px 24px', borderTop: `1px dashed ${C.border}`,
            fontSize: '12px', color: C.inkSoft, fontStyle: 'italic',
          }}>{order.notes}</div>
        )}

        <div style={{ height: '14px' }} />

        {/* Action bar */}
        <div className="no-print" style={{
          padding: '14px 18px', background: C.bg,
          borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px',
          display: 'flex', gap: '8px', flexWrap: 'wrap',
        }}>
          <button onClick={onClose} style={{
            flex: '1 1 80px', padding: '12px', background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: '10px', color: C.inkSoft, fontFamily: 'inherit', fontSize: '13px',
            fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}><X size={14} strokeWidth={2} /> Close</button>
          <button onClick={handleShare} style={{
            flex: '1 1 110px', padding: '12px',
            background: shareState === 'copied' || shareState === 'shared' ? C.sage : 'transparent',
            border: `1px solid ${shareState === 'failed' ? C.rose : C.border}`,
            borderRadius: '10px',
            color: shareState === 'copied' || shareState === 'shared' ? C.card : C.inkSoft,
            fontFamily: 'inherit', fontSize: '13px',
            fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            transition: 'all 200ms ease',
          }}>
            {shareState === 'shared' ? <><Check size={14} strokeWidth={2.4} /> Shared</>
              : shareState === 'copied' ? <><Check size={14} strokeWidth={2.4} /> Copied</>
              : shareState === 'failed' ? <><AlertCircle size={14} strokeWidth={2} /> Failed</>
              : <><Upload size={14} strokeWidth={2} /> Share</>}
          </button>
          <button onClick={handlePrint} className="primary-btn" style={{
            flex: '1 1 110px', padding: '12px', background: C.sageDeep, border: 'none',
            borderRadius: '10px', color: C.card, fontFamily: 'inherit', fontSize: '13px',
            fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}><Download size={14} strokeWidth={2} /> Print / PDF</button>
        </div>
      </div>
    </div>
  );
}

// Quick-edit overlay for an existing order (or a duplicate). Reads/writes
// cart + orderForm state directly so saving uses the same submitOrderForm
// path as the Build tab. Items management is read-only inside the modal —
// for adding/removing items, the user can switch to Build tab.
function EditOrderModal({
  cart, orderForm, setOrderForm, orders, settings, flowers, materials, bouquets,
  editingOrderId, setCustomerName, setQty, setIncluded, setPriceOverride, setExtras, setDiscount,
  onAddEventType, onAddPaymentMethod, onSubmit, onCancel,
}) {
  const eventTypes = (settings && settings.eventTypes) || DEFAULT_EVENT_TYPES;
  const paymentMethods = (settings && settings.paymentMethods) || DEFAULT_PAYMENT_METHODS;
  const remindersOn = orderForm.enableReminders !== false;
  const isEditing = !!editingOrderId;
  // Catalog picker (PickerOverlay) for adding items inline. Reuses cart's setQty.
  const [pickerOpen, setPickerOpen] = useState(false);
  const itemsByKey = useMemo(() => {
    const map = {};
    (cart.items || []).forEach(it => { map[`${it.kind}:${it.id}`] = it; });
    return map;
  }, [cart.items]);

  return (
    <div onClick={onCancel} style={{
      position: 'fixed', inset: 0, background: 'rgba(42,53,40,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', zIndex: 70, backdropFilter: 'blur(4px)',
    }}>
      {pickerOpen && (
        <div onClick={(e) => e.stopPropagation()}>
          <PickerOverlay
            flowers={flowers} materials={materials} bouquets={bouquets}
            itemsByKey={itemsByKey}
            setItemQty={setQty}
            onAddNewFlower={null}
            onAddNewMaterial={null}
            onClose={() => setPickerOpen(false)}
          />
        </div>
      )}
      <div onClick={(e) => e.stopPropagation()} className="modal-content" style={{
        background: C.card, borderRadius: '16px',
        width: '100%', maxWidth: '500px',
        height: 'min(720px, 92vh)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(42,53,40,0.3)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '20px 22px 14px', flexShrink: 0,
          borderBottom: `1px solid ${C.borderSoft}`,
        }}>
          <div style={{
            width: '36px', height: '36px', background: `${C.gold}22`, borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Pencil size={16} color={C.gold} strokeWidth={2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="serif" style={{
              fontSize: '20px', margin: 0, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.2,
            }}>{isEditing ? 'Edit order' : 'New order'}</h2>
            <div style={{ fontSize: '12px', color: C.inkSoft, marginTop: '2px' }}>
              Quick edit · for items, use the Build tab
            </div>
          </div>
          <button onClick={onCancel} aria-label="Close" style={{
            background: 'transparent', border: 'none', padding: '8px', borderRadius: '8px',
            cursor: 'pointer', color: C.inkSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={18} /></button>
        </div>

        <div className="no-scrollbar" style={{
          flex: 1, minHeight: 0, overflowY: 'auto',
          padding: '16px 22px',
        }}>
          <Field label="Customer name" required>
            <CustomerNameInput
              value={cart.customerName}
              onChange={setCustomerName}
              orders={orders || []}
              autoFocus={false}
            />
          </Field>

          {/* Arrangement gets its own field block — short user-typed label
              like "Mixed spring bouquet". Never auto-filled from items. */}
          <Field label="Arrangement name (optional)" hint="A short label like 'Spring bouquet' — your own words.">
            <input className="text-input" type="text" value={orderForm.arrangement || ''}
              onChange={(e) => setOrderForm({ ...orderForm, arrangement: e.target.value })}
              placeholder="e.g. Mixed spring bouquet" style={inputStyle()} />
          </Field>

          {/* Items — list with × to remove, plus an "Add items" button that
              opens the catalog picker overlay. Empty state prompts her to add. */}
          <Field label={`Arrangement${(cart.items || []).length > 0 ? ` (${cart.items.length})` : ''}`} hint="Tap × to remove. Tap Add items for the catalog picker.">
            <div style={{
              background: C.bg, border: `1px solid ${C.borderSoft}`, borderRadius: '10px',
              padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px',
              maxHeight: '200px', overflowY: 'auto',
            }} className="no-scrollbar">
              {(cart.items || []).length === 0 ? (
                <div style={{
                  padding: '14px', fontSize: '13px', color: C.inkFaint,
                  fontStyle: 'italic', textAlign: 'center',
                }}>
                  No items yet — tap "Add items" below.
                </div>
              ) : (cart.items || []).map(item => {
                const ref = item.kind === 'bouquet'
                  ? (bouquets || []).find(x => x.id === item.id)
                  : item.kind === 'flower'
                    ? (flowers || []).find(x => x.id === item.id)
                    : (materials || []).find(x => x.id === item.id);
                const name = ref?.name || '(removed)';
                const hasOverride = typeof item.unitPriceOverride === 'number' && isFinite(item.unitPriceOverride);
                // Compute the catalog per-unit price + unit noun (stem/bunch/each)
                let catalogUnit = 0, unitNoun = 'each';
                if (item.kind === 'flower' && ref) {
                  if (ref.mode === 'perStem') {
                    catalogUnit = ref.bunchPrice / ref.bunchCount;
                    unitNoun = 'stem';
                  } else {
                    catalogUnit = (ref.flatMin + ref.flatMax) / 2;
                    unitNoun = 'bunch';
                  }
                } else if (item.kind === 'material' && ref) {
                  catalogUnit = ref.unitPrice || 0;
                } else if (item.kind === 'bouquet' && ref) {
                  if (typeof ref.fixedPrice === 'number') {
                    catalogUnit = ref.fixedPrice;
                  } else {
                    const r = computeMaterialRanges(ref.items || [], flowers, materials, bouquets);
                    catalogUnit = (r.effMin + r.effMax) / 2;
                  }
                }
                const effectiveUnit = hasOverride ? item.unitPriceOverride : catalogUnit;
                return (
                  <div key={`${item.kind}:${item.id}`} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '6px 8px', borderRadius: '6px',
                    background: C.card,
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: C.ink, minWidth: '24px' }}>
                      {item.qty}×
                    </span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: '13px', color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {name}
                    </span>
                    {item.kind === 'bouquet' && (
                      <span style={{
                        fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em',
                        color: C.sageDeep, background: `${C.sage}22`,
                        padding: '1px 5px', borderRadius: '3px',
                      }}>BUNDLE</span>
                    )}
                    {/* Inline per-unit price editor — only for flowers and
                        supplies. Bouquets price by their own fixed price (or
                        the sum of their loose-arrangement contents) and
                        aren't overridable from the order line. */}
                    {setPriceOverride && item.kind !== 'bouquet' && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '2px',
                        padding: '2px 6px', borderRadius: '6px',
                        background: hasOverride ? `${C.gold}1f` : C.bg,
                        border: `1px solid ${hasOverride ? C.gold : C.borderSoft}`,
                        flexShrink: 0,
                      }}>
                        <span style={{ fontSize: '11px', color: C.inkFaint }}>$</span>
                        <input type="number" min="0" step="0.01"
                          value={hasOverride ? item.unitPriceOverride : ''}
                          placeholder={catalogUnit.toFixed(2)}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === '') setPriceOverride(item.kind, item.id, null);
                            else {
                              const n = parseFloat(v);
                              if (isFinite(n) && n >= 0) setPriceOverride(item.kind, item.id, n);
                            }
                          }}
                          style={{
                            width: '54px', padding: '2px 0', fontSize: '12px', fontFamily: 'inherit',
                            background: 'transparent', border: 'none', outline: 'none',
                            color: hasOverride ? C.ink : C.inkSoft, textAlign: 'right',
                          }} />
                        <span style={{ fontSize: '10px', color: C.inkFaint }}>/{unitNoun}</span>
                      </div>
                    )}
                    <span style={{
                      fontSize: '12px', fontWeight: 600, color: C.sageDeep,
                      flexShrink: 0, minWidth: '52px', textAlign: 'right',
                    }}>${(effectiveUnit * item.qty).toFixed(2)}</span>
                    <button onClick={() => setQty(item.kind, item.id, 0)} aria-label="Remove"
                      style={{
                        background: 'transparent', border: 'none', padding: '4px',
                        cursor: 'pointer', color: C.inkFaint,
                        display: 'flex', alignItems: 'center',
                      }}><X size={14} /></button>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setPickerOpen(true)} style={{
              width: '100%', marginTop: '8px', padding: '10px 14px',
              background: 'transparent', border: `1px dashed ${C.border}`,
              borderRadius: '10px', color: C.sageDeep,
              fontFamily: 'inherit', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}>
              <Plus size={14} strokeWidth={2.2} /> Add items from catalog
            </button>
          </Field>

          {/* Live pricing — recomputes as items/extras/discount change. The
              same panel the Build tab uses, so the user sees material cost,
              extras, discount, and the customer total update in real time.
              Saving the order uses the same derived costPer (submitOrderForm
              reads cart.items + cart.discount). */}
          {((cart.items || []).length > 0 || (cart.extraCosts || []).length > 0) && (
            <PricingPanel
              quantity={orderForm.quantity || '1'}
              items={cart.items} flowers={flowers} materials={materials} bouquets={bouquets}
              extraCosts={cart.extraCosts}
              onChangeExtras={setExtras}
              discount={cart.discount}
              onChangeDiscount={setDiscount}
            />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(70px, 90px) minmax(0, 1fr)', gap: '10px', marginBottom: '14px' }}>
            <Field label="Qty" style={{ marginBottom: 0 }}>
              <input className="text-input" type="number" min="1" value={orderForm.quantity}
                onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                placeholder="1" style={{ ...inputStyle(), minWidth: 0 }} />
            </Field>
            <Field label="Pickup date & time" required style={{ marginBottom: 0 }}>
              <input className="text-input" type="datetime-local" value={orderForm.pickupDateTime || ''}
                min={(() => {
                  const d = new Date();
                  const pad = x => String(x).padStart(2, '0');
                  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                })()}
                onChange={(e) => setOrderForm({ ...orderForm, pickupDateTime: e.target.value })}
                style={{ ...inputStyle(), minWidth: 0, width: '100%' }} />
            </Field>
          </div>

          <Field label="Event type">
            <TypeDropdown
              value={orderForm.eventType || 'general'}
              options={eventTypes}
              onChange={(key) => setOrderForm({ ...orderForm, eventType: key })}
              onAdd={onAddEventType}
              showColor
              placeholder="Select event type…"
            />
          </Field>

          <Field label="Payments" hint="Add one per payment. Split across methods if needed.">
            <PaymentsEditor
              payments={orderForm.payments || []}
              onChange={(next) => setOrderForm({ ...orderForm, payments: next })}
              total={(parseFloat(orderForm.quantity) || 0) * (parseFloat(orderForm.costPer) || 0)}
              paymentMethods={paymentMethods}
            />
          </Field>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
            background: C.bg, borderRadius: '8px', marginBottom: '14px', cursor: 'pointer',
          }} onClick={() => setOrderForm({ ...orderForm, enableReminders: !remindersOn })}>
            <div style={{
              width: '20px', height: '20px', borderRadius: '6px',
              background: remindersOn ? C.sageDeep : C.card,
              border: `1.5px solid ${remindersOn ? C.sageDeep : C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 160ms ease', flexShrink: 0,
            }}>
              {remindersOn && <Check size={13} strokeWidth={3} color={C.card} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: C.ink }}>Pickup reminders</div>
              <div style={{ fontSize: '11px', color: C.inkFaint }}>
                Phone alerts at the offsets you've set in Settings.
              </div>
            </div>
          </div>

          <CollapsibleField label="Notes (optional)" hint="Anything you want to remember." value={orderForm.notes}>
            <textarea className="text-input" value={orderForm.notes || ''}
              onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
              placeholder="e.g. Her sister's birthday"
              rows="2"
              style={{ ...inputStyle(), resize: 'vertical', minHeight: '60px' }} />
          </CollapsibleField>

          <CollapsibleField label="Card messages (optional)" hint="One per bouquet that needs a card. Tap + to add more." value={(orderForm.cardMessages || []).join(' ')}>
            <CardMessagesEditor
              cardMessages={orderForm.cardMessages || []}
              onChange={(next) => setOrderForm({ ...orderForm, cardMessages: next })}
            />
          </CollapsibleField>

          <CollapsibleField
            label="More bouquets in this order (optional)"
            hint="Add extra bouquets shipping with this order — e.g. centerpieces, bridesmaid bouquets."
            value={(orderForm.additionalBouquets || []).map(b => b.name || '').join(' ')}
          >
            <AdditionalBouquetsEditor
              bouquets={orderForm.additionalBouquets || []}
              onChange={(next) => setOrderForm({ ...orderForm, additionalBouquets: next })}
            />
          </CollapsibleField>
        </div>

        <div style={{
          padding: '14px 22px', flexShrink: 0,
          background: C.card,
          borderTop: `1px solid ${C.borderSoft}`, display: 'flex', gap: '10px',
        }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: '10px', color: C.inkSoft, fontFamily: 'inherit', fontSize: '14px',
            fontWeight: 500, cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={onSubmit} className="primary-btn" style={{
            flex: 2, padding: '12px',
            background: C.sageDeep,
            border: 'none', borderRadius: '10px',
            color: C.card, fontFamily: 'inherit', fontSize: '14px', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
            <Check size={15} strokeWidth={2.4} />
            {isEditing ? 'Save changes' : 'Save order'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CartView({
  cart, flowers, materials, bouquets, orders, totals, settings,
  setQty, setIncluded, setPriceOverride, setCustomerName,
  setExtras, setDiscount, clearCart,
  // Order-detail fields (merged from the old OrderFormModal). Reads/writes go
  // straight to orderForm state in App so draft persistence keeps working.
  orderForm, setOrderForm, editingOrderId,
  onAddNewFlower, onAddNewMaterial, onAddNewBouquet, onSaveAsBouquet,
  onAddEventType, onAddPaymentMethod,
  onSaveOrder, onCancelEdit, onSwitchToInventory,
}) {
  const [pickerTab, setPickerTab] = useState('flowers');
  const [search, setSearch] = useState('');
  const itemsByKey = useMemo(() => {
    const map = {};
    cart.items.forEach(it => { map[`${it.kind}:${it.id}`] = it; });
    return map;
  }, [cart.items]);

  const rawList = pickerTab === 'flowers' ? flowers
    : pickerTab === 'materials' ? materials
    : (bouquets || []);
  // Alphabetical A→Z so the picker stays predictable as the catalog grows.
  const list = useMemo(() =>
    [...(rawList || [])].sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))
  , [rawList]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(item => {
      if (item.name.toLowerCase().includes(q)) return true;
      if (pickerTab === 'flowers' && item.description && item.description.toLowerCase().includes(q)) return true;
      if (pickerTab === 'materials' && item.note && item.note.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [list, search, pickerTab]);
  const pickerKind = pickerTab === 'flowers' ? 'flower'
    : pickerTab === 'materials' ? 'material'
    : 'bouquet';

  const cartHasItems = cart.items.length > 0;
  const fmt = (n) => `$${n.toFixed(2)}`;

  // Live customer total for the sticky footer (mirrors PricingPanel, qty=1 in cart).
  // Subtotal → apply discount → customer total. Capped at 0.
  const ranges = computeMaterialRanges(cart.items, flowers, materials, bouquets);
  const effMid = (ranges.effMin + ranges.effMax) / 2;
  const extrasTotal = sumExtras(cart.extraCosts);
  const subtotal = effMid + extrasTotal;
  const discKind = (cart.discount && cart.discount.kind === 'percent') ? 'percent' : 'flat';
  const discValue = Number(cart.discount && cart.discount.value) || 0;
  const discountAmount = discKind === 'percent'
    ? Math.min(subtotal, subtotal * Math.min(100, Math.max(0, discValue)) / 100)
    : Math.min(subtotal, Math.max(0, discValue));
  const customerTotal = Math.max(0, subtotal - discountAmount);

  if (flowers.length === 0 && materials.length === 0) {
    return (
      <div style={{
        background: C.card, border: `1px dashed ${C.border}`, borderRadius: '14px',
        padding: '48px 20px', textAlign: 'center', color: C.inkSoft,
      }}>
        <Flower2 size={32} strokeWidth={1.4} color={C.inkFaint} style={{ marginBottom: '12px' }} />
        <div style={{ fontSize: '14px', marginBottom: '4px' }}>Nothing in your catalog yet</div>
        <div style={{ fontSize: '12px', color: C.inkFaint, marginBottom: '14px' }}>
          Add a flower or supply first, then come back here to build a bouquet.
        </div>
        <button onClick={onSwitchToInventory} style={{
          padding: '10px 18px', background: C.sageDeep, border: 'none', borderRadius: '8px',
          color: C.card, fontFamily: 'inherit', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
        }}>Go to flowers</button>
      </div>
    );
  }

  const PickerColumn = (
    // Flex column makes the picker chrome (label/tabs/search) stay put at the
    // top while the items list (.build-picker-scroll, flex:1) scrolls beneath.
    // Works for both desktop (parent .build-picker locks height) and mobile
    // (.build-picker-scroll has its own max-height: 55vh).
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '8px', minHeight: '28px',
      }}>
        <SectionLabel style={{ marginBottom: 0 }}>{cartHasItems ? 'Add more' : 'Pick from catalog'}</SectionLabel>
        <button onClick={
            pickerTab === 'flowers' ? onAddNewFlower
            : pickerTab === 'materials' ? onAddNewMaterial
            : onAddNewBouquet
          }
          style={{
            padding: '6px 10px', background: 'transparent',
            border: `1px dashed ${C.border}`, borderRadius: '8px',
            color: C.inkSoft, fontFamily: 'inherit', fontSize: '12px', fontWeight: 500,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            <Plus size={12} strokeWidth={2.2} /> New {
              pickerTab === 'flowers' ? 'flower'
              : pickerTab === 'materials' ? 'supply'
              : 'bouquet'
            }
        </button>
      </div>

      <div className="build-sub-tabs" style={{
        display: 'flex', gap: '4px', background: C.bgDeep, padding: '4px',
        borderRadius: '10px', marginBottom: '12px',
      }}>
        <button onClick={() => setPickerTab('flowers')} style={{
          flex: 1, padding: '9px', borderRadius: '8px', border: 'none',
          background: pickerTab === 'flowers' ? C.card : 'transparent',
          color: pickerTab === 'flowers' ? C.ink : C.inkSoft,
          fontFamily: 'inherit', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}>
          <Flower2 size={13} strokeWidth={2} /> Flowers <span style={{ opacity: 0.55, fontWeight: 400 }}>{flowers.length}</span>
        </button>
        <button onClick={() => setPickerTab('materials')} style={{
          flex: 1, padding: '9px', borderRadius: '8px', border: 'none',
          background: pickerTab === 'materials' ? C.card : 'transparent',
          color: pickerTab === 'materials' ? C.ink : C.inkSoft,
          fontFamily: 'inherit', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}>
          <Tag size={13} strokeWidth={2} /> Supplies <span style={{ opacity: 0.55, fontWeight: 400 }}>{materials.length}</span>
        </button>
        <button onClick={() => setPickerTab('bouquets')} style={{
          flex: 1, padding: '9px', borderRadius: '8px', border: 'none',
          background: pickerTab === 'bouquets' ? C.card : 'transparent',
          color: pickerTab === 'bouquets' ? C.ink : C.inkSoft,
          fontFamily: 'inherit', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}>
          <Sheet size={13} strokeWidth={2} /> Bouquets <span style={{ opacity: 0.55, fontWeight: 400 }}>{(bouquets || []).length}</span>
        </button>
      </div>

      <SearchBar value={search} onChange={setSearch}
        placeholder={pickerTab === 'flowers' ? 'Search flowers…'
          : pickerTab === 'materials' ? 'Search supplies…'
          : 'Search bouquets…'} />

      {/* Scrollable list — picker chrome (label/tabs/search) stays put on
          desktop, only this container scrolls. On mobile (no .build-picker
          height clamp) it just lays out naturally. */}
      <div className="build-picker-scroll" style={{
        display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px',
      }}>
        {filtered.length === 0 ? (
          <div style={{
            padding: '24px', background: C.card, border: `1px dashed ${C.border}`,
            borderRadius: '12px', textAlign: 'center', color: C.inkFaint, fontSize: '13px',
          }}>
            {search.trim()
              ? `No ${pickerTab} match "${search}".`
              : pickerTab === 'flowers' ? 'No flowers yet.'
              : pickerTab === 'materials' ? 'No supplies yet.'
              : 'No bouquets yet.'}
          </div>
        ) : filtered.map(item => (
          <PickerRow
            key={item.id}
            kind={pickerKind}
            item={item}
            cartItem={itemsByKey[`${pickerKind}:${item.id}`]}
            setQty={setQty}
            setIncluded={setIncluded}
            setPriceOverride={setPriceOverride}
          />
        ))}

      </div>
    </div>
  );

  const eventTypes = (settings && settings.eventTypes) || DEFAULT_EVENT_TYPES;
  const paymentMethods = (settings && settings.paymentMethods) || DEFAULT_PAYMENT_METHODS;
  const remindersOn = orderForm ? orderForm.enableReminders !== false : true;
  const isEditing = !!editingOrderId;
  const saveButtonLabel = isEditing ? 'Save changes' : 'Save order';

  const SideColumn = (
    // Match picker: flex column so the sticky save card at the bottom of the
    // .build-side scroll container has room to actually stick (marginTop:auto
    // pushes it down).
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {isEditing && (
        // Banner only appears when editing an existing order — makes the "I'm
        // not making a new order" mode unmistakable, with an escape hatch.
        <div style={{
          marginBottom: '14px', padding: '10px 14px',
          background: `${C.gold}1f`, border: `1px solid ${C.gold}66`,
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <Pencil size={14} color={C.gold} strokeWidth={2} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0, fontSize: '12px', color: C.ink }}>
            Editing <strong>{cart.customerName || 'order'}</strong>
          </div>
          <button onClick={onCancelEdit} style={{
            padding: '6px 10px', background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: '8px', color: C.inkSoft, fontFamily: 'inherit', fontSize: '12px',
            fontWeight: 500, cursor: 'pointer',
          }}>Cancel edit</button>
        </div>
      )}

      {/* Customer card */}
      <div style={{
        background: C.card, border: `1px solid ${C.borderSoft}`,
        borderRadius: '14px', padding: '16px', marginBottom: '12px',
      }}>
        <Field label="Customer name" required hint={isEditing ? null : 'Required to save as an order.'} style={{ marginBottom: 0 }}>
          <CustomerNameInput
            value={cart.customerName}
            onChange={setCustomerName}
            orders={orders || []}
            autoFocus={false}
          />
        </Field>
      </div>

      {/* Arrangement card — separate bubble. Stays as a clean text input;
          never auto-filled from item names so the placeholder shows when
          empty. */}
      {orderForm && setOrderForm && (
        <div style={{
          background: C.card, border: `1px solid ${C.borderSoft}`,
          borderRadius: '14px', padding: '16px', marginBottom: '12px',
        }}>
          <Field label="Arrangement name (optional)" hint="A short label like 'Spring bouquet' — your own words." style={{ marginBottom: 0 }}>
            <input className="text-input" type="text" value={orderForm.arrangement || ''}
              onChange={(e) => setOrderForm({ ...orderForm, arrangement: e.target.value })}
              placeholder="e.g. Mixed spring bouquet" style={inputStyle()} />
          </Field>
        </div>
      )}

      {cartHasItems && (
        <CartSummary cart={cart} flowers={flowers} materials={materials} bouquets={bouquets}
          setQty={setQty} setIncluded={setIncluded} clearCart={clearCart}
          onSaveAsBouquet={onSaveAsBouquet} />
      )}

      {(cartHasItems || extrasTotal > 0) && (
        <PricingPanel
          quantity="1" hideQty
          items={cart.items} flowers={flowers} materials={materials} bouquets={bouquets}
          extraCosts={cart.extraCosts}
          onChangeExtras={setExtras}
          discount={cart.discount}
          onChangeDiscount={setDiscount}
          hideTotal
        />
      )}

      {/* Order details — was the OrderFormModal, now inline. Always visible
          so the user knows from day 1 that the cart IS the order workflow. */}
      {orderForm && setOrderForm && (
        <div style={{
          background: C.card, border: `1px solid ${C.borderSoft}`,
          borderRadius: '14px', padding: '16px', marginBottom: '12px',
        }}>
          <div className="serif" style={{
            fontSize: '15px', fontWeight: 500, marginBottom: '12px',
          }}>Order details</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(70px, 90px) minmax(0, 1fr)', gap: '10px', marginBottom: '14px' }}>
            <Field label="Qty" style={{ marginBottom: 0 }}>
              <input className="text-input" type="number" min="1" value={orderForm.quantity}
                onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                placeholder="1" style={{ ...inputStyle(), minWidth: 0 }} />
            </Field>
            <Field label="Pickup date & time" required style={{ marginBottom: 0 }}>
              <input className="text-input" type="datetime-local" value={orderForm.pickupDateTime || ''}
                min={(() => {
                  const d = new Date();
                  const pad = x => String(x).padStart(2, '0');
                  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                })()}
                onChange={(e) => {
                  const next = e.target.value;
                  if (next) {
                    // Hard guard: even if someone types/pastes a past datetime
                    // (browser min only constrains the picker UI), pin it forward
                    // to "now" so we never persist a past pickup.
                    const now = new Date();
                    const pad = x => String(x).padStart(2, '0');
                    const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
                    if (next < nowStr) {
                      setOrderForm({ ...orderForm, pickupDateTime: nowStr });
                      return;
                    }
                  }
                  setOrderForm({ ...orderForm, pickupDateTime: next });
                }}
                style={{ ...inputStyle(), minWidth: 0, width: '100%' }} />
            </Field>
          </div>

          <Field label="Event type">
            <TypeDropdown
              value={orderForm.eventType || 'general'}
              options={eventTypes}
              onChange={(key) => setOrderForm({ ...orderForm, eventType: key })}
              onAdd={onAddEventType}
              showColor
              placeholder="Select event type…"
            />
          </Field>

          <Field label="Payments" hint="Add one per payment. Split across methods if needed.">
            <PaymentsEditor
              payments={orderForm.payments || []}
              onChange={(next) => setOrderForm({ ...orderForm, payments: next })}
              total={(parseFloat(orderForm.quantity) || 0) * (parseFloat(orderForm.costPer) || 0)}
              paymentMethods={paymentMethods}
            />
          </Field>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
            background: C.bg, borderRadius: '8px', marginBottom: '14px', cursor: 'pointer',
          }} onClick={() => setOrderForm({ ...orderForm, enableReminders: !remindersOn })}>
            <div style={{
              width: '20px', height: '20px', borderRadius: '6px',
              background: remindersOn ? C.sageDeep : C.card,
              border: `1.5px solid ${remindersOn ? C.sageDeep : C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 160ms ease', flexShrink: 0,
            }}>
              {remindersOn && <Check size={13} strokeWidth={3} color={C.card} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: C.ink }}>Pickup reminders</div>
              <div style={{ fontSize: '11px', color: C.inkFaint }}>
                Phone alerts at the offsets you've set in Settings.
              </div>
            </div>
          </div>

          <CollapsibleField label="Notes (optional)" hint="Anything you want to remember." value={orderForm.notes}>
            <textarea className="text-input" value={orderForm.notes || ''}
              onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
              placeholder="e.g. Her sister's birthday"
              rows="2"
              style={{ ...inputStyle(), resize: 'vertical', minHeight: '60px' }} />
          </CollapsibleField>

          <CollapsibleField label="Card messages (optional)" hint="One per bouquet that needs a card. Tap + to add more." value={(orderForm.cardMessages || []).join(' ')}>
            <CardMessagesEditor
              cardMessages={orderForm.cardMessages || []}
              onChange={(next) => setOrderForm({ ...orderForm, cardMessages: next })}
            />
          </CollapsibleField>

          <CollapsibleField
            label="More bouquets in this order (optional)"
            hint="Add extra bouquets shipping with this order — e.g. centerpieces, bridesmaid bouquets."
            value={(orderForm.additionalBouquets || []).map(b => b.name || '').join(' ')}
          >
            <AdditionalBouquetsEditor
              bouquets={orderForm.additionalBouquets || []}
              onChange={(next) => setOrderForm({ ...orderForm, additionalBouquets: next })}
            />
          </CollapsibleField>
        </div>
      )}

      {/* Desktop save summary — sticks to the bottom of the side column's
          scroll container so the customer-pays total + save button stay
          visible like the main HUD does at the top. Mobile gets its own
          sticky footer further down (the build-mobile-footer block), so
          this one stays hidden on narrow viewports via .build-side-only-desktop. */}
      {cartHasItems && (
      <div className="build-side-only-desktop" style={{
        background: C.ink, color: C.card, padding: '14px 16px', borderRadius: '12px',
        boxShadow: '0 -8px 24px rgba(42,53,40,0.28)',
        alignItems: 'center', gap: '12px',
        position: 'sticky', bottom: 0, zIndex: 30,
        marginTop: 'auto',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '11px', color: C.inkFaint, letterSpacing: '0.08em',
            textTransform: 'uppercase', marginBottom: '2px',
          }}>Customer pays</div>
          <div className="serif" style={{
            fontSize: '22px', fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.1,
          }}>{fmt(customerTotal)}</div>
          <div style={{ fontSize: '10px', color: C.inkFaint, marginTop: '2px' }}>
            from arrangement{extrasTotal > 0 && ` · +${fmt(extrasTotal)} extras`}
          </div>
        </div>
        <button onClick={onSaveOrder} className="primary-btn" style={{
          padding: '12px 16px', background: C.sageDeep, border: 'none', borderRadius: '10px',
          color: C.card, fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
        }}>
          {saveButtonLabel} <CalendarPlus size={14} strokeWidth={2} />
        </button>
      </div>
      )}
    </div>
  );

  return (
    <div className="fade-in" style={{ paddingBottom: cartHasItems ? '160px' : '20px' }}>
      <div className="build-grid">
        {/* DOM order: picker first (so mobile sees the flower list right
            away — cart + summary stack below). Desktop grid uses explicit
            grid-column assignments, so column placement is unaffected. */}
        <div className="build-picker">{PickerColumn}</div>
        <div className="build-side">{SideColumn}</div>
      </div>

      {cartHasItems && (
        <div className="build-mobile-footer" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: C.ink, color: C.card, padding: '14px 20px',
          boxShadow: '0 -8px 24px rgba(42,53,40,0.18)', zIndex: 40,
        }}>
          <div style={{ maxWidth: '880px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '11px', color: C.inkFaint, letterSpacing: '0.08em',
                textTransform: 'uppercase', marginBottom: '2px',
              }}>
                Customer pays
              </div>
              <div className="serif" style={{
                fontSize: '24px', fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.1,
              }}>
                {fmt(customerTotal)}
              </div>
              <div style={{ fontSize: '10px', color: C.inkFaint, marginTop: '2px' }}>
                from arrangement{extrasTotal > 0 && ` · +${fmt(extrasTotal)} extras`}
              </div>
            </div>
            <button onClick={onSaveOrder} className="primary-btn" style={{
              padding: '12px 18px', background: C.sageDeep, border: 'none', borderRadius: '10px',
              color: C.card, fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
            }}>
              {saveButtonLabel} <CalendarPlus size={15} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ position: 'relative' }}>
      <Search size={15} strokeWidth={1.8} color={C.inkFaint} style={{
        position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none',
      }} />
      <input className="text-input" type="search" value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...inputStyle(), paddingLeft: '40px', paddingRight: value ? '40px' : '14px' }} />
      {value && (
        <button onClick={() => onChange('')} aria-label="Clear search" style={{
          position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
          background: 'transparent', border: 'none', padding: '8px', cursor: 'pointer',
          color: C.inkFaint, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><X size={14} /></button>
      )}
    </div>
  );
}

function PickerRow({ kind, item, cartItem, setQty, setIncluded, setPriceOverride }) {
  const qty = cartItem?.qty || 0;
  const inCart = qty > 0;
  const hasOverride = inCart && typeof cartItem.unitPriceOverride === 'number' && isFinite(cartItem.unitPriceOverride);
  const isBouquet = kind === 'bouquet';

  let priceLabel, catalogPlaceholder, unitNoun;
  if (kind === 'flower') {
    if (item.mode === 'perStem') {
      const p = item.bunchPrice / item.bunchCount;
      priceLabel = `$${p.toFixed(2)}/stem`;
      catalogPlaceholder = p.toFixed(2);
    } else {
      const mid = (item.flatMin + item.flatMax) / 2;
      priceLabel = `$${item.flatMin.toFixed(2)}–$${item.flatMax.toFixed(2)}/bunch`;
      catalogPlaceholder = mid.toFixed(2);
    }
    unitNoun = item.mode === 'perStem' ? 'stem' : 'bunch';
  } else if (kind === 'material') {
    priceLabel = item.unitPrice > 0 ? `$${item.unitPrice.toFixed(2)} each` : 'No price set';
    catalogPlaceholder = item.unitPrice > 0 ? item.unitPrice.toFixed(2) : '0.00';
    unitNoun = 'each';
  } else {
    // bouquet
    const hasFixed = typeof item.fixedPrice === 'number' && isFinite(item.fixedPrice);
    priceLabel = hasFixed ? `$${item.fixedPrice.toFixed(2)} bundle` : 'Loose arrangement';
    catalogPlaceholder = hasFixed ? item.fixedPrice.toFixed(2) : '0.00';
    unitNoun = 'each';
  }

  return (
    <div style={{
      background: inCart ? `${C.sage}10` : C.card,
      border: `1px solid ${inCart ? C.sage : C.borderSoft}`,
      borderRadius: '12px', padding: '12px 14px',
      transition: 'all 200ms ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {kind === 'material' && (
          <div style={{
            width: '22px', height: '22px', borderRadius: '50%', background: item.color,
            border: isLight(item.color) ? `1px solid ${C.border}` : 'none', flexShrink: 0,
          }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="serif" style={{
            fontSize: '15px', fontWeight: 500, color: C.ink, lineHeight: 1.2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {item.name}
          </div>
          <div style={{ fontSize: '12px', color: C.inkSoft, marginTop: '2px' }}>{priceLabel}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button className="qty-btn" onClick={() => setQty(kind, item.id, qty - 1)} disabled={qty === 0}
            aria-label="Remove one"
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: C.sageDeep, border: 'none', color: C.card, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <Minus size={15} strokeWidth={2.5} />
          </button>
          <div style={{
            minWidth: '24px', textAlign: 'center', fontSize: '15px', fontWeight: 600,
            color: inCart ? C.ink : C.inkFaint,
          }}>{qty}</div>
          <button className="qty-btn" onClick={() => setQty(kind, item.id, qty + 1)}
            aria-label="Add one"
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: C.sageDeep, border: 'none', color: C.card, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <Plus size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      {inCart && !isBouquet && (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div onClick={() => setIncluded(kind, item.id, !cartItem.included)}
            style={{
              padding: '8px 10px',
              background: cartItem.included ? `${C.sage}18` : C.bg,
              border: `1px solid ${cartItem.included ? C.sage : C.border}`,
              borderRadius: '8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
            <div style={{
              width: '18px', height: '18px', borderRadius: '5px',
              background: cartItem.included ? C.sageDeep : C.card,
              border: `1.5px solid ${cartItem.included ? C.sageDeep : C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {cartItem.included && <Check size={12} strokeWidth={3} color={C.card} />}
            </div>
            <div style={{ fontSize: '12px', color: cartItem.included ? C.sageDeep : C.inkSoft, fontWeight: 500 }}>
              {cartItem.included ? 'Counted in price' : 'Not counted in price'}
            </div>
          </div>
          <div style={{
            padding: '8px 10px', background: hasOverride ? `${C.gold}15` : C.bg,
            border: `1px solid ${hasOverride ? C.gold : C.border}`,
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '12px', color: C.inkSoft, fontWeight: 500, flexShrink: 0 }}>
              Price for this bouquet
            </span>
            <div style={{ position: 'relative', flex: 1, maxWidth: '120px' }}>
              <span style={{
                position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                fontSize: '12px', color: C.inkFaint, pointerEvents: 'none',
              }}>$</span>
              <input
                type="number" min="0" step="0.01"
                value={hasOverride ? cartItem.unitPriceOverride : ''}
                onChange={(e) => setPriceOverride(kind, item.id, e.target.value)}
                placeholder={catalogPlaceholder}
                aria-label={`Override unit price (catalog ${priceLabel})`}
                style={{
                  width: '100%', padding: '6px 8px 6px 20px', fontSize: '12px',
                  fontFamily: 'inherit', background: C.card,
                  border: `1px solid ${hasOverride ? C.gold : C.border}`, borderRadius: '6px',
                  color: C.ink, textAlign: 'right',
                }}
              />
            </div>
            <span style={{ fontSize: '11px', color: C.inkFaint, flexShrink: 0 }}>/{unitNoun}</span>
            {hasOverride && (
              <button onClick={() => setPriceOverride(kind, item.id, '')}
                aria-label="Reset to catalog price"
                style={{
                  background: 'transparent', border: 'none', padding: '4px',
                  cursor: 'pointer', color: C.inkFaint, fontSize: '11px',
                  textDecoration: 'underline', fontFamily: 'inherit',
                }}>reset</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CartSummary({ cart, flowers, materials, bouquets, setQty, setIncluded, clearCart, onSaveAsBouquet }) {
  const [expanded, setExpanded] = useState({});
  const toggleExpand = (key) => setExpanded(e => ({ ...e, [key]: !e[key] }));

  // Two separate "bubbles", both representing bouquets:
  //   1. "In this bouquet" — loose flowers/supplies the user is currently
  //      assembling. Has a "Save as bouquet" action so it can be turned into
  //      a reusable preset.
  //   2. "Premade bouquets" — saved bouquet templates that were dropped in
  //      whole. Each row is expandable to reveal its inner recipe (read-only;
  //      bouquets can't nest, so the contents shown are flowers/materials).
  const bouquetItems = cart.items.filter(it => it.kind === 'bouquet');
  const looseItems = cart.items.filter(it => it.kind !== 'bouquet');

  // Match the rest of the right-column cards (Order details, Pricing) — use
  // C.borderSoft for the outline so all bubbles read as the same surface.
  const cardStyle = {
    background: C.card, border: `1px solid ${C.borderSoft}`,
    borderRadius: '14px', padding: '14px', marginBottom: '12px',
  };

  // Show "Clear cart" only once — on whichever card renders first (working
  // bouquet on top has priority since that's the one the user is touching).
  const clearOnLoose = looseItems.length > 0;
  const clearOnBouquets = !clearOnLoose && bouquetItems.length > 0;

  const renderHeader = (title, withClear) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: '10px',
    }}>
      <div className="serif" style={{ fontSize: '15px', fontWeight: 500 }}>{title}</div>
      {withClear && <DeleteButton onConfirm={clearCart} label="Clear cart" padding="8px" size={14} />}
    </div>
  );

  const renderBouquetRow = (item) => {
    const key = `${item.kind}:${item.id}`;
    const isExpanded = !!expanded[key];
    const bq = (bouquets || []).find(x => x.id === item.id);
    const name = bq ? bq.name : '(removed)';
    const hasFixedPrice = bq && typeof bq.fixedPrice === 'number' && isFinite(bq.fixedPrice);
    const lineTotal = hasFixedPrice ? bq.fixedPrice * item.qty : 0;
    return (
      <div key={key} style={{
        background: item.included ? `${C.sage}10` : `${C.inkFaint}10`,
        border: `1px solid ${item.included ? C.sage : C.borderSoft}`,
        borderRadius: '10px', padding: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => toggleExpand(key)} aria-label="Expand bouquet"
            style={{
              background: 'transparent', border: 'none', padding: '4px',
              cursor: 'pointer', color: C.inkSoft,
              display: 'flex', alignItems: 'center',
            }}>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <div style={{
            fontSize: '13px', minWidth: '28px', textAlign: 'right',
            fontWeight: 600, color: C.ink, flexShrink: 0,
          }}>{item.qty}×</div>
          <div style={{
            flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '5px',
            color: item.included ? C.ink : C.inkFaint,
            textDecoration: item.included ? 'none' : 'line-through',
          }}>
            <span className="serif" style={{
              fontSize: '14px', fontWeight: 500,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{name}</span>
            <span style={{
              fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em',
              color: C.sageDeep, background: `${C.sage}22`,
              padding: '1px 5px', borderRadius: '3px', flexShrink: 0,
            }}>BUNDLE</span>
          </div>
          <div style={{
            fontSize: '13px', color: item.included ? C.sageDeep : C.inkFaint,
            fontWeight: 600, flexShrink: 0,
          }}>{hasFixedPrice ? `$${lineTotal.toFixed(2)}` : '—'}</div>
          <button onClick={() => setQty('bouquet', item.id, 0)} aria-label="Remove from cart"
            style={{
              background: 'transparent', border: 'none', padding: '6px',
              cursor: 'pointer', color: C.inkFaint,
              display: 'flex', alignItems: 'center',
            }}><X size={14} /></button>
        </div>
        {isExpanded && bq && (
          <div style={{
            marginTop: '8px', paddingTop: '8px', borderTop: `1px dashed ${C.border}`,
            display: 'flex', flexDirection: 'column', gap: '3px',
            paddingLeft: '34px',
          }}>
            {(bq.items || []).length === 0 && (
              <div style={{ fontSize: '11px', color: C.inkFaint, fontStyle: 'italic' }}>(no contents)</div>
            )}
            {(bq.items || []).map((sub, i) => {
              const subRef = sub.kind === 'flower'
                ? (flowers || []).find(x => x.id === sub.id)
                : (materials || []).find(x => x.id === sub.id);
              return (
                <div key={i} style={{
                  fontSize: '12px', color: C.inkSoft,
                  display: 'flex', justifyContent: 'space-between', gap: '8px',
                }}>
                  <span>{sub.qty}× {subRef ? subRef.name : '(removed)'}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderLooseRow = (item) => {
    const key = `${item.kind}:${item.id}`;
    const ref = item.kind === 'flower'
      ? flowers.find(x => x.id === item.id)
      : materials.find(x => x.id === item.id);
    const name = ref ? ref.name : '(removed)';
    const hasOverride = typeof item.unitPriceOverride === 'number' && isFinite(item.unitPriceOverride);
    let lineLabel = '';
    if (hasOverride) {
      const v = item.unitPriceOverride * item.qty;
      lineLabel = `$${v.toFixed(2)}`;
    } else if (ref && item.kind === 'flower') {
      const isPer = ref.mode === 'perStem';
      const min = isPer ? (ref.bunchPrice / ref.bunchCount) * item.qty : ref.flatMin * item.qty;
      const max = isPer ? (ref.bunchPrice / ref.bunchCount) * item.qty : ref.flatMax * item.qty;
      lineLabel = min === max ? `$${min.toFixed(2)}` : `$${min.toFixed(2)}–$${max.toFixed(2)}`;
    } else if (ref) {
      const v = (ref.unitPrice || 0) * item.qty;
      lineLabel = v > 0 ? `$${v.toFixed(2)}` : '—';
    }
    return (
      <div key={key} style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '6px 8px', borderRadius: '8px',
        background: item.included ? 'transparent' : `${C.inkFaint}10`,
      }}>
        <div style={{
          fontSize: '13px', minWidth: '28px', textAlign: 'right',
          fontWeight: 600, color: C.ink,
        }}>{item.qty}×</div>
        <div style={{
          flex: 1, minWidth: 0, fontSize: '13px',
          color: item.included ? C.ink : C.inkFaint,
          textDecoration: item.included ? 'none' : 'line-through',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: '5px',
        }}>
          {name}
          {hasOverride && (
            <span title="Price adjusted for this bouquet" style={{
              fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em',
              color: C.gold, background: `${C.gold}22`,
              padding: '1px 5px', borderRadius: '3px', flexShrink: 0,
            }}>ADJ</span>
          )}
        </div>
        <div style={{
          fontSize: '12px', color: item.included ? C.sageDeep : C.inkFaint,
          fontWeight: 600, flexShrink: 0,
        }}>{lineLabel}</div>
        <button onClick={() => setQty(item.kind, item.id, 0)} aria-label="Remove from cart"
          style={{
            background: 'transparent', border: 'none', padding: '6px',
            cursor: 'pointer', color: C.inkFaint,
            display: 'flex', alignItems: 'center',
          }}><X size={14} /></button>
      </div>
    );
  };

  return (
    <div style={{ marginBottom: '6px' }}>
      {looseItems.length > 0 && (
        <div style={cardStyle}>
          {renderHeader('In this bouquet', clearOnLoose)}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {looseItems.map(renderLooseRow)}
          </div>
          {/* Save as bouquet — turns the current loose items into a reusable
              preset so future checkouts can drop the whole thing in. */}
          {onSaveAsBouquet && (
            <button onClick={onSaveAsBouquet} style={{
              marginTop: '10px', padding: '8px 12px',
              background: 'transparent', border: `1px dashed ${C.sage}`,
              borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: '12px', fontWeight: 500, color: C.sageDeep,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              width: '100%',
            }}>
              <Sheet size={12} strokeWidth={2.2} /> Save as bouquet for next time
            </button>
          )}
        </div>
      )}
      {bouquetItems.length > 0 && (
        <div style={cardStyle}>
          {renderHeader('Premade bouquet(s)', clearOnBouquets)}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {bouquetItems.map(renderBouquetRow)}
          </div>
        </div>
      )}
    </div>
  );
}

// --------------------- TRANSFER ---------------------

function TransferModal({ flowers, materials, orders, settings, lastExport, onClose, onExported, onImport }) {
  const [mode, setMode] = useState('export');
  const [pasteText, setPasteText] = useState('');
  const [importStatus, setImportStatus] = useState(null);
  const [copyState, setCopyState] = useState('');
  const [downloadState, setDownloadState] = useState('');

  const exportData = buildExport(flowers, materials, orders, settings);
  const exportJSON = JSON.stringify(exportData, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportJSON);
      setCopyState('done');
      onExported();
      setTimeout(() => setCopyState(''), 2400);
    } catch (e) {
      setCopyState('failed');
      setTimeout(() => setCopyState(''), 2400);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([exportJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    a.download = `${sanitizeFilename(settings.businessName)}-backup-${date}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadState('done');
    onExported();
    setTimeout(() => setDownloadState(''), 2400);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const result = await onImport(data);
        setImportStatus(result.ok ? {
          ok: true,
          msg: `Imported ${result.flowerCount} flowers, ${result.materialCount} supplies, ${result.orderCount} orders${result.hasSettings ? ' + settings' : ''}.`,
        } : { ok: false, msg: result.error });
      } catch (e) { setImportStatus({ ok: false, msg: "Couldn't read this file. Make sure it's a backup .json." }); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePaste = async () => {
    if (!pasteText.trim()) return;
    try {
      const data = JSON.parse(pasteText);
      const result = await onImport(data);
      setImportStatus(result.ok ? {
        ok: true,
        msg: `Imported ${result.flowerCount} flowers, ${result.materialCount} supplies, ${result.orderCount} orders${result.hasSettings ? ' + settings' : ''}.`,
      } : { ok: false, msg: result.error });
      if (result.ok) setPasteText('');
    } catch (e) { setImportStatus({ ok: false, msg: "That doesn't look like valid backup data." }); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(42,53,40,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', zIndex: 50, backdropFilter: 'blur(4px)',
    }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
        background: C.card, borderRadius: '16px', padding: '24px',
        width: '100%', maxWidth: '520px', maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 20px 60px rgba(42,53,40,0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <div style={{
            width: '36px', height: '36px', background: `${C.sageDeep}22`, borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ArrowLeftRight size={16} color={C.sageDeep} strokeWidth={2} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 className="serif" style={{ fontSize: '22px', margin: 0, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              Transfer your data
            </h2>
            <div style={{ fontSize: '13px', color: C.inkSoft, marginTop: '2px' }}>
              Move between devices, or save a backup
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close" style={{
            background: 'transparent', border: 'none', padding: '10px', borderRadius: '8px',
            cursor: 'pointer', color: C.inkSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={20} /></button>
        </div>

        {lastExport && (
          <div style={{
            fontSize: '12px', color: C.inkFaint, fontStyle: 'italic',
            marginTop: '4px', marginBottom: '18px',
          }}>Last backup {formatRelative(lastExport)}</div>
        )}

        <div style={{
          display: 'flex', gap: '4px', background: C.bgDeep, padding: '4px',
          borderRadius: '10px', marginBottom: '20px', marginTop: lastExport ? 0 : '14px',
        }}>
          <button onClick={() => setMode('export')} style={{
            flex: 1, padding: '9px', borderRadius: '8px', border: 'none',
            background: mode === 'export' ? C.card : 'transparent',
            color: mode === 'export' ? C.ink : C.inkSoft,
            fontFamily: 'inherit', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
            <Download size={13} strokeWidth={2} /> Export
          </button>
          <button onClick={() => setMode('import')} style={{
            flex: 1, padding: '9px', borderRadius: '8px', border: 'none',
            background: mode === 'import' ? C.card : 'transparent',
            color: mode === 'import' ? C.ink : C.inkSoft,
            fontFamily: 'inherit', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
            <Upload size={13} strokeWidth={2} /> Import
          </button>
        </div>

        {mode === 'export' ? (
          <div>
            <div style={{ fontSize: '13px', color: C.inkSoft, marginBottom: '14px', lineHeight: 1.55 }}>
              Save a copy of your <strong>{flowers.length}</strong> flowers, <strong>{materials.length}</strong> supplies, <strong>{orders.length}</strong> orders, and your settings.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={handleDownload} style={{
                padding: '14px 16px', background: C.sageDeep, border: 'none', borderRadius: '10px',
                color: C.card, fontFamily: 'inherit', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 180ms ease',
              }}>
                {downloadState === 'done'
                  ? <><Check size={16} strokeWidth={2.4} /> Downloaded</>
                  : <><Download size={16} strokeWidth={2} /> Download backup file</>}
              </button>
              <button onClick={handleCopy} style={{
                padding: '12px 16px', background: 'transparent', border: `1px solid ${C.border}`,
                borderRadius: '10px', color: C.ink, fontFamily: 'inherit', fontSize: '14px',
                fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 160ms ease',
              }}>
                {copyState === 'done'
                  ? <><Check size={15} strokeWidth={2.4} color={C.sageDeep} /> Copied</>
                  : copyState === 'failed'
                  ? <><AlertCircle size={15} strokeWidth={2} color={C.rose} /> Couldn't copy</>
                  : <><Copy size={15} strokeWidth={2} /> Copy to clipboard</>}
              </button>
            </div>
            <div style={{
              marginTop: '14px', padding: '12px 14px', background: C.bg, borderRadius: '10px',
              fontSize: '12px', color: C.inkSoft, lineHeight: 1.6,
            }}>
              <strong style={{ color: C.ink }}>Tip:</strong> Email the backup to yourself, or paste it into a note. Then on your other device, open this app and use Import.
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '13px', color: C.inkSoft, marginBottom: '14px', lineHeight: 1.55 }}>
              Replace your current data with a backup. <strong style={{ color: C.roseDeep }}>This overwrites everything you have now.</strong>
            </div>
            <label style={{
              padding: '14px 16px', background: C.sageDeep, border: 'none', borderRadius: '10px',
              color: C.card, fontFamily: 'inherit', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 180ms ease', marginBottom: '14px',
            }}>
              <Upload size={16} strokeWidth={2} /> Choose backup file
              <input type="file" accept=".json,application/json" onChange={handleFile} style={{ display: 'none' }} />
            </label>
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <div style={{ height: '1px', background: C.borderSoft }} />
              <span style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                background: C.card, padding: '0 10px', fontSize: '11px', color: C.inkFaint,
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>or paste</span>
            </div>
            <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste backup data here…"
              style={{
                width: '100%', minHeight: '90px', padding: '12px', fontSize: '12px',
                fontFamily: 'monospace', background: C.bg, border: `1px solid ${C.border}`,
                borderRadius: '10px', color: C.ink, resize: 'vertical', marginBottom: '8px',
              }} />
            <button onClick={handlePaste} disabled={!pasteText.trim()}
              style={{
                width: '100%', padding: '11px', background: pasteText.trim() ? C.ink : C.bgDeep,
                border: 'none', borderRadius: '10px',
                color: pasteText.trim() ? C.card : C.inkFaint,
                fontFamily: 'inherit', fontSize: '13px', fontWeight: 500,
                cursor: pasteText.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}>
              <ClipboardPaste size={14} strokeWidth={2} /> Import pasted data
            </button>

            {importStatus && (
              <div style={{
                marginTop: '14px', padding: '12px 14px',
                background: importStatus.ok ? `${C.sage}22` : `${C.rose}22`,
                border: `1px solid ${importStatus.ok ? C.sage : C.rose}`,
                borderRadius: '10px', fontSize: '13px',
                color: importStatus.ok ? C.sageDeep : C.roseDeep,
                display: 'flex', alignItems: 'flex-start', gap: '8px',
              }}>
                {importStatus.ok
                  ? <Check size={16} strokeWidth={2.4} style={{ flexShrink: 0, marginTop: '1px' }} />
                  : <AlertCircle size={16} strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px' }} />}
                <div style={{ lineHeight: 1.5 }}>{importStatus.msg}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --------------------- LOG PRICE & FLOWER FORM ---------------------

function LogPriceModal({ flower, recentNotes, onCancel, onSave }) {
  const isPer = flower.mode === 'perStem';
  const [bunchPrice, setBunchPrice] = useState(isPer ? flower.bunchPrice.toString() : '');
  const [bunchCount, setBunchCount] = useState(isPer ? flower.bunchCount.toString() : '');
  const [flatMin, setFlatMin] = useState(!isPer ? flower.flatMin.toString() : '');
  const [flatMax, setFlatMax] = useState(!isPer ? flower.flatMax.toString() : '');
  const [note, setNote] = useState('');

  const submit = () => {
    const entry = { date: new Date().toISOString(), note: note.trim() || undefined };
    if (isPer) {
      const bp = parseFloat(bunchPrice), bc = parseInt(bunchCount);
      if (!bp || !bc) return;
      entry.bunchPrice = bp; entry.bunchCount = bc;
    } else {
      const mn = parseFloat(flatMin), mx = parseFloat(flatMax);
      if (!mn || !mx) return;
      entry.flatMin = mn; entry.flatMax = mx;
    }
    onSave(entry);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(42,53,40,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', zIndex: 50, backdropFilter: 'blur(4px)',
    }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
        background: C.card, borderRadius: '16px', padding: '24px',
        width: '100%', maxWidth: '480px', maxHeight: '92vh', overflow: 'auto',
        boxShadow: '0 20px 60px rgba(42,53,40,0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
          <div style={{
            width: '36px', height: '36px', background: `${C.gold}22`, borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Tag size={16} color={C.gold} strokeWidth={2} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 className="serif" style={{ fontSize: '20px', margin: 0, fontWeight: 500, letterSpacing: '-0.01em' }}>
              Log price for {flower.name}
            </h2>
            <div style={{ fontSize: '12px', color: C.inkSoft, marginTop: '2px' }}>
              Updates the current price and saves to history
            </div>
          </div>
          <button className="icon-btn" onClick={onCancel} aria-label="Close" style={{
            background: 'transparent', border: 'none', padding: '10px', borderRadius: '8px',
            cursor: 'pointer', color: C.inkSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={20} /></button>
        </div>

        {isPer ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Bunch price">
              <input className="text-input" type="number" min="0" step="0.01" value={bunchPrice}
                onChange={(e) => setBunchPrice(e.target.value)}
                placeholder="12.99" autoFocus style={inputStyle()} />
            </Field>
            <Field label="Stems per bunch">
              <input className="text-input" type="number" min="1" value={bunchCount}
                onChange={(e) => setBunchCount(e.target.value)}
                placeholder="12" style={inputStyle()} />
            </Field>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Min price">
              <input className="text-input" type="number" min="0" step="0.01" value={flatMin}
                onChange={(e) => setFlatMin(e.target.value)}
                placeholder="5.00" autoFocus style={inputStyle()} />
            </Field>
            <Field label="Max price">
              <input className="text-input" type="number" min="0" step="0.01" value={flatMax}
                onChange={(e) => setFlatMax(e.target.value)}
                placeholder="7.00" style={inputStyle()} />
            </Field>
          </div>
        )}

        <Field label="Note (optional)" hint="Where, what variety, anything to remember.">
          <input className="text-input" type="text" value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. TJ Brookside, opening buds" style={inputStyle()} />
          {recentNotes.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              {recentNotes.map(n => (
                <button key={n} className="note-chip" onClick={() => setNote(n)} style={{
                  padding: '5px 10px', fontSize: '11px', fontFamily: 'inherit',
                  background: C.bg, border: `1px solid ${C.border}`, borderRadius: '12px',
                  color: C.inkSoft, cursor: 'pointer',
                }}>{n}</button>
              ))}
            </div>
          )}
        </Field>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '14px', background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: '10px', color: C.inkSoft, fontFamily: 'inherit', fontSize: '15px',
            fontWeight: 500, cursor: 'pointer',
          }}>Cancel</button>
          <button className="primary-btn" onClick={submit} style={{
            flex: 2, padding: '14px', background: C.sageDeep, border: 'none',
            borderRadius: '10px', color: C.card, fontFamily: 'inherit', fontSize: '15px',
            fontWeight: 500, cursor: 'pointer',
          }}>Save price</button>
        </div>
      </div>
    </div>
  );
}

function FlowerFormModal({ form, setForm, editingId, lookupState, onLookup, onCancel, onSubmit }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(42,53,40,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', zIndex: 70, backdropFilter: 'blur(4px)',
    }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
        background: C.card, borderRadius: '16px', padding: '24px',
        width: '100%', maxWidth: '500px', maxHeight: '92vh', overflow: 'auto',
        boxShadow: '0 20px 60px rgba(42,53,40,0.25)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div>
            <h2 className="serif" style={{ fontSize: '22px', margin: '0 0 4px', fontWeight: 500, letterSpacing: '-0.01em' }}>
              {editingId ? 'Edit flower' : 'New flower'}
            </h2>
            <div style={{ fontSize: '13px', color: C.inkSoft }}>Track pricing & details</div>
          </div>
          <button className="icon-btn" onClick={onCancel} aria-label="Close" style={{
            background: 'transparent', border: 'none', padding: '10px', borderRadius: '8px',
            cursor: 'pointer', color: C.inkSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={20} /></button>
        </div>

        <Field label="Name">
          <div style={{ display: 'flex', gap: '8px' }}>
            <input className="text-input" type="text" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Lisianthus" autoFocus style={inputStyle()} />
            <button className="lookup-btn" onClick={onLookup}
              disabled={!form.name.trim() || lookupState.loading}
              style={{
                padding: '0 14px', background: C.bg, border: `1px solid ${C.border}`,
                borderRadius: '10px', cursor: form.name.trim() && !lookupState.loading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.inkSoft,
                opacity: form.name.trim() && !lookupState.loading ? 1 : 0.5, flexShrink: 0,
              }}>
              {lookupState.loading ? <Loader2 size={15} className="spin" /> : <Search size={15} strokeWidth={1.8} />}
            </button>
          </div>
          {lookupState.error && (
            <div style={{ fontSize: '12px', color: C.rose, marginTop: '6px', display: 'flex', alignItems: 'flex-start', gap: '5px', lineHeight: 1.5, flexWrap: 'wrap' }}>
              <AlertCircle size={12} strokeWidth={2} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>
                {lookupState.error}
                {lookupState.searchUrl && (
                  <> <a href={lookupState.searchUrl} target="_blank" rel="noopener noreferrer"
                    style={{ color: C.sageDeep, fontWeight: 600, textDecoration: 'underline' }}>
                    Open Wikipedia search →
                  </a></>
                )}
              </span>
            </div>
          )}
        </Field>

        <Field label="Photo (optional)" hint="Upload from camera/files, or use the lookup above to grab one from Wikipedia.">
          {form.imageUrl ? (
            <PhotoEditor
              imageUrl={form.imageUrl}
              position={form.imagePosition || '50% 50%'}
              zoom={form.imageZoom || 1}
              onChange={({ position, zoom }) => setForm({ ...form, imagePosition: position, imageZoom: zoom })}
              onRemove={() => setForm({ ...form, imageUrl: '', imagePosition: '50% 50%', imageZoom: 1 })}
            />
          ) : (
            <FlowerPhotoUpload onUpload={(dataUrl) => setForm({ ...form, imageUrl: dataUrl, imagePosition: '50% 50%', imageZoom: 1 })} />
          )}
        </Field>

        <Field label="Pricing">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <ModeBtn active={form.mode === 'perStem'} onClick={() => setForm({ ...form, mode: 'perStem' })}
              title="Per stem" sub="Sold by the bunch" />
            <ModeBtn active={form.mode === 'flat'} onClick={() => setForm({ ...form, mode: 'flat' })}
              title="Flat per bunch" sub="Variable count" />
          </div>
          {form.mode === 'perStem' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input className="text-input" type="number" min="0" step="0.01" value={form.bunchPrice}
                onChange={(e) => setForm({ ...form, bunchPrice: e.target.value })}
                placeholder="Bunch price" style={inputStyle()} />
              <input className="text-input" type="number" min="1" value={form.bunchCount}
                onChange={(e) => setForm({ ...form, bunchCount: e.target.value })}
                placeholder="Stems" style={inputStyle()} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input className="text-input" type="number" min="0" step="0.01" value={form.flatMin}
                onChange={(e) => setForm({ ...form, flatMin: e.target.value })}
                placeholder="Min $" style={inputStyle()} />
              <input className="text-input" type="number" min="0" step="0.01" value={form.flatMax}
                onChange={(e) => setForm({ ...form, flatMax: e.target.value })}
                placeholder="Max $" style={inputStyle()} />
            </div>
          )}
        </Field>

        <Field label="Description (optional)" hint="Lookup auto-fills from Wikipedia, or write your own.">
          <textarea className="text-input" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="e.g. Classic cupped blooms, available in many colors"
            rows="3"
            style={{ ...inputStyle(), resize: 'vertical', minHeight: '70px' }} />
        </Field>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '14px', background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: '10px', color: C.inkSoft, fontFamily: 'inherit', fontSize: '15px',
            fontWeight: 500, cursor: 'pointer',
          }}>Cancel</button>
          <button className="primary-btn" onClick={onSubmit} style={{
            flex: 2, padding: '14px', background: C.sageDeep, border: 'none',
            borderRadius: '10px', color: C.card, fontFamily: 'inherit', fontSize: '15px',
            fontWeight: 500, cursor: 'pointer',
          }}>{editingId ? 'Save changes' : 'Add flower'}</button>
        </div>
      </div>
    </div>
  );
}
