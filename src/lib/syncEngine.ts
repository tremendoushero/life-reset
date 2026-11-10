// ====================================================================
// LIFE RESET - Offline-First Sync & Mutation Queue Engine
// Handles bidirectional Supabase synchronization, offline queueing,
// auto-reconnect flushes, and seamless guest-to-account data migration.
// ====================================================================

import { supabase, isSupabaseConfigured } from './supabase';
import { db } from './indexedDB';
import { QueuedMutation, CloudSyncState, SyncStatus } from '@/types';

type SyncListener = (state: CloudSyncState) => void;

// Helper to ensure valid UUID for PostgreSQL
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function ensureUUID(id?: string): string {
  if (id && UUID_REGEX.test(id)) {
    return id;
  }
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback RFC-4122 v4 UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

class SyncEngine {
  private listeners: Set<SyncListener> = new Set();
  private isFlushing = false;
  private currentUserId: string | null = null;
  private state: CloudSyncState = {
    status: 'local_only',
    lastSyncedAt: null,
    pendingCount: 0,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
      // Re-check queue count on startup
      this.updatePendingCount();
    }
  }

  public setUserId(userId: string | null) {
    this.currentUserId = userId;
    if (!userId || userId === 'local_user') {
      this.updateState({ status: 'local_only' });
    } else {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        this.updateState({ status: 'offline' });
      } else {
        this.updateState({ status: 'synced' });
        // Attempt flush whenever user is set
        this.flushQueue(userId);
      }
    }
  }

  public getSyncState(): CloudSyncState {
    return { ...this.state };
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getSyncState());
    return () => this.listeners.delete(listener);
  }

  private updateState(updates: Partial<CloudSyncState>) {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach((l) => l(this.getSyncState()));
  }

  private async updatePendingCount() {
    try {
      const queue = await db.getQueue();
      this.updateState({ pendingCount: queue.length });
    } catch {
      // Ignored
    }
  }

  private async handleNetworkChange(isOnline: boolean) {
    if (!isOnline) {
      this.updateState({
        status: this.currentUserId && this.currentUserId !== 'local_user' ? 'offline' : 'local_only',
      });
      return;
    }

    if (this.currentUserId && this.currentUserId !== 'local_user') {
      this.updateState({ status: 'syncing' });
      await this.flushQueue(this.currentUserId);
    }
  }

  /**
   * Dispatch a mutation from any data action.
   * If online and authenticated, attempts immediate Supabase push.
   * If offline or fails, enqueues to IndexedDB for automatic background flush.
   */
  public async dispatchMutation(
    table: string,
    operation: 'UPSERT' | 'DELETE',
    payload: any,
    userId?: string
  ): Promise<void> {
    const activeUserId = userId || this.currentUserId;

    // If in guest mode, we do not sync to remote
    if (!activeUserId || activeUserId === 'local_user') {
      return;
    }

    const online = typeof navigator !== 'undefined' ? navigator.onLine : true;

    // Clean payload and ensure user_id
    const sanitizedPayload = { ...payload, user_id: activeUserId };
    if (sanitizedPayload.id) {
      sanitizedPayload.id = ensureUUID(sanitizedPayload.id);
    }

    // If online and Supabase is configured, attempt direct remote write
    if (online && isSupabaseConfigured) {
      try {
        if (operation === 'UPSERT') {
          // Do not send subtasks embedded array to tasks table directly
          const { subtasks, milestones, ...rowPayload } = sanitizedPayload;
          const { error } = await supabase.from(table).upsert(rowPayload);
          if (error) throw error;
        } else if (operation === 'DELETE') {
          const { error } = await supabase.from(table).delete().eq('id', sanitizedPayload.id).eq('user_id', activeUserId);
          if (error) throw error;
        }

        this.updateState({
          status: 'synced',
          lastSyncedAt: new Date().toISOString(),
        });
        return;
      } catch (err) {
        console.warn(`Direct sync failed for ${table}, enqueueing offline mutation:`, err);
      }
    }

    // Enqueue offline mutation in IndexedDB
    const mutation: QueuedMutation = {
      id: ensureUUID(),
      table,
      operation,
      payload: sanitizedPayload,
      timestamp: new Date().toISOString(),
      retry_count: 0,
    };

    await db.enqueueMutation(mutation);
    await this.updatePendingCount();

    this.updateState({
      status: online ? 'queued' : 'offline',
    });
  }

  /**
   * Flush all queued mutations to Supabase in FIFO order.
   */
  public async flushQueue(userId: string): Promise<number> {
    if (this.isFlushing || !isSupabaseConfigured) return 0;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return 0;

    this.isFlushing = true;
    this.updateState({ status: 'syncing' });

    let flushedCount = 0;
    try {
      const queue = await db.getQueue();
      if (queue.length === 0) {
        this.updateState({
          status: 'synced',
          pendingCount: 0,
          lastSyncedAt: new Date().toISOString(),
        });
        this.isFlushing = false;
        return 0;
      }

      for (const mutation of queue) {
        try {
          const { table, operation, payload } = mutation;
          const mutationPayload = { ...payload, user_id: userId };

          if (operation === 'UPSERT') {
            const { subtasks, milestones, ...rowPayload } = mutationPayload;
            const { error } = await supabase.from(table).upsert(rowPayload);
            if (error) throw error;
          } else if (operation === 'DELETE') {
            const { error } = await supabase
              .from(table)
              .delete()
              .eq('id', mutationPayload.id)
              .eq('user_id', userId);
            if (error) throw error;
          }

          // Successfully processed mutation
          await db.dequeueMutation(mutation.id);
          flushedCount++;
        } catch (itemError) {
          console.error(`Failed to flush queued mutation ${mutation.id}:`, itemError);
          // Stop queue execution on connection error to preserve order
          break;
        }
      }

      const remaining = await db.getQueue();
      this.updateState({
        status: remaining.length === 0 ? 'synced' : 'queued',
        pendingCount: remaining.length,
        lastSyncedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error during queue flush:', err);
      this.updateState({ status: 'error' });
    } finally {
      this.isFlushing = false;
    }

    return flushedCount;
  }

  /**
   * Migrate all local guest data (user_id === 'local_user') to the authenticated account.
   * Guarantees zero data loss when customer signs up.
   */
  public async migrateGuestData(newUserId: string): Promise<{ migratedCount: number }> {
    let totalMigrated = 0;

    const collections = [
      { key: 'tasks', table: 'tasks' },
      { key: 'brain_dumps', table: 'brain_dump_entries' },
      { key: 'goals', table: 'goals' },
      { key: 'projects', table: 'projects' },
      { key: 'habits', table: 'habits' },
      { key: 'habit_logs', table: 'habit_logs' },
      { key: 'moods', table: 'mood_entries' },
      { key: 'energies', table: 'energy_entries' },
      { key: 'journals', table: 'journal_entries' },
      { key: 'gratitudes', table: 'gratitude_entries' },
      { key: 'dopamine', table: 'dopamine_activities' },
      { key: 'focus_sessions', table: 'focus_sessions' },
      { key: 'calendar_events', table: 'calendar_events' },
      { key: 'bills', table: 'bills' },
      { key: 'transactions', table: 'transactions' },
      { key: 'savings', table: 'savings_goals' },
      { key: 'debts', table: 'debts' },
      { key: 'life_admin', table: 'life_admin_items' },
      { key: 'follow_ups', table: 'follow_up_items' },
      { key: 'household_tasks', table: 'household_tasks' },
      { key: 'household_inv', table: 'household_inventory' },
      { key: 'weekly_reviews', table: 'weekly_reviews' },
      { key: 'monthly_reviews', table: 'monthly_reviews' },
    ];

    try {
      this.updateState({ status: 'syncing' });

      for (const col of collections) {
        const items = await db.get<any[]>(col.key, []);
        if (!Array.isArray(items) || items.length === 0) continue;

        let modified = false;
        const updatedItems = items.map((item) => {
          if (!item.user_id || item.user_id === 'local_user') {
            modified = true;
            totalMigrated++;
            const sanitizedId = ensureUUID(item.id);
            return {
              ...item,
              id: sanitizedId,
              user_id: newUserId,
            };
          }
          return item;
        });

        if (modified) {
          // 1. Update local storage with new user_id and valid UUIDs
          await db.set(col.key, updatedItems);

          // 2. Queue for cloud push or push directly
          for (const item of updatedItems) {
            await this.dispatchMutation(col.table, 'UPSERT', item, newUserId);
          }
        }
      }

      // Also migrate user profile and preferences
      const profile = await db.get<any>('profile', null);
      if (profile && (profile.id === 'local_user' || !profile.id)) {
        const updatedProfile = { ...profile, id: newUserId };
        await db.set('profile', updatedProfile);
        await this.dispatchMutation('profiles', 'UPSERT', updatedProfile, newUserId);
      }

      const prefs = await db.get<any>('user_preferences', null);
      if (prefs) {
        const updatedPrefs = { ...prefs, user_id: newUserId };
        await db.set('user_preferences', updatedPrefs);
        await this.dispatchMutation('user_preferences', 'UPSERT', updatedPrefs, newUserId);
      }

      // Flush queue
      await this.flushQueue(newUserId);
    } catch (err) {
      console.error('Error during guest data migration:', err);
    }

    return { migratedCount: totalMigrated };
  }

  /**
   * Pulls remote data from Supabase and merges with local data.
   */
  public async pullRemoteData(userId: string): Promise<Record<string, any[]> | null> {
    if (!isSupabaseConfigured || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return null;
    }

    try {
      this.updateState({ status: 'syncing' });

      const [
        tasksRes,
        brainDumpsRes,
        goalsRes,
        projectsRes,
        habitsRes,
        habitLogsRes,
        moodsRes,
        energiesRes,
        journalsRes,
        gratitudesRes,
        dopamineRes,
        focusRes,
        calendarRes,
        billsRes,
        txRes,
        savingsRes,
        debtsRes,
        adminRes,
        followUpsRes,
        householdRes,
        invRes,
        wRevRes,
        mRevRes,
      ] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', userId),
        supabase.from('brain_dump_entries').select('*').eq('user_id', userId),
        supabase.from('goals').select('*').eq('user_id', userId),
        supabase.from('projects').select('*').eq('user_id', userId),
        supabase.from('habits').select('*').eq('user_id', userId),
        supabase.from('habit_logs').select('*').eq('user_id', userId),
        supabase.from('mood_entries').select('*').eq('user_id', userId),
        supabase.from('energy_entries').select('*').eq('user_id', userId),
        supabase.from('journal_entries').select('*').eq('user_id', userId),
        supabase.from('gratitude_entries').select('*').eq('user_id', userId),
        supabase.from('dopamine_activities').select('*').eq('user_id', userId),
        supabase.from('focus_sessions').select('*').eq('user_id', userId),
        supabase.from('calendar_events').select('*').eq('user_id', userId),
        supabase.from('bills').select('*').eq('user_id', userId),
        supabase.from('transactions').select('*').eq('user_id', userId),
        supabase.from('savings_goals').select('*').eq('user_id', userId),
        supabase.from('debts').select('*').eq('user_id', userId),
        supabase.from('life_admin_items').select('*').eq('user_id', userId),
        supabase.from('follow_ups').select('*').eq('user_id', userId),
        supabase.from('household_tasks').select('*').eq('user_id', userId),
        supabase.from('household_inventory').select('*').eq('user_id', userId),
        supabase.from('weekly_reviews').select('*').eq('user_id', userId),
        supabase.from('monthly_reviews').select('*').eq('user_id', userId),
      ]);

      const mergeCollection = async (key: string, remoteItems: any[] | null) => {
        const local = await db.get<any[]>(key, []);
        if (!remoteItems || remoteItems.length === 0) return local;

        const map = new Map<string, any>();
        // Add remote items first
        remoteItems.forEach((r) => map.set(r.id, r));
        // Add or overwrite with local if local was updated more recently
        local.forEach((l) => {
          const r = map.get(l.id);
          if (!r) {
            map.set(l.id, l);
          } else {
            const localUpdated = new Date(l.updated_at || l.created_at || 0).getTime();
            const remoteUpdated = new Date(r.updated_at || r.created_at || 0).getTime();
            if (localUpdated >= remoteUpdated) {
              map.set(l.id, l);
            }
          }
        });

        const merged = Array.from(map.values());
        await db.set(key, merged);
        return merged;
      };

      const result = {
        tasks: await mergeCollection('tasks', tasksRes.data),
        brainDumps: await mergeCollection('brain_dumps', brainDumpsRes.data),
        goals: await mergeCollection('goals', goalsRes.data),
        projects: await mergeCollection('projects', projectsRes.data),
        habits: await mergeCollection('habits', habitsRes.data),
        habitLogs: await mergeCollection('habit_logs', habitLogsRes.data),
        moods: await mergeCollection('moods', moodsRes.data),
        energies: await mergeCollection('energies', energiesRes.data),
        journals: await mergeCollection('journals', journalsRes.data),
        gratitudes: await mergeCollection('gratitudes', gratitudesRes.data),
        dopamine: await mergeCollection('dopamine', dopamineRes.data),
        focusSessions: await mergeCollection('focus_sessions', focusRes.data),
        calendarEvents: await mergeCollection('calendar_events', calendarRes.data),
        bills: await mergeCollection('bills', billsRes.data),
        transactions: await mergeCollection('transactions', txRes.data),
        savings: await mergeCollection('savings', savingsRes.data),
        debts: await mergeCollection('debts', debtsRes.data),
        lifeAdmin: await mergeCollection('life_admin', adminRes.data),
        followUps: await mergeCollection('follow_ups', followUpsRes.data),
        householdTasks: await mergeCollection('household_tasks', householdRes.data),
        householdInv: await mergeCollection('household_inv', invRes.data),
        weeklyReviews: await mergeCollection('weekly_reviews', wRevRes.data),
        monthlyReviews: await mergeCollection('monthly_reviews', mRevRes.data),
      };

      this.updateState({
        status: 'synced',
        lastSyncedAt: new Date().toISOString(),
      });

      return result;
    } catch (err) {
      console.error('Error pulling remote data:', err);
      this.updateState({ status: 'error' });
      return null;
    }
  }
}

export const syncEngine = new SyncEngine();

