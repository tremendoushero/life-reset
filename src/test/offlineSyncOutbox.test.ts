import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '@/lib/indexedDB';
import { syncEngine, ensureUUID } from '@/lib/syncEngine';
import { Task } from '@/types';
import { supabase, setIsSupabaseConfigured } from '@/lib/supabase';

describe('Offline-to-Online Synchronization & Outbox Resilience', () => {
  let cloudDb: {
    tasks: Map<string, any>;
  };
  const testUserId = '55555555-5555-4555-8555-555555555555';

  beforeEach(async () => {
    setIsSupabaseConfigured(true);
    await db.clear();
    await db.clearQueue();
    syncEngine.setUserId(null);

    cloudDb = {
      tasks: new Map(),
    };
  });

  afterEach(async () => {
    syncEngine.setUserId(null);
    setIsSupabaseConfigured(false);
    await db.clearQueue();
    vi.restoreAllMocks();
  });

  const setupSupabaseMock = (opts?: { failUpsertCount?: number }) => {
    let upsertFailuresRemaining = opts?.failUpsertCount || 0;

    return vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      return {
        upsert: vi.fn().mockImplementation((payload) => {
          if (upsertFailuresRemaining > 0) {
            upsertFailuresRemaining--;
            return Promise.reject(new Error('Network error: connection refused'));
          }
          if (table === 'tasks') {
            cloudDb.tasks.set(payload.id, payload);
          }
          return Promise.resolve({ data: payload, error: null });
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation((col: string, val: string) => {
            if (table === 'tasks') {
              const userTasks = Array.from(cloudDb.tasks.values()).filter((t) => t.user_id === val);
              return Promise.resolve({ data: userTasks, error: null });
            }
            return Promise.resolve({ data: [], error: null });
          }),
        }),
      } as any;
    });
  };

  it('1. Offline creation: enqueues task in outbox with authenticated user_id while preserving local data', async () => {
    setupSupabaseMock();
    syncEngine.setUserId(testUserId);
    syncEngine.handleNetworkChange(false);
    expect(syncEngine.getSyncState().status).toBe('offline');

    const offlineTask: Task = {
      id: ensureUUID(),
      user_id: testUserId,
      title: 'Finish offline presentation slides',
      category: 'work',
      priority: 'essential',
      estimated_duration: 45,
      status: 'not_started',
      energy_requirement: 'high',
      recurrence: 'none',
      is_top_three: true,
      postponed_count: 0,
      created_at: new Date().toISOString(),
      subtasks: [],
    };

    // Save to local IndexedDB and dispatch mutation
    await db.set('tasks', [offlineTask]);
    await syncEngine.dispatchMutation('tasks', 'UPSERT', offlineTask, testUserId);

    // Verify local IndexedDB preserves the task
    const localTasks = await db.get<Task[]>('tasks', []);
    expect(localTasks).toHaveLength(1);
    expect(localTasks[0].title).toBe('Finish offline presentation slides');

    // Verify task is queued in outbox with proper user_id
    const queue = await db.getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].payload.id).toBe(offlineTask.id);
    expect(queue[0].payload.user_id).toBe(testUserId);
    expect(queue[0].operation).toBe('UPSERT');

    // Verify it has NOT reached cloud yet
    expect(cloudDb.tasks.has(offlineTask.id)).toBe(false);
  });

  it('2. Automatic reconnection: triggers outbox flush and uploads pending tasks to cloud', async () => {
    setupSupabaseMock();
    syncEngine.setUserId(testUserId);
    syncEngine.handleNetworkChange(false);

    const offlineTask: Task = {
      id: ensureUUID(),
      user_id: testUserId,
      title: 'Subway brainstorm item',
      category: 'mind',
      priority: 'important',
      estimated_duration: 15,
      status: 'not_started',
      energy_requirement: 'medium',
      recurrence: 'none',
      is_top_three: false,
      postponed_count: 0,
      created_at: new Date().toISOString(),
      subtasks: [],
    };

    await db.set('tasks', [offlineTask]);
    await syncEngine.dispatchMutation('tasks', 'UPSERT', offlineTask, testUserId);

    expect(cloudDb.tasks.has(offlineTask.id)).toBe(false);

    // Reconnection triggers automatic flush and pull
    await syncEngine.handleNetworkChange(true);

    // Cloud now has the uploaded task
    expect(cloudDb.tasks.has(offlineTask.id)).toBe(true);
    expect(cloudDb.tasks.get(offlineTask.id).title).toBe('Subway brainstorm item');
    expect(cloudDb.tasks.get(offlineTask.id).user_id).toBe(testUserId);

    // Outbox is drained
    const queueAfter = await db.getQueue();
    expect(queueAfter).toHaveLength(0);
    expect(syncEngine.getSyncState().pendingCount).toBe(0);
  });

  it('3. Duplicate prevention: repeated flushes and retries are idempotent and do not duplicate records', async () => {
    setupSupabaseMock();
    syncEngine.setUserId(testUserId);

    const task: Task = {
      id: ensureUUID(),
      user_id: testUserId,
      title: 'Idempotency verification task',
      category: 'finance',
      priority: 'essential',
      estimated_duration: 10,
      status: 'not_started',
      energy_requirement: 'low',
      recurrence: 'none',
      is_top_three: false,
      postponed_count: 0,
      created_at: new Date().toISOString(),
      subtasks: [],
    };

    // Offline enqueue
    syncEngine.handleNetworkChange(false);
    await syncEngine.dispatchMutation('tasks', 'UPSERT', task, testUserId);

    // Turn online and flush once
    syncEngine.handleNetworkChange(true);
    await syncEngine.flushQueue(testUserId);

    expect(cloudDb.tasks.size).toBe(1);

    // Even if another flush is triggered or mutation is sent again with the same UUID
    await syncEngine.dispatchMutation('tasks', 'UPSERT', task, testUserId);
    await syncEngine.flushQueue(testUserId);

    // Exact same UUID: no duplicates created in cloud
    expect(cloudDb.tasks.size).toBe(1);
    expect(cloudDb.tasks.get(task.id).title).toBe('Idempotency verification task');
  });

  it('4. Failure recovery: retains outbox queue and local data on network failure and retries safely', async () => {
    // Supabase will fail the first 2 upsert attempts
    setupSupabaseMock({ failUpsertCount: 2 });
    syncEngine.setUserId(testUserId);
    syncEngine.handleNetworkChange(false);

    const failingTask: Task = {
      id: ensureUUID(),
      user_id: testUserId,
      title: 'Must not be lost during server crash',
      category: 'wellness',
      priority: 'essential',
      estimated_duration: 20,
      status: 'not_started',
      energy_requirement: 'low',
      recurrence: 'none',
      is_top_three: false,
      postponed_count: 0,
      created_at: new Date().toISOString(),
      subtasks: [],
    };

    await db.set('tasks', [failingTask]);
    await syncEngine.dispatchMutation('tasks', 'UPSERT', failingTask, testUserId);

    // Attempt flush (attempt 1 fails)
    syncEngine.handleNetworkChange(false); // set state
    (syncEngine as any).state.status = 'syncing'; // simulate network attempt
    const flushedCount1 = await syncEngine.flushQueue(testUserId);
    expect(flushedCount1).toBe(0);

    // Local IndexedDB task is completely intact
    const localTasks = await db.get<Task[]>('tasks', []);
    expect(localTasks).toHaveLength(1);
    expect(localTasks[0].title).toBe('Must not be lost during server crash');

    // Outbox queue retained the item with incremented retry count and recorded error
    const queue = await db.getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].retry_count).toBe(1);
    expect(queue[0].last_error).toContain('Network error');

    // Next retry after server recovers (attempt 2 fails, attempt 3 succeeds)
    await syncEngine.flushQueue(testUserId); // attempt 2 fails
    const queue2 = await db.getQueue();
    expect(queue2[0].retry_count).toBe(2);

    // 3rd attempt succeeds!
    const flushedCount3 = await syncEngine.flushQueue(testUserId);
    expect(flushedCount3).toBe(1);

    // Cloud now has the task, queue is empty, and local task is preserved
    expect(cloudDb.tasks.has(failingTask.id)).toBe(true);
    const queueFinal = await db.getQueue();
    expect(queueFinal).toHaveLength(0);
  });

  it('5. Cross-device propagation: phone uploads offline task, laptop pulls and displays it', async () => {
    setupSupabaseMock();

    // Phone creates task while offline
    syncEngine.setUserId(testUserId);
    syncEngine.handleNetworkChange(false);

    const phoneTask: Task = {
      id: ensureUUID(),
      user_id: testUserId,
      title: 'Created on Phone Offline and Synced to Laptop',
      category: 'personal',
      priority: 'essential',
      estimated_duration: 30,
      status: 'not_started',
      energy_requirement: 'medium',
      recurrence: 'none',
      is_top_three: true,
      postponed_count: 0,
      created_at: new Date().toISOString(),
      subtasks: [],
    };

    await syncEngine.dispatchMutation('tasks', 'UPSERT', phoneTask, testUserId);

    // Phone reconnects
    await syncEngine.handleNetworkChange(true);
    expect(cloudDb.tasks.has(phoneTask.id)).toBe(true);

    // --- LAPTOP SESSION ---
    // Laptop clears local state and logs into the same account
    await db.clear();
    syncEngine.setUserId(null);
    syncEngine.setUserId(testUserId);

    let laptopUpdatedCollections: any = null;
    const unsub = syncEngine.onRemoteData((data) => {
      laptopUpdatedCollections = data;
    });

    // Laptop pulls remote data
    const pulledData = await syncEngine.pullRemoteData(testUserId);
    expect(pulledData?.tasks).toBeDefined();
    expect(pulledData?.tasks.some((t) => t.id === phoneTask.id)).toBe(true);

    // Laptop IndexedDB now contains the phone task
    const laptopTasks = await db.get<Task[]>('tasks', []);
    expect(laptopTasks.some((t) => t.title === 'Created on Phone Offline and Synced to Laptop')).toBe(true);
    expect(laptopUpdatedCollections?.tasks.some((t: any) => t.id === phoneTask.id)).toBe(true);

    unsub();
  });
});

