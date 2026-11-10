import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCapacity } from '@/contexts/CapacityContext';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { TaskCard } from '@/components/features/TaskCard';
import { TaskFormModal } from '@/components/features/TaskFormModal';
import { TinyStepRescueModal } from '@/components/features/TinyStepRescueModal';
import { TopThreeSelectorModal } from '@/components/features/TopThreeSelectorModal';
import { GentleRestartModal } from '@/components/features/GentleRestartModal';
import { AdaptiveModeSelector } from '@/components/features/AdaptiveModeSelector';
import { CapacityCheckIn } from '@/components/features/CapacityCheckIn';
import { FocusTimer } from '@/components/features/FocusTimer';
import { Task } from '@/types';
import { format } from 'date-fns';
import {
  Sparkles,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Feather,
  ArrowRight,
  Target,
  Smile,
  Shield,
  Coffee,
  Heart,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ListTodo,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { mode, setMode } = useCapacity();
  const {
    tasks,
    habits,
    habitLogs,
    focusSessions,
    gratitudes,
    bills,
    followUps,
    dopamineMenu,
    postponeTask,
    addBrainDump,
    convertBrainDumpToTask,
    brainDumps,
  } = useData();

  const navigate = useNavigate();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const now = new Date();

  // Modals state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [rescuingTask, setRescuingTask] = useState<Task | null>(null);
  const [topThreeModalOpen, setTopThreeModalOpen] = useState(false);
  const [restartModalOpen, setRestartModalOpen] = useState(false);

  // Quick brain dump in overwhelmed / brain dump mode
  const [quickThought, setQuickThought] = useState('');
  const [thoughtSaved, setThoughtSaved] = useState(false);

  // Active focus task selection for Focus Mode
  const [activeFocusTaskId, setActiveFocusTaskId] = useState<string>('');

  // Greeting by hour
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Tasks due today or flagged as top three
  const todayTasks = tasks.filter(
    t => (t.due_date === todayStr || t.is_top_three) && t.status !== 'archived'
  );
  const topThree = tasks.filter(t => t.is_top_three && t.status !== 'archived').slice(0, 3);

  // Real statistics derived strictly from actual user data records
  const completedToday = tasks.filter(
    t => t.completed_at && t.completed_at.startsWith(todayStr)
  ).length;
  const habitsDoneToday = habitLogs.filter(h => h.date === todayStr && h.completed).length;
  const focusMinsToday = focusSessions
    .filter(f => f.created_at.startsWith(todayStr))
    .reduce((acc, curr) => acc + curr.actual_duration_minutes, 0);

  // Upcoming reminders (bills pending soon, follow ups)
  const pendingBills = bills.filter(b => b.payment_status === 'pending');
  const activeFollowUps = followUps.filter(f => f.status === 'waiting');

  const handleSaveThought = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickThought.trim()) return;
    await addBrainDump(quickThought.trim());
    setQuickThought('');
    setThoughtSaved(true);
    setTimeout(() => setThoughtSaved(false), 2200);
  };

  // ----------------------------------------------------
  // MODE 5: BRAIN DUMP MODE (Distraction-Free Full View)
  // ----------------------------------------------------
  if (mode === 'brain-dump') {
    const recentDumps = brainDumps.filter(b => !b.is_archived).slice(0, 8);

    return (
      <div className="max-w-3xl mx-auto space-y-6 py-4 animate-fade-in">
        {/* Header bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-lavender-light text-lavender-dark flex items-center justify-center">
              <Feather className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-espresso-900 dark:text-ivory-50">
                Brain Dump Sanctuary
              </h2>
              <p className="text-xs text-espresso-500 dark:text-ivory-400">
                Type whatever is occupying your thoughts. No formatting, no sorting required.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setMode('normal')}>
            Return to Dashboard
          </Button>
        </div>

        {/* Large distraction-free input area */}
        <Card className="p-6 border-2 border-lavender/40 shadow-soft-md space-y-3 bg-cardwhite dark:bg-espresso-800">
          <form onSubmit={handleSaveThought} className="space-y-3">
            <textarea
              value={quickThought}
              onChange={e => setQuickThought(e.target.value)}
              placeholder="Dump a thought, chore, worry, or idea right here... (Press Enter or click Dump)"
              rows={4}
              autoFocus
              className="w-full p-4 rounded-xl border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900 text-sm md:text-base text-espresso-900 dark:text-ivory-100 placeholder-espresso-300 focus:outline-none focus:ring-2 focus:ring-lavender/40 resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-espresso-400 italic">
                {thoughtSaved ? (
                  <span className="text-sage-dark dark:text-sage-light font-semibold animate-fade-in">
                    ✓ Thought safely parked!
                  </span>
                ) : (
                  'Everything is saved automatically to your records.'
                )}
              </span>
              <Button type="submit" variant="primary" size="md" disabled={!quickThought.trim()}>
                Dump Thought
              </Button>
            </div>
          </form>
        </Card>

        {/* Recent captures stream */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-espresso-600 dark:text-ivory-300">
            <span>Recently Unloaded Thoughts ({recentDumps.length})</span>
            <button
              onClick={() => navigate('/brain-dump')}
              className="text-primary hover:underline font-medium capitalize"
            >
              Open Full Brain Dump Manager →
            </button>
          </div>

          <div className="space-y-2">
            {recentDumps.length === 0 ? (
              <Card className="text-center py-8 border-dashed">
                <p className="text-xs text-espresso-400">Your mind is clear. Type above to offload any cognitive weight.</p>
              </Card>
            ) : (
              recentDumps.map(entry => (
                <Card key={entry.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                  <span className="text-espresso-800 dark:text-ivory-100 font-medium break-words flex-1">
                    {entry.content}
                  </span>
                  {!entry.is_processed && (
                    <Button
                      variant="gentle"
                      size="sm"
                      onClick={() => convertBrainDumpToTask(entry.id, todayStr)}
                      icon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      To Today's Tasks
                    </Button>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // MODE 4: FOCUS MODE (Distraction-Free Single Task & Timer)
  // ----------------------------------------------------
  if (mode === 'focus') {
    const availableTasks = todayTasks.filter(t => t.status !== 'completed');
    const selectedTask =
      tasks.find(t => t.id === activeFocusTaskId) ||
      topThree.find(t => t.status !== 'completed') ||
      availableTasks[0] ||
      null;

    return (
      <div className="max-w-2xl mx-auto space-y-6 py-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-softblue-light text-softblue-dark flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-espresso-900 dark:text-ivory-50">
                Focus Mode
              </h2>
              <p className="text-xs text-espresso-500 dark:text-ivory-400">
                Zero clutter. One single task in sight with timed intervals.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setMode('normal')}>
            Exit Focus Mode
          </Button>
        </div>

        {/* Task Switcher Pill */}
        <Card className="p-4 flex items-center justify-between gap-3 border-2 border-primary/20">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary block mb-0.5">
              Current Focus Objective:
            </span>
            <p className="text-sm font-serif font-bold text-espresso-900 dark:text-ivory-50 truncate">
              {selectedTask ? selectedTask.title : 'General Focused Deep Work'}
            </p>
          </div>

          <div className="shrink-0">
            <select
              value={selectedTask?.id || ''}
              onChange={e => setActiveFocusTaskId(e.target.value)}
              className="text-xs rounded-xl border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900 px-3 py-1.5 text-espresso-800 dark:text-ivory-100"
            >
              <option value="">Choose task to focus on...</option>
              {availableTasks.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Focus Timer */}
        <FocusTimer selectedTask={selectedTask} />

        {/* Subtask micro-checklist if active task has subtasks */}
        {selectedTask && (selectedTask.subtasks || []).length > 0 && (
          <Card className="p-4 space-y-2">
            <span className="text-xs font-semibold uppercase text-espresso-600 dark:text-ivory-300">
              Task Micro-Steps:
            </span>
            <div className="space-y-1.5">
              {(selectedTask.subtasks || []).map(sub => (
                <div key={sub.id} className="flex items-center gap-2 text-xs">
                  <CheckCircle2
                    className={`w-4 h-4 ${sub.is_completed ? 'text-sage' : 'text-espresso-300'}`}
                  />
                  <span className={sub.is_completed ? 'line-through text-espresso-400' : 'text-espresso-800 dark:text-ivory-100'}>
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // MODE 3: OVERWHELMED MODE INTERFACE
  // ----------------------------------------------------
  if (mode === 'overwhelmed') {
    const singleAction =
      topThree.find(t => t.status !== 'completed') ||
      todayTasks.find(t => t.status !== 'completed');

    return (
      <div className="max-w-2xl mx-auto space-y-6 py-6 animate-fade-in px-2 sm:px-0">
        {/* Calming reassurance banner */}
        <div className="p-6 rounded-2xl bg-cardwhite dark:bg-espresso-800 border-2 border-softpeach/60 shadow-soft-md text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-softpeach-light text-softpeach-dark flex items-center justify-center mx-auto">
            <Smile className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-espresso-900 dark:text-ivory-50">
            Pause. You only need to do one small thing.
          </h2>
          <p className="text-xs sm:text-sm text-espresso-600 dark:text-ivory-300 max-w-md mx-auto leading-relaxed">
            Everything else can wait. Your worth is not measured by a checklist.
            Take a slow, deep breath. We have paused all other distractions.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setMode('normal')}
              className="text-xs font-semibold text-espresso-400 hover:text-espresso-700 dark:hover:text-ivory-100 underline"
            >
              Exit Overwhelmed Mode
            </button>
          </div>
        </div>

        {/* The One Single Action */}
        <Card className="p-6 border-2 border-primary/30 shadow-soft-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-2 block">
            Your Only Next Step Right Now:
          </span>
          {singleAction ? (
            <div className="space-y-4">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-espresso-900 dark:text-ivory-100 leading-snug">
                {singleAction.title}
              </h3>
              {singleAction.description && (
                <p className="text-xs sm:text-sm text-espresso-600 dark:text-ivory-300 leading-relaxed">
                  {singleAction.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Button
                  variant="primary"
                  onClick={() => setRescuingTask(singleAction)}
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  Break into 2-minute step
                </Button>
                <Button
                  variant="outline"
                  onClick={() => postponeTask(singleAction.id)}
                >
                  Postpone without guilt
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircle2 className="w-10 h-10 text-sage mx-auto mb-2" />
              <p className="font-semibold text-espresso-900 dark:text-ivory-100">
                You have no high-priority tasks right now!
              </p>
              <p className="text-xs text-espresso-500 mt-1">
                Rest, drink some cool water, or listen to favorite music.
              </p>
            </div>
          )}
        </Card>

        {/* Quick thought capture to unload cognitive weight */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-espresso-600 dark:text-ivory-300 flex items-center gap-1.5">
              <Feather className="w-3.5 h-3.5 text-primary" /> Unload your mind
            </span>
            {thoughtSaved && (
              <span className="text-xs text-sage-dark dark:text-sage-light font-medium animate-fade-in">
                Thought safely parked!
              </span>
            )}
          </div>
          <form onSubmit={handleSaveThought} className="flex gap-2">
            <input
              type="text"
              value={quickThought}
              onChange={e => setQuickThought(e.target.value)}
              placeholder="Dump whatever thought is bothering you..."
              className="flex-1 rounded-xl border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900 px-3 py-2 text-xs sm:text-sm text-espresso-900 dark:text-ivory-100 focus:outline-none focus:border-primary"
            />
            <Button type="submit" variant="secondary" size="sm">
              Park It
            </Button>
          </form>
        </Card>

        <TinyStepRescueModal
          isOpen={!!rescuingTask}
          onClose={() => setRescuingTask(null)}
          task={rescuingTask}
        />
      </div>
    );
  }

  // ----------------------------------------------------
  // MODE 2: LOW-ENERGY DAY INTERFACE (Simplified & Restful)
  // ----------------------------------------------------
  if (mode === 'low-energy') {
    // Only show essential tasks OR duration <= 15m OR very_low/low energy
    const lowEnergyTasks = todayTasks.filter(
      t =>
        t.priority === 'essential' ||
        t.estimated_duration <= 15 ||
        t.energy_requirement === 'very_low' ||
        t.energy_requirement === 'low'
    );

    const appetizers = dopamineMenu.filter(d => d.category === 'appetizer').slice(0, 3);

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in py-2">
        {/* Low-energy comforting header */}
        <div className="p-5 rounded-2xl bg-sage-light/60 dark:bg-espresso-800 border border-sage/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sage text-white flex items-center justify-center shrink-0">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-espresso-900 dark:text-ivory-50">
                Low-Energy Day Active
              </h2>
              <p className="text-xs text-espresso-600 dark:text-ivory-300">
                Everything non-essential has been tucked away. Only short wins and gentle care.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setMode('normal')}>
            Reset to Normal Day
          </Button>
        </div>

        {/* Capacity check-in for listening to energy */}
        <CapacityCheckIn />

        {/* Essential & Low-Effort Tasks Only */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-espresso-900 dark:text-ivory-50">
              Essential & Short Wins ({lowEnergyTasks.length})
            </h3>
            <span className="text-xs text-espresso-400">All heavy tasks are hidden</span>
          </div>

          <div className="space-y-2">
            {lowEnergyTasks.length === 0 ? (
              <Card className="text-center py-8">
                <Smile className="w-8 h-8 text-sage mx-auto mb-2 opacity-70" />
                <p className="text-sm font-semibold text-espresso-800 dark:text-ivory-100">
                  No high-energy obligations today.
                </p>
                <p className="text-xs text-espresso-400 mt-1">
                  Give yourself full permission to rest and recharge.
                </p>
              </Card>
            ) : (
              lowEnergyTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={t => {
                    setEditingTask(t);
                    setTaskModalOpen(true);
                  }}
                  onRescue={t => setRescuingTask(t)}
                />
              ))
            )}
          </div>
        </div>

        {/* Rest & Recovery Appetizers */}
        <Card className="p-4 border-l-4 border-l-sage">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-sage-dark dark:text-sage-light mb-2 flex items-center gap-1.5">
            <Heart className="w-4 h-4" />
            Gentle Dopamine & Recovery Menu
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {appetizers.map(app => (
              <div
                key={app.id}
                className="p-2.5 rounded-xl bg-ivory-100 dark:bg-espresso-900 text-xs text-espresso-800 dark:text-ivory-200 border border-ivory-200 dark:border-espresso-700"
              >
                <p className="font-medium truncate">{app.title}</p>
                <span className="text-[10px] text-espresso-400">{app.duration_minutes}m pause</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Modals */}
        <TaskFormModal
          isOpen={taskModalOpen}
          onClose={() => setTaskModalOpen(false)}
          taskToEdit={editingTask}
        />
        <TinyStepRescueModal
          isOpen={!!rescuingTask}
          onClose={() => setRescuingTask(null)}
          task={rescuingTask}
        />
      </div>
    );
  }

  // ----------------------------------------------------
  // MODE 1: NORMAL DAY (Full Rich Dashboard)
  // ----------------------------------------------------
  return (
    <div className="space-y-6 animate-fade-in">
      {/* A. GREETING & DATE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            {format(now, 'EEEE, MMMM d, yyyy')}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900 dark:text-ivory-50 mt-0.5">
            {greeting}, {user?.display_name?.split(' ')[0] || 'Friend'}
          </h2>
          <p className="text-xs sm:text-sm text-espresso-500 dark:text-ivory-400 mt-0.5">
            One calm place for your day. Focus on what feels doable right now.
          </p>
        </div>

        {/* Quick Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRestartModalOpen(true)}
            icon={<RefreshCw className="w-3.5 h-3.5 text-primary" />}
            title="Clean slate without guilt"
          >
            Gentle Restart
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingTask(null);
              setTaskModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Task
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/focus')}
            icon={<Target className="w-4 h-4" />}
          >
            Timer
          </Button>
        </div>
      </div>

      {/* ADAPTIVE MODE SELECTOR */}
      <AdaptiveModeSelector />

      {/* B. TODAY'S CAPACITY CHECK-IN */}
      <CapacityCheckIn />

      {/* C. TODAY'S TOP THREE (Interactive with Selection, Editing, Database Persistence) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-serif text-lg font-bold text-espresso-900 dark:text-ivory-50">
              Today's Top Three Priorities
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-espresso-500 dark:text-ivory-400">
              {topThree.filter(t => t.status === 'completed').length}/3 finished
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTopThreeModalOpen(true)}
              icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
              className="text-xs py-1 px-2.5"
            >
              Choose Top 3
            </Button>
          </div>
        </div>

        {topThree.length === 0 ? (
          <Card className="text-center py-8 border-dashed bg-cardwhite dark:bg-espresso-800">
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-2 opacity-70" />
            <h4 className="text-sm font-semibold text-espresso-800 dark:text-ivory-100">
              No top three priorities chosen for today
            </h4>
            <p className="text-xs text-espresso-500 dark:text-ivory-400 mt-1 max-w-sm mx-auto">
              Selecting up to 3 priority tasks shields your focus from an overwhelming never-ending to-do list.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTopThreeModalOpen(true)}
              className="mt-3"
              icon={<ListTodo className="w-3.5 h-3.5" />}
            >
              Select Top Priorities
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {topThree.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={t => {
                  setEditingTask(t);
                  setTaskModalOpen(true);
                }}
                onRescue={t => setRescuingTask(t)}
              />
            ))}
          </div>
        )}
      </div>

      {/* D & F. TWO-COLUMN LAYOUT: PROGRESS & SCHEDULE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Tasks */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-espresso-900 dark:text-ivory-50">
              Today's Schedule & Tasks
            </h3>
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              <span>View all ({tasks.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {todayTasks.slice(0, 6).map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={t => {
                  setEditingTask(t);
                  setTaskModalOpen(true);
                }}
                onRescue={t => setRescuingTask(t)}
              />
            ))}

            {todayTasks.length === 0 && (
              <Card className="text-center py-6 border-dashed">
                <p className="text-xs text-espresso-400">
                  No scheduled tasks for today. Enjoy the calm space!
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Right Col: Today's Gentle Progress & Gentle Reminders */}
        <div className="space-y-4">
          {/* Progress Card (Supportive, real statistics from user data) */}
          <Card className="p-4 bg-cardwhite dark:bg-espresso-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-espresso-700 dark:text-ivory-300 mb-3">
              Today's Gentle Progress
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-ivory-100 dark:bg-espresso-900">
                <span className="text-xl font-bold font-serif text-espresso-900 dark:text-ivory-100">
                  {completedToday}
                </span>
                <p className="text-[10px] text-espresso-500 dark:text-ivory-400 uppercase mt-0.5">
                  Tasks Done
                </p>
              </div>

              <div className="p-2 rounded-xl bg-ivory-100 dark:bg-espresso-900">
                <span className="text-xl font-bold font-serif text-espresso-900 dark:text-ivory-100">
                  {habitsDoneToday}
                </span>
                <p className="text-[10px] text-espresso-500 dark:text-ivory-400 uppercase mt-0.5">
                  Habits
                </p>
              </div>

              <div className="p-2 rounded-xl bg-ivory-100 dark:bg-espresso-900">
                <span className="text-xl font-bold font-serif text-primary">
                  {focusMinsToday}m
                </span>
                <p className="text-[10px] text-espresso-500 dark:text-ivory-400 uppercase mt-0.5">
                  Focus
                </p>
              </div>
            </div>

            {/* Gratitude win */}
            {gratitudes.length > 0 && (
              <div className="mt-3 p-2.5 rounded-xl bg-sage-light/50 dark:bg-sage-dark/20 border border-sage/30 text-xs text-espresso-800 dark:text-ivory-200">
                <span className="font-semibold block text-[11px] text-sage-dark dark:text-sage-light">
                  Today's Positive Moment:
                </span>
                <p className="italic mt-0.5 leading-snug">"{gratitudes[0].text}"</p>
              </div>
            )}
          </Card>

          {/* Gentle Reminders Card */}
          <Card className="p-4 bg-cardwhite dark:bg-espresso-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-espresso-700 dark:text-ivory-300 mb-2">
              Gentle Reminders
            </h4>
            <div className="space-y-2 text-xs">
              {pendingBills.slice(0, 2).map(bill => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-softpeach-light/40 border border-softpeach/40"
                >
                  <span className="font-medium text-espresso-800 dark:text-ivory-100 truncate">
                    Bill: {bill.name}
                  </span>
                  <span className="font-semibold text-primary shrink-0">
                    ${bill.amount.toFixed(2)}
                  </span>
                </div>
              ))}

              {activeFollowUps.slice(0, 2).map(fu => (
                <div
                  key={fu.id}
                  className="p-2 rounded-lg bg-softblue-light/40 border border-softblue/40 text-espresso-800 dark:text-ivory-100"
                >
                  <span className="font-semibold text-softblue-dark block">
                    Waiting for {fu.person_or_org}:
                  </span>
                  <span className="truncate block">{fu.title}</span>
                </div>
              ))}

              {pendingBills.length === 0 && activeFollowUps.length === 0 && (
                <p className="text-espresso-400 text-center py-2">
                  No upcoming pending bills or follow-ups.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <TaskFormModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        taskToEdit={editingTask}
      />

      <TinyStepRescueModal
        isOpen={!!rescuingTask}
        onClose={() => setRescuingTask(null)}
        task={rescuingTask}
      />

      <TopThreeSelectorModal
        isOpen={topThreeModalOpen}
        onClose={() => setTopThreeModalOpen(false)}
        onAddNewTask={() => {
          setEditingTask(null);
          setTaskModalOpen(true);
        }}
      />

      <GentleRestartModal
        isOpen={restartModalOpen}
        onClose={() => setRestartModalOpen(false)}
      />
    </div>
  );
};
