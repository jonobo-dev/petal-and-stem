// IndexedDB wrapper that mimics the window.storage API used by the v8 artifact.
// One database, one object store, key-value pairs of strings.
// All values are stored as strings (callers JSON.stringify themselves) for parity with the artifact API.

const DB_NAME = 'petal-stem';
const DB_VERSION = 1;
const STORE = 'kv';

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function tx(mode) {
  const db = await openDB();
  return db.transaction(STORE, mode).objectStore(STORE);
}

export const storage = {
  async get(key) {
    const store = await tx('readonly');
    return new Promise((resolve, reject) => {
      const req = store.get(key);
      req.onsuccess = () => {
        const v = req.result;
        if (v == null) resolve(null);
        else resolve({ key, value: v });
      };
      req.onerror = () => reject(req.error);
    });
  },

  async set(key, value) {
    const store = await tx('readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(value, key);
      req.onsuccess = () => resolve({ key, value });
      req.onerror = () => reject(req.error);
    });
  },

  async delete(key) {
    const store = await tx('readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(key);
      req.onsuccess = () => resolve({ key, deleted: true });
      req.onerror = () => reject(req.error);
    });
  },

  async list(prefix) {
    const store = await tx('readonly');
    return new Promise((resolve, reject) => {
      const req = store.getAllKeys();
      req.onsuccess = () => {
        let keys = req.result || [];
        if (prefix) keys = keys.filter((k) => typeof k === 'string' && k.startsWith(prefix));
        resolve({ keys, prefix });
      };
      req.onerror = () => reject(req.error);
    });
  },
};
