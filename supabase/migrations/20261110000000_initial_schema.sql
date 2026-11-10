-- ====================================================================
-- LIFE RESET: Comprehensive Supabase PostgreSQL Schema
-- Migration: 20261110000000_initial_schema.sql
-- Description: Complete 30-table schema with RLS, indexes & constraints
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. PROFILES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    planning_capacity TEXT DEFAULT 'steady' CHECK (planning_capacity IN ('empty', 'low', 'steady', 'high', 'full')),
    preferred_planning_time TEXT DEFAULT 'morning' CHECK (preferred_planning_time IN ('morning', 'afternoon', 'evening', 'anytime')),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 2. USER_PREFERENCES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'warm-ivory' CHECK (theme IN ('warm-ivory', 'sage', 'lavender', 'soft-blue', 'soft-peach', 'dark-espresso')),
    color_mode TEXT DEFAULT 'light' CHECK (color_mode IN ('light', 'dark', 'system')),
    font_size TEXT DEFAULT 'normal' CHECK (font_size IN ('normal', 'large', 'x-large')),
    reduced_motion BOOLEAN DEFAULT FALSE,
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    start_of_week INTEGER DEFAULT 1 CHECK (start_of_week IN (0, 1, 6)), -- 0=Sun, 1=Mon, 6=Sat
    timezone TEXT DEFAULT 'UTC',
    active_capacity_mode TEXT DEFAULT 'normal' CHECK (active_capacity_mode IN ('normal', 'low-energy', 'overwhelmed', 'focus', 'brain-dump')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT user_preferences_user_unique UNIQUE (user_id)
);

-- --------------------------------------------------------------------
-- 3. TASKS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    priority TEXT DEFAULT 'important' CHECK (priority IN ('essential', 'important', 'optional')),
    due_date DATE,
    due_time TIME,
    estimated_duration INTEGER DEFAULT 15, -- minutes
    status TEXT DEFAULT 'not_started' CHECK (status IN ('inbox', 'not_started', 'in_progress', 'completed', 'waiting', 'archived')),
    energy_requirement TEXT DEFAULT 'medium' CHECK (energy_requirement IN ('very_low', 'low', 'medium', 'high')),
    context TEXT, -- 'home', 'work', 'computer', 'errand'
    recurrence TEXT DEFAULT 'none' CHECK (recurrence IN ('none', 'daily', 'weekdays', 'weekly', 'monthly')),
    notes TEXT,
    is_top_three BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    postponed_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 4. TASK_SUBTASKS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_subtasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    estimated_minutes INTEGER DEFAULT 5,
    is_completed BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 5. BRAIN_DUMP_ENTRIES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.brain_dump_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'uncategorized',
    is_processed BOOLEAN DEFAULT FALSE,
    converted_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 6. GOALS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'personal',
    target_date DATE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    next_action TEXT,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'paused', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 7. GOAL_MILESTONES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.goal_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_date DATE,
    is_completed BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 8. PROJECTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    deadline DATE,
    next_action TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    notes TEXT,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 9. HABITS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    routine TEXT DEFAULT 'custom' CHECK (routine IN ('morning', 'evening', 'custom')),
    frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekdays', 'weekly', '2x_week', '3x_week')),
    energy_level TEXT DEFAULT 'low' CHECK (energy_level IN ('very_low', 'low', 'medium', 'high')),
    is_paused BOOLEAN DEFAULT FALSE,
    target_count_weekly INTEGER DEFAULT 7,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 10. HABIT_LOGS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.habit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT habit_logs_user_habit_date_unique UNIQUE (user_id, habit_id, date)
);

-- --------------------------------------------------------------------
-- 11. MOOD_ENTRIES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mood_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    mood TEXT NOT NULL CHECK (mood IN ('low', 'meh', 'okay', 'good', 'bright')),
    notes TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 12. ENERGY_ENTRIES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.energy_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    energy_level TEXT NOT NULL CHECK (energy_level IN ('empty', 'low', 'steady', 'high', 'full')),
    time_of_day TEXT DEFAULT 'morning' CHECK (time_of_day IN ('morning', 'afternoon', 'evening')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 13. JOURNAL_ENTRIES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    prompt TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 14. GRATITUDE_ENTRIES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gratitude_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 15. DOPAMINE_ACTIVITIES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dopamine_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'appetizer' CHECK (category IN ('appetizer', 'entree', 'side', 'dessert')), -- dopamine menu metaphors
    duration_minutes INTEGER DEFAULT 5,
    energy_needed TEXT DEFAULT 'low' CHECK (energy_needed IN ('very_low', 'low', 'medium', 'high')),
    is_favorite BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 16. FOCUS_SESSIONS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.focus_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    target_duration_minutes INTEGER NOT NULL,
    actual_duration_minutes INTEGER NOT NULL,
    completed BOOLEAN DEFAULT TRUE,
    distraction_count INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 17. CALENDAR_EVENTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    category TEXT DEFAULT 'event',
    color TEXT DEFAULT '#E78B3D',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 18. BILLS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    recurrence TEXT DEFAULT 'monthly' CHECK (recurrence IN ('one_time', 'weekly', 'monthly', 'quarterly', 'annually')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'auto_pay')),
    category TEXT DEFAULT 'utilities',
    paid_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 19. TRANSACTIONS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(12, 2) NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    is_planned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 20. SAVINGS_GOALS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL,
    current_amount NUMERIC(12, 2) DEFAULT 0,
    target_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 21. DEBTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    current_balance NUMERIC(12, 2) NOT NULL,
    interest_rate NUMERIC(5, 2),
    minimum_payment NUMERIC(12, 2),
    due_day INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 22. LIFE_ADMIN_ITEMS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.life_admin_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('appointment', 'renewal', 'document', 'insurance', 'errand', 'return_refund', 'form', 'general')),
    due_date DATE,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 23. FOLLOW_UPS (WAITING-FOR TRACKER)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    person_or_org TEXT NOT NULL,
    requested_date DATE DEFAULT CURRENT_DATE,
    follow_up_date DATE NOT NULL,
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'received', 'closed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 24. HOUSEHOLD_TASKS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.household_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    zone TEXT DEFAULT 'general', -- 'kitchen', 'bedroom', 'bathroom', 'living_room'
    frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'seasonal')),
    last_completed DATE,
    next_due DATE,
    estimated_minutes INTEGER DEFAULT 15,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 25. HOUSEHOLD_INVENTORY
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.household_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    category TEXT DEFAULT 'pantry', -- 'pantry', 'supplies', 'maintenance', 'emergency'
    quantity INTEGER DEFAULT 1,
    reorder_level INTEGER DEFAULT 1,
    location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 26. WEEKLY_REVIEWS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.weekly_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    tasks_completed_count INTEGER DEFAULT 0,
    focus_minutes_total INTEGER DEFAULT 0,
    small_wins TEXT[],
    what_was_difficult TEXT,
    what_helped TEXT,
    what_can_be_simplified TEXT,
    next_week_priority TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT weekly_reviews_user_week_unique UNIQUE (user_id, week_start)
);

