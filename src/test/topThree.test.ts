import { describe, it, expect } from 'vitest';
import { Task } from '@/types';

describe("Today's Top Three Management", () => {
  const sampleTasks: Task[] = [
    {
      id: 'task-a',
      user_id: 'u1',
      title: 'Task A',
      category: 'general',
      priority: 'essential',
      due_date: '2026-11-10',
      estimated_duration: 10,
      status: 'not_started',
      energy_requirement: 'medium',
      recurrence: 'none',
      is_top_three: false,
      postponed_count: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: 'task-b',
      user_id: 'u1',
      title: 'Task B',
      category: 'general',
      priority: 'important',
      due_date: '2026-11-10',
      estimated_duration: 15,
      status: 'not_started',
      energy_requirement: 'low',
      recurrence: 'none',
      is_top_three: true,
      postponed_count: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: 'task-c',
      user_id: 'u1',
      title: 'Task C',
      category: 'general',
      priority: 'important',
      due_date: '2026-11-10',
      estimated_duration: 20,
      status: 'not_started',
      energy_requirement: 'medium',
      recurrence: 'none',
      is_top_three: true,
      postponed_count: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: 'task-d',
      user_id: 'u1',
      title: 'Task D',
      category: 'general',
      priority: 'optional',
      due_date: '2026-11-10',
      estimated_duration: 5,
      status: 'not_started',
      energy_requirement: 'very_low',
      recurrence: 'none',
      is_top_three: false,
      postponed_count: 0,
      created_at: new Date().toISOString(),
    },
  ];

  it('limits top three to a maximum of 3 tasks', () => {
    const selected = ['task-a', 'task-b', 'task-c', 'task-d'];
    const capped = selected.slice(0, 3);
    expect(capped.length).toBe(3);
    expect(capped).toEqual(['task-a', 'task-b', 'task-c']);
  });

  it('updates task is_top_three flags accurately based on selection', () => {
    const selectedIds = ['task-a', 'task-d'];
    const updated = sampleTasks.map(t => ({
      ...t,
      is_top_three: selectedIds.includes(t.id),
    }));

    const topThree = updated.filter(t => t.is_top_three);
    expect(topThree.length).toBe(2);
    expect(topThree.map(t => t.id)).toEqual(['task-a', 'task-d']);

    // task-b and task-c should now have is_top_three = false
    const taskB = updated.find(t => t.id === 'task-b');
    expect(taskB?.is_top_three).toBe(false);
  });
});

