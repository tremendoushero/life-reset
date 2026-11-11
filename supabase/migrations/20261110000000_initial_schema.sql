-- ====================================================================
-- LIFE RESET: Comprehensive Supabase PostgreSQL Schema & Security
-- Migration: 20261110000000_initial_schema.sql
-- Description: Complete 30-table personal life management schema
-- Security: Explicit Row Level Security (RLS) on EVERY table
-- Enforcement: Strict tenant isolation where auth.uid() = user_id
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- TABLE DEFINITIONS WITH EXPLICIT ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
CREATE POLICY "profiles_delete" ON public.profiles
    FOR DELETE TO authenticated
    USING (auth.uid() = id);

-- --------------------------------------------------------------------
-- 2. USER_PREFERENCES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'warm-ivory' CHECK (theme IN ('warm-ivory', 'sage', 'lavender', 'soft-blue', 'soft-peach', 'dark-espresso')),
    color_mode TEXT DEFAULT 'light' CHECK (color_mode IN ('light', 'dark', 'system')),
    font_size TEXT DEFAULT 'normal' CHECK (font_size IN ('normal', 'large', 'x-large')),
    reduced_motion BOOLEAN DEFAULT FALSE,
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    start_of_week INTEGER DEFAULT 1 CHECK (start_of_week IN (0, 1, 6)),
    timezone TEXT DEFAULT 'UTC',
    active_capacity_mode TEXT DEFAULT 'normal' CHECK (active_capacity_mode IN ('normal', 'low-energy', 'overwhelmed', 'focus', 'brain-dump')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT user_preferences_user_unique UNIQUE (user_id)
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_preferences_select" ON public.user_preferences;
CREATE POLICY "user_preferences_select" ON public.user_preferences
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_preferences_insert" ON public.user_preferences;
CREATE POLICY "user_preferences_insert" ON public.user_preferences
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_preferences_update" ON public.user_preferences;
CREATE POLICY "user_preferences_update" ON public.user_preferences
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_preferences_delete" ON public.user_preferences;
CREATE POLICY "user_preferences_delete" ON public.user_preferences
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 3. TASKS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    priority TEXT DEFAULT 'important' CHECK (priority IN ('essential', 'important', 'optional')),
    due_date DATE,
    due_time TIME,
    estimated_duration INTEGER DEFAULT 15,
    status TEXT DEFAULT 'not_started' CHECK (status IN ('inbox', 'not_started', 'in_progress', 'completed', 'waiting', 'archived')),
    energy_requirement TEXT DEFAULT 'medium' CHECK (energy_requirement IN ('very_low', 'low', 'medium', 'high')),
    context TEXT,
    recurrence TEXT DEFAULT 'none' CHECK (recurrence IN ('none', 'daily', 'weekdays', 'weekly', 'monthly')),
    notes TEXT,
    is_top_three BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    postponed_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
CREATE POLICY "tasks_select" ON public.tasks
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
CREATE POLICY "tasks_insert" ON public.tasks
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
CREATE POLICY "tasks_update" ON public.tasks
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;
CREATE POLICY "tasks_delete" ON public.tasks
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 4. TASK_SUBTASKS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    estimated_minutes INTEGER DEFAULT 5,
    is_completed BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_subtasks FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_subtasks_select" ON public.task_subtasks;
CREATE POLICY "task_subtasks_select" ON public.task_subtasks
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "task_subtasks_insert" ON public.task_subtasks;
CREATE POLICY "task_subtasks_insert" ON public.task_subtasks
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_id AND t.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "task_subtasks_update" ON public.task_subtasks;
CREATE POLICY "task_subtasks_update" ON public.task_subtasks
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_id AND t.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "task_subtasks_delete" ON public.task_subtasks;
CREATE POLICY "task_subtasks_delete" ON public.task_subtasks
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 5. BRAIN_DUMP_ENTRIES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.brain_dump_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'uncategorized',
    is_processed BOOLEAN DEFAULT FALSE,
    converted_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.brain_dump_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_dump_entries FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brain_dump_select" ON public.brain_dump_entries;
CREATE POLICY "brain_dump_select" ON public.brain_dump_entries
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "brain_dump_insert" ON public.brain_dump_entries;
CREATE POLICY "brain_dump_insert" ON public.brain_dump_entries
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        (converted_task_id IS NULL OR EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = converted_task_id AND t.user_id = auth.uid()
        ))
    );

