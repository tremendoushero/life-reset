// ====================================================================
// LIFE RESET - Demo & Starter Data (ADHD-Friendly, Realistic)
// ====================================================================

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
  UserProfile,
  UserPreferences,
} from '@/types';
import { format, subDays, addDays } from 'date-fns';

const today = format(new Date(), 'yyyy-MM-dd');
const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
const inThreeDays = format(addDays(new Date(), 3), 'yyyy-MM-dd');

export const DEMO_USER_ID = 'demo-user-life-reset';

export const demoProfile: UserProfile = {
  id: DEMO_USER_ID,
  email: 'alex.morgan@example.com',
  display_name: 'Alex Morgan',
  planning_capacity: 'steady',
  preferred_planning_time: 'morning',
  onboarding_completed: true,
  created_at: new Date().toISOString(),
};

export const demoPreferences: UserPreferences = {
  user_id: DEMO_USER_ID,
  theme: 'warm-ivory',
  color_mode: 'light',
  font_size: 'normal',
  reduced_motion: false,
  quiet_hours_enabled: true,
  quiet_hours_start: '22:30',
  quiet_hours_end: '08:00',
  start_of_week: 1,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  active_capacity_mode: 'normal',
  card_order: ['capacity', 'top_three', 'time_awareness', 'quick_tasks', 'progress', 'gentle_reminders'],
  hidden_cards: [],
};

export const demoTasks: Task[] = [
  {
    id: 'task-1',
    user_id: DEMO_USER_ID,
    title: 'Call dentist to reschedule appointment',
    description: 'Number is in phone contacts. Just ask for any Tuesday afternoon.',
    category: 'health',
    priority: 'essential',
    due_date: today,
    due_time: '14:00',
    estimated_duration: 10,
    status: 'not_started',
    energy_requirement: 'medium',
    context: 'phone',
    recurrence: 'none',
    notes: 'Remember you have dental insurance card in wallet.',
    is_top_three: true,
    postponed_count: 1,
    created_at: new Date().toISOString(),
    subtasks: [
      { id: 'sub-1-1', task_id: 'task-1', user_id: DEMO_USER_ID, title: 'Find insurance card', estimated_minutes: 2, is_completed: true, sort_order: 0 },
      { id: 'sub-1-2', task_id: 'task-1', user_id: DEMO_USER_ID, title: 'Dial reception number', estimated_minutes: 3, is_completed: false, sort_order: 1 },
      { id: 'sub-1-3', task_id: 'task-1', user_id: DEMO_USER_ID, title: 'Add new time to calendar', estimated_minutes: 2, is_completed: false, sort_order: 2 },
    ],
  },
  {
    id: 'task-2',
    user_id: DEMO_USER_ID,
    title: 'Review car insurance renewal quote',
    description: 'Check if current policy auto-renews at higher price.',
    category: 'life-admin',
    priority: 'essential',
    due_date: today,
    due_time: '11:00',
    estimated_duration: 15,
    status: 'in_progress',
    energy_requirement: 'medium',
    context: 'computer',
    recurrence: 'none',
    notes: 'Comparison website open in bookmark tab.',
    is_top_three: true,
    postponed_count: 0,
    created_at: new Date().toISOString(),
    subtasks: [
      { id: 'sub-2-1', task_id: 'task-2', user_id: DEMO_USER_ID, title: 'Open email from insurer', estimated_minutes: 2, is_completed: true, sort_order: 0 },
      { id: 'sub-2-2', task_id: 'task-2', user_id: DEMO_USER_ID, title: 'Check premium difference', estimated_minutes: 5, is_completed: false, sort_order: 1 },
    ],
  },
  {
    id: 'task-3',
    user_id: DEMO_USER_ID,
    title: 'Sort laundry: put one basket in machine',
    description: 'Do not worry about folding yet. Just start the wash cycle.',
    category: 'household',
    priority: 'important',
    due_date: today,
    estimated_duration: 5,
    status: 'not_started',
    energy_requirement: 'low',
    context: 'home',
    recurrence: 'none',
    is_top_three: true,
    postponed_count: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'task-4',
    user_id: DEMO_USER_ID,
    title: 'Drink a glass of water and stretch',
    category: 'wellness',
    priority: 'important',
    due_date: today,
    estimated_duration: 3,
    status: 'completed',
    energy_requirement: 'very_low',
    context: 'home',
    recurrence: 'daily',
    is_top_three: false,
    completed_at: new Date().toISOString(),
    postponed_count: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'task-5',
    user_id: DEMO_USER_ID,
    title: 'Submit grocery order online',
    description: 'Need milk, oat bread, coffee beans, salad greens.',
    category: 'errand',
    priority: 'optional',
    due_date: tomorrow,
    estimated_duration: 15,
    status: 'not_started',
    energy_requirement: 'low',
    context: 'computer',
    recurrence: 'weekly',
    is_top_three: false,
    postponed_count: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'task-6',
    user_id: DEMO_USER_ID,
    title: 'Draft paragraph 1 for quarterly project summary',
    category: 'work',
    priority: 'important',
    due_date: inThreeDays,
    estimated_duration: 25,
    status: 'inbox',
    energy_requirement: 'high',
    context: 'computer',
    recurrence: 'none',
    is_top_three: false,
    postponed_count: 0,
    created_at: new Date().toISOString(),
  },
];

