import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/indexedDB';
import { syncEngine, ensureUUID } from '@/lib/syncEngine';
import { Task, Habit, QueuedMutation } from '@/types';

describe('Offline-First Sync Engine & Migration System', () => {
  beforeEach(async () => {
    await db.clear();
    await db.clearQueue();
    syncEngine.setUserId('local_user');
  });

  afterEach(async () => {
    syncEngine.setUserId(null);
    await db.clearQueue();
  });

  it('generates valid RFC-4122 v4 UUIDs', () => {
    const uuid = ensureUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

    // Existing valid UUID is preserved
    const existing = '123e4567-e89b-12d3-a456-426614174000';
    expect(ensureUUID(existing)).toBe(existing);
  });

  it('queues mutations into IndexedDB when user is authenticated and offline', async () => {
    const mockUserId = ensureUUID();
    syncEngine.setUserId(mockUserId);

    const testTask: Task = {
      id: ensureUUID(),
      user_id: mockUserId,
      title: 'Review offline planner notes',
      category: 'wellness',
      priority: 'important',
      estimated_duration: 15,
      status: 'not_started',
      energy_requirement: 'medium',
      recurrence: 'none',
      is_top_three: true,
      postponed_count: 0,
      created_at: new Date().toISOString(),
      subtasks: [],
    };

    // Save locally to IndexedDB
    await db.set('tasks', [testTask]);

    // Dispatch mutation through sync engine
    await syncEngine.dispatchMutation('tasks', 'UPSERT', testTask, mockUserId);

    // Verify it is queued in IndexedDB
    const queue = await db.getQueue();
    expect(queue.length).toBeGreaterThanOrEqual(1);
    const queuedTask = queue.find(m => m.table === 'tasks' && m.payload.title === 'Review offline planner notes');
    expect(queuedTask).toBeDefined();
    expect(queuedTask?.operation).toBe('UPSERT');
    expect(queuedTask?.payload.user_id).toBe(mockUserId);
  });

  it('coalesces multiple offline updates to the same record to minimize sync payload', async () => {
    const mockUserId = ensureUUID();
    syncEngine.setUserId(mockUserId);
    const taskId = ensureUUID();

    const mutation1: QueuedMutation = {
      id: ensureUUID(),
      table: 'tasks',
      operation: 'UPSERT',
      payload: { id: taskId, title: 'Draft v1', user_id: mockUserId },
      timestamp: new Date().toISOString(),
      retry_count: 0,
    };

    const mutation2: QueuedMutation = {
      id: ensureUUID(),
      table: 'tasks',
      operation: 'UPSERT',
      payload: { id: taskId, title: 'Draft v2 (Final)', user_id: mockUserId },
      timestamp: new Date().toISOString(),
      retry_count: 0,
    };

    await db.enqueueMutation(mutation1);
    await db.enqueueMutation(mutation2);

    const queue = await db.getQueue();
    // Coalesced into 1 latest upsert
    expect(queue.filter(m => m.payload.id === taskId)).toHaveLength(1);
    expect(queue.find(m => m.payload.id === taskId)?.payload.title).toBe('Draft v2 (Final)');
  });

  it('safely migrates local guest data to a new user account without data loss', async () => {
    // 1. User starts as guest and creates tasks and habits
    const guestTask1: Task = {
      id: 'task_guest_1',
      user_id: 'local_user',
      title: 'Gentle hydration check',
      category: 'wellness',
      priority: 'essential',
      estimated_duration: 5,
      status: 'completed',
      energy_requirement: 'very_low',
      recurrence: 'daily',
      is_top_three: false,
      postponed_count: 0,
      created_at: new Date().toISOString(),
      subtasks: [],
    };

    const guestHabit1: Habit = {
      id: 'hab_guest_1',
      user_id: 'local_user',
      title: 'Evening wind-down stretch',
      routine: 'evening',
      frequency: 'daily',
      energy_level: 'very_low',
      is_paused: false,
      target_count_weekly: 7,
      created_at: new Date().toISOString(),
    };

    await db.set('tasks', [guestTask1]);
    await db.set('habits', [guestHabit1]);

    // 2. User signs up -> new UUID is created
    const newUserId = ensureUUID();
    const result = await syncEngine.migrateGuestData(newUserId);

    expect(result.migratedCount).toBeGreaterThanOrEqual(2);

    // 3. Inspect local IndexedDB
    const migratedTasks = await db.get<Task[]>('tasks', []);
    const migratedHabits = await db.get<Habit[]>('habits', []);

    expect(migratedTasks[0].user_id).toBe(newUserId);
    expect(migratedTasks[0].title).toBe('Gentle hydration check');
    // ID was converted to a valid UUID for PostgreSQL compatibility
    expect(migratedTasks[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

    expect(migratedHabits[0].user_id).toBe(newUserId);
    expect(migratedHabits[0].title).toBe('Evening wind-down stretch');
  });

  it('keeps planner 100% operational offline without auth barriers', async () => {
    // Guest mode
    syncEngine.setUserId('local_user');

    const offlineTask: Task = {
      id: ensureUUID(),
      user_id: 'local_user',
      title: 'Offline brainstorming session',
      category: 'mind',
      priority: 'important',
      estimated_duration: 20,
      status: 'not_started',
      energy_requirement: 'low',
      recurrence: 'none',
      is_top_three: true,
      postponed_count: 0,
      created_at: new Date().toISOString(),
      subtasks: [],
    };

    await db.set('tasks', [offlineTask]);
    const stored = await db.get<Task[]>('tasks', []);

    expect(stored).toHaveLength(1);
    expect(stored[0].title).toBe('Offline brainstorming session');

    // Guest mutations don't clog queue
    await syncEngine.dispatchMutation('tasks', 'UPSERT', offlineTask, 'local_user');
    const queue = await db.getQueue();
    expect(queue).toHaveLength(0);
  });
});