DROP POLICY IF EXISTS "brain_dump_update" ON public.brain_dump_entries;
CREATE POLICY "brain_dump_update" ON public.brain_dump_entries
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id AND
        (converted_task_id IS NULL OR EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = converted_task_id AND t.user_id = auth.uid()
        ))
    );

DROP POLICY IF EXISTS "brain_dump_delete" ON public.brain_dump_entries;
CREATE POLICY "brain_dump_delete" ON public.brain_dump_entries
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 6. GOALS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "goals_select" ON public.goals;
CREATE POLICY "goals_select" ON public.goals
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "goals_insert" ON public.goals;
CREATE POLICY "goals_insert" ON public.goals
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "goals_update" ON public.goals;
CREATE POLICY "goals_update" ON public.goals
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "goals_delete" ON public.goals;
CREATE POLICY "goals_delete" ON public.goals
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 7. GOAL_MILESTONES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.goal_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_date DATE,
    is_completed BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_milestones FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "goal_milestones_select" ON public.goal_milestones;
CREATE POLICY "goal_milestones_select" ON public.goal_milestones
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "goal_milestones_insert" ON public.goal_milestones;
CREATE POLICY "goal_milestones_insert" ON public.goal_milestones
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.goals g
            WHERE g.id = goal_id AND g.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "goal_milestones_update" ON public.goal_milestones;
CREATE POLICY "goal_milestones_update" ON public.goal_milestones
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.goals g
            WHERE g.id = goal_id AND g.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "goal_milestones_delete" ON public.goal_milestones;
CREATE POLICY "goal_milestones_delete" ON public.goal_milestones
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 8. PROJECTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select" ON public.projects;
CREATE POLICY "projects_select" ON public.projects
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "projects_insert" ON public.projects;
CREATE POLICY "projects_insert" ON public.projects
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        (goal_id IS NULL OR EXISTS (
            SELECT 1 FROM public.goals g
            WHERE g.id = goal_id AND g.user_id = auth.uid()
        ))
    );

DROP POLICY IF EXISTS "projects_update" ON public.projects;
CREATE POLICY "projects_update" ON public.projects
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id AND
        (goal_id IS NULL OR EXISTS (
            SELECT 1 FROM public.goals g
            WHERE g.id = goal_id AND g.user_id = auth.uid()
        ))
    );

DROP POLICY IF EXISTS "projects_delete" ON public.projects;
CREATE POLICY "projects_delete" ON public.projects
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 9. HABITS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "habits_select" ON public.habits;
CREATE POLICY "habits_select" ON public.habits
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "habits_insert" ON public.habits;
CREATE POLICY "habits_insert" ON public.habits
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "habits_update" ON public.habits;
CREATE POLICY "habits_update" ON public.habits
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "habits_delete" ON public.habits;
CREATE POLICY "habits_delete" ON public.habits
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 10. HABIT_LOGS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.habit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT habit_logs_user_habit_date_unique UNIQUE (user_id, habit_id, date)
);

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "habit_logs_select" ON public.habit_logs;
CREATE POLICY "habit_logs_select" ON public.habit_logs
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "habit_logs_insert" ON public.habit_logs;
CREATE POLICY "habit_logs_insert" ON public.habit_logs
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.habits h
            WHERE h.id = habit_id AND h.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "habit_logs_update" ON public.habit_logs;
CREATE POLICY "habit_logs_update" ON public.habit_logs
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.habits h
            WHERE h.id = habit_id AND h.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "habit_logs_delete" ON public.habit_logs;
CREATE POLICY "habit_logs_delete" ON public.habit_logs
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 11. MOOD_ENTRIES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mood_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    mood TEXT NOT NULL CHECK (mood IN ('low', 'meh', 'okay', 'good', 'bright')),
    notes TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_entries FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mood_entries_select" ON public.mood_entries;
