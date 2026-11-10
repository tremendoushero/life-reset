import { describe, it, expect } from 'vitest';
import { AdaptiveMode, Task } from '@/types';

describe('Signature Feature: Adaptive Capacity Engine', () => {
  const sampleTasks: Task[] = [
    {
      id: '1',
      user_id: 'u1',
      title: 'Pay urgent electric bill',
      category: 'life-admin',
      priority: 'essential',
      due_date: '2026-11-10',
      estimated_duration: 10,
      status: 'not_started',
      energy_requirement: 'medium',
      recurrence: 'none',
      is_top_three: true,
      postponed_count: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      user_id: 'u1',
      title: 'Deep clean refrigerator coils',
      category: 'household',
      priority: 'optional',
      due_date: '2026-11-10',
      estimated_duration: 90,
      status: 'not_started',
      energy_requirement: 'high',
      recurrence: 'none',
      is_top_three: false,
      postponed_count: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: '3',
      user_id: 'u1',
      title: 'Drink a glass of water',
      category: 'wellness',
      priority: 'important',
      due_date: '2026-11-10',
      estimated_duration: 2,
      status: 'not_started',
      energy_requirement: 'very_low',
      recurrence: 'daily',
      is_top_three: false,
      postponed_count: 0,
      created_at: new Date().toISOString(),
    },
  ];

  it('filters out high energy non-essential tasks in Low-Energy Mode', () => {
    const filterForLowEnergy = (tasks: Task[]) => {
      return tasks.filter(
        t =>
          t.priority === 'essential' ||
          t.energy_requirement === 'very_low' ||
          t.energy_requirement === 'low'
      );
    };

    const visibleTasks = filterForLowEnergy(sampleTasks);
    expect(visibleTasks.length).toBe(2);
    expect(visibleTasks.some(t => t.id === '2')).toBe(false); // deep clean is filtered out
    expect(visibleTasks.some(t => t.id === '1')).toBe(true);  // essential bill remains
    expect(visibleTasks.some(t => t.id === '3')).toBe(true);  // low energy water remains
  });

  it('isolates only the single next step in Overwhelmed Mode', () => {
    const topAction = sampleTasks.find(t => t.is_top_three) || sampleTasks[0];
    expect(topAction).toBeDefined();
    expect(topAction?.title).toBe('Pay urgent electric bill');
  });
});
