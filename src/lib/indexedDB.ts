// ====================================================================
// LIFE RESET - IndexedDB Storage Engine (Standalone Local Storage)
// ====================================================================

import { QueuedMutation, UserStash } from '@/types';

const DB_NAME = 'LifeResetPlannerDB';
const DB_VERSION = 1;
const STORE_NAME = 'planner_data';

export const PLANNER_COLLECTIONS = [
  'profile',
  'user_preferences',
  'tasks',
  'habits',
  'dopamine',
  'household_tasks',
  'brain_dumps',
  'goals',
  'projects',
  'habit_logs',
  'moods',
  'energies',
  'journals',
  'gratitudes',
  'focus_sessions',
  'calendar_events',
  'bills',
  'transactions',
  'savings',
  'debts',
  'life_admin',
  'follow_ups',
  'household_inv',
  'weekly_reviews',
  'monthly_reviews',
] as const;

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
    // Coalesce updates if an entry for the same table and payload.id exists
    const existingIdx = queue.findIndex(
      m => m.table === mutation.table && m.payload?.id && m.payload.id === mutation.payload?.id
    );
    if (existingIdx >= 0) {
      if (mutation.operation === 'UPSERT') {
        queue[existingIdx] = {
          ...mutation,
          id: queue[existingIdx].id, // preserve queue item ID
          retry_count: queue[existingIdx].retry_count || 0,
        };
      } else if (mutation.operation === 'DELETE') {
        queue[existingIdx] = mutation;
      }
    } else {
      queue.push(mutation);
    }
    await db.set('sync_mutation_queue', queue);
  },

  async updateMutation(mutation: QueuedMutation): Promise<void> {
    const queue = await db.getQueue();
    const idx = queue.findIndex(m => m.id === mutation.id);
    if (idx >= 0) {
      queue[idx] = mutation;
      await db.set('sync_mutation_queue', queue);
    }
  },

  async dequeueMutation(id: string): Promise<void> {
    const queue = await db.getQueue();
    const updated = queue.filter(m => m.id !== id);
    await db.set('sync_mutation_queue', updated);
  },

  async clearQueue(): Promise<void> {
    await db.set('sync_mutation_queue', []);
  },

  /**
   * Safely stashes a user's pending sync mutations and local records into a dedicated,
   * account-isolated stash slot before sign-out. This guarantees that offline changes
   * are never deleted or exposed to other accounts.
   */
  async stashUserData(userId: string): Promise<void> {
    if (!userId || userId === 'local_user') return;

    try {
      const queue = await db.getQueue();
      // Isolate mutations belonging to this user
      const userQueue = queue.filter(
        (m) => !m.payload?.user_id || m.payload.user_id === userId
      );

      // If there are no pending mutations, the user's data is already safely in Supabase.
      // Do not create a stale snapshot that could conflict with newer remote changes.
      if (userQueue.length === 0) {
        console.log(`[IndexedDB 🔒] No pending mutations to stash for user ${userId}; cloud data is up to date.`);
        return;
      }

      const collections: Record<string, any> = {};
      for (const col of PLANNER_COLLECTIONS) {
        const data = await db.get<any>(col, null);
        if (data) {
          if (Array.isArray(data)) {
            // Keep items created by or tagged with this user
            collections[col] = data.filter(
              (item: any) => !item.user_id || item.user_id === userId
            );
          } else if (typeof data === 'object') {
            if (data.id === userId || data.user_id === userId) {
              collections[col] = data;
            }
          }
        }
      }

      const existingStash = await db.get<UserStash | null>(`user_stash_${userId}`, null);
      let mergedQueue = userQueue;
      let mergedCollections = collections;

      if (existingStash) {
        // Merge queues preserving unique mutations
        const seenIds = new Set(userQueue.map((m) => m.id));
        const priorQueue = (existingStash.queue || []).filter((m) => !seenIds.has(m.id));
        mergedQueue = [...priorQueue, ...userQueue];

        // Merge collections
        mergedCollections = { ...existingStash.collections };
        for (const [col, items] of Object.entries(collections)) {
          if (Array.isArray(items)) {
            const priorItems = Array.isArray(mergedCollections[col]) ? mergedCollections[col] : [];
            const itemMap = new Map(priorItems.map((i: any) => [i.id, i]));
            for (const it of items) {
              itemMap.set(it.id, it);
            }
            mergedCollections[col] = Array.from(itemMap.values());
          } else {
            mergedCollections[col] = items;
          }
        }
      }

      const stash: UserStash = {
        userId,
        queue: mergedQueue,
        collections: mergedCollections,
        stashedAt: new Date().toISOString(),
      };

      await db.set(`user_stash_${userId}`, stash);
      console.log(`[IndexedDB 🔒] Successfully stashed ${mergedQueue.length} pending mutations and local collections for user ${userId}`);
    } catch (err) {
      console.error(`[IndexedDB ❌] Error while stashing data for user ${userId}:`, err);
    }
  },

  /**
   * Retrieves an account's stashed data if present.
   */
  async getUserStash(userId: string): Promise<UserStash | null> {
    if (!userId || userId === 'local_user') return null;
    return db.get<UserStash | null>(`user_stash_${userId}`, null);
  },

  /**
   * Restores an account's stashed pending mutations and local planner data upon sign-in.
   * Atomically removes the stash once restoration is complete.
   */
  async restoreUserStash(
    userId: string
  ): Promise<{ restoredQueueCount: number; restoredItemsCount: number }> {
    if (!userId || userId === 'local_user') {
      return { restoredQueueCount: 0, restoredItemsCount: 0 };
    }

    try {
      const stash = await db.get<UserStash | null>(`user_stash_${userId}`, null);
      if (!stash) {
        return { restoredQueueCount: 0, restoredItemsCount: 0 };
      }

      console.log(`[IndexedDB 🔓] Restoring stash for user ${userId} (${stash.queue?.length || 0} queued mutations)...`);
      let restoredQueueCount = 0;
      let restoredItemsCount = 0;

      // 1. Restore and coalesce queue
      if (stash.queue && stash.queue.length > 0) {
        const currentQueue = await db.getQueue();
        const queueMap = new Map(currentQueue.map((m) => [m.id, m]));
        for (const m of stash.queue) {
          if (!queueMap.has(m.id)) {
            queueMap.set(m.id, m);
            restoredQueueCount++;
          }
        }
        await db.set('sync_mutation_queue', Array.from(queueMap.values()));
      }

      // 2. Restore collections into active IndexedDB
      if (stash.collections) {
        for (const [col, items] of Object.entries(stash.collections)) {
          if (Array.isArray(items) && items.length > 0) {
            const currentItems = await db.get<any[]>(col, []);
            const itemMap = new Map(currentItems.map((i) => [i.id, i]));
            for (const it of items) {
              if (!itemMap.has(it.id)) {
                itemMap.set(it.id, it);
                restoredItemsCount++;
              }
            }
            await db.set(col, Array.from(itemMap.values()));
          } else if (items && typeof items === 'object') {
            await db.set(col, items);
            restoredItemsCount++;
          }
        }
      }

      // 3. Clear stash now that it has been safely restored
      await db.remove(`user_stash_${userId}`);
      console.log(`[IndexedDB ✅] Restored ${restoredQueueCount} queue mutations and ${restoredItemsCount} items for user ${userId}`);

      return { restoredQueueCount, restoredItemsCount };
    } catch (err) {
      console.error(`[IndexedDB ❌] Error while restoring stash for user ${userId}:`, err);
      return { restoredQueueCount: 0, restoredItemsCount: 0 };
    }
  },

  /**
   * Clears active working session data from IndexedDB and localStorage,
   * while PRESERVING user stashes (`user_stash_*`) so offline data is never deleted.
   */
  async clearActiveSession(): Promise<void> {
    try {
      const keys = await db.getAllKeys();
      for (const k of keys) {
        if (!k.startsWith('user_stash_')) {
          await db.remove(k);
        }
      }
    } catch (err) {
      console.warn('[IndexedDB] clearActiveSession indexeddb error:', err);
    }

    try {
      if (typeof localStorage !== 'undefined') {
        const toRemove: string[] = [];
        const len = localStorage.length || 0;
        for (let i = 0; i < len; i++) {
          const k = localStorage.key ? localStorage.key(i) : null;
          if (k && (k.startsWith(LOCAL_STORAGE_PREFIX) || k.startsWith('life_reset_'))) {
            if (!k.includes('user_stash_')) {
              toRemove.push(k);
            }
          }
        }
        toRemove.forEach((k) => localStorage.removeItem(k));
      }
    } catch (err) {
      console.warn('[IndexedDB] clearActiveSession localStorage error:', err);
    }
  },
};
