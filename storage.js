// storage.js — IndexedDB for lessons (large), localStorage for small KV
// Exposes: App.storage (lessons), App.kv (small things)

window.App = window.App || {};

(function() {
  const DB_NAME = 'lesson_generator';
  const DB_VERSION = 1;
  const LESSONS_STORE = 'lessons';

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(LESSONS_STORE)) {
          const store = db.createObjectStore(LESSONS_STORE, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function tx(mode) {
    const db = await openDB();
    return db.transaction(LESSONS_STORE, mode).objectStore(LESSONS_STORE);
  }

  async function getAll() {
    try {
      const store = await tx('readonly');
      return new Promise((res, rej) => {
        const req = store.getAll();
        req.onsuccess = () => {
          const arr = req.result || [];
          arr.sort((a, b) => b.createdAt - a.createdAt);
          res(arr);
        };
        req.onerror = () => rej(req.error);
      });
    } catch (e) {
      console.warn('IDB read failed, returning empty:', e);
      return [];
    }
  }

  async function put(lesson) {
    try {
      const store = await tx('readwrite');
      return new Promise((res, rej) => {
        const req = store.put(lesson);
        req.onsuccess = () => res(lesson);
        req.onerror = () => rej(req.error);
      });
    } catch (e) {
      console.warn('IDB write failed:', e);
      throw e;
    }
  }

  async function remove(id) {
    try {
      const store = await tx('readwrite');
      return new Promise((res, rej) => {
        const req = store.delete(id);
        req.onsuccess = () => res();
        req.onerror = () => rej(req.error);
      });
    } catch (e) {
      console.warn('IDB delete failed:', e);
    }
  }

  async function get(id) {
    try {
      const store = await tx('readonly');
      return new Promise((res, rej) => {
        const req = store.get(id);
        req.onsuccess = () => res(req.result || null);
        req.onerror = () => rej(req.error);
      });
    } catch (e) {
      return null;
    }
  }

  // One-time migration from localStorage 'lesson_history' to IndexedDB
  async function migrateFromLocalStorage() {
    try {
      const raw = localStorage.getItem('lesson_history');
      if (!raw) return;
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr) || !arr.length) {
        localStorage.removeItem('lesson_history');
        return;
      }
      for (const lesson of arr) {
        if (lesson && lesson.id) await put(lesson);
      }
      localStorage.removeItem('lesson_history');
      console.info('Migrated', arr.length, 'lessons from localStorage to IndexedDB');
    } catch (e) {
      console.warn('Migration failed:', e);
    }
  }

  App.storage = { getAll, put, remove, get, migrateFromLocalStorage };

  // Small KV for things that fit in localStorage with no quota worry
  App.kv = {
    get(key, fallback = null) {
      try {
        const v = localStorage.getItem(key);
        return v == null ? fallback : v;
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); return true; }
      catch (e) {
        if (e.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded for key:', key);
        }
        return false;
      }
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch (e) {}
    },
    getJSON(key, fallback) {
      const raw = this.get(key);
      if (raw == null) return fallback;
      try { return JSON.parse(raw); } catch (e) { return fallback; }
    },
    setJSON(key, obj) {
      return this.set(key, JSON.stringify(obj));
    }
  };
})();