CREATE POLICY "mood_entries_select" ON public.mood_entries
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "mood_entries_insert" ON public.mood_entries;
CREATE POLICY "mood_entries_insert" ON public.mood_entries
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "mood_entries_update" ON public.mood_entries;
CREATE POLICY "mood_entries_update" ON public.mood_entries
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "mood_entries_delete" ON public.mood_entries;
CREATE POLICY "mood_entries_delete" ON public.mood_entries
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 12. ENERGY_ENTRIES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.energy_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    energy_level TEXT NOT NULL CHECK (energy_level IN ('empty', 'low', 'steady', 'high', 'full')),
    time_of_day TEXT DEFAULT 'morning' CHECK (time_of_day IN ('morning', 'afternoon', 'evening')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.energy_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_entries FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "energy_entries_select" ON public.energy_entries;
CREATE POLICY "energy_entries_select" ON public.energy_entries
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "energy_entries_insert" ON public.energy_entries;
CREATE POLICY "energy_entries_insert" ON public.energy_entries
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "energy_entries_update" ON public.energy_entries;
CREATE POLICY "energy_entries_update" ON public.energy_entries
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "energy_entries_delete" ON public.energy_entries;
CREATE POLICY "energy_entries_delete" ON public.energy_entries
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 13. JOURNAL_ENTRIES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    prompt TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "journal_entries_select" ON public.journal_entries;
CREATE POLICY "journal_entries_select" ON public.journal_entries
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "journal_entries_insert" ON public.journal_entries;
CREATE POLICY "journal_entries_insert" ON public.journal_entries
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "journal_entries_update" ON public.journal_entries;
CREATE POLICY "journal_entries_update" ON public.journal_entries
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "journal_entries_delete" ON public.journal_entries;
CREATE POLICY "journal_entries_delete" ON public.journal_entries
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 14. GRATITUDE_ENTRIES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gratitude_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.gratitude_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gratitude_entries FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gratitude_entries_select" ON public.gratitude_entries;
CREATE POLICY "gratitude_entries_select" ON public.gratitude_entries
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "gratitude_entries_insert" ON public.gratitude_entries;
CREATE POLICY "gratitude_entries_insert" ON public.gratitude_entries
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "gratitude_entries_update" ON public.gratitude_entries;
CREATE POLICY "gratitude_entries_update" ON public.gratitude_entries
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "gratitude_entries_delete" ON public.gratitude_entries;
CREATE POLICY "gratitude_entries_delete" ON public.gratitude_entries
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 15. DOPAMINE_ACTIVITIES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dopamine_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'appetizer' CHECK (category IN ('appetizer', 'entree', 'side', 'dessert')),
    duration_minutes INTEGER DEFAULT 5,
    energy_needed TEXT DEFAULT 'low' CHECK (energy_needed IN ('very_low', 'low', 'medium', 'high')),
    is_favorite BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.dopamine_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dopamine_activities FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dopamine_activities_select" ON public.dopamine_activities;
CREATE POLICY "dopamine_activities_select" ON public.dopamine_activities
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "dopamine_activities_insert" ON public.dopamine_activities;
CREATE POLICY "dopamine_activities_insert" ON public.dopamine_activities
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "dopamine_activities_update" ON public.dopamine_activities;
CREATE POLICY "dopamine_activities_update" ON public.dopamine_activities
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "dopamine_activities_delete" ON public.dopamine_activities;
CREATE POLICY "dopamine_activities_delete" ON public.dopamine_activities
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 16. FOCUS_SESSIONS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.focus_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    target_duration_minutes INTEGER NOT NULL,
    actual_duration_minutes INTEGER NOT NULL,
    completed BOOLEAN DEFAULT TRUE,
    distraction_count INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "focus_sessions_select" ON public.focus_sessions;
CREATE POLICY "focus_sessions_select" ON public.focus_sessions
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "focus_sessions_insert" ON public.focus_sessions;
CREATE POLICY "focus_sessions_insert" ON public.focus_sessions
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        (task_id IS NULL OR EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_id AND t.user_id = auth.uid()
        ))
    );

