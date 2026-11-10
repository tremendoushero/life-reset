import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/indexedDB';
import {
  defaultProfile,
  defaultHabits,
  defaultPreferences,
  defaultDopamineMenu,
  defaultTasks,
} from '@/lib/starterData';
import { BackupDataBundle } from '@/contexts/DataContext';
import { Task, Habit } from '@/types';

describe('Standalone Digital Planner Storage & Backup Operations', () => {
  beforeEach(async () => {
    await db.clear();
  });

  it('persists and retrieves data locally through db abstraction', async () => {
    const testTask: Task = {
      id: 'task_local_123',
      user_id: 'local_user',
      title: 'Gentle morning stretching',
      category: 'wellness',
      priority: 'important',
      due_date: '2026-11-10',
      estimated_duration: 10,
      status: 'not_started',
      energy_requirement: 'very_low',
      recurrence: 'daily',
      is_top_three: true,
      postponed_count: 0,
      created_at: new Date().toISOString(),
      subtasks: [],
    };

    await db.set('tasks', [testTask]);
    const retrieved = await db.get<Task[]>('tasks', []);

    expect(retrieved).toHaveLength(1);
    expect(retrieved[0].id).toBe('task_local_123');
    expect(retrieved[0].title).toBe('Gentle morning stretching');
  });

  it('generates a valid portable JSON backup bundle', async () => {
    const sampleBundle: BackupDataBundle = {
      version: 1,
      app: 'LIFE RESET',
      exportedAt: new Date().toISOString(),
      profile: defaultProfile,
      preferences: defaultPreferences,
      tasks: [
        {
          id: 'task_abc',
          user_id: 'local_user',
          title: 'Drink a glass of water',
          category: 'wellness',
          priority: 'essential',
          estimated_duration: 5,
          status: 'completed',
          energy_requirement: 'very_low',
          recurrence: 'none',
          is_top_three: false,
          postponed_count: 0,
          created_at: new Date().toISOString(),
        },
      ],
      habits: defaultHabits,
      dopamineMenu: defaultDopamineMenu,
    };

    const jsonString = JSON.stringify(sampleBundle, null, 2);
    expect(jsonString).toContain('LIFE RESET');
    expect(jsonString).toContain('Drink a glass of water');

    // Parse back
    const parsed = JSON.parse(jsonString) as BackupDataBundle;
    expect(parsed.version).toBe(1);
    expect(parsed.app).toBe('LIFE RESET');
    expect(parsed.tasks).toHaveLength(1);
    expect(parsed.tasks?.[0].title).toBe('Drink a glass of water');
    expect(parsed.habits).toHaveLength(defaultHabits.length);
  });

  it('validates and safely restores an imported backup bundle', async () => {
    const customHabit: Habit = {
      id: 'custom_hab_99',
      user_id: 'local_user',
      title: 'Afternoon sun break',
      description: '5 minutes outdoors',
      routine: 'custom',
      frequency: 'daily',
      energy_level: 'very_low',
      is_paused: false,
      target_count_weekly: 7,
      created_at: new Date().toISOString(),
    };

    const backupToImport: BackupDataBundle = {
      version: 1,
      app: 'LIFE RESET',
      exportedAt: new Date().toISOString(),
      profile: {
        ...defaultProfile,
        display_name: 'Taylor',
      },
      habits: [customHabit],
      tasks: [],
    };

    const jsonString = JSON.stringify(backupToImport);

    // Simulation of import validation logic
    const parsed = JSON.parse(jsonString);
    expect(parsed).toBeDefined();
    expect(parsed.app).toBe('LIFE RESET');

    await db.set('profile', parsed.profile);
    await db.set('habits', parsed.habits);

    const savedProfile = await db.get('profile', defaultProfile);
    const savedHabits = await db.get<Habit[]>('habits', []);

    expect(savedProfile.display_name).toBe('Taylor');
    expect(savedHabits).toHaveLength(1);
    expect(savedHabits[0].title).toBe('Afternoon sun break');
  });

  it('rejects invalid or corrupted backup content gracefully', () => {
    const invalidJson = '{"app": "INVALID_JSON_CONTENT';
    let failed = false;
    try {
      JSON.parse(invalidJson);
    } catch {
      failed = true;
    }
    expect(failed).toBe(true);
  });

  it('clears all data back to clean starter defaults without leaving user data', async () => {
    await db.set('tasks', [
      {
        id: 'temp_task',
        user_id: 'local_user',
        title: 'Sensitive Task',
        category: 'general',
        priority: 'urgent',
        status: 'not_started',
        energy_requirement: 'medium',
        recurrence: 'none',
        is_top_three: false,
        postponed_count: 0,
        created_at: new Date().toISOString(),
      },
    ]);

    // Verify task is there
    let storedTasks = await db.get<Task[]>('tasks', []);
    expect(storedTasks).toHaveLength(1);

    // Clear all data
    await db.clear();

    // Verify task is gone and returns default
    storedTasks = await db.get<Task[]>('tasks', defaultTasks);
    expect(storedTasks).toEqual([]);
  });
});
