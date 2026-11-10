// ====================================================================
// LIFE RESET - Supabase Client & Persistence Layer
// ====================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-anon-key')
);

// Real client or mock-safe client
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : (createClient('https://mock-life-reset.supabase.co', 'mock-anon-key', {
      auth: { persistSession: false, autoRefreshToken: false },
    }));

// Local offline sync queue and storage helper
const STORAGE_PREFIX = 'life_reset_';

export const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn('Error reading from localStorage', e);
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn('Error saving to localStorage', e);
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch (e) {
      console.warn('Error removing from localStorage', e);
    }
  },
};

// Queue for offline mutations to replay when network returns
interface PendingMutation {
  id: string;
  table: string;
  action: 'insert' | 'update' | 'delete';
  payload: any;
  timestamp: number;
}

export const offlineQueue = {
  add(table: string, action: 'insert' | 'update' | 'delete', payload: any) {
    const queue = storage.get<PendingMutation[]>('offline_queue', []);
    queue.push({
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      table,
      action,
      payload,
      timestamp: Date.now(),
    });
    storage.set('offline_queue', queue);
  },

  getAll(): PendingMutation[] {
    return storage.get<PendingMutation[]>('offline_queue', []);
  },

  clear() {
    storage.set('offline_queue', []);
  },
};