DROP POLICY IF EXISTS "focus_sessions_update" ON public.focus_sessions;
CREATE POLICY "focus_sessions_update" ON public.focus_sessions
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id AND
        (task_id IS NULL OR EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_id AND t.user_id = auth.uid()
        ))
    );

DROP POLICY IF EXISTS "focus_sessions_delete" ON public.focus_sessions;
CREATE POLICY "focus_sessions_delete" ON public.focus_sessions
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 17. CALENDAR_EVENTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calendar_events_select" ON public.calendar_events;
CREATE POLICY "calendar_events_select" ON public.calendar_events
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "calendar_events_insert" ON public.calendar_events;
CREATE POLICY "calendar_events_insert" ON public.calendar_events
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "calendar_events_update" ON public.calendar_events;
CREATE POLICY "calendar_events_update" ON public.calendar_events
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "calendar_events_delete" ON public.calendar_events;
CREATE POLICY "calendar_events_delete" ON public.calendar_events
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 18. BILLS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bills_select" ON public.bills;
CREATE POLICY "bills_select" ON public.bills
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "bills_insert" ON public.bills;
CREATE POLICY "bills_insert" ON public.bills
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bills_update" ON public.bills;
CREATE POLICY "bills_update" ON public.bills
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bills_delete" ON public.bills;
CREATE POLICY "bills_delete" ON public.bills
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 19. TRANSACTIONS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select" ON public.transactions;
CREATE POLICY "transactions_select" ON public.transactions
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_insert" ON public.transactions;
CREATE POLICY "transactions_insert" ON public.transactions
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_update" ON public.transactions;
CREATE POLICY "transactions_update" ON public.transactions
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_delete" ON public.transactions;
CREATE POLICY "transactions_delete" ON public.transactions
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 20. SAVINGS_GOALS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.savings_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL,
    current_amount NUMERIC(12, 2) DEFAULT 0,
    target_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "savings_goals_select" ON public.savings_goals;
CREATE POLICY "savings_goals_select" ON public.savings_goals
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "savings_goals_insert" ON public.savings_goals;
CREATE POLICY "savings_goals_insert" ON public.savings_goals
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "savings_goals_update" ON public.savings_goals;
CREATE POLICY "savings_goals_update" ON public.savings_goals
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "savings_goals_delete" ON public.savings_goals;
CREATE POLICY "savings_goals_delete" ON public.savings_goals
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 21. DEBTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "debts_select" ON public.debts;
CREATE POLICY "debts_select" ON public.debts
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "debts_insert" ON public.debts;
CREATE POLICY "debts_insert" ON public.debts
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "debts_update" ON public.debts;
CREATE POLICY "debts_update" ON public.debts
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "debts_delete" ON public.debts;
CREATE POLICY "debts_delete" ON public.debts
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 22. LIFE_ADMIN_ITEMS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.life_admin_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('appointment', 'renewal', 'document', 'insurance', 'errand', 'return_refund', 'form', 'general')),
    due_date DATE,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.life_admin_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_admin_items FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "life_admin_items_select" ON public.life_admin_items;
CREATE POLICY "life_admin_items_select" ON public.life_admin_items
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "life_admin_items_insert" ON public.life_admin_items;
CREATE POLICY "life_admin_items_insert" ON public.life_admin_items
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "life_admin_items_update" ON public.life_admin_items;
CREATE POLICY "life_admin_items_update" ON public.life_admin_items
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "life_admin_items_delete" ON public.life_admin_items;
CREATE POLICY "life_admin_items_delete" ON public.life_admin_items
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 23. FOLLOW_UPS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follow_ups_select" ON public.follow_ups;
CREATE POLICY "follow_ups_select" ON public.follow_ups
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "follow_ups_insert" ON public.follow_ups;
CREATE POLICY "follow_ups_insert" ON public.follow_ups
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "follow_ups_update" ON public.follow_ups;
CREATE POLICY "follow_ups_update" ON public.follow_ups
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "follow_ups_delete" ON public.follow_ups;
CREATE POLICY "follow_ups_delete" ON public.follow_ups
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 24. HOUSEHOLD_TASKS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.household_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    zone TEXT DEFAULT 'general',
    frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'seasonal')),
    last_completed DATE,
    next_due DATE,
    estimated_minutes INTEGER DEFAULT 15,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.household_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_tasks FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "household_tasks_select" ON public.household_tasks;
