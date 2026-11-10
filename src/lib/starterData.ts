// ====================================================================
// LIFE RESET - Clean Starter Data (No Fake Customer Personas or Fake Stats)
// ====================================================================

import {
  UserProfile,
  UserPreferences,
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
} from '@/types';

export const defaultProfile: UserProfile = {
  id: 'local_user',
  display_name: 'My Life Reset',
  planning_capacity: 'steady',
  preferred_planning_time: 'morning',
  onboarding_completed: true,
  created_at: new Date().toISOString(),
};

export const defaultPreferences: UserPreferences = {
  user_id: 'local_user',
  theme: 'warm-ivory',
  color_mode: 'light',
  font_size: 'normal',
  reduced_motion: false,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:30',
  quiet_hours_end: '08:00',
  start_of_week: 1,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  active_capacity_mode: 'normal',
};

// Helpful, non-punitive ADHD habit ideas
export const defaultHabits: Habit[] = [
  {
    id: 'hab_1',
    user_id: 'local_user',
    title: 'Morning glass of water',
    description: 'Keep water by bed. Easy first win of the day.',
    routine: 'morning',
    frequency: 'daily',
    energy_level: 'very_low',
    is_paused: false,
    target_count_weekly: 7,
    created_at: new Date().toISOString(),
  },
  {
    id: 'hab_2',
    user_id: 'local_user',
    title: 'Daily capacity check-in',
    description: 'Listen to your energy before committing to tasks.',
    routine: 'morning',
    frequency: 'daily',
    energy_level: 'very_low',
    is_paused: false,
    target_count_weekly: 7,
    created_at: new Date().toISOString(),
  },
  {
    id: 'hab_3',
    user_id: 'local_user',
    title: '2-minute evening reset',
    description: 'Put dishes in sink, pick up floor clothes.',
    routine: 'evening',
    frequency: 'daily',
    energy_level: 'low',
    is_paused: false,
    target_count_weekly: 5,
    created_at: new Date().toISOString(),
  },
];

// Dopamine Menu (Practical executive function menu)
export const defaultDopamineMenu: DopamineActivity[] = [
  // Appetizers (quick 2-5 mins)
  { id: 'dop_1', user_id: 'local_user', title: 'Put favorite song on with headphones', category: 'appetizer', duration_minutes: 4, energy_needed: 'very_low', is_favorite: true },
  { id: 'dop_2', user_id: 'local_user', title: 'Cool water splash on face & wrists', category: 'appetizer', duration_minutes: 2, energy_needed: 'very_low', is_favorite: false },
  { id: 'dop_3', user_id: 'local_user', title: '60-second gentle stretch or shake-out', category: 'appetizer', duration_minutes: 2, energy_needed: 'very_low', is_favorite: true },

  // Entrees (deep, fulfilling 20-45 mins)
  { id: 'dop_4', user_id: 'local_user', title: 'Walk outside with a podcast', category: 'entree', duration_minutes: 30, energy_needed: 'low', is_favorite: true },
  { id: 'dop_5', user_id: 'local_user', title: 'Comforting cooking or warm beverage ritual', category: 'entree', duration_minutes: 25, energy_needed: 'medium', is_favorite: false },

  // Sides (can do alongside work)
  { id: 'dop_6', user_id: 'local_user', title: 'Lo-fi beats or ambient rain audio', category: 'side', duration_minutes: 60, energy_needed: 'very_low', is_favorite: true },
  { id: 'dop_7', user_id: 'local_user', title: 'Pleasant lighting (warm lamp instead of harsh overhead)', category: 'side', duration_minutes: 120, energy_needed: 'very_low', is_favorite: true },

  // Desserts (fun rewards, keep bounded)
  { id: 'dop_8', user_id: 'local_user', title: 'One episode of a comforting show', category: 'dessert', duration_minutes: 25, energy_needed: 'very_low', is_favorite: false },
];

export const defaultHouseholdTasks: HouseholdTask[] = [
  { id: 'hh_1', user_id: 'local_user', title: 'Wipe kitchen counter and run dishwasher', zone: 'kitchen', frequency: 'daily', estimated_minutes: 10, is_completed: false },
  { id: 'hh_2', user_id: 'local_user', title: 'Empty trash bins and replace liners', zone: 'general', frequency: 'weekly', estimated_minutes: 8, is_completed: false },
  { id: 'hh_3', user_id: 'local_user', title: 'Clean bathroom mirror and sink basin', zone: 'bathroom', frequency: 'weekly', estimated_minutes: 10, is_completed: false },
  { id: 'hh_4', user_id: 'local_user', title: 'Change bed sheets and pillow cases', zone: 'bedroom', frequency: 'weekly', estimated_minutes: 10, is_completed: false },
];

export const defaultTasks: Task[] = [];
export const defaultBrainDumps: BrainDumpEntry[] = [];
export const defaultGoals: Goal[] = [];
export const defaultProjects: Project[] = [];
export const defaultHabitLogs: HabitLog[] = [];
export const defaultMoods: MoodEntry[] = [];
export const defaultEnergies: EnergyEntry[] = [];
export const defaultJournals: JournalEntry[] = [];
export const defaultGratitudes: GratitudeEntry[] = [];
export const defaultFocusSessions: FocusSession[] = [];
export const defaultCalendarEvents: CalendarEvent[] = [];
export const defaultBills: Bill[] = [];
export const defaultTransactions: Transaction[] = [];
export const defaultSavings: SavingsGoal[] = [];
export const defaultDebts: Debt[] = [];
export const defaultLifeAdmin: LifeAdminItem[] = [];
export const defaultFollowUps: FollowUpItem[] = [];
export const defaultHouseholdInventory: HouseholdInventoryItem[] = [];
export const defaultWeeklyReviews: WeeklyReview[] = [];
export const defaultMonthlyReviews: MonthlyReview[] = [];

