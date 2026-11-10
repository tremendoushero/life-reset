// ====================================================================
// LIFE RESET - TypeScript Type Definitions
// ====================================================================

export type EnergyLevel = 'empty' | 'low' | 'steady' | 'high' | 'full';
export type MoodLevel = 'low' | 'meh' | 'okay' | 'good' | 'bright';
export type PlanningTime = 'morning' | 'afternoon' | 'evening' | 'anytime';
export type AdaptiveMode = 'normal' | 'low-energy' | 'overwhelmed' | 'focus' | 'brain-dump';

export type TaskPriority = 'essential' | 'important' | 'optional';
export type TaskStatus = 'inbox' | 'not_started' | 'in_progress' | 'completed' | 'waiting' | 'archived';
export type TaskEnergyRequirement = 'very_low' | 'low' | 'medium' | 'high';
export type TaskRecurrence = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  planning_capacity: EnergyLevel;
  preferred_planning_time: PlanningTime;
  onboarding_completed: boolean;
  created_at: string;
}

export interface UserPreferences {
  id?: string;
  user_id: string;
  theme: 'warm-ivory' | 'sage' | 'lavender' | 'soft-blue' | 'soft-peach' | 'dark-espresso';
  color_mode: 'light' | 'dark' | 'system';
  font_size: 'normal' | 'large' | 'x-large';
  reduced_motion: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  start_of_week: 0 | 1 | 6;
  timezone: string;
  active_capacity_mode: AdaptiveMode;
  card_order?: string[];
  hidden_cards?: string[];
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: string;
  priority: TaskPriority;
  due_date?: string | null; // YYYY-MM-DD
  due_time?: string | null; // HH:mm
  estimated_duration: number; // minutes
  status: TaskStatus;
  energy_requirement: TaskEnergyRequirement;
  context?: string; // 'home' | 'work' | 'computer' | 'errand'
  recurrence: TaskRecurrence;
  notes?: string;
  is_top_three: boolean;
  completed_at?: string | null;
  postponed_count: number;
  created_at: string;
  updated_at?: string;
  subtasks?: TaskSubtask[];
}

export interface TaskSubtask {
  id: string;
  task_id: string;
  user_id: string;
  title: string;
  estimated_minutes: number;
  is_completed: boolean;
  sort_order: number;
  created_at?: string;
}

export interface BrainDumpEntry {
  id: string;
  user_id: string;
  content: string;
  category: string;
  is_processed: boolean;
  converted_task_id?: string | null;
  is_archived: boolean;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: string;
  target_date?: string;
  progress: number; // 0-100
  next_action?: string;
  status: 'not_started' | 'in_progress' | 'paused' | 'completed';
  created_at: string;
  milestones?: GoalMilestone[];
}

export interface GoalMilestone {
  id: string;
  goal_id: string;
  user_id: string;
  title: string;
  target_date?: string;
  is_completed: boolean;
  sort_order: number;
}

export interface Project {
  id: string;
  user_id: string;
  goal_id?: string | null;
  name: string;
  description?: string;
  deadline?: string;
  next_action?: string;
  status: 'active' | 'paused' | 'completed';
  notes?: string;
  progress: number;
  created_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  routine: 'morning' | 'evening' | 'custom';
  frequency: 'daily' | 'weekdays' | 'weekly' | '2x_week' | '3x_week';
  energy_level: 'very_low' | 'low' | 'medium' | 'high';
  is_paused: boolean;
  target_count_weekly: number;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  notes?: string;
  created_at: string;
}

export interface MoodEntry {
  id: string;
  user_id: string;
  date: string;
  mood: MoodLevel;
  notes?: string;
  tags?: string[];
  created_at: string;
}

export interface EnergyEntry {
  id: string;
  user_id: string;
  date: string;
  energy_level: EnergyLevel;
  time_of_day: 'morning' | 'afternoon' | 'evening';
  notes?: string;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  date: string;
  title?: string;
  content: string;
  prompt?: string;
  tags?: string[];
  created_at: string;
  updated_at?: string;
}

export interface GratitudeEntry {
  id: string;
  user_id: string;
  date: string;
  text: string;
  created_at: string;
}

export interface DopamineActivity {
  id: string;
  user_id: string;
  title: string;
  category: 'appetizer' | 'entree' | 'side' | 'dessert';
  duration_minutes: number;
  energy_needed: 'very_low' | 'low' | 'medium' | 'high';
  is_favorite: boolean;
  notes?: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  task_id?: string | null;
  task_title?: string;
  target_duration_minutes: number;
  actual_duration_minutes: number;
  completed: boolean;
  distraction_count: number;
  notes?: string;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_time: string; // ISO
  end_time: string; // ISO
  all_day: boolean;
  category: string;
  color?: string;
}

export interface Bill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_date: string; // YYYY-MM-DD
  recurrence: 'one_time' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  payment_status: 'pending' | 'paid' | 'auto_pay';
  category: string;
  paid_date?: string | null;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;
  is_planned: boolean;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  notes?: string;
}

export interface Debt {
  id: string;
  user_id: string;
  name: string;
  current_balance: number;
  interest_rate?: number;
  minimum_payment?: number;
  due_day?: number;
  notes?: string;
}

export interface LifeAdminItem {
  id: string;
  user_id: string;
  title: string;
  category: 'appointment' | 'renewal' | 'document' | 'insurance' | 'errand' | 'return_refund' | 'form' | 'general';
  due_date?: string;
  notes?: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
}

export interface FollowUpItem {
  id: string;
  user_id: string;
  title: string;
  person_or_org: string;
  requested_date: string;
  follow_up_date: string;
  status: 'waiting' | 'received' | 'closed';
  notes?: string;
}

export interface HouseholdTask {
  id: string;
  user_id: string;
  title: string;
  zone: 'kitchen' | 'bedroom' | 'bathroom' | 'living_room' | 'general';
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'seasonal';
  last_completed?: string;
  next_due?: string;
  estimated_minutes: number;
  is_completed: boolean;
}

export interface HouseholdInventoryItem {
  id: string;
  user_id: string;
  item_name: string;
  category: 'pantry' | 'supplies' | 'maintenance' | 'emergency';
  quantity: number;
  reorder_level: number;
  location?: string;
  notes?: string;
}

export interface WeeklyReview {
  id: string;
  user_id: string;
  week_start: string;
  tasks_completed_count: number;
  focus_minutes_total: number;
  small_wins: string[];
  what_was_difficult?: string;
  what_helped?: string;
  what_can_be_simplified?: string;
  next_week_priority?: string;
  created_at: string;
}

export interface MonthlyReview {
  id: string;
  user_id: string;
  month_start: string;
  personal_highlights?: string;
  challenges_faced?: string;
  lessons_learned?: string;
  what_to_change_next_month?: string;
  created_at: string;
}

export interface Entitlement {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'past_due' | 'canceled' | 'revoked' | 'trial';
  provider: 'test' | 'stripe' | 'lemonsqueezy';
  granted_at: string;
  expires_at?: string;
}