CREATE POLICY "household_tasks_select" ON public.household_tasks
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "household_tasks_insert" ON public.household_tasks;
CREATE POLICY "household_tasks_insert" ON public.household_tasks
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "household_tasks_update" ON public.household_tasks;
CREATE POLICY "household_tasks_update" ON public.household_tasks
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "household_tasks_delete" ON public.household_tasks;
CREATE POLICY "household_tasks_delete" ON public.household_tasks
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 25. HOUSEHOLD_INVENTORY
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.household_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    category TEXT DEFAULT 'pantry',
    quantity INTEGER DEFAULT 1,
    reorder_level INTEGER DEFAULT 1,
    location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.household_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_inventory FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "household_inventory_select" ON public.household_inventory;
CREATE POLICY "household_inventory_select" ON public.household_inventory
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "household_inventory_insert" ON public.household_inventory;
CREATE POLICY "household_inventory_insert" ON public.household_inventory
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "household_inventory_update" ON public.household_inventory;
CREATE POLICY "household_inventory_update" ON public.household_inventory
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "household_inventory_delete" ON public.household_inventory;
CREATE POLICY "household_inventory_delete" ON public.household_inventory
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 26. WEEKLY_REVIEWS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.weekly_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reviews FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "weekly_reviews_select" ON public.weekly_reviews;
CREATE POLICY "weekly_reviews_select" ON public.weekly_reviews
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "weekly_reviews_insert" ON public.weekly_reviews;
CREATE POLICY "weekly_reviews_insert" ON public.weekly_reviews
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "weekly_reviews_update" ON public.weekly_reviews;
CREATE POLICY "weekly_reviews_update" ON public.weekly_reviews
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "weekly_reviews_delete" ON public.weekly_reviews;
CREATE POLICY "weekly_reviews_delete" ON public.weekly_reviews
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 27. MONTHLY_REVIEWS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.monthly_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month_start DATE NOT NULL,
    personal_highlights TEXT,
    challenges_faced TEXT,
    lessons_learned TEXT,
    what_to_change_next_month TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT monthly_reviews_user_month_unique UNIQUE (user_id, month_start)
);

ALTER TABLE public.monthly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_reviews FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "monthly_reviews_select" ON public.monthly_reviews;
CREATE POLICY "monthly_reviews_select" ON public.monthly_reviews
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "monthly_reviews_insert" ON public.monthly_reviews;
CREATE POLICY "monthly_reviews_insert" ON public.monthly_reviews
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "monthly_reviews_update" ON public.monthly_reviews;
CREATE POLICY "monthly_reviews_update" ON public.monthly_reviews
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "monthly_reviews_delete" ON public.monthly_reviews;
CREATE POLICY "monthly_reviews_delete" ON public.monthly_reviews
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 28. DASHBOARD_LAYOUTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dashboard_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_order TEXT[] DEFAULT ARRAY['capacity', 'top_three', 'time_awareness', 'quick_tasks', 'progress', 'gentle_reminders'],
    hidden_cards TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT dashboard_layouts_user_unique UNIQUE (user_id)
);

ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_layouts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dashboard_layouts_select" ON public.dashboard_layouts;
CREATE POLICY "dashboard_layouts_select" ON public.dashboard_layouts
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "dashboard_layouts_insert" ON public.dashboard_layouts;
CREATE POLICY "dashboard_layouts_insert" ON public.dashboard_layouts
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "dashboard_layouts_update" ON public.dashboard_layouts;
CREATE POLICY "dashboard_layouts_update" ON public.dashboard_layouts
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "dashboard_layouts_delete" ON public.dashboard_layouts;
CREATE POLICY "dashboard_layouts_delete" ON public.dashboard_layouts
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 29. SUBSCRIPTIONS_OR_ENTITLEMENTS
-- Special handling: Users can only read their own entitlement status.
-- Grants, modifications, and revocations can only be performed by service_role (backend webhook).
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions_or_entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL DEFAULT 'lifetime_license',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'revoked', 'trial')),
    provider TEXT NOT NULL DEFAULT 'standalone' CHECK (provider IN ('standalone', 'gumroad', 'stripe', 'lemonsqueezy', 'test')),
    external_customer_id TEXT,
    external_subscription_id TEXT,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT user_entitlements_user_unique UNIQUE (user_id)
);

