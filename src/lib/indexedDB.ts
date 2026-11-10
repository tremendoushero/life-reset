// ====================================================================
// LIFE RESET - IndexedDB Storage Engine (Standalone Local Storage)
// ====================================================================

import { QueuedMutation } from '@/types';

const DB_NAME = 'LifeResetPlannerDB';
const DB_VERSION = 1;
const STORE_NAME = 'planner_data';

// Helper to open IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Fallback to localStorage if IndexedDB is blocked (e.g. private browsing in rare browser versions)
const LOCAL_STORAGE_PREFIX = 'lr_standalone_';

export const db = {
  async get<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const database = await openDB();
      return new Promise<T>((resolve) => {
        const tx = database.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);

        req.onsuccess = () => {
          if (req.result !== undefined && req.result !== null) {
            resolve(req.result);
          } else {
            // Check localStorage migration / fallback
            const local = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${key}`);
            if (local) {
              try {
                const parsed = JSON.parse(local);
                // Backfill to IndexedDB
                db.set(key, parsed).catch(() => {});
                resolve(parsed);
                return;
              } catch {}
            }
            resolve(defaultValue);
          }
        };

        req.onerror = () => {
          // Fallback to localStorage
          const local = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${key}`);
          resolve(local ? JSON.parse(local) : defaultValue);
        };
      });
    } catch {
      // LocalStorage fallback
      try {
        const local = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${key}`);
        return local ? JSON.parse(local) : defaultValue;
      } catch {
        return defaultValue;
      }
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    // Keep localStorage in sync as immediate synchronous mirror & resilience
    try {
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${key}`, JSON.stringify(value));
    } catch {}

    try {
      const database = await openDB();
      return new Promise<void>((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(value, key);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      // IndexedDB error caught, localStorage already written
    }
  },

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${key}`);
    } catch {}

    try {
      const database = await openDB();
      return new Promise<void>((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(key);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {}
  },

  async getAllKeys(): Promise<string[]> {
    try {
      const database = await openDB();
      return new Promise<string[]>((resolve) => {
        const tx = database.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAllKeys();

        req.onsuccess = () => resolve((req.result as string[]) || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  },

  async clear(): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        const keysToRemove: string[] = [];
        const len = localStorage.length || 0;
        for (let i = 0; i < len; i++) {
          const k = localStorage.key ? localStorage.key(i) : null;
          if (k && (k.startsWith(LOCAL_STORAGE_PREFIX) || k.startsWith('life_reset_'))) {
            keysToRemove.push(k);
          }
        }
        if (keysToRemove.length > 0) {
          keysToRemove.forEach(k => localStorage.removeItem(k));
        } else if (typeof localStorage.clear === 'function') {
          localStorage.clear();
        }
      }
    } catch {}

    try {
      const database = await openDB();
      return new Promise<void>((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {}
  },

  async getQueue(): Promise<QueuedMutation[]> {
    return db.get<QueuedMutation[]>('sync_mutation_queue', []);
  },

  async enqueueMutation(mutation: QueuedMutation): Promise<void> {
    const queue = await db.getQueue();
    // Coalesce updates if an upsert for the same table and payload.id exists
    const existingIdx = queue.findIndex(
      m => m.table === mutation.table && m.payload?.id && m.payload.id === mutation.payload?.id
    );
    if (existingIdx >= 0 && mutation.operation === 'UPSERT' && queue[existingIdx].operation === 'UPSERT') {
      queue[existingIdx] = mutation;
    } else {
      queue.push(mutation);
    }
    await db.set('sync_mutation_queue', queue);
  },

  async dequeueMutation(id: string): Promise<void> {
    const queue = await db.getQueue();
    const updated = queue.filter(m => m.id !== id);
    await db.set('sync_mutation_queue', updated);
  },

  async clearQueue(): Promise<void> {
    await db.set('sync_mutation_queue', []);
  },
};
