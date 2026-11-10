import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Task,
  BrainDumpEntry,
  Goal,
  Project,
  Habit,
  HabitLog,
  MoodEntry,
  EnergyEntry,
  JournalEntry,
  GratitudeEntry,
  DopamineActivity,
  FocusSession,
  CalendarEvent,
  Bill,
  Transaction,
  SavingsGoal,
  Debt,
  LifeAdminItem,
  FollowUpItem,
  HouseholdTask,
  HouseholdInventoryItem,
  WeeklyReview,
  MonthlyReview,
  UserPreferences,
} from '@/types';
import {
  demoTasks,
  demoBrainDumps,
  demoGoals,
  demoProjects,
  demoHabits,
  demoHabitLogs,
  demoMoods,
  demoEnergies,
  demoJournals,
  demoGratitudes,
  demoDopamineMenu,
  demoFocusSessions,
  demoCalendarEvents,
  demoBills,
  demoTransactions,
  demoSavings,
  demoDebts,
  demoLifeAdmin,
  demoFollowUps,
  demoHousehold,
  demoInventory,
  demoPreferences,
} from '@/lib/demoData';
import { supabase, isSupabaseConfigured, storage, offlineQueue } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { format, addDays } from 'date-fns';

export type SaveState = 'saved' | 'saving' | 'offline' | 'error';

interface DataContextType {
  saveState: SaveState;

  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'postponed_count'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  restoreTask: (id: string) => Promise<void>;
  postponeTask: (id: string, newDate?: string) => Promise<void>;
  addSubtask: (taskId: string, title: string, estimatedMinutes?: number) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  breakdownTaskIntoSteps: (taskId: string, steps: { title: string; estimated_minutes: number }[]) => Promise<void>;
  setTopThreeTaskIds: (ids: string[]) => Promise<void>;
  toggleTopThree: (id: string) => Promise<{ success: boolean; message?: string }>;

  // Brain Dump
  brainDumps: BrainDumpEntry[];
  addBrainDump: (content: string, category?: string) => Promise<BrainDumpEntry>;
  convertBrainDumpToTask: (id: string, targetDate?: string) => Promise<Task>;
  archiveBrainDump: (id: string) => Promise<void>;
  deleteBrainDump: (id: string) => Promise<void>;