ALTER TABLE public.subscriptions_or_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions_or_entitlements FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "entitlements_select" ON public.subscriptions_or_entitlements;
CREATE POLICY "entitlements_select" ON public.subscriptions_or_entitlements
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "entitlements_insert" ON public.subscriptions_or_entitlements;
DROP POLICY IF EXISTS "entitlements_update" ON public.subscriptions_or_entitlements;
DROP POLICY IF EXISTS "entitlements_delete" ON public.subscriptions_or_entitlements;

-- --------------------------------------------------------------------
-- 30. PAYMENT_EVENTS
-- Special handling: Users can only read their own payment logs.
-- Mutations (INSERT/UPDATE/DELETE) can only be performed by service_role (backend webhook).
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_events_select" ON public.payment_events;
CREATE POLICY "payment_events_select" ON public.payment_events
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- ====================================================================
-- PERFORMANCE INDEXES (Optimized for user_id and timestamp filters)
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON public.tasks (user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks (user_id, status);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON public.task_subtasks (task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_user ON public.task_subtasks (user_id);
CREATE INDEX IF NOT EXISTS idx_brain_dump_user ON public.brain_dump_entries (user_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals (user_id, status);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_goal ON public.goal_milestones (goal_id);
CREATE INDEX IF NOT EXISTS idx_projects_user ON public.projects (user_id, status);
CREATE INDEX IF NOT EXISTS idx_habits_user ON public.habits (user_id, is_paused);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON public.habit_logs (user_id, date);
CREATE INDEX IF NOT EXISTS idx_mood_user_date ON public.mood_entries (user_id, date);
CREATE INDEX IF NOT EXISTS idx_energy_user_date ON public.energy_entries (user_id, date);
CREATE INDEX IF NOT EXISTS idx_journal_user_date ON public.journal_entries (user_id, date);
CREATE INDEX IF NOT EXISTS idx_gratitude_user_date ON public.gratitude_entries (user_id, date);
CREATE INDEX IF NOT EXISTS idx_dopamine_user ON public.dopamine_activities (user_id);
CREATE INDEX IF NOT EXISTS idx_focus_user_date ON public.focus_sessions (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_calendar_user_range ON public.calendar_events (user_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bills_user_due ON public.bills (user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions (user_id, date);
CREATE INDEX IF NOT EXISTS idx_savings_user ON public.savings_goals (user_id);
CREATE INDEX IF NOT EXISTS idx_debts_user ON public.debts (user_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_due ON public.life_admin_items (user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_follow_ups_user ON public.follow_ups (user_id, follow_up_date);
CREATE INDEX IF NOT EXISTS idx_household_user ON public.household_tasks (user_id, next_due);
CREATE INDEX IF NOT EXISTS idx_inventory_user ON public.household_inventory (user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_user ON public.weekly_reviews (user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_monthly_user ON public.monthly_reviews (user_id, month_start);
CREATE INDEX IF NOT EXISTS idx_payment_events_user ON public.payment_events (user_id);

-- ====================================================================
-- AUTOMATIC UPDATED_AT TRIGGER FUNCTION & TRIGGERS
-- Updates updated_at to NOW() automatically on every row update.
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Profiles
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 2. User Preferences
DROP TRIGGER IF EXISTS trigger_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER trigger_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 3. Tasks
DROP TRIGGER IF EXISTS trigger_tasks_updated_at ON public.tasks;
CREATE TRIGGER trigger_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Task Subtasks
DROP TRIGGER IF EXISTS trigger_task_subtasks_updated_at ON public.task_subtasks;
CREATE TRIGGER trigger_task_subtasks_updated_at
    BEFORE UPDATE ON public.task_subtasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Brain Dump Entries
DROP TRIGGER IF EXISTS trigger_brain_dump_entries_updated_at ON public.brain_dump_entries;
CREATE TRIGGER trigger_brain_dump_entries_updated_at
    BEFORE UPDATE ON public.brain_dump_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. Goals
DROP TRIGGER IF EXISTS trigger_goals_updated_at ON public.goals;
CREATE TRIGGER trigger_goals_updated_at
    BEFORE UPDATE ON public.goals
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. Goal Milestones
DROP TRIGGER IF EXISTS trigger_goal_milestones_updated_at ON public.goal_milestones;
CREATE TRIGGER trigger_goal_milestones_updated_at
    BEFORE UPDATE ON public.goal_milestones
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 8. Projects
DROP TRIGGER IF EXISTS trigger_projects_updated_at ON public.projects;
CREATE TRIGGER trigger_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 9. Habits
DROP TRIGGER IF EXISTS trigger_habits_updated_at ON public.habits;
CREATE TRIGGER trigger_habits_updated_at
    BEFORE UPDATE ON public.habits
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 10. Journal Entries
DROP TRIGGER IF EXISTS trigger_journal_entries_updated_at ON public.journal_entries;
CREATE TRIGGER trigger_journal_entries_updated_at
    BEFORE UPDATE ON public.journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 11. Calendar Events
DROP TRIGGER IF EXISTS trigger_calendar_events_updated_at ON public.calendar_events;
CREATE TRIGGER trigger_calendar_events_updated_at
    BEFORE UPDATE ON public.calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 12. Bills
DROP TRIGGER IF EXISTS trigger_bills_updated_at ON public.bills;
CREATE TRIGGER trigger_bills_updated_at
    BEFORE UPDATE ON public.bills
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 13. Transactions
DROP TRIGGER IF EXISTS trigger_transactions_updated_at ON public.transactions;
CREATE TRIGGER trigger_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 14. Savings Goals
DROP TRIGGER IF EXISTS trigger_savings_goals_updated_at ON public.savings_goals;
CREATE TRIGGER trigger_savings_goals_updated_at
    BEFORE UPDATE ON public.savings_goals
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 15. Debts
DROP TRIGGER IF EXISTS trigger_debts_updated_at ON public.debts;
CREATE TRIGGER trigger_debts_updated_at
    BEFORE UPDATE ON public.debts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 16. Life Admin Items
DROP TRIGGER IF EXISTS trigger_life_admin_items_updated_at ON public.life_admin_items;
CREATE TRIGGER trigger_life_admin_items_updated_at
    BEFORE UPDATE ON public.life_admin_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 17. Follow Ups
DROP TRIGGER IF EXISTS trigger_follow_ups_updated_at ON public.follow_ups;
CREATE TRIGGER trigger_follow_ups_updated_at
    BEFORE UPDATE ON public.follow_ups
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 18. Household Tasks
DROP TRIGGER IF EXISTS trigger_household_tasks_updated_at ON public.household_tasks;
CREATE TRIGGER trigger_household_tasks_updated_at
    BEFORE UPDATE ON public.household_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 19. Household Inventory
DROP TRIGGER IF EXISTS trigger_household_inventory_updated_at ON public.household_inventory;
CREATE TRIGGER trigger_household_inventory_updated_at
    BEFORE UPDATE ON public.household_inventory
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 20. Dashboard Layouts
DROP TRIGGER IF EXISTS trigger_dashboard_layouts_updated_at ON public.dashboard_layouts;
CREATE TRIGGER trigger_dashboard_layouts_updated_at
    BEFORE UPDATE ON public.dashboard_layouts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 21. Subscriptions / Entitlements
DROP TRIGGER IF EXISTS trigger_subscriptions_updated_at ON public.subscriptions_or_entitlements;
CREATE TRIGGER trigger_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions_or_entitlements
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ====================================================================
-- CROSS-TABLE PARENT RECORD OWNERSHIP VALIDATION
-- Enforces that foreign key parent records belong to the same user_id.
-- Preserves nullable relationships (skips when NULL) and ON DELETE behaviour.
-- ====================================================================
CREATE OR REPLACE FUNCTION public.validate_parent_record_ownership()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. task_subtasks -> tasks
    IF TG_TABLE_NAME = 'task_subtasks' THEN
        IF NEW.task_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM public.tasks WHERE id = NEW.task_id AND user_id = NEW.user_id
        ) THEN
            RAISE EXCEPTION 'Ownership violation: task_id % does not belong to user %', NEW.task_id, NEW.user_id;
        END IF;

    -- 2. goal_milestones -> goals
    ELSIF TG_TABLE_NAME = 'goal_milestones' THEN
        IF NEW.goal_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM public.goals WHERE id = NEW.goal_id AND user_id = NEW.user_id
        ) THEN
            RAISE EXCEPTION 'Ownership violation: goal_id % does not belong to user %', NEW.goal_id, NEW.user_id;
        END IF;

    -- 3. habit_logs -> habits
    ELSIF TG_TABLE_NAME = 'habit_logs' THEN
        IF NEW.habit_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM public.habits WHERE id = NEW.habit_id AND user_id = NEW.user_id
        ) THEN
            RAISE EXCEPTION 'Ownership violation: habit_id % does not belong to user %', NEW.habit_id, NEW.user_id;
        END IF;

    -- 4. projects -> goals (nullable)
    ELSIF TG_TABLE_NAME = 'projects' THEN
        IF NEW.goal_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM public.goals WHERE id = NEW.goal_id AND user_id = NEW.user_id
        ) THEN
            RAISE EXCEPTION 'Ownership violation: goal_id % does not belong to user %', NEW.goal_id, NEW.user_id;
        END IF;

    -- 5. focus_sessions -> tasks (nullable)
    ELSIF TG_TABLE_NAME = 'focus_sessions' THEN
        IF NEW.task_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM public.tasks WHERE id = NEW.task_id AND user_id = NEW.user_id
        ) THEN
            RAISE EXCEPTION 'Ownership violation: task_id % does not belong to user %', NEW.task_id, NEW.user_id;
        END IF;

    -- 6. brain_dump_entries -> tasks (converted_task_id, nullable)
    ELSIF TG_TABLE_NAME = 'brain_dump_entries' THEN
        IF NEW.converted_task_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM public.tasks WHERE id = NEW.converted_task_id AND user_id = NEW.user_id
        ) THEN
            RAISE EXCEPTION 'Ownership violation: converted_task_id % does not belong to user %', NEW.converted_task_id, NEW.user_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ownership triggers on child tables (BEFORE INSERT OR UPDATE)
DROP TRIGGER IF EXISTS trigger_validate_task_subtasks_ownership ON public.task_subtasks;
CREATE TRIGGER trigger_validate_task_subtasks_ownership
    BEFORE INSERT OR UPDATE ON public.task_subtasks
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_parent_record_ownership();

DROP TRIGGER IF EXISTS trigger_validate_goal_milestones_ownership ON public.goal_milestones;
CREATE TRIGGER trigger_validate_goal_milestones_ownership
    BEFORE INSERT OR UPDATE ON public.goal_milestones
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_parent_record_ownership();

DROP TRIGGER IF EXISTS trigger_validate_habit_logs_ownership ON public.habit_logs;
CREATE TRIGGER trigger_validate_habit_logs_ownership
    BEFORE INSERT OR UPDATE ON public.habit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_parent_record_ownership();

DROP TRIGGER IF EXISTS trigger_validate_projects_ownership ON public.projects;
CREATE TRIGGER trigger_validate_projects_ownership
    BEFORE INSERT OR UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_parent_record_ownership();

DROP TRIGGER IF EXISTS trigger_validate_focus_sessions_ownership ON public.focus_sessions;
CREATE TRIGGER trigger_validate_focus_sessions_ownership
    BEFORE INSERT OR UPDATE ON public.focus_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_parent_record_ownership();

DROP TRIGGER IF EXISTS trigger_validate_brain_dump_ownership ON public.brain_dump_entries;
CREATE TRIGGER trigger_validate_brain_dump_ownership
    BEFORE INSERT OR UPDATE ON public.brain_dump_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_parent_record_ownership();
