// Google Drive backup/sync for Petal & Stem.
//
// Stores a single JSON file in the user's Drive (appDataFolder-adjacent —
// same drive.file scope as sheets.js, which only grants access to files
// this app creates). Full data including base64 images rides along in
// one blob, matching what buildExport() produces.
//
// Sync model: offline-first. Local IndexedDB is source of truth while the
// app runs. On launch, pull Drive metadata and compare `exportedAt` with
// local to decide whether to restore. On every mutation, debounce 2s and
// push the full JSON up. Last-write-wins on conflicts — we surface the
// conflict as a toast but don't block the user.

import { getValidToken, isConfigured, isConnected } from './sheets.js';
import { storage } from './idb.js';

const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';
const BACKUP_FILENAME = 'petal-and-stem-backup.json';

// IDB keys — scoped to drive so they don't collide with sheets_* keys.
const DRIVE_FILE_ID_KEY = 'drive_backup_id';
const DRIVE_LAST_MOD_KEY = 'drive_last_modified';

export { isConfigured, isConnected };

// ─── Helpers ───

async function fetchDrive(url, opts = {}) {
  const token = await getValidToken();
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drive API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res;
}

// Find the backup file — check cached ID first, then search by name.
async function findBackupFileId() {
  const cached = await storage.get(DRIVE_FILE_ID_KEY).catch(() => null);
  if (cached?.value) {
    try {
      // Verify it still exists + not trashed
      const res = await fetchDrive(`${DRIVE_API}/${cached.value}?fields=id,trashed`);
      const data = await res.json();
      if (!data.trashed) return cached.value;
    } catch (e) {
      // fall through to search
    }
    await storage.delete(DRIVE_FILE_ID_KEY).catch(() => {});
  }

  // Search by name — drive.file scope only sees files we created anyway.
  const q = encodeURIComponent(`name='${BACKUP_FILENAME}' and trashed=false`);
  const res = await fetchDrive(`${DRIVE_API}?q=${q}&fields=files(id,modifiedTime)&spaces=drive`);
  const data = await res.json();
  const file = (data.files || [])[0];
  if (file?.id) {
    await storage.set(DRIVE_FILE_ID_KEY, file.id).catch(() => {});
    return file.id;
  }
  return null;
}

// ─── Public API ───

// Returns { id, modifiedTime } or null if no backup exists.
export async function getBackupMeta() {
  if (!isConfigured() || !(await isConnected())) return null;
  const id = await findBackupFileId();
  if (!id) return null;
  const res = await fetchDrive(`${DRIVE_API}/${id}?fields=id,modifiedTime,size`);
  return res.json();
}

// Download the backup JSON content. Returns parsed object or null.
export async function downloadBackup() {
  if (!isConfigured() || !(await isConnected())) return null;
  const id = await findBackupFileId();
  if (!id) return null;
  const res = await fetchDrive(`${DRIVE_API}/${id}?alt=media`);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error('Backup file is corrupted (not valid JSON)');
  }
}

// Upload / overwrite the backup JSON. Creates the file on first call.
// Returns { id, modifiedTime } of the resulting file.
export async function uploadBackup(exportData) {
  if (!isConfigured() || !(await isConnected())) {
    throw new Error('Not connected to Google');
  }
  const body = JSON.stringify(exportData);
  const existingId = await findBackupFileId();

  // Multipart upload: metadata + content in one request
  const boundary = '----petal' + Math.random().toString(36).slice(2);
  const metadata = existingId
    ? { mimeType: 'application/json' }
    : { name: BACKUP_FILENAME, mimeType: 'application/json' };

  const multipartBody =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${body}\r\n` +
    `--${boundary}--`;

  const url = existingId
    ? `${UPLOAD_API}/${existingId}?uploadType=multipart&fields=id,modifiedTime`
    : `${UPLOAD_API}?uploadType=multipart&fields=id,modifiedTime`;

  const res = await fetchDrive(url, {
    method: existingId ? 'PATCH' : 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: multipartBody,
  });
  const data = await res.json();
  if (data.id) {
    await storage.set(DRIVE_FILE_ID_KEY, data.id).catch(() => {});
    await storage.set(DRIVE_LAST_MOD_KEY, data.modifiedTime || '').catch(() => {});
  }
  return data;
}

// Record the Drive modifiedTime we last observed — used to detect
// conflicts (someone else uploaded while we were offline).
export async function getLastKnownModified() {
  const r = await storage.get(DRIVE_LAST_MOD_KEY).catch(() => null);
  return r?.value || null;
}
export async function setLastKnownModified(ts) {
  await storage.set(DRIVE_LAST_MOD_KEY, ts || '').catch(() => {});
}

// Wipe local drive state (used on disconnect).
export async function clearLocalDriveState() {
  await storage.delete(DRIVE_FILE_ID_KEY).catch(() => {});
  await storage.delete(DRIVE_LAST_MOD_KEY).catch(() => {});
}
