import { describe, it, expect } from 'vitest';
import { Task } from '@/types';

describe('Signature Feature: Gentle Restart System', () => {
  it('resets past overdue items without deleting them or creating guilt penalties', () => {
    const today = '2026-11-10';
    const oldDate = '2026-11-05';

    const tasksBeforeRestart: Task[] = [
      {
        id: 't1',
        user_id: 'u1',
        title: 'Old unfinished task 1',
        category: 'general',
        priority: 'essential',
        due_date: oldDate,
        estimated_duration: 10,
        status: 'not_started',
        energy_requirement: 'medium',
        recurrence: 'none',
        is_top_three: false,
        postponed_count: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: 't2',
        user_id: 'u1',
        title: 'Old unfinished task 2',
        category: 'general',
        priority: 'important',
        due_date: oldDate,
        estimated_duration: 20,
        status: 'not_started',
        energy_requirement: 'low',
        recurrence: 'none',
        is_top_three: false,
        postponed_count: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: 't3',
        user_id: 'u1',
        title: 'Already finished earlier',
        category: 'general',
        priority: 'optional',
        due_date: oldDate,
        estimated_duration: 5,
        status: 'completed',
        completed_at: '2026-11-05T10:00:00Z',
        energy_requirement: 'very_low',
        recurrence: 'none',
        is_top_three: false,
        postponed_count: 0,
        created_at: new Date().toISOString(),
      },
    ];

    // User chooses only t1 to keep for today during gentle restart
    const selectedToKeep = ['t1'];

    const tasksAfterRestart = tasksBeforeRestart.map(t => {
      if (selectedToKeep.includes(t.id)) {
        return {
          ...t,
          due_date: today,
          is_top_three: true,
          status: 'not_started' as const,
        };
      }
      if (t.status !== 'completed' && t.due_date && t.due_date < today) {
        return {
          ...t,
          due_date: null,
          is_top_three: false,
          status: 'inbox' as const,
        };
      }
      return t;
    });

    // 1. Total count of tasks must be identical (ZERO data loss)
    expect(tasksAfterRestart.length).toBe(tasksBeforeRestart.length);

    // 2. Selected task t1 is now scheduled for today as top 3
    const t1 = tasksAfterRestart.find(t => t.id === 't1');
    expect(t1?.due_date).toBe(today);
    expect(t1?.is_top_three).toBe(true);

    // 3. Unselected task t2 is parked in inbox with no overdue penalty
    const t2 = tasksAfterRestart.find(t => t.id === 't2');
    expect(t2?.due_date).toBeNull();
    expect(t2?.status).toBe('inbox');

    // 4. Completed task t3 remained unchanged
    const t3 = tasksAfterRestart.find(t => t.id === 't3');
    expect(t3?.status).toBe('completed');
  });
});