-- --------------------------------------------------------------------
-- 27. MONTHLY_REVIEWS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.monthly_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month_start DATE NOT NULL,
    personal_highlights TEXT,
    challenges_faced TEXT,
    lessons_learned TEXT,
    what_to_change_next_month TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT monthly_reviews_user_month_unique UNIQUE (user_id, month_start)
);

-- --------------------------------------------------------------------
-- 28. DASHBOARD_LAYOUTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dashboard_layouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_order TEXT[] DEFAULT ARRAY['capacity', 'top_three', 'time_awareness', 'quick_tasks', 'progress', 'gentle_reminders'],
    hidden_cards TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT dashboard_layouts_user_unique UNIQUE (user_id)
);

-- --------------------------------------------------------------------
-- 29. SUBSCRIPTIONS_OR_ENTITLEMENTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions_or_entitlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL DEFAULT 'lifetime_19',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'revoked', 'trial')),
    provider TEXT NOT NULL DEFAULT 'test' CHECK (provider IN ('test', 'stripe', 'lemonsqueezy')),
    external_customer_id TEXT,
    external_subscription_id TEXT,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT user_entitlements_user_unique UNIQUE (user_id)
);

-- --------------------------------------------------------------------
-- 30. PAYMENT_EVENTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_id TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL,
    event_type TEXT NOT NULL,
    amount NUMERIC(10, 2),
    currency TEXT DEFAULT 'USD',
    status TEXT NOT NULL,
    payload JSONB,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON public.tasks (user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks (user_id, status);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON public.task_subtasks (task_id);
CREATE INDEX IF NOT EXISTS idx_brain_dump_user ON public.brain_dump_entries (user_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_habits_user ON public.habits (user_id, is_paused);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON public.habit_logs (user_id, date);
CREATE INDEX IF NOT EXISTS idx_mood_user_date ON public.mood_entries (user_id, date);
CREATE INDEX IF NOT EXISTS idx_energy_user_date ON public.energy_entries (user_id, date);
CREATE INDEX IF NOT EXISTS idx_journal_user_date ON public.journal_entries (user_id, date);
CREATE INDEX IF NOT EXISTS idx_focus_user_date ON public.focus_sessions (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_calendar_user_range ON public.calendar_events (user_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bills_user_due ON public.bills (user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions (user_id, date);
CREATE INDEX IF NOT EXISTS idx_admin_user_due ON public.life_admin_items (user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_follow_ups_user ON public.follow_ups (user_id, follow_up_date);
CREATE INDEX IF NOT EXISTS idx_household_user ON public.household_tasks (user_id, next_due);

-- --------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: Every user can ONLY see & mutate their own records
-- --------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_dump_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gratitude_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dopamine_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_admin_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions_or_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- Helper macro for standard user_id based RLS policies
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'user_preferences', 'tasks', 'task_subtasks', 'brain_dump_entries',
        'goals', 'goal_milestones', 'projects', 'habits', 'habit_logs',
        'mood_entries', 'energy_entries', 'journal_entries', 'gratitude_entries',
        'dopamine_activities', 'focus_sessions', 'calendar_events', 'bills',
        'transactions', 'savings_goals', 'debts', 'life_admin_items', 'follow_ups',
        'household_tasks', 'household_inventory', 'weekly_reviews', 'monthly_reviews',
        'dashboard_layouts', 'subscriptions_or_entitlements'
    ];
BEGIN
    -- Profiles table policy
    DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
    CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
    CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

    -- Loop standard tables
    FOREACH t IN ARRAY tables
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s_user_select" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "%s_user_select" ON public.%I FOR SELECT USING (auth.uid() = user_id)', t, t);

        EXECUTE format('DROP POLICY IF EXISTS "%s_user_insert" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "%s_user_insert" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)', t, t);

        EXECUTE format('DROP POLICY IF EXISTS "%s_user_update" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "%s_user_update" ON public.%I FOR UPDATE USING (auth.uid() = user_id)', t, t);

        EXECUTE format('DROP POLICY IF EXISTS "%s_user_delete" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "%s_user_delete" ON public.%I FOR DELETE USING (auth.uid() = user_id)', t, t);
    END LOOP;

    -- Payment events: users can only view their own payment events, edge function writes with service role
    DROP POLICY IF EXISTS "payment_events_select" ON public.payment_events;
    CREATE POLICY "payment_events_select" ON public.payment_events FOR SELECT USING (auth.uid() = user_id);
END $$;