  // Goals & Projects
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Habits
  habits: Habit[];
  habitLogs: HabitLog[];
  addHabit: (habit: Omit<Habit, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  toggleHabitLog: (habitId: string, date: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;

  // Wellness & Mind
  moods: MoodEntry[];
  addMood: (mood: MoodEntry['mood'], notes?: string, tags?: string[]) => Promise<void>;
  energies: EnergyEntry[];
  addEnergy: (level: EnergyEntry['energy_level'], timeOfDay?: EnergyEntry['time_of_day'], notes?: string) => Promise<void>;
  journals: JournalEntry[];
  addJournal: (content: string, title?: string, prompt?: string, tags?: string[]) => Promise<void>;
  gratitudes: GratitudeEntry[];
  addGratitude: (text: string) => Promise<void>;
  dopamineMenu: DopamineActivity[];
  addDopamineActivity: (activity: Omit<DopamineActivity, 'id' | 'user_id'>) => Promise<void>;
  toggleDopamineFavorite: (id: string) => Promise<void>;

  // Focus Sessions
  focusSessions: FocusSession[];
  recordFocusSession: (session: Omit<FocusSession, 'id' | 'user_id' | 'created_at'>) => Promise<void>;

  // Calendar
  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: Omit<CalendarEvent, 'id' | 'user_id'>) => Promise<void>;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteCalendarEvent: (id: string) => Promise<void>;

  // Money
  bills: Bill[];
  addBill: (bill: Omit<Bill, 'id' | 'user_id'>) => Promise<void>;
  toggleBillPaid: (id: string) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'user_id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  savings: SavingsGoal[];
  addSavings: (s: Omit<SavingsGoal, 'id' | 'user_id'>) => Promise<void>;
  updateSavingsAmount: (id: string, amount: number) => Promise<void>;
  debts: Debt[];
  addDebt: (d: Omit<Debt, 'id' | 'user_id'>) => Promise<void>;
  updateDebtBalance: (id: string, newBalance: number) => Promise<void>;

  // Life Admin & Follow-ups
  lifeAdmin: LifeAdminItem[];
  addLifeAdmin: (item: Omit<LifeAdminItem, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateLifeAdminStatus: (id: string, status: LifeAdminItem['status']) => Promise<void>;
  deleteLifeAdmin: (id: string) => Promise<void>;
  followUps: FollowUpItem[];
  addFollowUp: (item: Omit<FollowUpItem, 'id' | 'user_id'>) => Promise<void>;
  updateFollowUpStatus: (id: string, status: FollowUpItem['status']) => Promise<void>;
  deleteFollowUp: (id: string) => Promise<void>;

  // Household
  householdTasks: HouseholdTask[];
  addHouseholdTask: (task: Omit<HouseholdTask, 'id' | 'user_id'>) => Promise<void>;
  toggleHouseholdTask: (id: string) => Promise<void>;
  householdInventory: HouseholdInventoryItem[];
  updateInventoryQuantity: (id: string, delta: number) => Promise<void>;
  addInventoryItem: (item: Omit<HouseholdInventoryItem, 'id' | 'user_id'>) => Promise<void>;

  // Reviews
  weeklyReviews: WeeklyReview[];
  addWeeklyReview: (review: Omit<WeeklyReview, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  monthlyReviews: MonthlyReview[];
  addMonthlyReview: (review: Omit<MonthlyReview, 'id' | 'user_id' | 'created_at'>) => Promise<void>;

  // Dashboard customization
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;

  // Signature Differentiator: Gentle Restart
  resetMyDay: (selectedTaskIdsToKeep: string[]) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDemo } = useAuth();
  const [saveState, setSaveState] = useState<SaveState>('saved');

  // State slices initialized from storage or realistic starter data
  const [tasks, setTasks] = useState<Task[]>(() => storage.get('tasks', demoTasks));
  const [brainDumps, setBrainDumps] = useState<BrainDumpEntry[]>(() => storage.get('brain_dumps', demoBrainDumps));
  const [goals, setGoals] = useState<Goal[]>(() => storage.get('goals', demoGoals));
  const [projects, setProjects] = useState<Project[]>(() => storage.get('projects', demoProjects));
  const [habits, setHabits] = useState<Habit[]>(() => storage.get('habits', demoHabits));
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>(() => storage.get('habit_logs', demoHabitLogs));
  const [moods, setMoods] = useState<MoodEntry[]>(() => storage.get('moods', demoMoods));
  const [energies, setEnergies] = useState<EnergyEntry[]>(() => storage.get('energies', demoEnergies));
  const [journals, setJournals] = useState<JournalEntry[]>(() => storage.get('journals', demoJournals));
  const [gratitudes, setGratitudes] = useState<GratitudeEntry[]>(() => storage.get('gratitudes', demoGratitudes));
  const [dopamineMenu, setDopamineMenu] = useState<DopamineActivity[]>(() => storage.get('dopamine', demoDopamineMenu));
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() => storage.get('focus_sessions', demoFocusSessions));
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => storage.get('calendar_events', demoCalendarEvents));
  const [bills, setBills] = useState<Bill[]>(() => storage.get('bills', demoBills));
  const [transactions, setTransactions] = useState<Transaction[]>(() => storage.get('transactions', demoTransactions));
  const [savings, setSavings] = useState<SavingsGoal[]>(() => storage.get('savings', demoSavings));
  const [debts, setDebts] = useState<Debt[]>(() => storage.get('debts', demoDebts));
  const [lifeAdmin, setLifeAdmin] = useState<LifeAdminItem[]>(() => storage.get('life_admin', demoLifeAdmin));
  const [followUps, setFollowUps] = useState<FollowUpItem[]>(() => storage.get('follow_ups', demoFollowUps));
  const [householdTasks, setHouseholdTasks] = useState<HouseholdTask[]>(() => storage.get('household_tasks', demoHousehold));
  const [householdInventory, setHouseholdInventory] = useState<HouseholdInventoryItem[]>(() => storage.get('household_inv', demoInventory));
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>(() => storage.get('weekly_reviews', []));
  const [monthlyReviews, setMonthlyReviews] = useState<MonthlyReview[]>(() => storage.get('monthly_reviews', []));
  const [preferences, setPreferences] = useState<UserPreferences>(() => storage.get('user_preferences', demoPreferences));