export const demoBrainDumps: BrainDumpEntry[] = [
  {
    id: 'bd-1',
    user_id: DEMO_USER_ID,
    content: 'Need to check expiry date on passport before spring holidays',
    category: 'travel',
    is_processed: false,
    is_archived: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'bd-2',
    user_id: DEMO_USER_ID,
    content: 'Gift idea for Mom: warm fleece throw blanket or ceramic mug with lid',
    category: 'family',
    is_processed: false,
    is_archived: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'bd-3',
    user_id: DEMO_USER_ID,
    content: 'Research noise-cancelling headphones cushion replacement',
    category: 'ideas',
    is_processed: false,
    is_archived: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'bd-4',
    user_id: DEMO_USER_ID,
    content: 'Try making vegetable lentil soup with smoked paprika this weekend',
    category: 'food',
    is_processed: true,
    is_archived: false,
    created_at: new Date().toISOString(),
  },
];

export const demoGoals: Goal[] = [
  {
    id: 'goal-1',
    user_id: DEMO_USER_ID,
    title: 'Build a low-stress evening wind-down routine',
    description: 'Transition smoothly to sleep without revenge bedtime procrastination.',
    category: 'wellness',
    target_date: addDays(new Date(), 30).toISOString().split('T')[0],
    progress: 45,
    next_action: 'Put phone on charger outside bedroom at 10 PM',
    status: 'in_progress',
    created_at: new Date().toISOString(),
    milestones: [
      { id: 'gm-1', goal_id: 'goal-1', user_id: DEMO_USER_ID, title: 'Identify 3 screen-free evening activities', is_completed: true, sort_order: 0 },
      { id: 'gm-2', goal_id: 'goal-1', user_id: DEMO_USER_ID, title: 'Set automatic quiet hours on devices', is_completed: true, sort_order: 1 },
      { id: 'gm-3', goal_id: 'goal-1', user_id: DEMO_USER_ID, title: 'Practice routine 4 nights in a week', is_completed: false, sort_order: 2 },
    ],
  },
  {
    id: 'goal-2',
    user_id: DEMO_USER_ID,
    title: 'Organise home workspace into zero-friction zones',
    description: 'Keep essentials within arm reach and clear clutter hotspots.',
    category: 'environment',
    target_date: addDays(new Date(), 45).toISOString().split('T')[0],
    progress: 30,
    next_action: 'Get a small cable tray under desk',
    status: 'in_progress',
    created_at: new Date().toISOString(),
  },
];

export const demoProjects: Project[] = [
  {
    id: 'proj-1',
    user_id: DEMO_USER_ID,
    goal_id: 'goal-2',
    name: 'Home Office Reset',
    description: 'Declutter surfaces, label wires, set up ergonomic lighting.',
    deadline: addDays(new Date(), 20).toISOString().split('T')[0],
    next_action: 'Clear desk top surface completely (10 mins)',
    status: 'active',
    progress: 40,
    created_at: new Date().toISOString(),
  },
];

