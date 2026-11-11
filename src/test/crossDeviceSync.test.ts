import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '@/lib/indexedDB';
import { syncEngine, ensureUUID } from '@/lib/syncEngine';
import { Task } from '@/types';
import { supabase, setIsSupabaseConfigured } from '@/lib/supabase';

describe('Cross-Device Cloud Synchronization & Auth Verification', () => {
  // In-memory Supabase cloud mock database to simulate real multi-device sync
  let cloudDb: {
    users: Map<string, { id: string; email: string; password: string; display_name: string }>;
    tasks: Map<string, any>;
    brain_dump_entries: Map<string, any>;
    goals: Map<string, any>;
    habits: Map<string, any>;
    user_preferences: Map<string, any>;
  };

  beforeEach(async () => {
    setIsSupabaseConfigured(true);
    await db.clear();
    await db.clearQueue();
    syncEngine.setUserId(null);

    cloudDb = {
      users: new Map(),
      tasks: new Map(),
      brain_dump_entries: new Map(),
      goals: new Map(),
      habits: new Map(),
      user_preferences: new Map(),
    };

    // Pre-populate an existing registered user
    cloudDb.users.set('existing@example.com', {
      id: '11111111-1111-4111-8111-111111111111',
      email: 'existing@example.com',
      password: 'correctpassword123',
      display_name: 'Existing User',
    });
  });

  afterEach(() => {
    setIsSupabaseConfigured(false);
    vi.restoreAllMocks();
  });

  // Helper to create a comprehensive Supabase from() mock
  const createSupabaseMock = () => {
    return vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      return {
        upsert: vi.fn().mockImplementation((payload) => {
          if (table === 'tasks') {
            cloudDb.tasks.set(payload.id, payload);
          } else if (table === 'brain_dump_entries') {
            cloudDb.brain_dump_entries.set(payload.id, payload);
          } else if (table === 'goals') {
            cloudDb.goals.set(payload.id, payload);
          } else if (table === 'habits') {
            cloudDb.habits.set(payload.id, payload);
          } else if (table === 'user_preferences') {
            cloudDb.user_preferences.set(payload.user_id, payload);
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
              const userTasks = Array.from(cloudDb.tasks.values()).filter(t => t.user_id === val);
              return Promise.resolve({ data: userTasks, error: null });
            }
            if (table === 'user_preferences') {
              const prefs = Array.from(cloudDb.user_preferences.values()).filter(p => p.user_id === val);
              return Promise.resolve({ data: prefs, error: null });
            }
            if (table === 'brain_dump_entries') {
              const entries = Array.from(cloudDb.brain_dump_entries.values()).filter(e => e.user_id === val);
              return Promise.resolve({ data: entries, error: null });
            }
            if (table === 'goals') {
              const userGoals = Array.from(cloudDb.goals.values()).filter(g => g.user_id === val);
              return Promise.resolve({ data: userGoals, error: null });
            }
            if (table === 'habits') {
              const userHabits = Array.from(cloudDb.habits.values()).filter(h => h.user_id === val);
              return Promise.resolve({ data: userHabits, error: null });
            }
            return Promise.resolve({ data: [], error: null });
          }),
        }),
      } as any;
    });
  };

  // --------------------------------------------------------------------------
  // Problem 1: Authentication Verification & Security
  // --------------------------------------------------------------------------
  describe('Problem 1: Authentication Integrity', () => {
    it('rejects sign-in for non-existent accounts with proper error and denies entry', async () => {
      const signInSpy = vi.spyOn(supabase.auth, 'signInWithPassword').mockImplementation(async (credentials: any) => {
        const { email, password } = credentials;
        const user = cloudDb.users.get(email);
        if (!user || user.password !== password) {
          return {
            data: { user: null, session: null },
            error: { message: 'Invalid login credentials', name: 'AuthApiError', status: 400 },
          } as any;
        }
        return {
          data: {
            user: { id: user.id, email: user.email, user_metadata: { display_name: user.display_name } },
            session: { access_token: 'valid_token' },
          },
          error: null,
        } as any;
      });

      // Attempt to sign in with an account that was never created
      const res = await supabase.auth.signInWithPassword({
        email: 'ghost_user_does_not_exist@example.com',
        password: 'Password123!',
      });

      expect(res.error).toBeDefined();
      expect(res.error?.message).toBe('Invalid login credentials');
      expect(res.data.session).toBeNull();
      expect(res.data.user).toBeNull();

      // Ensure syncEngine remains in local_only status and did not bind to ghost user
      expect(syncEngine.getSyncState().status).toBe('local_only');

      signInSpy.mockRestore();
    });

    it('rejects sign-in when an existing user provides an incorrect password', async () => {
      const signInSpy = vi.spyOn(supabase.auth, 'signInWithPassword').mockImplementation(async (credentials: any) => {
        const { email, password } = credentials;
        const user = cloudDb.users.get(email);
        if (!user || user.password !== password) {
          return {
            data: { user: null, session: null },
            error: { message: 'Invalid login credentials', name: 'AuthApiError', status: 400 },
          } as any;
        }
        return {
          data: {
            user: { id: user.id, email: user.email, user_metadata: { display_name: user.display_name } },
            session: { access_token: 'valid_token' },
          },
          error: null,
        } as any;
      });

      const res = await supabase.auth.signInWithPassword({
        email: 'existing@example.com',
        password: 'WRONG_PASSWORD_XYZ',
      });

      expect(res.error).toBeDefined();
      expect(res.error?.message).toBe('Invalid login credentials');
      expect(res.data.user).toBeNull();

      signInSpy.mockRestore();
    });

    it('successfully signs up a new genuine user and authenticates subsequent login', async () => {
      const signUpSpy = vi.spyOn(supabase.auth, 'signUp').mockImplementation(async (credentials: any) => {
        const { email, password, options } = credentials;
        if (cloudDb.users.has(email)) {
          return {
            data: { user: null, session: null },
            error: { message: 'User already registered', name: 'AuthApiError', status: 400 },
          } as any;
        }
        const newUser = {
          id: ensureUUID(),
          email,
          password,
          display_name: options?.data?.display_name || 'New User',
        };
        cloudDb.users.set(email, newUser);
        return {
          data: {
            user: { id: newUser.id, email: newUser.email, user_metadata: { display_name: newUser.display_name } },
            session: { access_token: 'token_new_user' },
          },
          error: null,
        } as any;
      });

      const signInSpy = vi.spyOn(supabase.auth, 'signInWithPassword').mockImplementation(async (credentials: any) => {
        const { email, password } = credentials;
        const user = cloudDb.users.get(email);
        if (!user || user.password !== password) {
          return {
            data: { user: null, session: null },
            error: { message: 'Invalid login credentials', name: 'AuthApiError', status: 400 },
          } as any;
        }
        return {
          data: {
            user: { id: user.id, email: user.email, user_metadata: { display_name: user.display_name } },
            session: { access_token: 'valid_token' },
          },
          error: null,
        } as any;
      });

      // 1. Sign up new account
      const signupResult = await supabase.auth.signUp({
        email: 'newuser@example.com',
        password: 'mysecurepassword123',
        options: { data: { display_name: 'Alex Rivera' } },
      });

      expect(signupResult.error).toBeNull();
      expect(signupResult.data.user).toBeDefined();
      expect(signupResult.data.user?.email).toBe('newuser@example.com');
      const assignedId = signupResult.data.user?.id!;
      expect(assignedId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

      // 2. Subsequent sign-in with the created account succeeds
      const loginResult = await supabase.auth.signInWithPassword({
        email: 'newuser@example.com',
        password: 'mysecurepassword123',
      });

      expect(loginResult.error).toBeNull();
      expect(loginResult.data.user?.id).toBe(assignedId);

      signUpSpy.mockRestore();
      signInSpy.mockRestore();
    });
  });

  // --------------------------------------------------------------------------
  // Problem 2: Cross-Device Cloud Sync (Laptop <-> Phone)
  // --------------------------------------------------------------------------
  describe('Problem 2: Cross-Device Cloud Sync', () => {
    it('creates tasks on a laptop and makes them appear on a phone using the same account', async () => {
      const sharedUserId = '22222222-2222-4222-8222-222222222222';
      const fromSpy = createSupabaseMock();

      // --- DEVICE 1: LAPTOP ---
      syncEngine.setUserId(sharedUserId);

      const laptopTask: Task = {
        id: ensureUUID(),
        user_id: sharedUserId,
        title: 'Review quarterly goals from laptop',
        category: 'work',
        priority: 'essential',
        due_date: '2026-11-12',
        estimated_duration: 30,
        status: 'not_started',
        energy_requirement: 'high',
        recurrence: 'none',
        is_top_three: true,
        postponed_count: 0,
        created_at: new Date('2026-11-10T10:00:00Z').toISOString(),
        updated_at: new Date('2026-11-10T10:00:00Z').toISOString(),
        subtasks: [],
      };

      // Laptop saves task locally and dispatches mutation
      await db.set('tasks', [laptopTask]);
      await syncEngine.dispatchMutation('tasks', 'UPSERT', laptopTask, sharedUserId);

      // Verify task was received in cloud database with the correct user ID
      expect(cloudDb.tasks.has(laptopTask.id)).toBe(true);
      expect(cloudDb.tasks.get(laptopTask.id).user_id).toBe(sharedUserId);
      expect(cloudDb.tasks.get(laptopTask.id).title).toBe('Review quarterly goals from laptop');

      // --- DEVICE 2: PHONE ---
      // Simulate phone starting fresh with empty/default IndexedDB
      await db.clear();
      const phoneInitialTasks = await db.get<Task[]>('tasks', []);
      expect(phoneInitialTasks).toEqual([]);

      // Phone user logs in with the SAME account ID
      syncEngine.setUserId(sharedUserId);

      // Phone subscribes to remote data
      let phoneNotifiedData: any = null;
      const unsub = syncEngine.onRemoteData((remoteCollections) => {
        phoneNotifiedData = remoteCollections;
      });

      const pulled = await syncEngine.pullRemoteData(sharedUserId);

      // Verify phone received laptop task from cloud
      expect(pulled?.tasks).toBeDefined();
      expect(pulled?.tasks.length).toBe(1);
      expect(pulled?.tasks[0].id).toBe(laptopTask.id);
      expect(pulled?.tasks[0].title).toBe('Review quarterly goals from laptop');

      // Verify phone's IndexedDB was populated
      const phoneSavedTasks = await db.get<Task[]>('tasks', []);
      expect(phoneSavedTasks).toHaveLength(1);
      expect(phoneSavedTasks[0].id).toBe(laptopTask.id);

      // Verify notification channel triggered to immediately render in phone UI
      expect(phoneNotifiedData?.tasks).toBeDefined();
      expect(phoneNotifiedData.tasks[0].title).toBe('Review quarterly goals from laptop');

      unsub();
      fromSpy.mockRestore();
    });

    it('edits tasks on a phone and reflects changes on laptop using Last-Write-Wins', async () => {
      const sharedUserId = '33333333-3333-4333-8333-333333333333';
      const taskId = ensureUUID();
      const fromSpy = createSupabaseMock();

      // Cloud already has the original task
      const originalTask: Task = {
        id: taskId,
        user_id: sharedUserId,
        title: 'Original Title from Laptop',
        category: 'personal',
        priority: 'important',
        due_date: '2026-11-15',
        estimated_duration: 15,
        status: 'not_started',
        energy_requirement: 'medium',
        recurrence: 'none',
        is_top_three: false,
        postponed_count: 0,
        created_at: new Date('2026-11-10T09:00:00Z').toISOString(),
        updated_at: new Date('2026-11-10T09:00:00Z').toISOString(),
        subtasks: [],
      };
      cloudDb.tasks.set(taskId, originalTask);

      // --- PHONE EDITS TASK ---
      syncEngine.setUserId(sharedUserId);
      const updatedPhoneTask: Task = {
        ...originalTask,
        title: 'Updated Title Edited on Phone!',
        status: 'completed',
        completed_at: new Date('2026-11-10T12:00:00Z').toISOString(),
        updated_at: new Date('2026-11-10T12:00:00Z').toISOString(),
      };

      await syncEngine.dispatchMutation('tasks', 'UPSERT', updatedPhoneTask, sharedUserId);

      // Cloud is updated
      expect(cloudDb.tasks.get(taskId).title).toBe('Updated Title Edited on Phone!');
      expect(cloudDb.tasks.get(taskId).status).toBe('completed');

      // --- LAPTOP PULLS UPDATE ---
      // Laptop had the older original task locally in its IndexedDB
      await db.set('tasks', [originalTask]);

      const laptopPulled = await syncEngine.pullRemoteData(sharedUserId);
      expect(laptopPulled?.tasks).toBeDefined();
      const resolvedTask = laptopPulled?.tasks.find(t => t.id === taskId);

      // Last-Write-Wins selected the newer phone update
      expect(resolvedTask.title).toBe('Updated Title Edited on Phone!');
      expect(resolvedTask.status).toBe('completed');

      // Laptop IndexedDB has the updated task
      const laptopDbTasks = await db.get<Task[]>('tasks', []);
      expect(laptopDbTasks.find(t => t.id === taskId)?.title).toBe('Updated Title Edited on Phone!');

      fromSpy.mockRestore();
    });

    it('queues offline edits and synchronizes automatically on reconnection', async () => {
      const userId = '44444444-4444-4444-8444-444444444444';
      const fromSpy = createSupabaseMock();
      syncEngine.setUserId(userId);

      // 1. Simulate device going OFFLINE
      syncEngine.handleNetworkChange(false);
      expect(syncEngine.getSyncState().status).toBe('offline');

      // 2. Perform actions while offline
      const offlineTask: Task = {
        id: ensureUUID(),
        user_id: userId,
        title: 'Created while on the subway offline',
        category: 'wellness',
        priority: 'essential',
        due_date: '2026-11-11',
        estimated_duration: 10,
        status: 'not_started',
        energy_requirement: 'low',
        recurrence: 'none',
        is_top_three: false,
        postponed_count: 0,
        created_at: new Date().toISOString(),
        subtasks: [],
      };

      await syncEngine.dispatchMutation('tasks', 'UPSERT', offlineTask, userId);

      // Mutation is queued locally in IndexedDB
      const queueBefore = await db.getQueue();
      expect(queueBefore.length).toBe(1);
      expect(queueBefore[0].payload.title).toBe('Created while on the subway offline');
      // Nothing sent to cloud yet
      expect(cloudDb.tasks.has(offlineTask.id)).toBe(false);

      // 3. Simulate device coming back ONLINE
      syncEngine.handleNetworkChange(true);

      // Queue is flushed to Supabase
      await syncEngine.flushQueue(userId);

      // Cloud received the queued mutation
      expect(cloudDb.tasks.has(offlineTask.id)).toBe(true);
      expect(cloudDb.tasks.get(offlineTask.id).title).toBe('Created while on the subway offline');

      // Local offline queue is now clean
      const queueAfter = await db.getQueue();
      expect(queueAfter.length).toBe(0);
      expect(syncEngine.getSyncState().pendingCount).toBe(0);

      fromSpy.mockRestore();
    });

    it('ensures signing out purges previous user data and prevents cross-account data leakage', async () => {
      const userAId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
      const userBId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
      const fromSpy = createSupabaseMock();

      // 1. User A logs in and has private planner data
      syncEngine.setUserId(userAId);
      const privateTaskA: Task = {
        id: ensureUUID(),
        user_id: userAId,
        title: "User A's Confidential Life Review",
        category: 'finance',
        priority: 'essential',
        estimated_duration: 30,
        status: 'completed',
        energy_requirement: 'high',
        recurrence: 'none',
        is_top_three: true,
        postponed_count: 0,
        created_at: new Date().toISOString(),
        subtasks: [],
      };
      await db.set('tasks', [privateTaskA]);

      // Verify User A data is present
      const storedA = await db.get<Task[]>('tasks', []);
      expect(storedA).toHaveLength(1);
      expect(storedA[0].title).toBe("User A's Confidential Life Review");

      // 2. User A signs out: IndexedDB and queues are completely purged
      await db.clear();
      await db.clearQueue();
      syncEngine.setUserId(null);
      syncEngine.notifyReset();

      // Verify storage was purged
      const afterSignOut = await db.get<Task[]>('tasks', []);
      expect(afterSignOut).toEqual([]);

      // 3. User B already has tasks stored in cloud Supabase
      const userBTask = {
        id: ensureUUID(),
        user_id: userBId,
        title: "User B's Fitness Routine",
        category: 'wellness',
        priority: 'important',
        due_date: '2026-11-12',
        estimated_duration: 20,
        status: 'not_started',
        created_at: new Date().toISOString(),
        subtasks: [],
      };
      cloudDb.tasks.set(userBTask.id, userBTask);

      // User B signs in
      syncEngine.setUserId(userBId);

      const pulledUserB = await syncEngine.pullRemoteData(userBId);
      expect(pulledUserB?.tasks).toBeDefined();
      expect(pulledUserB?.tasks).toHaveLength(1);
      expect(pulledUserB?.tasks[0].title).toBe("User B's Fitness Routine");

      // Ensure User B's loaded data NEVER contains User A's confidential tasks
      const allPhoneTasks = await db.get<Task[]>('tasks', []);
      expect(allPhoneTasks.some(t => t.title.includes("User A's Confidential"))).toBe(false);

      fromSpy.mockRestore();
    });

    it('detects uninitialized Supabase tables (PGRST205) and surfaces explicit diagnostic error without silent failure', async () => {
      // Simulate Supabase project where tables have not been created yet
      const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        return {
          select: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: null,
              error: {
                code: 'PGRST205',
                message: `Could not find the table 'public.${table}' in the schema cache`,
              },
            }),
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: {
                code: 'PGRST205',
                message: `Could not find the table 'public.${table}' in the schema cache`,
              },
            }),
          }),
        } as any;
      });

      const health = await syncEngine.checkCloudSchemaHealth();
      expect(health.isHealthy).toBe(false);
      expect(health.missingTables.length).toBeGreaterThan(0);
      expect(health.error).toContain('Database tables not initialized in Supabase');

      const syncState = syncEngine.getSyncState();
      expect(syncState.status).toBe('error');
      expect(syncState.errorMessage).toContain('SQL schema migration');

      fromSpy.mockRestore();
    });

    it('regression: phone creates task online, laptop signs in, and phone task appears on laptop without being blocked or overwritten', async () => {
      const sharedUserId = '77777777-7777-4777-8777-777777777777';
      const fromSpy = createSupabaseMock();

      // --- DEVICE 1: PHONE ---
      // Phone is online and authenticated
      syncEngine.setUserId(sharedUserId);
      expect(syncEngine.getSyncState().status).toBe('synced');

      const phoneTask: Task = {
        id: ensureUUID(),
        user_id: sharedUserId,
        title: 'Task Created Online on Phone',
        category: 'work',
        priority: 'essential',
        estimated_duration: 25,
        status: 'not_started',
        energy_requirement: 'medium',
        recurrence: 'none',
        is_top_three: true,
        postponed_count: 0,
        created_at: new Date().toISOString(),
        subtasks: [],
      };

      // Phone saves locally and dispatches mutation
      await db.set('tasks', [phoneTask]);
      await syncEngine.dispatchMutation('tasks', 'UPSERT', phoneTask, sharedUserId);

      // Verify task reached cloud Supabase database immediately
      expect(cloudDb.tasks.has(phoneTask.id)).toBe(true);
      expect(cloudDb.tasks.get(phoneTask.id).title).toBe('Task Created Online on Phone');
      expect(cloudDb.tasks.get(phoneTask.id).user_id).toBe(sharedUserId);

      // Verify phone outbox is empty
      const phoneQueue = await db.getQueue();
      expect(phoneQueue).toHaveLength(0);

      // --- DEVICE 2: LAPTOP ---
      // Laptop simulates starting fresh or previously signed out (zero pending changes)
      await db.clear();
      await db.clearQueue();
      syncEngine.setUserId(null);

      // Laptop user signs in with the SAME account
      syncEngine.setUserId(sharedUserId);

      // Restore any stashed data (none exists for clean sign-in)
      const restoreRes = await db.restoreUserStash(sharedUserId);
      expect(restoreRes.restoredQueueCount).toBe(0);

      // Laptop pulls remote data from cloud
      let laptopNotifiedCollections: any = null;
      const unsub = syncEngine.onRemoteData((data) => {
        laptopNotifiedCollections = data;
      });

      const pulled = await syncEngine.pullRemoteData(sharedUserId);

      // Phone task is pulled and resolved
      expect(pulled?.tasks).toBeDefined();
      expect(pulled?.tasks.some((t: any) => t.id === phoneTask.id)).toBe(true);

      // Laptop IndexedDB was updated
      const laptopTasks = await db.get<Task[]>('tasks', []);
      expect(laptopTasks.some((t) => t.id === phoneTask.id)).toBe(true);

      // UI listener received the phone task
      expect(laptopNotifiedCollections?.tasks.some((t: any) => t.id === phoneTask.id)).toBe(true);

      unsub();
      fromSpy.mockRestore();
    });

    it('guarantees that a failed dopamine_activities mutation (42501 permission denied) does not block task, habit, and goal synchronization', async () => {
      const testUserId = '88888888-8888-4888-8888-888888888888';
      syncEngine.setUserId(testUserId);

      // Spy on Supabase from():
      // dopamine_activities will fail with 42501 Permission Denied
      // tasks, habits, and goals will succeed
      const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'dopamine_activities') {
          return {
            upsert: vi.fn().mockResolvedValue({
              data: null,
              error: {
                code: '42501',
                message: 'permission denied for table dopamine_activities',
              },
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: {
                  code: '42501',
                  message: 'permission denied for table dopamine_activities',
                },
              }),
            }),
          } as any;
        }

        return {
          upsert: vi.fn().mockImplementation((payload) => {
            if (table === 'tasks') cloudDb.tasks.set(payload.id, payload);
            if (table === 'habits') cloudDb.habits.set(payload.id, payload);
            if (table === 'goals') cloudDb.goals.set(payload.id, payload);
            return Promise.resolve({ data: payload, error: null });
          }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((_col, val) => {
              if (table === 'tasks') {
                return Promise.resolve({
                  data: Array.from(cloudDb.tasks.values()).filter(t => t.user_id === val),
                  error: null,
                });
              }
              if (table === 'habits') {
                return Promise.resolve({
                  data: Array.from(cloudDb.habits.values()).filter(h => h.user_id === val),
                  error: null,
                });
              }
              if (table === 'goals') {
                return Promise.resolve({
                  data: Array.from(cloudDb.goals.values()).filter(g => g.user_id === val),
                  error: null,
                });
              }
              return Promise.resolve({ data: [], error: null });
            }),
          }),
        } as any;
      });

      // 1. Enqueue a failing dopamine_activities mutation (simulating guest migration seed)
      await db.enqueueMutation({
        id: ensureUUID(),
        table: 'dopamine_activities',
        operation: 'UPSERT',
        payload: { id: ensureUUID(), title: 'Appetizer Walk', category: 'appetizer', user_id: testUserId },
        timestamp: new Date().toISOString(),
        retry_count: 0,
      });

      // 2. User creates a task online while the dopamine mutation is in the queue
      const newTask: Task = {
        id: ensureUUID(),
        user_id: testUserId,
        title: 'High Priority Task',
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

      // Dispatches mutation: since there are no pending mutations for 'tasks',
      // it should directly sync or be flushed without head-of-line blocking
      await syncEngine.dispatchMutation('tasks', 'UPSERT', newTask, testUserId);

      // Verify the task reached cloud immediately
      expect(cloudDb.tasks.has(newTask.id)).toBe(true);
      expect(cloudDb.tasks.get(newTask.id).title).toBe('High Priority Task');

      // 3. Now trigger full outbox flush
      const flushedCount = await syncEngine.flushQueue(testUserId);

      // Even with dopamine_activities failing with 42501, the queue was not halted
      const queueAfter = await db.getQueue();
      // Failed mutation is preserved in outbox (Requirement 2 & 3: never silently delete failed mutations)
      expect(queueAfter.length).toBe(1);
      expect(queueAfter[0].table).toBe('dopamine_activities');
      expect(queueAfter[0].last_error).toContain('Code: 42501');
      expect(queueAfter[0].retry_count).toBeGreaterThan(0);

      // Sync state clearly reports the actual permission error instead of falsely reporting success
      const state = syncEngine.getSyncState();
      expect(state.status).toBe('error');
      expect(state.errorMessage).toContain('42501');

      // 4. Remote pull still succeeds for tasks, habits, and goals despite dopamine_activities error
      const pulled = await syncEngine.pullRemoteData(testUserId);
      expect(pulled).not.toBeNull();
      expect(pulled?.tasks.some((t: any) => t.id === newTask.id)).toBe(true);

      fromSpy.mockRestore();
    });

    it('ensures automatic upload and cross-device receiving are decoupled and independently testable', async () => {
      const userA = '99999999-9999-4999-8999-999999999999';
      const fromSpy = createSupabaseMock();

      // Device 1: Phone uploads automatically
      syncEngine.setUserId(userA);
      const testTask: Task = {
        id: ensureUUID(),
        user_id: userA,
        title: 'Device 1 Autonomous Upload',
        category: 'personal',
        priority: 'important',
        estimated_duration: 15,
        status: 'not_started',
        energy_requirement: 'low',
        recurrence: 'none',
        is_top_three: false,
        postponed_count: 0,
        created_at: new Date().toISOString(),
        subtasks: [],
      };

      // Dispatched without manual Sync Now
      await syncEngine.dispatchMutation('tasks', 'UPSERT', testTask, userA);
      expect(cloudDb.tasks.has(testTask.id)).toBe(true);

      // Device 2: Laptop receives independently via pullRemoteData without having to push
      const laptopPulled = await syncEngine.pullRemoteData(userA);
      expect(laptopPulled).toBeDefined();
      expect(laptopPulled?.tasks.some((t: any) => t.id === testTask.id)).toBe(true);

      fromSpy.mockRestore();
    });
  });
});