  // Sync to local storage on changes
  useEffect(() => { storage.set('tasks', tasks); }, [tasks]);
  useEffect(() => { storage.set('brain_dumps', brainDumps); }, [brainDumps]);
  useEffect(() => { storage.set('goals', goals); }, [goals]);
  useEffect(() => { storage.set('projects', projects); }, [projects]);
  useEffect(() => { storage.set('habits', habits); }, [habits]);
  useEffect(() => { storage.set('habit_logs', habitLogs); }, [habitLogs]);
  useEffect(() => { storage.set('moods', moods); }, [moods]);
  useEffect(() => { storage.set('energies', energies); }, [energies]);
  useEffect(() => { storage.set('journals', journals); }, [journals]);
  useEffect(() => { storage.set('gratitudes', gratitudes); }, [gratitudes]);
  useEffect(() => { storage.set('dopamine', dopamineMenu); }, [dopamineMenu]);
  useEffect(() => { storage.set('focus_sessions', focusSessions); }, [focusSessions]);
  useEffect(() => { storage.set('calendar_events', calendarEvents); }, [calendarEvents]);
  useEffect(() => { storage.set('bills', bills); }, [bills]);
  useEffect(() => { storage.set('transactions', transactions); }, [transactions]);
  useEffect(() => { storage.set('savings', savings); }, [savings]);
  useEffect(() => { storage.set('debts', debts); }, [debts]);
  useEffect(() => { storage.set('life_admin', lifeAdmin); }, [lifeAdmin]);
  useEffect(() => { storage.set('follow_ups', followUps); }, [followUps]);
  useEffect(() => { storage.set('household_tasks', householdTasks); }, [householdTasks]);
  useEffect(() => { storage.set('household_inv', householdInventory); }, [householdInventory]);
  useEffect(() => { storage.set('weekly_reviews', weeklyReviews); }, [weeklyReviews]);
  useEffect(() => { storage.set('monthly_reviews', monthlyReviews); }, [monthlyReviews]);
  useEffect(() => { storage.set('user_preferences', preferences); }, [preferences]);

  // Load from Supabase if online and configured
  useEffect(() => {
    if (isSupabaseConfigured && user && !isDemo) {
      const loadRemoteData = async () => {
        try {
          setSaveState('saving');
          const [
            tasksRes,
            brainDumpRes,
            goalsRes,
            habitsRes,
            moodsRes,
            energiesRes,
            billsRes,
            adminRes,
          ] = await Promise.all([
            supabase.from('tasks').select('*, subtasks:task_subtasks(*)').eq('user_id', user.id),
            supabase.from('brain_dump_entries').select('*').eq('user_id', user.id),
            supabase.from('goals').select('*, milestones:goal_milestones(*)').eq('user_id', user.id),
            supabase.from('habits').select('*').eq('user_id', user.id),
            supabase.from('mood_entries').select('*').eq('user_id', user.id).order('date', { ascending: false }),
            supabase.from('energy_entries').select('*').eq('user_id', user.id).order('date', { ascending: false }),
            supabase.from('bills').select('*').eq('user_id', user.id),
            supabase.from('life_admin_items').select('*').eq('user_id', user.id),
          ]);

          if (tasksRes.data && tasksRes.data.length > 0) setTasks(tasksRes.data);
          if (brainDumpRes.data && brainDumpRes.data.length > 0) setBrainDumps(brainDumpRes.data);
          if (goalsRes.data && goalsRes.data.length > 0) setGoals(goalsRes.data);
          if (habitsRes.data && habitsRes.data.length > 0) setHabits(habitsRes.data);
          if (moodsRes.data && moodsRes.data.length > 0) setMoods(moodsRes.data);
          if (energiesRes.data && energiesRes.data.length > 0) setEnergies(energiesRes.data);
          if (billsRes.data && billsRes.data.length > 0) setBills(billsRes.data);
          if (adminRes.data && adminRes.data.length > 0) setLifeAdmin(adminRes.data);
          setSaveState('saved');
        } catch (e) {
          console.warn('Could not sync remote data, continuing offline:', e);
          setSaveState('offline');
        }
      };

      loadRemoteData();
    }
  }, [user, isDemo]);

