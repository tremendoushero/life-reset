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
  UserProfile,
} from '@/types';
import {
  defaultProfile,
  defaultPreferences,
  defaultHabits,
  defaultDopamineMenu,
  defaultHouseholdTasks,
  defaultTasks,
  defaultBrainDumps,
  defaultGoals,
  defaultProjects,
  defaultHabitLogs,
  defaultMoods,
  defaultEnergies,
  defaultJournals,
  defaultGratitudes,
  defaultFocusSessions,
  defaultCalendarEvents,
  defaultBills,
  defaultTransactions,
  defaultSavings,
  defaultDebts,
  defaultLifeAdmin,
  defaultFollowUps,
  defaultHouseholdInventory,
  defaultWeeklyReviews,
  defaultMonthlyReviews,
} from '@/lib/starterData';
import { db } from '@/lib/indexedDB';
import { useAuth } from './AuthContext';
import { format, addDays } from 'date-fns';

export type SaveState = 'saved' | 'saving' | 'offline' | 'error';

export interface BackupDataBundle {
  version: number;
  app: string;
  exportedAt: string;
  profile?: UserProfile;
  preferences?: UserPreferences;
  tasks?: Task[];
  brainDumps?: BrainDumpEntry[];
  goals?: Goal[];
  projects?: Project[];
  habits?: Habit[];
  habitLogs?: HabitLog[];
  moods?: MoodEntry[];
  energies?: EnergyEntry[];
  journals?: JournalEntry[];
  gratitudes?: GratitudeEntry[];
  dopamineMenu?: DopamineActivity[];
  focusSessions?: FocusSession[];
  calendarEvents?: CalendarEvent[];
  bills?: Bill[];
  transactions?: Transaction[];
  savings?: SavingsGoal[];
  debts?: Debt[];
  lifeAdmin?: LifeAdminItem[];
  followUps?: FollowUpItem[];
  householdTasks?: HouseholdTask[];
  householdInventory?: HouseholdInventoryItem[];
  weeklyReviews?: WeeklyReview[];
  monthlyReviews?: MonthlyReview[];
}

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

  // Gentle Restart
  resetMyDay: (selectedTaskIdsToKeep: string[]) => Promise<void>;

  // Standalone Digital Planner: Backup, Import, Clear
  exportBackup: () => Promise<string>;
  importBackup: (jsonString: string) => Promise<{ success: boolean; message?: string }>;
  clearAllData: () => Promise<void>;
}

const LOCAL_STORAGE_PREFIX = 'lr_standalone_';

