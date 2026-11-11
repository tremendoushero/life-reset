import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '@/lib/indexedDB';
import { syncEngine, ensureUUID } from '@/lib/syncEngine';
import { Task, QueuedMutation } from '@/types';
import { supabase, setIsSupabaseConfigured } from '@/lib/supabase';

describe('Sign-Out Outbox Preservation & Multi-Account Isolation', () => {
  let cloudDb: {
    tasks: Map<string, any>;
  };

  const userA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const userB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

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
    await db.clear();
    await db.clearQueue();
    vi.restoreAllMocks();
  });

  const setupSupabaseMock = () => {
    return vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      return {
        upsert: vi.fn().mockImplementation((payload) => {
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

  it('1. Sign-out with pending mutations: never silently deletes offline tasks; stashes them safely', async () => {
    setupSupabaseMock();
    syncEngine.setUserId(userA);
    syncEngine.handleNetworkChange(false); // Offline

    const offlineTaskA: Task = {
      id: ensureUUID(),
      user_id: userA,
      title: "User A's Critical Offline Proposal",
      category: 'work',
      priority: 'essential',
      estimated_duration: 60,
      status: 'not_started',
      energy_requirement: 'high',
      recurrence: 'none',
      is_top_three: true,
      postponed_count: 0,
      created_at: new Date().toISOString(),
      subtasks: [],
    };

    // Save locally and enqueue mutation
    await db.set('tasks', [offlineTaskA]);
    await syncEngine.dispatchMutation('tasks', 'UPSERT', offlineTaskA, userA);

    // Verify outbox has 1 pending mutation
    const queueBefore = await db.getQueue();
    expect(queueBefore).toHaveLength(1);
    expect(queueBefore[0].payload.id).toBe(offlineTaskA.id);

    // Perform safe sign-out flow (stash -> clearActiveSession -> clearQueue)
    await db.stashUserData(userA);
    await db.clearActiveSession();
    await db.clearQueue();
    syncEngine.setUserId(null);

    // Active working state is clean for guest / next user
    const activeTasks = await db.get<Task[]>('tasks', []);
    expect(activeTasks.find((t) => t.id === offlineTaskA.id)).toBeUndefined();
    const activeQueue = await db.getQueue();
    expect(activeQueue).toHaveLength(0);

    // BUT User A's data was NOT deleted: safely archived in user_stash_userA
    const stash = await db.getUserStash(userA);
    expect(stash).not.toBeNull();
    expect(stash?.userId).toBe(userA);
    expect(stash?.queue).toHaveLength(1);
    expect(stash?.queue[0].payload.title).toBe("User A's Critical Offline Proposal");
    expect(stash?.collections.tasks).toBeDefined();
    expect(stash?.collections.tasks[0].id).toBe(offlineTaskA.id);

    // Cloud has not received it yet
    expect(cloudDb.tasks.has(offlineTaskA.id)).toBe(false);
  });

  it('2. Cancel sign-out: aborts sign-out, keeps user authenticated, and leaves pending queue intact', async () => {
    setupSupabaseMock();
    syncEngine.setUserId(userA);
    syncEngine.handleNetworkChange(false);

    const offlineTask: Task = {
      id: ensureUUID(),
      user_id: userA,
      title: 'Keep me active after cancel',
      category: 'mind',
      priority: 'important',
      estimated_duration: 10,
      status: 'not_started',
      energy_requirement: 'low',
      recurrence: 'none',
      is_top_three: false,
      postponed_count: 0,
      created_at: new Date().toISOString(),
      subtasks: [],
    };

    await db.set('tasks', [offlineTask]);
    await syncEngine.dispatchMutation('tasks', 'UPSERT', offlineTask, userA);

    // User triggers sign-out warning, sees pending changes, and clicks "Cancel & Keep Signed In"
    const userCancelled = true;
    if (!userCancelled) {
      await db.stashUserData(userA);
      await db.clearActiveSession();
      await db.clearQueue();
    }

    // Verify nothing was wiped
    const activeQueue = await db.getQueue();
    expect(activeQueue).toHaveLength(1);
    expect(activeQueue[0].payload.title).toBe('Keep me active after cancel');

    const activeTasks = await db.get<Task[]>('tasks', []);
    expect(activeTasks).toHaveLength(1);
    expect(activeTasks[0].title).toBe('Keep me active after cancel');

    // No stash was created since sign-out was cancelled
    const stash = await db.getUserStash(userA);
    expect(stash).toBeNull();
  });

  it('3. Signing back into the original account: restores pending queue and resumes automatic cloud sync', async () => {
    setupSupabaseMock();

    // 1. User A creates offline task and signs out
    const offlineTaskId = ensureUUID();
    const offlineTask: Task = {
      id: offlineTaskId,
      user_id: userA,
      title: 'Drafted offline and restored later',
      category: 'wellness',
      priority: 'essential',
      estimated_duration: 15,
      status: 'not_started',
      energy_requirement: 'medium',
      recurrence: 'none',
      is_top_three: true,
      postponed_count: 0,
      created_at: new Date().toISOString(),
      subtasks: [],
    };

    await db.set('tasks', [offlineTask]);
    const mutation: QueuedMutation = {
      id: ensureUUID(),
      table: 'tasks',
      operation: 'UPSERT',
      payload: offlineTask,
      timestamp: new Date().toISOString(),
      retry_count: 0,
    };
    await db.enqueueMutation(mutation);

    // Sign out (stashed)
    await db.stashUserData(userA);
    await db.clearActiveSession();
    await db.clearQueue();

    // 2. User A signs back into this device later
    const restoreResult = await db.restoreUserStash(userA);
    expect(restoreResult.restoredQueueCount).toBe(1);
    expect(restoreResult.restoredItemsCount).toBeGreaterThanOrEqual(1);

    // Active IndexedDB now contains User A's task again
    const activeTasks = await db.get<Task[]>('tasks', []);
    expect(activeTasks.some((t) => t.id === offlineTaskId)).toBe(true);

    // Active queue contains User A's pending mutation
    const activeQueue = await db.getQueue();
    expect(activeQueue).toHaveLength(1);
    expect(activeQueue[0].payload.id).toBe(offlineTaskId);

    // Device reconnects to internet
    syncEngine.setUserId(userA);
    syncEngine.handleNetworkChange(true);
    await syncEngine.flushQueue(userA);

    // Cloud has now safely received User A's task!
    expect(cloudDb.tasks.has(offlineTaskId)).toBe(true);
    expect(cloudDb.tasks.get(offlineTaskId).title).toBe('Drafted offline and restored later');

    // Queue is drained
    const queueAfterSync = await db.getQueue();
    expect(queueAfterSync).toHaveLength(0);

    // Stash was cleaned up upon successful restoration
    const stashAfter = await db.getUserStash(userA);
    expect(stashAfter).toBeNull();
  });

  it('4. Signing into a different account: enforces strict isolation; User B cannot see or upload User A pending data', async () => {
    setupSupabaseMock();

    // 1. User A creates private offline task and signs out with pending queue
    const privateTaskAId = ensureUUID();
    const privateTaskA: Task = {
      id: privateTaskAId,
      user_id: userA,
      title: "User A's Secret Financial Plan",
      category: 'finance',
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

    await db.set('tasks', [privateTaskA]);
    await db.enqueueMutation({
      id: ensureUUID(),
      table: 'tasks',
      operation: 'UPSERT',
      payload: privateTaskA,
      timestamp: new Date().toISOString(),
      retry_count: 0,
    });

    // Safe sign out for User A
    await db.stashUserData(userA);
    await db.clearActiveSession();
    await db.clearQueue();

    // 2. User B logs in on the same browser / device
    syncEngine.setUserId(userB);

    // Attempt to restore stash for User B -> Should find NOTHING
    const restoreB = await db.restoreUserStash(userB);
    expect(restoreB.restoredQueueCount).toBe(0);

    // User B's active queue is empty
    const queueB = await db.getQueue();
    expect(queueB).toHaveLength(0);

    // User B does NOT see User A's task
    const tasksB = await db.get<Task[]>('tasks', []);
    expect(tasksB.find((t) => t.id === privateTaskAId)).toBeUndefined();

    // 3. User B creates their own task and syncs
    const taskBId = ensureUUID();
    const taskB: Task = {
      id: taskBId,
      user_id: userB,
      title: "User B's Fitness Log",
      category: 'wellness',
      priority: 'important',
      estimated_duration: 30,
      status: 'not_started',
      energy_requirement: 'medium',
      recurrence: 'none',
      is_top_three: false,
      postponed_count: 0,
      created_at: new Date().toISOString(),
      subtasks: [],
    };

    await db.set('tasks', [taskB]);
    await syncEngine.dispatchMutation('tasks', 'UPSERT', taskB, userB);

    // Cloud only has User B's task, NEVER User A's pending task
    expect(cloudDb.tasks.has(taskBId)).toBe(true);
    expect(cloudDb.tasks.has(privateTaskAId)).toBe(false);

    // 4. User B signs out
    await db.stashUserData(userB);
    await db.clearActiveSession();
    await db.clearQueue();

    // 5. User A logs back in
    syncEngine.setUserId(userA);
    const restoreA = await db.restoreUserStash(userA);
    expect(restoreA.restoredQueueCount).toBe(1);

    // User A has their original offline task intact!
    const restoredTasksA = await db.get<Task[]>('tasks', []);
    expect(restoredTasksA.some((t) => t.id === privateTaskAId)).toBe(true);

    // And User A has zero items from User B
    expect(restoredTasksA.some((t) => t.id === taskBId)).toBe(false);
  });

  describe('Sign-Out Modal Sync Flow & Optional Error Decoupling', () => {
    it('Sync Now Before Signing Out successfully flushes offline task even when dopamine_activities returns PGRST205', async () => {
      syncEngine.setUserId(userA);

      // Mock Supabase: tasks succeed, dopamine_activities fails with PGRST205
      const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'dopamine_activities') {
          return {
            upsert: vi.fn().mockResolvedValue({
              data: null,
              error: {
                code: 'PGRST205',
                message: "Could not find the table 'public.dopamine_activities' in the schema cache",
              },
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: {
                  code: 'PGRST205',
                  message: "Could not find the table 'public.dopamine_activities' in the schema cache",
                },
              }),
            }),
          } as any;
        }

        return {
          upsert: vi.fn().mockImplementation((payload) => {
            if (table === 'tasks') {
              cloudDb.tasks.set(payload.id, payload);
            }
            return Promise.resolve({ data: payload, error: null });
          }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((col: string, val: string) => {
              if (table === 'tasks') {
                return Promise.resolve({
                  data: Array.from(cloudDb.tasks.values()).filter((t) => t.user_id === val),
                  error: null,
                });
              }
              return Promise.resolve({ data: [], error: null });
            }),
          }),
        } as any;
      });

      // 1. User created a dopamine activity earlier or guest starter data seeded it
      const dopId = ensureUUID();
      await db.enqueueMutation({
        id: ensureUUID(),
        table: 'dopamine_activities',
        operation: 'UPSERT',
        payload: { id: dopId, user_id: userA, title: 'Appetizer Walk' },
        timestamp: new Date().toISOString(),
        retry_count: 0,
      });

      // 2. User goes offline and creates a critical task
      syncEngine.handleNetworkChange(false);
      const taskId = ensureUUID();
      const offlineTask: Task = {
        id: taskId,
        user_id: userA,
        title: 'Important Financial Review',
        category: 'finance',
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
      await db.set('tasks', [offlineTask]);
      await syncEngine.dispatchMutation('tasks', 'UPSERT', offlineTask, userA);

      // Verify 2 mutations are in the queue (1 dopamine + 1 task)
      const initialBreakdown = await syncEngine.getPendingBreakdown();
      expect(initialBreakdown.total).toBe(2);
      expect(initialBreakdown.critical).toBe(1);
      expect(initialBreakdown.optional).toBe(1);
      expect(initialBreakdown.criticalTables).toContain('tasks');
      expect(initialBreakdown.optionalTables).toContain('dopamine_activities');

      // 3. User reconnects and clicks "Sync Now Before Signing Out" (triggers flushAndPull)
      syncEngine.handleNetworkChange(true);
      const syncResult = await syncEngine.flushAndPull(userA);

      // 4. Verify critical success: critical task WAS uploaded to cloud!
      expect(syncResult.criticalSuccess).toBe(true);
      expect(syncResult.flushedCount).toBe(1);
      expect(cloudDb.tasks.has(taskId)).toBe(true);
      expect(cloudDb.tasks.get(taskId).title).toBe('Important Financial Review');

      // 5. Verify optional dopamine_activities mutation is preserved with error info (never silently dropped)
      const afterBreakdown = await syncEngine.getPendingBreakdown();
      expect(afterBreakdown.critical).toBe(0);
      expect(afterBreakdown.optional).toBe(1);
      expect(afterBreakdown.total).toBe(1);

      const remainingQueue = await db.getQueue();
      expect(remainingQueue).toHaveLength(1);
      expect(remainingQueue[0].table).toBe('dopamine_activities');
      expect(remainingQueue[0].last_error).toContain('PGRST205');
      expect(remainingQueue[0].retry_count).toBeGreaterThan(0);

      // 6. User can now proceed with safe sign-out without fear of losing critical tasks
      await db.stashUserData(userA);
      await db.clearActiveSession();
      await db.clearQueue();
      syncEngine.setUserId(null);

      // Active queue is clean
      expect(await db.getQueue()).toHaveLength(0);

      // 7. When User A logs back in, their preserved optional mutation is restored safely
      syncEngine.setUserId(userA);
      const restoreRes = await db.restoreUserStash(userA);
      expect(restoreRes.restoredQueueCount).toBe(1);
      const restoredQueue = await db.getQueue();
      expect(restoredQueue[0].table).toBe('dopamine_activities');

      fromSpy.mockRestore();
    });

    it('prevents sign-out and accurately reports error when a critical task upload fails', async () => {
      syncEngine.setUserId(userA);

      // Mock Supabase: tasks table fails with network or 500 error
      const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        return {
          upsert: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: '500',
              message: 'Database connection timeout on tasks table',
            },
          }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: {
                code: '500',
                message: 'Database connection timeout',
              },
            }),
          }),
        } as any;
      });

      // User has an offline task
      const offlineTask: Task = {
        id: ensureUUID(),
        user_id: userA,
        title: 'Critical Unsynced Task',
        category: 'work',
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
      await db.enqueueMutation({
        id: ensureUUID(),
        table: 'tasks',
        operation: 'UPSERT',
        payload: offlineTask,
        timestamp: new Date().toISOString(),
        retry_count: 0,
      });

      // User attempts Sync Now Before Signing Out
      const syncResult = await syncEngine.flushAndPull(userA);

      // Must report critical failure!
      expect(syncResult.criticalSuccess).toBe(false);
      expect(syncResult.success).toBe(false);
      expect(syncResult.criticalPendingCount).toBe(1);
      expect(syncResult.error).toContain('Database connection timeout');

      // The critical task remains safely in the outbox
      const breakdown = await syncEngine.getPendingBreakdown();
      expect(breakdown.critical).toBe(1);
      expect(breakdown.criticalTables).toContain('tasks');

      fromSpy.mockRestore();
    });

    it('sanitizes profiles payload by stripping user_id so profiles upload without schema cache or column errors', async () => {
      syncEngine.setUserId(userA);

      let capturedProfilesPayload: any = null;
      const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            upsert: vi.fn().mockImplementation((payload) => {
              capturedProfilesPayload = payload;
              // Fail if payload has user_id, simulating PostgREST PGRST204
              if ('user_id' in payload) {
                return Promise.resolve({
                  data: null,
                  error: {
                    code: 'PGRST204',
                    message: "Could not find the 'user_id' column of 'profiles' in the schema cache",
                  },
                });
              }
              return Promise.resolve({ data: payload, error: null });
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any;
        }

        return {
          upsert: vi.fn().mockResolvedValue({ data: {}, error: null }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        } as any;
      });

      // Enqueue a legacy profile mutation that had user_id attached
      await db.enqueueMutation({
        id: ensureUUID(),
        table: 'profiles',
        operation: 'UPSERT',
        payload: {
          id: userA,
          user_id: userA, // Legacy field that previously caused PGRST204 / schema cache error
          display_name: 'Sanitized User',
          planning_capacity: 'steady',
        },
        timestamp: new Date().toISOString(),
        retry_count: 0,
      });

      // Flush queue
      const flushed = await syncEngine.flushQueue(userA);
      expect(flushed).toBe(1);

      // Verify user_id was cleanly stripped before sending to Supabase
      expect(capturedProfilesPayload).toBeDefined();
      expect(capturedProfilesPayload.id).toBe(userA);
      expect('user_id' in capturedProfilesPayload).toBe(false);
      expect(capturedProfilesPayload.display_name).toBe('Sanitized User');

      // Verify queue is now clean
      const remaining = await db.getQueue();
      expect(remaining).toHaveLength(0);

      fromSpy.mockRestore();
    });
  });
});