export const demoHabits: Habit[] = [
  {
    id: 'habit-1',
    user_id: DEMO_USER_ID,
    title: 'Morning glass of water',
    description: 'Keep bottle by bed. Drink upon waking.',
    routine: 'morning',
    frequency: 'daily',
    energy_level: 'very_low',
    is_paused: false,
    target_count_weekly: 7,
    created_at: new Date().toISOString(),
  },
  {
    id: 'habit-2',
    user_id: DEMO_USER_ID,
    title: 'Check capacity check-in',
    description: 'Listen to energy before committing to tasks.',
    routine: 'morning',
    frequency: 'daily',
    energy_level: 'very_low',
    is_paused: false,
    target_count_weekly: 7,
    created_at: new Date().toISOString(),
  },
  {
    id: 'habit-3',
    user_id: DEMO_USER_ID,
    title: '10-minute walk outside or fresh air',
    description: 'No pressure on speed or distance.',
    routine: 'custom',
    frequency: '3x_week',
    energy_level: 'low',
    is_paused: false,
    target_count_weekly: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: 'habit-4',
    user_id: DEMO_USER_ID,
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

export const demoHabitLogs: HabitLog[] = [
  { id: 'hl-1', habit_id: 'habit-1', user_id: DEMO_USER_ID, date: today, completed: true, created_at: new Date().toISOString() },
  { id: 'hl-2', habit_id: 'habit-2', user_id: DEMO_USER_ID, date: today, completed: true, created_at: new Date().toISOString() },
  { id: 'hl-3', habit_id: 'habit-1', user_id: DEMO_USER_ID, date: yesterday, completed: true, created_at: new Date().toISOString() },
  { id: 'hl-4', habit_id: 'habit-3', user_id: DEMO_USER_ID, date: yesterday, completed: true, created_at: new Date().toISOString() },
];

export const demoMoods: MoodEntry[] = [
  { id: 'mood-1', user_id: DEMO_USER_ID, date: today, mood: 'good', notes: 'Slept well, warm tea in morning helped ground me.', tags: ['calm', 'rested'], created_at: new Date().toISOString() },
  { id: 'mood-2', user_id: DEMO_USER_ID, date: yesterday, mood: 'okay', notes: 'Afternoon dip around 3pm, but took a gentle pause.', tags: ['mildly tired'], created_at: new Date().toISOString() },
];

export const demoEnergies: EnergyEntry[] = [
  { id: 'ene-1', user_id: DEMO_USER_ID, date: today, energy_level: 'steady', time_of_day: 'morning', notes: 'Ready for 1 or 2 focused blocks.', created_at: new Date().toISOString() },
  { id: 'ene-2', user_id: DEMO_USER_ID, date: yesterday, energy_level: 'low', time_of_day: 'afternoon', notes: 'Did low-demand tasks.', created_at: new Date().toISOString() },
];

export const demoJournals: JournalEntry[] = [
  {
    id: 'j-1',
    user_id: DEMO_USER_ID,
    date: today,
    title: 'Permission to do things imperfectly',
    content: 'Reminding myself that a task half-done is infinitely better than 0% done. Folding only half the laundry basket still means I have clean socks. Taking the pressure off makes it easier to just start.',
    prompt: 'What can I be gentle with myself about today?',
    tags: ['mindset', 'acceptance'],
    created_at: new Date().toISOString(),
  },
];

export const demoGratitudes: GratitudeEntry[] = [
  { id: 'grat-1', user_id: DEMO_USER_ID, date: today, text: 'Warm sunshine through the window while drinking tea', created_at: new Date().toISOString() },
  { id: 'grat-2', user_id: DEMO_USER_ID, date: today, text: 'My friend sending a funny voice note just when I needed a laugh', created_at: new Date().toISOString() },
];

export const demoDopamineMenu: DopamineActivity[] = [
  // Appetizers (quick 2-5 mins)
  { id: 'dop-1', user_id: DEMO_USER_ID, title: 'Put favorite song on with headphones', category: 'appetizer', duration_minutes: 4, energy_needed: 'very_low', is_favorite: true },
  { id: 'dop-2', user_id: DEMO_USER_ID, title: 'Cold water splash on face & wrist rinse', category: 'appetizer', duration_minutes: 2, energy_needed: 'very_low', is_favorite: false },
  { id: 'dop-3', user_id: DEMO_USER_ID, title: 'Cuddle pet or hug a cozy pillow', category: 'appetizer', duration_minutes: 3, energy_needed: 'very_low', is_favorite: true },

  // Entrees (deep, fulfilling 20-45 mins)
  { id: 'dop-4', user_id: DEMO_USER_ID, title: 'Cooking a comforting recipe with music', category: 'entree', duration_minutes: 35, energy_needed: 'medium', is_favorite: true },
  { id: 'dop-5', user_id: DEMO_USER_ID, title: 'Walk in the park with a podcast', category: 'entree', duration_minutes: 30, energy_needed: 'low', is_favorite: true },

  // Sides (can do alongside work)
  { id: 'dop-6', user_id: DEMO_USER_ID, title: 'Lo-fi beats playlist running in background', category: 'side', duration_minutes: 60, energy_needed: 'very_low', is_favorite: true },
  { id: 'dop-7', user_id: DEMO_USER_ID, title: 'Diffusing lavender or citrus essential oil', category: 'side', duration_minutes: 120, energy_needed: 'very_low', is_favorite: false },

  // Desserts (fun rewards, keep bounded)
  { id: 'dop-8', user_id: DEMO_USER_ID, title: 'Watching one episode of cozy show', category: 'dessert', duration_minutes: 25, energy_needed: 'very_low', is_favorite: true },
];

export const demoFocusSessions: FocusSession[] = [
  {
    id: 'foc-1',
    user_id: DEMO_USER_ID,
    task_id: 'task-2',
    task_title: 'Review car insurance renewal quote',
    target_duration_minutes: 25,
    actual_duration_minutes: 25,
    completed: true,
    distraction_count: 1,
    notes: 'Completed the comparison form without getting lost in tabs.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'foc-2',
    user_id: DEMO_USER_ID,
    task_id: 'task-1',
    task_title: 'Dental paperwork prep',
    target_duration_minutes: 15,
    actual_duration_minutes: 15,
    completed: true,
    distraction_count: 0,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const demoCalendarEvents: CalendarEvent[] = [
  {
    id: 'cal-1',
    user_id: DEMO_USER_ID,
    title: 'Team sync call',
    description: 'Weekly check-in on project deliverables',
    start_time: `${today}T10:00:00`,
    end_time: `${today}T10:45:00`,
    all_day: false,
    category: 'work',
    color: '#E78B3D',
  },
  {
    id: 'cal-2',
    user_id: DEMO_USER_ID,
    title: 'Dentist window',
    description: 'Call between 2:00 and 4:00 PM',
    start_time: `${today}T14:00:00`,
    end_time: `${today}T14:30:00`,
    all_day: false,
    category: 'health',
    color: '#A4B58A',
  },
  {
    id: 'cal-3',
    user_id: DEMO_USER_ID,
    title: 'Quiet evening wind-down',
    start_time: `${today}T21:00:00`,
    end_time: `${today}T22:00:00`,
    all_day: false,
    category: 'wellness',
    color: '#B6A4E8',
  },
];

export const demoBills: Bill[] = [
  {
    id: 'bill-1',
    user_id: DEMO_USER_ID,
    name: 'Home Internet (Fiber)',
    amount: 55.00,
    due_date: addDays(new Date(), 4).toISOString().split('T')[0],
    recurrence: 'monthly',
    payment_status: 'auto_pay',
    category: 'utilities',
  },
  {
    id: 'bill-2',
    user_id: DEMO_USER_ID,
    name: 'Electricity & Heating',
    amount: 112.50,
    due_date: addDays(new Date(), 10).toISOString().split('T')[0],
    recurrence: 'monthly',
    payment_status: 'pending',
    category: 'utilities',
  },
  {
    id: 'bill-3',
    user_id: DEMO_USER_ID,
    name: 'Music & Audio Stream',
    amount: 11.99,
    due_date: addDays(new Date(), 15).toISOString().split('T')[0],
    recurrence: 'monthly',
    payment_status: 'paid',
    paid_date: today,
    category: 'subscriptions',
  },
];

export const demoTransactions: Transaction[] = [
  { id: 'tx-1', user_id: DEMO_USER_ID, type: 'income', amount: 3200.00, category: 'Salary / Client', description: 'Monthly primary deposit', date: format(subDays(new Date(), 9), 'yyyy-MM-dd'), is_planned: true },
  { id: 'tx-2', user_id: DEMO_USER_ID, type: 'expense', amount: 84.50, category: 'Groceries', description: 'Fresh produce and pantry staples', date: yesterday, is_planned: false },
  { id: 'tx-3', user_id: DEMO_USER_ID, type: 'expense', amount: 4.75, category: 'Coffee / Treat', description: 'Matcha latte while reading', date: today, is_planned: false },
];

export const demoSavings: SavingsGoal[] = [
  {
    id: 'sav-1',
    user_id: DEMO_USER_ID,
    title: 'Peace-of-Mind Emergency Fund',
    target_amount: 3000.00,
    current_amount: 1850.00,
    target_date: addDays(new Date(), 180).toISOString().split('T')[0],
    notes: 'Kept in high-yield savings account away from daily checking.',
  },
  {
    id: 'sav-2',
    user_id: DEMO_USER_ID,
    title: 'Weekend Cabin Retreat',
    target_amount: 600.00,
    current_amount: 420.00,
    target_date: addDays(new Date(), 90).toISOString().split('T')[0],
  },
];

export const demoDebts: Debt[] = [
  {
    id: 'debt-1',
    user_id: DEMO_USER_ID,
    name: 'Credit Card (Main)',
    current_balance: 750.00,
    interest_rate: 18.5,
    minimum_payment: 35.00,
    due_day: 24,
    notes: 'Paying $150 each month to clear balance in 5 months.',
  },
];

export const demoLifeAdmin: LifeAdminItem[] = [
  {
    id: 'admin-1',
    user_id: DEMO_USER_ID,
    title: 'Car registration renewal',
    category: 'renewal',
    due_date: addDays(new Date(), 18).toISOString().split('T')[0],
    status: 'pending',
    notes: 'Online renewal link received in mail.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'admin-2',
    user_id: DEMO_USER_ID,
    title: 'Return wrong-size winter gloves',
    category: 'return_refund',
    due_date: addDays(new Date(), 6).toISOString().split('T')[0],
    status: 'pending',
    notes: 'Package return QR code in email; drop off at parcel locker.',
    created_at: new Date().toISOString(),
  },
];

export const demoFollowUps: FollowUpItem[] = [
  {
    id: 'fu-1',
    user_id: DEMO_USER_ID,
    title: 'Awaiting landlord reply on bathroom tap repair',
    person_or_org: 'Property Manager (David)',
    requested_date: subDays(new Date(), 4).toISOString().split('T')[0],
    follow_up_date: today,
    status: 'waiting',
    notes: 'Send gentle SMS reminder if no email by 3 PM.',
  },
  {
    id: 'fu-2',
    user_id: DEMO_USER_ID,
    title: 'Prescription renewal authorization from clinic',
    person_or_org: 'Dr. Evans office',
    requested_date: subDays(new Date(), 2).toISOString().split('T')[0],
    follow_up_date: tomorrow,
    status: 'waiting',
    notes: 'Pharmacy stated they sent fax request on Monday.',
  },
];

export const demoHousehold: HouseholdTask[] = [
  { id: 'hh-1', user_id: DEMO_USER_ID, title: 'Wipe kitchen counter and run dishwasher', zone: 'kitchen', frequency: 'daily', estimated_minutes: 10, is_completed: false },
  { id: 'hh-2', user_id: DEMO_USER_ID, title: 'Empty trash bins and replace liners', zone: 'general', frequency: 'weekly', estimated_minutes: 8, is_completed: true, last_completed: today },
  { id: 'hh-3', user_id: DEMO_USER_ID, title: 'Clean bathroom mirror and sink basin', zone: 'bathroom', frequency: 'weekly', estimated_minutes: 12, is_completed: false, next_due: tomorrow },
  { id: 'hh-4', user_id: DEMO_USER_ID, title: 'Change bed sheets and pillow cases', zone: 'bedroom', frequency: 'weekly', estimated_minutes: 10, is_completed: false, next_due: addDays(new Date(), 2).toISOString().split('T')[0] },
];

export const demoInventory: HouseholdInventoryItem[] = [
  { id: 'inv-1', user_id: DEMO_USER_ID, item_name: 'Ground Espresso Beans', category: 'pantry', quantity: 1, reorder_level: 1, location: 'Kitchen cupboard' },
  { id: 'inv-2', user_id: DEMO_USER_ID, item_name: 'Dishwasher Pods', category: 'supplies', quantity: 8, reorder_level: 10, location: 'Under sink' },
  { id: 'inv-3', user_id: DEMO_USER_ID, item_name: 'AA Rechargeable Batteries', category: 'supplies', quantity: 4, reorder_level: 2, location: 'Desk drawer' },
];

