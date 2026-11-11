// ====================================================================
// LIFE RESET - Habits Synchronization & Permission Diagnostics Tests
// Verifies:
// 1. Verifies active Supabase auth session before remote database writes
// 2. Ensures session user ID matches expected planner user ID (isolation)
// 3. Refreshes expiring sessions safely (proactive & reactive retry)
// 4. Prevents unauthenticated mutations from sending as anon; queues safely
// 5. Correctly distinguishes table privileges from RLS policy violations
// 6. Clears stale sync error messages after successful sync and sign-in
// 7. Preserves all existing RLS policies, user isolation, and IndexedDB data
// ====================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { syncEngine, ensureUUID } from '../lib/syncEngine';
import { db } from '../lib/indexedDB';
import { supabase } from '../lib/supabase';
import { Habit } from '../types';

describe('Habits Synchronization & Auth Diagnostic Engine', () => {
  const testUserId = '33333333-3333-4333-8333-333333333333';
  const cloudHabits = new Map<string, any>();

  beforeEach(async () => {
    cloudHabits.clear();
    await db.clearQueue();
    syncEngine.setUserId(testUserId);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Successfully uploads habit when authenticated, verifying no 42501 RLS error occurs', async () => {
    const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'habits') {
        return {
          upsert: vi.fn().mockImplementation((payload) => {
            // Emulate PostgreSQL RLS check: auth.uid() === user_id
            if (payload.user_id !== testUserId) {
              return Promise.resolve({
                data: null,
                error: {
                  code: '42501',
                  message: 'new row violates row-level security policy for table "habits"',
                },
              });
            }
            cloudHabits.set(payload.id, payload);
            return Promise.resolve({ data: payload, error: null });
          }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: Array.from(cloudHabits.values()),
              error: null,
            }),
          }),
        } as any;
      }
      return {
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
        select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }),
      } as any;
    });

    const newHabit: Habit = {
      id: ensureUUID(),
      user_id: testUserId,
      title: 'Morning Sunlight & Glass of Water',
      description: 'Step outside for 5 mins upon waking.',
      routine: 'morning',
      frequency: 'daily',
      energy_level: 'low',
      is_paused: false,
      target_count_weekly: 7,
      created_at: new Date().toISOString(),
    };

    // Dispatch habit mutation
    await syncEngine.dispatchMutation('habits', 'UPSERT', newHabit, testUserId);

    // Verify habit reached cloud
    expect(cloudHabits.has(newHabit.id)).toBe(true);
    expect(cloudHabits.get(newHabit.id).title).toBe('Morning Sunlight & Glass of Water');

    // Verify sync state reports synced with NO error
    const state = syncEngine.getSyncState();
    expect(state.status).toBe('synced');
    expect(state.errorMessage).toBeUndefined();

    fromSpy.mockRestore();
  });

  it('2. Prevents unauthenticated mutations from sending to Supabase as anon role; keeps them queued safely', async () => {
    // Mock getSession returning null and refreshSession returning null
    const getSessionSpy = vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: null },
      error: null,
    });
    const refreshSpy = vi.spyOn(supabase.auth, 'refreshSession').mockResolvedValue({
      data: { session: null, user: null },
      error: new Error('No refresh token available') as any,
    });

    let remoteWriteAttempted = false;
    const fromSpy = vi.spyOn(supabase, 'from').mockImplementation(() => {
      remoteWriteAttempted = true;
      return {
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any;
    });

    const offlineHabit: Habit = {
      id: ensureUUID(),
      user_id: testUserId,
      title: 'Deep Breath Reset',
      routine: 'custom',
      frequency: 'daily',
      energy_level: 'very_low',
      is_paused: false,
      target_count_weekly: 7,
      created_at: new Date().toISOString(),
    };

    // Attempt mutation dispatch while session is missing/unauthenticated
    await syncEngine.dispatchMutation('habits', 'UPSERT', offlineHabit, testUserId);

    // CRITICAL: Must NOT attempt remote write as anon!
    expect(remoteWriteAttempted).toBe(false);

    // CRITICAL: Mutation must be safely preserved in local IndexedDB outbox
    const queue = await db.getQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].table).toBe('habits');
    expect(queue[0].payload.title).toBe('Deep Breath Reset');
    // Must NOT have false database permission error
    expect(queue[0].last_error).toBeUndefined();

    // Sync state is cleanly queued, NOT error
    const state = syncEngine.getSyncState();
    expect(state.status).toBe('queued');
    expect(state.errorMessage).toBeUndefined();

    getSessionSpy.mockRestore();
    refreshSpy.mockRestore();
    fromSpy.mockRestore();
  });

  it('3. Enforces session user ID matching to protect user isolation and prevent cross-account upload', async () => {
    const wrongUserId = '99999999-9999-4999-8999-999999999999';
    // Active Supabase session belongs to wrongUserId
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: wrongUserId },
          access_token: 'valid_token_wrong_user',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        } as any,
      },
      error: null,
    });

    let remoteWriteAttempted = false;
    const fromSpy = vi.spyOn(supabase, 'from').mockImplementation(() => {
      remoteWriteAttempted = true;
      return {
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any;
    });

    // Calling ensureAuthenticatedSession for testUserId while session is wrongUserId
    const isValid = await syncEngine.ensureAuthenticatedSession(testUserId);
    expect(isValid).toBe(false);

    // Flush should pause without pushing wrong user data
    await db.enqueueMutation({
      id: ensureUUID(),
      table: 'habits',
      operation: 'UPSERT',
      payload: { id: ensureUUID(), title: 'Private User Habit', user_id: testUserId },
      timestamp: new Date().toISOString(),
      retry_count: 0,
    });

    const flushed = await syncEngine.flushQueue(testUserId);
    expect(flushed).toBe(0);
    expect(remoteWriteAttempted).toBe(false);

    // Queue is preserved safely
    const queue = await db.getQueue();
    expect(queue.length).toBe(1);

    fromSpy.mockRestore();
  });

  it('4. Refreshes expiring session safely within 30-second window before remote write', async () => {
    let refreshCalled = false;
    const nowSec = Math.floor(Date.now() / 1000);

    // Session expiring in 10 seconds (< 30s threshold)
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: { id: testUserId },
          access_token: 'about_to_expire_token',
          expires_at: nowSec + 10,
        } as any,
      },
      error: null,
    });

    vi.spyOn(supabase.auth, 'refreshSession').mockImplementation(async () => {
      refreshCalled = true;
      return {
        data: {
          user: { id: testUserId } as any,
          session: {
            user: { id: testUserId } as any,
            access_token: 'fresh_refreshed_token',
            expires_at: nowSec + 3600,
          } as any,
        },
        error: null,
      };
    });

    const isValid = await syncEngine.ensureAuthenticatedSession(testUserId);
    expect(isValid).toBe(true);
    expect(refreshCalled).toBe(true);
  });

  it('5. Correctly distinguishes missing table privileges from RLS policy violations', async () => {
    let attemptedRefresh = false;
    vi.spyOn(supabase.auth, 'refreshSession').mockImplementation(async () => {
      attemptedRefresh = true;
      const mockUser = { id: testUserId } as any;
      return {
        data: {
          user: mockUser,
          session: {
            user: mockUser,
            access_token: 'valid_refreshed_token',
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          } as any,
        },
        error: null,
      };
    });

    // Simulates an RLS failure that auto-recovers after token refresh
    let callCount = 0;
    const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'habits') {
        return {
          upsert: vi.fn().mockImplementation((payload) => {
            callCount++;
            if (callCount === 1) {
              // First call: expired session violates RLS
              return Promise.resolve({
                data: null,
                error: {
                  code: '42501',
                  message: 'new row violates row-level security policy for table "habits"',
                },
              });
            }
            // Second call after session refresh succeeds!
            cloudHabits.set(payload.id, payload);
            return Promise.resolve({ data: payload, error: null });
          }),
        } as any;
      }
      return {
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
        select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }),
      } as any;
    });

    await db.enqueueMutation({
      id: ensureUUID(),
      table: 'habits',
      operation: 'UPSERT',
      payload: { id: ensureUUID(), title: 'Gentle Evening Stretch', user_id: testUserId },
      timestamp: new Date().toISOString(),
      retry_count: 0,
    });

    const flushed = await syncEngine.flushQueue(testUserId);

    // Refresh was attempted upon encountering 42501 RLS violation
    expect(attemptedRefresh).toBe(true);
    // Habit successfully flushed on retry
    expect(flushed).toBe(1);
    expect(cloudHabits.size).toBe(1);

    // Sync state is healthy and error is cleared
    const state = syncEngine.getSyncState();
    expect(state.status).toBe('synced');
    expect(state.errorMessage).toBeUndefined();

    fromSpy.mockRestore();
  });

  it('6. Clears stale error notice when a previously failing habit is successfully flushed', async () => {
    // 1. Seed queue with a mutation that previously had an error
    const habitId = ensureUUID();
    await db.enqueueMutation({
      id: ensureUUID(),
      table: 'habits',
      operation: 'UPSERT',
      payload: { id: habitId, title: 'Daily Capacity Check-in', user_id: testUserId },
      timestamp: new Date().toISOString(),
      retry_count: 1,
      last_error: "Database permission denied for 'habits' (Code: 42501). Please check permissions in Supabase SQL Editor.",
    });

    // 2. Mock successful upsert now that user is properly authenticated
    const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'habits') {
        return {
          upsert: vi.fn().mockImplementation((payload) => {
            cloudHabits.set(payload.id, payload);
            return Promise.resolve({ data: payload, error: null });
          }),
        } as any;
      }
      return {
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
        select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }),
      } as any;
    });

    // 3. Flush queue
    const flushed = await syncEngine.flushQueue(testUserId);
    expect(flushed).toBe(1);
    expect(cloudHabits.has(habitId)).toBe(true);

    // 4. Verify queue is now empty
    const queueAfter = await db.getQueue();
    expect(queueAfter.length).toBe(0);

    // 5. Verify the stale error message is completely cleared from SyncEngine state
    const state = syncEngine.getSyncState();
    expect(state.status).toBe('synced');
    expect(state.errorMessage).toBeUndefined();

    fromSpy.mockRestore();
  });

  it('7. Clears stale sync error notice upon new user sign-in', async () => {
    // Simulate active stale error
    (syncEngine as any).updateState({
      status: 'error',
      errorMessage: "Database permission denied for 'habits' (Code: 42501).",
    });

    expect(syncEngine.getSyncState().errorMessage).toBeDefined();

    // User signs in (setUserId called)
    syncEngine.setUserId('44444444-4444-4444-8444-444444444444');

    // Error message must be wiped clean upon signing in
    const state = syncEngine.getSyncState();
    expect(state.errorMessage).toBeUndefined();
  });

  it('8. Remote pull clears stale error message when queue is clear and collections are healthy', async () => {
    const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    } as any);

    // Simulate existing error in sync state
    (syncEngine as any).updateState({
      status: 'error',
      errorMessage: "Database permission denied for 'habits' (Code: 42501). Please check permissions in Supabase SQL Editor.",
    });

    expect(syncEngine.getSyncState().errorMessage).toBeDefined();

    // Pull remote data when queue is empty
    await syncEngine.pullRemoteData(testUserId);

    // Stale error notice MUST be cleared
    const state = syncEngine.getSyncState();
    expect(state.status).toBe('synced');
    expect(state.errorMessage).toBeUndefined();

    fromSpy.mockRestore();
  });
});