  // ----------------------------------------------------
  // Task Actions
  // ----------------------------------------------------
  const addTask = async (taskData: Omit<Task, 'id' | 'user_id' | 'created_at' | 'postponed_count'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      user_id: user?.id || 'demo_user',
      postponed_count: 0,
      created_at: new Date().toISOString(),
      subtasks: [],
    };
    setTasks(prev => [newTask, ...prev]);

    if (isSupabaseConfigured && user && !isDemo) {
      try {
        setSaveState('saving');
        await supabase.from('tasks').insert(newTask);
        setSaveState('saved');
      } catch (e) {
        offlineQueue.add('tasks', 'insert', newTask);
        setSaveState('offline');
      }
    }
    return newTask;
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t)));
    if (isSupabaseConfigured && user && !isDemo) {
      try {
        setSaveState('saving');
        await supabase.from('tasks').update(updates).eq('id', id);
        setSaveState('saved');
      } catch (e) {
        offlineQueue.add('tasks', 'update', { id, ...updates });
        setSaveState('offline');
      }
    }
  };

  const toggleTaskCompletion = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const isCompleted = task.status === 'completed';
    const newStatus = isCompleted ? 'not_started' : 'completed';
    const completedAt = isCompleted ? null : new Date().toISOString();

    await updateTask(id, {
      status: newStatus,
      completed_at: completedAt,
    });
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (isSupabaseConfigured && user && !isDemo) {
      try {
        await supabase.from('tasks').delete().eq('id', id);
      } catch {
        offlineQueue.add('tasks', 'delete', { id });
      }
    }
  };

  const restoreTask = async (id: string) => {
    await updateTask(id, { status: 'not_started', completed_at: null });
  };

  const postponeTask = async (id: string, newDate?: string) => {
    const targetDate = newDate || format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    await updateTask(id, {
      due_date: targetDate,
      postponed_count: (task.postponed_count || 0) + 1,
    });
  };

  const addSubtask = async (taskId: string, title: string, estimatedMinutes = 5) => {
    const newSubtask = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      task_id: taskId,
      user_id: user?.id || 'demo_user',
      title,
      estimated_minutes: estimatedMinutes,
      is_completed: false,
      sort_order: 0,
      created_at: new Date().toISOString(),
    };

    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, subtasks: [...(t.subtasks || []), newSubtask] }
          : t
      )
    );

    if (isSupabaseConfigured && user && !isDemo) {
      await supabase.from('task_subtasks').insert(newSubtask);
    }
  };

  const toggleSubtask = async (taskId: string, subtaskId: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== taskId) return t;
        const updatedSubs = (t.subtasks || []).map(s =>
          s.id === subtaskId ? { ...s, is_completed: !s.is_completed } : s
        );
        return { ...t, subtasks: updatedSubs };
      })
    );
  };

  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== taskId) return t;
        return { ...t, subtasks: (t.subtasks || []).filter(s => s.id !== subtaskId) };
      })
    );
  };

  // Tiny-step rescue breakdown helper
  const breakdownTaskIntoSteps = async (
    taskId: string,
    steps: { title: string; estimated_minutes: number }[]
  ) => {
    const formattedSubtasks = steps.map((s, idx) => ({
      id: `sub_${Date.now()}_${idx}`,
      task_id: taskId,
      user_id: user?.id || 'demo_user',
      title: s.title,
      estimated_minutes: s.estimated_minutes,
      is_completed: false,
      sort_order: idx,
    }));

    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, subtasks: [...(t.subtasks || []), ...formattedSubtasks] }
          : t
      )
    );
  };

  // Today's Top Three Management with database persistence
  const setTopThreeTaskIds = async (ids: string[]) => {
    const limitedIds = ids.slice(0, 3);
    setTasks(prev =>
      prev.map(t => ({
        ...t,
        is_top_three: limitedIds.includes(t.id),
      }))
    );

    if (isSupabaseConfigured && user && !isDemo) {
      try {
        setSaveState('saving');
        // Update each task's is_top_three in Supabase
        await Promise.all(
          tasks.map(t => {
            const shouldBeTopThree = limitedIds.includes(t.id);
            if (t.is_top_three !== shouldBeTopThree) {
              return supabase.from('tasks').update({ is_top_three: shouldBeTopThree }).eq('id', t.id);
            }
            return Promise.resolve();
          })
        );
        setSaveState('saved');
      } catch (e) {
        setSaveState('offline');
      }
    }
  };

  const toggleTopThree = async (id: string): Promise<{ success: boolean; message?: string }> => {
    const targetTask = tasks.find(t => t.id === id);
    if (!targetTask) return { success: false, message: 'Task not found' };

    const currentTopThree = tasks.filter(t => t.is_top_three);

    if (targetTask.is_top_three) {
      await updateTask(id, { is_top_three: false });
      return { success: true };
    } else {
      if (currentTopThree.length >= 3) {
        return {
          success: false,
          message: "You already have 3 priority tasks selected. Deselect one first to maintain focus!",
        };
      }
      await updateTask(id, { is_top_three: true });
      return { success: true };
    }
  };

  // ----------------------------------------------------
  // Brain Dump Actions
  // ----------------------------------------------------
  const addBrainDump = async (content: string, category = 'uncategorized') => {
    const entry: BrainDumpEntry = {
      id: `bd_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      user_id: user?.id || 'demo_user',
      content,
      category,
      is_processed: false,
      is_archived: false,
      created_at: new Date().toISOString(),
    };
    setBrainDumps(prev => [entry, ...prev]);

    if (isSupabaseConfigured && user && !isDemo) {
      await supabase.from('brain_dump_entries').insert(entry);
    }
    return entry;
  };

  const convertBrainDumpToTask = async (id: string, targetDate?: string) => {
    const item = brainDumps.find(b => b.id === id);
    if (!item) throw new Error('Item not found');

    const createdTask = await addTask({
      title: item.content,
      category: item.category !== 'uncategorized' ? item.category : 'general',
      priority: 'important',
      due_date: targetDate || format(new Date(), 'yyyy-MM-dd'),
      estimated_duration: 15,
      status: 'not_started',
      energy_requirement: 'medium',
      recurrence: 'none',
      is_top_three: false,
    });

    setBrainDumps(prev =>
      prev.map(b => (b.id === id ? { ...b, is_processed: true, converted_task_id: createdTask.id } : b))
    );

    return createdTask;
  };

  const archiveBrainDump = async (id: string) => {
    setBrainDumps(prev => prev.map(b => (b.id === id ? { ...b, is_archived: true } : b)));
  };

  const deleteBrainDump = async (id: string) => {
    setBrainDumps(prev => prev.filter(b => b.id !== id));
  };

  // ----------------------------------------------------
  // Goals & Projects
  // ----------------------------------------------------
  const addGoal = async (goal: Omit<Goal, 'id' | 'user_id' | 'created_at'>) => {
    const newGoal: Goal = {
      ...goal,
      id: `goal_${Date.now()}`,
      user_id: user?.id || 'demo_user',
      created_at: new Date().toISOString(),
      milestones: [],
    };
    setGoals(prev => [newGoal, ...prev]);
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    setGoals(prev => prev.map(g => (g.id === id ? { ...g, ...updates } : g)));
  };

  const deleteGoal = async (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const addProject = async (project: Omit<Project, 'id' | 'user_id' | 'created_at'>) => {
    const newProj: Project = {
      ...project,
      id: `proj_${Date.now()}`,
      user_id: user?.id || 'demo_user',
      created_at: new Date().toISOString(),
    };
    setProjects(prev => [newProj, ...prev]);
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProject = async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  // ----------------------------------------------------
  // Habits & Habit Logs (No streak pressure!)
  // ----------------------------------------------------
  const addHabit = async (habit: Omit<Habit, 'id' | 'user_id' | 'created_at'>) => {
    const newHabit: Habit = {
      ...habit,
      id: `hab_${Date.now()}`,
      user_id: user?.id || 'demo_user',
      created_at: new Date().toISOString(),
    };
    setHabits(prev => [newHabit, ...prev]);
  };

  const updateHabit = async (id: string, updates: Partial<Habit>) => {
    setHabits(prev => prev.map(h => (h.id === id ? { ...h, ...updates } : h)));
  };

  const toggleHabitLog = async (habitId: string, date: string) => {
    const existingIndex = habitLogs.findIndex(l => l.habit_id === habitId && l.date === date);
    if (existingIndex >= 0) {
      setHabitLogs(prev => prev.filter((_, idx) => idx !== existingIndex));
    } else {
      const newLog: HabitLog = {
        id: `hl_${Date.now()}`,
        habit_id: habitId,
        user_id: user?.id || 'demo_user',
        date,
        completed: true,
        created_at: new Date().toISOString(),
      };
      setHabitLogs(prev => [...prev, newLog]);
    }
  };

  const deleteHabit = async (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setHabitLogs(prev => prev.filter(l => l.habit_id !== id));
  };

  // ----------------------------------------------------
  // Wellness & Mind with Supabase Persistence
  // ----------------------------------------------------
  const addMood = async (mood: MoodEntry['mood'], notes?: string, tags?: string[]) => {
    const entry: MoodEntry = {
      id: `m_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      user_id: user?.id || 'demo_user',
      date: format(new Date(), 'yyyy-MM-dd'),
      mood,
      notes,
      tags,
      created_at: new Date().toISOString(),
    };
    setMoods(prev => [entry, ...prev]);

    if (isSupabaseConfigured && user && !isDemo) {
      try {
        setSaveState('saving');
        await supabase.from('mood_entries').insert(entry);
        setSaveState('saved');
      } catch (e) {
        offlineQueue.add('mood_entries', 'insert', entry);
        setSaveState('offline');
      }
    }
  };

  const addEnergy = async (level: EnergyEntry['energy_level'], timeOfDay: EnergyEntry['time_of_day'] = 'morning', notes?: string) => {
    const entry: EnergyEntry = {
      id: `e_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      user_id: user?.id || 'demo_user',
      date: format(new Date(), 'yyyy-MM-dd'),
      energy_level: level,
      time_of_day: timeOfDay,
      notes,
      created_at: new Date().toISOString(),
    };
    setEnergies(prev => [entry, ...prev]);

    if (isSupabaseConfigured && user && !isDemo) {
      try {
        setSaveState('saving');
        await Promise.all([
          supabase.from('energy_entries').insert(entry),
          supabase.from('profiles').update({ planning_capacity: level }).eq('id', user.id),
        ]);
        setSaveState('saved');
      } catch (e) {
        offlineQueue.add('energy_entries', 'insert', entry);
        setSaveState('offline');
      }
    }
  };

  const addJournal = async (content: string, title?: string, prompt?: string, tags?: string[]) => {
    const entry: JournalEntry = {
      id: `j_${Date.now()}`,
      user_id: user?.id || 'demo_user',
      date: format(new Date(), 'yyyy-MM-dd'),
      title,
      content,
      prompt,
      tags,
      created_at: new Date().toISOString(),
    };
    setJournals(prev => [entry, ...prev]);
  };

  const addGratitude = async (text: string) => {
    const entry: GratitudeEntry = {
      id: `grat_${Date.now()}`,
      user_id: user?.id || 'demo_user',
      date: format(new Date(), 'yyyy-MM-dd'),
      text,
      created_at: new Date().toISOString(),
    };
    setGratitudes(prev => [entry, ...prev]);
  };

  const addDopamineActivity = async (activity: Omit<DopamineActivity, 'id' | 'user_id'>) => {
    const newAct: DopamineActivity = {
      ...activity,
      id: `dop_${Date.now()}`,
      user_id: user?.id || 'demo_user',
    };
    setDopamineMenu(prev => [...prev, newAct]);
  };

  const toggleDopamineFavorite = async (id: string) => {
    setDopamineMenu(prev =>
      prev.map(a => (a.id === id ? { ...a, is_favorite: !a.is_favorite } : a))
    );
  };

  // ----------------------------------------------------
  // Focus Sessions
  // ----------------------------------------------------
  const recordFocusSession = async (session: Omit<FocusSession, 'id' | 'user_id' | 'created_at'>) => {
    const newSession: FocusSession = {
      ...session,
      id: `foc_${Date.now()}`,
      user_id: user?.id || 'demo_user',
      created_at: new Date().toISOString(),
    };
    setFocusSessions(prev => [newSession, ...prev]);
  };

  // ----------------------------------------------------
  // Calendar
  // ----------------------------------------------------
  const addCalendarEvent = async (event: Omit<CalendarEvent, 'id' | 'user_id'>) => {
    const newEv: CalendarEvent = {
      ...event,
      id: `cal_${Date.now()}`,
      user_id: user?.id || 'demo_user',
    };
    setCalendarEvents(prev => [...prev, newEv]);
  };

  const updateCalendarEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    setCalendarEvents(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCalendarEvent = async (id: string) => {
    setCalendarEvents(prev => prev.filter(c => c.id !== id));
  };

  // ----------------------------------------------------
  // Money
  // ----------------------------------------------------
  const addBill = async (bill: Omit<Bill, 'id' | 'user_id'>) => {
    const newBill: Bill = { ...bill, id: `bill_${Date.now()}`, user_id: user?.id || 'demo_user' };
    setBills(prev => [...prev, newBill]);
  };

  const toggleBillPaid = async (id: string) => {
    setBills(prev =>
      prev.map(b => {
        if (b.id !== id) return b;
        const isPaid = b.payment_status === 'paid';
        return {
          ...b,
          payment_status: isPaid ? 'pending' : 'paid',
          paid_date: isPaid ? null : format(new Date(), 'yyyy-MM-dd'),
        };
      })
    );
  };

  const deleteBill = async (id: string) => {
    setBills(prev => prev.filter(b => b.id !== id));
  };

  const addTransaction = async (tx: Omit<Transaction, 'id' | 'user_id'>) => {
    const newTx: Transaction = { ...tx, id: `tx_${Date.now()}`, user_id: user?.id || 'demo_user' };
    setTransactions(prev => [newTx, ...prev]);
  };

  const deleteTransaction = async (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addSavings = async (s: Omit<SavingsGoal, 'id' | 'user_id'>) => {
    const newSav: SavingsGoal = { ...s, id: `sav_${Date.now()}`, user_id: user?.id || 'demo_user' };
    setSavings(prev => [...prev, newSav]);
  };

  const updateSavingsAmount = async (id: string, amount: number) => {
    setSavings(prev => prev.map(s => (s.id === id ? { ...s, current_amount: amount } : s)));
  };

  const addDebt = async (d: Omit<Debt, 'id' | 'user_id'>) => {
    const newDebt: Debt = { ...d, id: `debt_${Date.now()}`, user_id: user?.id || 'demo_user' };
    setDebts(prev => [...prev, newDebt]);
  };

  const updateDebtBalance = async (id: string, newBalance: number) => {
    setDebts(prev => prev.map(d => (d.id === id ? { ...d, current_balance: newBalance } : d)));
  };

  // ----------------------------------------------------
  // Life Admin & Follow-ups
  // ----------------------------------------------------
  const addLifeAdmin = async (item: Omit<LifeAdminItem, 'id' | 'user_id' | 'created_at'>) => {
    const newItem: LifeAdminItem = {
      ...item,
      id: `admin_${Date.now()}`,
      user_id: user?.id || 'demo_user',
      created_at: new Date().toISOString(),
    };
    setLifeAdmin(prev => [newItem, ...prev]);
  };

  const updateLifeAdminStatus = async (id: string, status: LifeAdminItem['status']) => {
    setLifeAdmin(prev => prev.map(a => (a.id === id ? { ...a, status } : a)));
  };

  const deleteLifeAdmin = async (id: string) => {
    setLifeAdmin(prev => prev.filter(a => a.id !== id));
  };

  const addFollowUp = async (item: Omit<FollowUpItem, 'id' | 'user_id'>) => {
    const newFu: FollowUpItem = { ...item, id: `fu_${Date.now()}`, user_id: user?.id || 'demo_user' };
    setFollowUps(prev => [newFu, ...prev]);
  };

  const updateFollowUpStatus = async (id: string, status: FollowUpItem['status']) => {
    setFollowUps(prev => prev.map(f => (f.id === id ? { ...f, status } : f)));
  };

  const deleteFollowUp = async (id: string) => {
    setFollowUps(prev => prev.filter(f => f.id !== id));
  };

  // ----------------------------------------------------
  // Household
  // ----------------------------------------------------
  const addHouseholdTask = async (task: Omit<HouseholdTask, 'id' | 'user_id'>) => {
    const newTask: HouseholdTask = { ...task, id: `hh_${Date.now()}`, user_id: user?.id || 'demo_user' };
    setHouseholdTasks(prev => [...prev, newTask]);
  };

  const toggleHouseholdTask = async (id: string) => {
    setHouseholdTasks(prev =>
      prev.map(h => (h.id === id ? { ...h, is_completed: !h.is_completed, last_completed: format(new Date(), 'yyyy-MM-dd') } : h))
    );
  };

  const addInventoryItem = async (item: Omit<HouseholdInventoryItem, 'id' | 'user_id'>) => {
    const newInv: HouseholdInventoryItem = { ...item, id: `inv_${Date.now()}`, user_id: user?.id || 'demo_user' };
    setHouseholdInventory(prev => [...prev, newInv]);
  };

  const updateInventoryQuantity = async (id: string, delta: number) => {
    setHouseholdInventory(prev =>
      prev.map(i => (i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
    );
  };

  // ----------------------------------------------------
  // Reviews
  // ----------------------------------------------------
  const addWeeklyReview = async (review: Omit<WeeklyReview, 'id' | 'user_id' | 'created_at'>) => {
    const newRev: WeeklyReview = {
      ...review,
      id: `wrev_${Date.now()}`,
      user_id: user?.id || 'demo_user',
      created_at: new Date().toISOString(),
    };
    setWeeklyReviews(prev => [newRev, ...prev]);
  };

  const addMonthlyReview = async (review: Omit<MonthlyReview, 'id' | 'user_id' | 'created_at'>) => {
    const newRev: MonthlyReview = {
      ...review,
      id: `mrev_${Date.now()}`,
      user_id: user?.id || 'demo_user',
      created_at: new Date().toISOString(),
    };
    setMonthlyReviews(prev => [newRev, ...prev]);
  };

  // ----------------------------------------------------
  // Preferences
  // ----------------------------------------------------
  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  // ----------------------------------------------------
  // SIGNATURE FEATURE: GENTLE RESTART SYSTEM
  // Safe, no-guilt reset of the day
  // Does NOT delete tasks or history. Only cleans overdue flags & focuses today.
  // ----------------------------------------------------
  const resetMyDay = async (selectedTaskIdsToKeep: string[]) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    setTasks(prev =>
      prev.map(t => {
        // If task was selected to keep for today
        if (selectedTaskIdsToKeep.includes(t.id)) {
          return {
            ...t,
            due_date: todayStr,
            is_top_three: true,
            status: t.status === 'completed' ? 'completed' : 'not_started',
          };
        }

        // If overdue or not selected, gently park in inbox or archive
        if (t.status !== 'completed' && t.due_date && t.due_date < todayStr) {
          return {
            ...t,
            due_date: null,
            is_top_three: false,
            status: 'inbox',
          };
        }

        return t;
      })
    );
  };

  return (
    <DataContext.Provider
      value={{
        saveState,
        tasks,
        addTask,
        updateTask,
        toggleTaskCompletion,
        deleteTask,
        restoreTask,
        postponeTask,
        addSubtask,
        toggleSubtask,
        deleteSubtask,
        breakdownTaskIntoSteps,
        setTopThreeTaskIds,
        toggleTopThree,
        brainDumps,
        addBrainDump,
        convertBrainDumpToTask,
        archiveBrainDump,
        deleteBrainDump,
        goals,
        addGoal,
        updateGoal,
        deleteGoal,
        projects,
        addProject,
        updateProject,
        deleteProject,
        habits,
        habitLogs,
        addHabit,
        updateHabit,
        toggleHabitLog,
        deleteHabit,
        moods,
        addMood,
        energies,
        addEnergy,
        journals,
        addJournal,
        gratitudes,
        addGratitude,
        dopamineMenu,
        addDopamineActivity,
        toggleDopamineFavorite,
        focusSessions,
        recordFocusSession,
        calendarEvents,
        addCalendarEvent,
        updateCalendarEvent,
        deleteCalendarEvent,
        bills,
        addBill,
        toggleBillPaid,
        deleteBill,
        transactions,
        addTransaction,
        deleteTransaction,
        savings,
        addSavings,
        updateSavingsAmount,
        debts,
        addDebt,
        updateDebtBalance,
        lifeAdmin,
        addLifeAdmin,
        updateLifeAdminStatus,
        deleteLifeAdmin,
        followUps,
        addFollowUp,
        updateFollowUpStatus,
        deleteFollowUp,
        householdTasks,
        addHouseholdTask,
        toggleHouseholdTask,
        householdInventory,
        addInventoryItem,
        updateInventoryQuantity,
        weeklyReviews,
        addWeeklyReview,
        monthlyReviews,
        addMonthlyReview,
        preferences,
        updatePreferences,
        resetMyDay,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