function getInitialLocal<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${key}`);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateProfile } = useAuth();
  const [saveState, setSaveState] = useState<SaveState>('saved');

  // Synchronously initialize from local storage mirror if available, else clean starter data
  const [tasks, setTasks] = useState<Task[]>(() => getInitialLocal('tasks', defaultTasks));
  const [brainDumps, setBrainDumps] = useState<BrainDumpEntry[]>(() => getInitialLocal('brain_dumps', defaultBrainDumps));
  const [goals, setGoals] = useState<Goal[]>(() => getInitialLocal('goals', defaultGoals));
  const [projects, setProjects] = useState<Project[]>(() => getInitialLocal('projects', defaultProjects));
  const [habits, setHabits] = useState<Habit[]>(() => getInitialLocal('habits', defaultHabits));
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>(() => getInitialLocal('habit_logs', defaultHabitLogs));
  const [moods, setMoods] = useState<MoodEntry[]>(() => getInitialLocal('moods', defaultMoods));
  const [energies, setEnergies] = useState<EnergyEntry[]>(() => getInitialLocal('energies', defaultEnergies));
  const [journals, setJournals] = useState<JournalEntry[]>(() => getInitialLocal('journals', defaultJournals));
  const [gratitudes, setGratitudes] = useState<GratitudeEntry[]>(() => getInitialLocal('gratitudes', defaultGratitudes));
  const [dopamineMenu, setDopamineMenu] = useState<DopamineActivity[]>(() => getInitialLocal('dopamine', defaultDopamineMenu));
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() => getInitialLocal('focus_sessions', defaultFocusSessions));
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => getInitialLocal('calendar_events', defaultCalendarEvents));
  const [bills, setBills] = useState<Bill[]>(() => getInitialLocal('bills', defaultBills));
  const [transactions, setTransactions] = useState<Transaction[]>(() => getInitialLocal('transactions', defaultTransactions));
  const [savings, setSavings] = useState<SavingsGoal[]>(() => getInitialLocal('savings', defaultSavings));
  const [debts, setDebts] = useState<Debt[]>(() => getInitialLocal('debts', defaultDebts));
  const [lifeAdmin, setLifeAdmin] = useState<LifeAdminItem[]>(() => getInitialLocal('life_admin', defaultLifeAdmin));
  const [followUps, setFollowUps] = useState<FollowUpItem[]>(() => getInitialLocal('follow_ups', defaultFollowUps));
  const [householdTasks, setHouseholdTasks] = useState<HouseholdTask[]>(() => getInitialLocal('household_tasks', defaultHouseholdTasks));
  const [householdInventory, setHouseholdInventory] = useState<HouseholdInventoryItem[]>(() => getInitialLocal('household_inv', defaultHouseholdInventory));
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>(() => getInitialLocal('weekly_reviews', defaultWeeklyReviews));
  const [monthlyReviews, setMonthlyReviews] = useState<MonthlyReview[]>(() => getInitialLocal('monthly_reviews', defaultMonthlyReviews));
  const [preferences, setPreferences] = useState<UserPreferences>(() => getInitialLocal('user_preferences', defaultPreferences));

  // Asynchronously hydrate from IndexedDB on startup
  useEffect(() => {
    let isMounted = true;
    const hydrateAll = async () => {
      try {
        const [
          loadedTasks,
          loadedBrainDumps,
          loadedGoals,
          loadedProjects,
          loadedHabits,
          loadedHabitLogs,
          loadedMoods,
          loadedEnergies,
          loadedJournals,
          loadedGratitudes,
          loadedDopamine,
          loadedFocus,
          loadedCalendar,
          loadedBills,
          loadedTx,
          loadedSavings,
          loadedDebts,
          loadedAdmin,
          loadedFollowUps,
          loadedHousehold,
          loadedInv,
          loadedWReviews,
          loadedMReviews,
          loadedPrefs,
        ] = await Promise.all([
          db.get<Task[]>('tasks', defaultTasks),
          db.get<BrainDumpEntry[]>('brain_dumps', defaultBrainDumps),
          db.get<Goal[]>('goals', defaultGoals),
          db.get<Project[]>('projects', defaultProjects),
          db.get<Habit[]>('habits', defaultHabits),
          db.get<HabitLog[]>('habit_logs', defaultHabitLogs),
          db.get<MoodEntry[]>('moods', defaultMoods),
          db.get<EnergyEntry[]>('energies', defaultEnergies),
          db.get<JournalEntry[]>('journals', defaultJournals),
          db.get<GratitudeEntry[]>('gratitudes', defaultGratitudes),
          db.get<DopamineActivity[]>('dopamine', defaultDopamineMenu),
          db.get<FocusSession[]>('focus_sessions', defaultFocusSessions),
          db.get<CalendarEvent[]>('calendar_events', defaultCalendarEvents),
          db.get<Bill[]>('bills', defaultBills),
          db.get<Transaction[]>('transactions', defaultTransactions),
          db.get<SavingsGoal[]>('savings', defaultSavings),
          db.get<Debt[]>('debts', defaultDebts),
          db.get<LifeAdminItem[]>('life_admin', defaultLifeAdmin),
          db.get<FollowUpItem[]>('follow_ups', defaultFollowUps),
          db.get<HouseholdTask[]>('household_tasks', defaultHouseholdTasks),
          db.get<HouseholdInventoryItem[]>('household_inv', defaultHouseholdInventory),
          db.get<WeeklyReview[]>('weekly_reviews', defaultWeeklyReviews),
          db.get<MonthlyReview[]>('monthly_reviews', defaultMonthlyReviews),
          db.get<UserPreferences>('user_preferences', defaultPreferences),
        ]);

        if (isMounted) {
          if (loadedTasks) setTasks(loadedTasks);
          if (loadedBrainDumps) setBrainDumps(loadedBrainDumps);
          if (loadedGoals) setGoals(loadedGoals);
          if (loadedProjects) setProjects(loadedProjects);
          if (loadedHabits) setHabits(loadedHabits);
          if (loadedHabitLogs) setHabitLogs(loadedHabitLogs);
          if (loadedMoods) setMoods(loadedMoods);
          if (loadedEnergies) setEnergies(loadedEnergies);
          if (loadedJournals) setJournals(loadedJournals);
          if (loadedGratitudes) setGratitudes(loadedGratitudes);
          if (loadedDopamine) setDopamineMenu(loadedDopamine);
          if (loadedFocus) setFocusSessions(loadedFocus);
          if (loadedCalendar) setCalendarEvents(loadedCalendar);
          if (loadedBills) setBills(loadedBills);
          if (loadedTx) setTransactions(loadedTx);
          if (loadedSavings) setSavings(loadedSavings);
          if (loadedDebts) setDebts(loadedDebts);
          if (loadedAdmin) setLifeAdmin(loadedAdmin);
          if (loadedFollowUps) setFollowUps(loadedFollowUps);
          if (loadedHousehold) setHouseholdTasks(loadedHousehold);
          if (loadedInv) setHouseholdInventory(loadedInv);
          if (loadedWReviews) setWeeklyReviews(loadedWReviews);
          if (loadedMReviews) setMonthlyReviews(loadedMReviews);
          if (loadedPrefs) setPreferences(loadedPrefs);
        }
      } catch (err) {
        console.error('Failed to hydrate planner state from IndexedDB:', err);
      }
    };

    hydrateAll();
    return () => {
      isMounted = false;
    };
  }, []);

  // Helper to persist slice changes to IndexedDB
  const persistSlice = <T,>(key: string, data: T) => {
    setSaveState('saving');
    db.set(key, data)
      .then(() => setSaveState('saved'))
      .catch(err => {
        console.error(`Error saving ${key} to IndexedDB:`, err);
        setSaveState('error');
      });
  };

  // Sync each slice on update
  useEffect(() => { persistSlice('tasks', tasks); }, [tasks]);
  useEffect(() => { persistSlice('brain_dumps', brainDumps); }, [brainDumps]);
  useEffect(() => { persistSlice('goals', goals); }, [goals]);
  useEffect(() => { persistSlice('projects', projects); }, [projects]);
  useEffect(() => { persistSlice('habits', habits); }, [habits]);
  useEffect(() => { persistSlice('habit_logs', habitLogs); }, [habitLogs]);
  useEffect(() => { persistSlice('moods', moods); }, [moods]);
  useEffect(() => { persistSlice('energies', energies); }, [energies]);
  useEffect(() => { persistSlice('journals', journals); }, [journals]);
  useEffect(() => { persistSlice('gratitudes', gratitudes); }, [gratitudes]);
  useEffect(() => { persistSlice('dopamine', dopamineMenu); }, [dopamineMenu]);
  useEffect(() => { persistSlice('focus_sessions', focusSessions); }, [focusSessions]);
  useEffect(() => { persistSlice('calendar_events', calendarEvents); }, [calendarEvents]);
  useEffect(() => { persistSlice('bills', bills); }, [bills]);
  useEffect(() => { persistSlice('transactions', transactions); }, [transactions]);
  useEffect(() => { persistSlice('savings', savings); }, [savings]);
  useEffect(() => { persistSlice('debts', debts); }, [debts]);
  useEffect(() => { persistSlice('life_admin', lifeAdmin); }, [lifeAdmin]);
  useEffect(() => { persistSlice('follow_ups', followUps); }, [followUps]);
  useEffect(() => { persistSlice('household_tasks', householdTasks); }, [householdTasks]);
  useEffect(() => { persistSlice('household_inv', householdInventory); }, [householdInventory]);
  useEffect(() => { persistSlice('weekly_reviews', weeklyReviews); }, [weeklyReviews]);
  useEffect(() => { persistSlice('monthly_reviews', monthlyReviews); }, [monthlyReviews]);
  useEffect(() => { persistSlice('user_preferences', preferences); }, [preferences]);

  // ----------------------------------------------------
  // Task Actions
  // ----------------------------------------------------
  const addTask = async (taskData: Omit<Task, 'id' | 'user_id' | 'created_at' | 'postponed_count'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      user_id: user?.id || 'local_user',
      postponed_count: 0,
      created_at: new Date().toISOString(),
      subtasks: [],
    };
    setTasks(prev => [newTask, ...prev]);
    return newTask;
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t)));
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
      user_id: user?.id || 'local_user',
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
  };

  const toggleSubtask = async (taskId: string, subtaskId: string) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? {
              ...t,
              subtasks: (t.subtasks || []).map(s =>
                s.id === subtaskId ? { ...s, is_completed: !s.is_completed } : s
              ),
            }
          : t
      )
    );
  };

  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? {
              ...t,
              subtasks: (t.subtasks || []).filter(s => s.id !== subtaskId),
            }
          : t
      )
    );
  };

  const breakdownTaskIntoSteps = async (
    taskId: string,
    steps: { title: string; estimated_minutes: number }[]
  ) => {
    const newSubtasks = steps.map((s, idx) => ({
      id: `sub_${Date.now()}_${idx}`,
      task_id: taskId,
      user_id: user?.id || 'local_user',
      title: s.title,
      estimated_minutes: s.estimated_minutes,
      is_completed: false,
      sort_order: idx,
      created_at: new Date().toISOString(),
    }));

    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, subtasks: [...(t.subtasks || []), ...newSubtasks] }
          : t
      )
    );
  };

  const setTopThreeTaskIds = async (ids: string[]) => {
    setTasks(prev =>
      prev.map(t => ({
        ...t,
        is_top_three: ids.includes(t.id),
      }))
    );
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
      user_id: user?.id || 'local_user',
      content,
      category,
      is_processed: false,
      is_archived: false,
      created_at: new Date().toISOString(),
    };
    setBrainDumps(prev => [entry, ...prev]);
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
      user_id: user?.id || 'local_user',
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
      user_id: user?.id || 'local_user',
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
  // Habits & Habit Logs (Gentle, non-punitive)
  // ----------------------------------------------------
  const addHabit = async (habit: Omit<Habit, 'id' | 'user_id' | 'created_at'>) => {
    const newHabit: Habit = {
      ...habit,
      id: `hab_${Date.now()}`,
      user_id: user?.id || 'local_user',
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
        user_id: user?.id || 'local_user',
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
  // Wellness & Mind
  // ----------------------------------------------------
  const addMood = async (mood: MoodEntry['mood'], notes?: string, tags?: string[]) => {
    const entry: MoodEntry = {
      id: `mood_${Date.now()}`,
      user_id: user?.id || 'local_user',
      date: format(new Date(), 'yyyy-MM-dd'),
      mood,
      notes: notes || undefined,
      tags: tags || [],
      created_at: new Date().toISOString(),
    };
    setMoods(prev => [entry, ...prev]);
  };

  const addEnergy = async (
    level: EnergyEntry['energy_level'],
    timeOfDay?: EnergyEntry['time_of_day'],
    notes?: string
  ) => {
    const entry: EnergyEntry = {
      id: `energy_${Date.now()}`,
      user_id: user?.id || 'local_user',
      date: format(new Date(), 'yyyy-MM-dd'),
      time_of_day: timeOfDay || 'morning',
      energy_level: level,
      notes: notes || undefined,
      created_at: new Date().toISOString(),
    };
    setEnergies(prev => [entry, ...prev]);
  };

  const addJournal = async (content: string, title?: string, prompt?: string, tags?: string[]) => {
    const entry: JournalEntry = {
      id: `jnl_${Date.now()}`,
      user_id: user?.id || 'local_user',
      date: format(new Date(), 'yyyy-MM-dd'),
      title: title || 'Quick Reflection',
      content,
      prompt: prompt || undefined,
      tags: tags || [],
      created_at: new Date().toISOString(),
    };
    setJournals(prev => [entry, ...prev]);
  };

  const addGratitude = async (text: string) => {
    const entry: GratitudeEntry = {
      id: `grat_${Date.now()}`,
      user_id: user?.id || 'local_user',
      text,
      date: format(new Date(), 'yyyy-MM-dd'),
      created_at: new Date().toISOString(),
    };
    setGratitudes(prev => [entry, ...prev]);
  };

  const addDopamineActivity = async (activity: Omit<DopamineActivity, 'id' | 'user_id'>) => {
    const item: DopamineActivity = {
      ...activity,
      id: `dop_${Date.now()}`,
      user_id: user?.id || 'local_user',
    };
    setDopamineMenu(prev => [item, ...prev]);
  };

  const toggleDopamineFavorite = async (id: string) => {
    setDopamineMenu(prev => prev.map(d => (d.id === id ? { ...d, is_favorite: !d.is_favorite } : d)));
  };

  // ----------------------------------------------------
  // Focus Sessions
  // ----------------------------------------------------
  const recordFocusSession = async (session: Omit<FocusSession, 'id' | 'user_id' | 'created_at'>) => {
    const entry: FocusSession = {
      ...session,
      id: `foc_${Date.now()}`,
      user_id: user?.id || 'local_user',
      created_at: new Date().toISOString(),
    };
    setFocusSessions(prev => [entry, ...prev]);
  };

  // ----------------------------------------------------
  // Calendar Events
  // ----------------------------------------------------
  const addCalendarEvent = async (event: Omit<CalendarEvent, 'id' | 'user_id'>) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: `evt_${Date.now()}`,
      user_id: user?.id || 'local_user',
    };
    setCalendarEvents(prev => [...prev, newEvent]);
  };

  const updateCalendarEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    setCalendarEvents(prev => prev.map(e => (e.id === id ? { ...e, ...updates } : e)));
  };

  const deleteCalendarEvent = async (id: string) => {
    setCalendarEvents(prev => prev.filter(e => e.id !== id));
  };

  // ----------------------------------------------------
  // Money
  // ----------------------------------------------------
  const addBill = async (bill: Omit<Bill, 'id' | 'user_id'>) => {
    const newBill: Bill = { ...bill, id: `bill_${Date.now()}`, user_id: user?.id || 'local_user' };
    setBills(prev => [newBill, ...prev]);
  };

  const toggleBillPaid = async (id: string) => {
    setBills(prev =>
      prev.map(b => (b.id === id ? { ...b, payment_status: b.payment_status === 'paid' ? 'pending' : 'paid', paid_date: new Date().toISOString() } : b))
    );
  };

  const deleteBill = async (id: string) => {
    setBills(prev => prev.filter(b => b.id !== id));
  };

  const addTransaction = async (tx: Omit<Transaction, 'id' | 'user_id'>) => {
    const newTx: Transaction = { ...tx, id: `tx_${Date.now()}`, user_id: user?.id || 'local_user' };
    setTransactions(prev => [newTx, ...prev]);
  };

  const deleteTransaction = async (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addSavings = async (s: Omit<SavingsGoal, 'id' | 'user_id'>) => {
    const newS: SavingsGoal = { ...s, id: `sav_${Date.now()}`, user_id: user?.id || 'local_user' };
    setSavings(prev => [newS, ...prev]);
  };

  const updateSavingsAmount = async (id: string, amount: number) => {
    setSavings(prev => prev.map(s => (s.id === id ? { ...s, current_amount: amount } : s)));
  };

  const addDebt = async (d: Omit<Debt, 'id' | 'user_id'>) => {
    const newDebt: Debt = { ...d, id: `debt_${Date.now()}`, user_id: user?.id || 'local_user' };
    setDebts(prev => [newDebt, ...prev]);
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
      user_id: user?.id || 'local_user',
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
    const newFu: FollowUpItem = { ...item, id: `fu_${Date.now()}`, user_id: user?.id || 'local_user' };
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
    const newTask: HouseholdTask = { ...task, id: `hh_${Date.now()}`, user_id: user?.id || 'local_user' };
    setHouseholdTasks(prev => [...prev, newTask]);
  };

  const toggleHouseholdTask = async (id: string) => {
    setHouseholdTasks(prev =>
      prev.map(h => (h.id === id ? { ...h, is_completed: !h.is_completed, last_completed: format(new Date(), 'yyyy-MM-dd') } : h))
    );
  };

  const addInventoryItem = async (item: Omit<HouseholdInventoryItem, 'id' | 'user_id'>) => {
    const newInv: HouseholdInventoryItem = { ...item, id: `inv_${Date.now()}`, user_id: user?.id || 'local_user' };
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
      user_id: user?.id || 'local_user',
      created_at: new Date().toISOString(),
    };
    setWeeklyReviews(prev => [newRev, ...prev]);
  };

  const addMonthlyReview = async (review: Omit<MonthlyReview, 'id' | 'user_id' | 'created_at'>) => {
    const newRev: MonthlyReview = {
      ...review,
      id: `mrev_${Date.now()}`,
      user_id: user?.id || 'local_user',
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
        if (selectedTaskIdsToKeep.includes(t.id)) {
          return {
            ...t,
            due_date: todayStr,
            is_top_three: true,
            status: t.status === 'completed' ? 'completed' : 'not_started',
          };
        }

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

  // ----------------------------------------------------
  // STANDALONE DIGITAL PLANNER: BACKUP, IMPORT, CLEAR
  // ----------------------------------------------------
  const exportBackup = async (): Promise<string> => {
    const backupBundle: BackupDataBundle = {
      version: 1,
      app: 'LIFE RESET',
      exportedAt: new Date().toISOString(),
      profile: user,
      preferences,
      tasks,
      brainDumps,
      goals,
      projects,
      habits,
      habitLogs,
      moods,
      energies,
      journals,
      gratitudes,
      dopamineMenu,
      focusSessions,
      calendarEvents,
      bills,
      transactions,
      savings,
      debts,
      lifeAdmin,
      followUps,
      householdTasks,
      householdInventory,
      weeklyReviews,
      monthlyReviews,
    };
    return JSON.stringify(backupBundle, null, 2);
  };

  const importBackup = async (jsonString: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const data = JSON.parse(jsonString) as BackupDataBundle;
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Invalid backup file format.' };
      }

      // Restore profile if present
      if (data.profile) {
        await updateProfile(data.profile);
      }

      // Restore collections
      if (Array.isArray(data.tasks)) setTasks(data.tasks);
      if (Array.isArray(data.brainDumps)) setBrainDumps(data.brainDumps);
      if (Array.isArray(data.goals)) setGoals(data.goals);
      if (Array.isArray(data.projects)) setProjects(data.projects);
      if (Array.isArray(data.habits)) setHabits(data.habits);
      if (Array.isArray(data.habitLogs)) setHabitLogs(data.habitLogs);
      if (Array.isArray(data.moods)) setMoods(data.moods);
      if (Array.isArray(data.energies)) setEnergies(data.energies);
      if (Array.isArray(data.journals)) setJournals(data.journals);
      if (Array.isArray(data.gratitudes)) setGratitudes(data.gratitudes);
      if (Array.isArray(data.dopamineMenu)) setDopamineMenu(data.dopamineMenu);
      if (Array.isArray(data.focusSessions)) setFocusSessions(data.focusSessions);
      if (Array.isArray(data.calendarEvents)) setCalendarEvents(data.calendarEvents);
      if (Array.isArray(data.bills)) setBills(data.bills);
      if (Array.isArray(data.transactions)) setTransactions(data.transactions);
      if (Array.isArray(data.savings)) setSavings(data.savings);
      if (Array.isArray(data.debts)) setDebts(data.debts);
      if (Array.isArray(data.lifeAdmin)) setLifeAdmin(data.lifeAdmin);
      if (Array.isArray(data.followUps)) setFollowUps(data.followUps);
      if (Array.isArray(data.householdTasks)) setHouseholdTasks(data.householdTasks);
      if (Array.isArray(data.householdInventory)) setHouseholdInventory(data.householdInventory);
      if (Array.isArray(data.weeklyReviews)) setWeeklyReviews(data.weeklyReviews);
      if (Array.isArray(data.monthlyReviews)) setMonthlyReviews(data.monthlyReviews);
      if (data.preferences && typeof data.preferences === 'object') setPreferences(data.preferences);

      setSaveState('saved');
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Error parsing backup JSON.' };
    }
  };

  const clearAllData = async (): Promise<void> => {
    // Reset state slices to clean defaults
    setTasks(defaultTasks);
    setBrainDumps(defaultBrainDumps);
    setGoals(defaultGoals);
    setProjects(defaultProjects);
    setHabits(defaultHabits);
    setHabitLogs(defaultHabitLogs);
    setMoods(defaultMoods);
    setEnergies(defaultEnergies);
    setJournals(defaultJournals);
    setGratitudes(defaultGratitudes);
    setDopamineMenu(defaultDopamineMenu);
    setFocusSessions(defaultFocusSessions);
    setCalendarEvents(defaultCalendarEvents);
    setBills(defaultBills);
    setTransactions(defaultTransactions);
    setSavings(defaultSavings);
    setDebts(defaultDebts);
    setLifeAdmin(defaultLifeAdmin);
    setFollowUps(defaultFollowUps);
    setHouseholdTasks(defaultHouseholdTasks);
    setHouseholdInventory(defaultHouseholdInventory);
    setWeeklyReviews(defaultWeeklyReviews);
    setMonthlyReviews(defaultMonthlyReviews);
    setPreferences(defaultPreferences);

    // Reset profile
    await updateProfile(defaultProfile);

    // Clear local storage and IndexedDB
    await db.clear();

    // Re-seed essential starter templates
    await Promise.all([
      db.set('profile', defaultProfile),
      db.set('user_preferences', defaultPreferences),
      db.set('habits', defaultHabits),
      db.set('dopamine', defaultDopamineMenu),
      db.set('household_tasks', defaultHouseholdTasks),
      db.set('tasks', defaultTasks),
      db.set('brain_dumps', defaultBrainDumps),
      db.set('goals', defaultGoals),
      db.set('projects', defaultProjects),
      db.set('habit_logs', defaultHabitLogs),
      db.set('moods', defaultMoods),
      db.set('energies', defaultEnergies),
      db.set('journals', defaultJournals),
      db.set('gratitudes', defaultGratitudes),
      db.set('focus_sessions', defaultFocusSessions),
      db.set('calendar_events', defaultCalendarEvents),
      db.set('bills', defaultBills),
      db.set('transactions', defaultTransactions),
      db.set('savings', defaultSavings),
      db.set('debts', defaultDebts),
      db.set('life_admin', defaultLifeAdmin),
      db.set('follow_ups', defaultFollowUps),
      db.set('household_inv', defaultHouseholdInventory),
      db.set('weekly_reviews', defaultWeeklyReviews),
      db.set('monthly_reviews', defaultMonthlyReviews),
    ]);

    setSaveState('saved');
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
        exportBackup,
        importBackup,
        clearAllData,
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
