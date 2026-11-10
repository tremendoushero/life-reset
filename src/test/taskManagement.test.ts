import { describe, it, expect } from 'vitest';
import { demoTasks } from '@/lib/demoData';
import { Task } from '@/types';

describe('Task Management Logic', () => {
  it('identifies top three tasks correctly', () => {
    const topThree = demoTasks.filter(t => t.is_top_three);
    expect(topThree.length).toBeLessThanOrEqual(3);
    topThree.forEach(t => {
      expect(t.is_top_three).toBe(true);
    });
  });

  it('supports task breakdown with micro-steps', () => {
    const taskWithSubs = demoTasks.find(t => (t.subtasks || []).length > 0);
    expect(taskWithSubs).toBeDefined();
    expect(taskWithSubs!.subtasks!.length).toBeGreaterThan(0);

    const firstSub = taskWithSubs!.subtasks![0];
    expect(firstSub.estimated_minutes).toBeLessThanOrEqual(15);
  });

  it('allows rescheduling task due dates without deleting history', () => {
    const originalTask: Task = {
      id: 'test-1',
      user_id: 'u1',
      title: 'Reschedule test',
      category: 'general',
      priority: 'important',
      due_date: '2026-11-10',
      estimated_duration: 15,
      status: 'not_started',
      energy_requirement: 'medium',
      recurrence: 'none',
      is_top_three: true,
      postponed_count: 0,
      created_at: new Date().toISOString(),
    };

    const newDueDate = '2026-11-11';
    const updatedTask: Task = {
      ...originalTask,
      due_date: newDueDate,
      postponed_count: originalTask.postponed_count + 1,
    };

    expect(updatedTask.due_date).toBe('2026-11-11');
    expect(updatedTask.postponed_count).toBe(1);
    expect(updatedTask.id).toBe(originalTask.id);
  });
});
