import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCapacity } from '@/contexts/CapacityContext';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { TaskCard } from '@/components/features/TaskCard';
import { TaskFormModal } from '@/components/features/TaskFormModal';
import { TinyStepRescueModal } from '@/components/features/TinyStepRescueModal';
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
  ShieldAlert,
  HelpCircle,
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
    postponeTask,
    addBrainDump,
  } = useData();

  const navigate = useNavigate();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const now = new Date();

  // Modals state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [rescuingTask, setRescuingTask] = useState<Task | null>(null);

  // Quick brain dump in overwhelmed / brain dump mode
  const [quickThought, setQuickThought] = useState('');
  const [thoughtSaved, setThoughtSaved] = useState(false);

  // Greeting by hour
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Tasks due today or flagged as top three
  const todayTasks = tasks.filter(t => t.due_date === todayStr || t.is_top_three);
  const topThree = todayTasks.filter(t => t.is_top_three).slice(0, 3);
  const completedToday = tasks.filter(t => t.completed_at && t.completed_at.startsWith(todayStr)).length;
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
    setTimeout(() => setThoughtSaved(false), 2000);
  };

  // ----------------------------------------------------
  // MODE 3: OVERWHELMED MODE INTERFACE
  // ----------------------------------------------------
  if (mode === 'overwhelmed') {
    const singleAction = topThree.find(t => t.status !== 'completed') || todayTasks.find(t => t.status !== 'completed');

    return (
      <div className="max-w-2xl mx-auto space-y-6 py-6 animate-fade-in">
        {/* Calming reassurance banner */}
        <div className="p-6 rounded-2xl bg-cardwhite dark:bg-espresso-800 border-2 border-softpeach/60 shadow-soft-md text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-softpeach-light text-softpeach-dark flex items-center justify-center mx-auto">
            <Smile className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-espresso-900 dark:text-ivory-50">
            Pause. You only need to do one small thing.
          </h2>
          <p className="text-sm text-espresso-600 dark:text-ivory-300 max-w-md mx-auto leading-relaxed">
            Everything else can wait. Your worth is not measured by a checklist.
            Take a slow deep breath.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setMode('normal')}
              className="text-xs font-semibold text-espresso-400 hover:text-espresso-700 underline"
            >
              Exit Overwhelmed Mode
            </button>
          </div>
        </div>

        {/* The One Single Action */}
        <Card className="p-6 border-2 border-primary/30">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-2 block">
            Your Only Next Step:
          </span>
          {singleAction ? (
            <div className="space-y-4">
              <h3 className="font-serif text-xl font-bold text-espresso-900 dark:text-ivory-100">
                {singleAction.title}
              </h3>
              {singleAction.description && (
                <p className="text-sm text-espresso-600 dark:text-ivory-300">
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
                Rest, drink some water, or listen to favorite music.
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
              <span className="text-xs text-sage-dark font-medium animate-fade-in">
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
              className="flex-1 rounded-xl border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900 px-3 py-2 text-sm text-espresso-900 dark:text-ivory-100 focus:outline-none focus:border-primary"
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
  // MODE 4: FOCUS MODE
  // ----------------------------------------------------
  if (mode === 'focus') {
    const focusTask = topThree.find(t => t.status !== 'completed') || todayTasks[0];
    return (
      <div className="max-w-xl mx-auto space-y-6 py-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-espresso-900 dark:text-ivory-50">
              Focus Mode
            </h2>
            <p className="text-xs text-espresso-500 dark:text-ivory-400">
              Zero distractions. Single task in sight.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setMode('normal')}>
            Exit Focus
          </Button>
        </div>

        <FocusTimer selectedTask={focusTask} />
      </div>
    );
  }

  // ----------------------------------------------------
  // MODE 1 & 2: NORMAL DAY & LOW-ENERGY DAY
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
            {mode === 'low-energy'
              ? 'Low-Energy Day active. We simplified your view to essentials.'
              : 'One calm place for your day. Focus on what feels doable.'}
          </p>
        </div>

        {/* Quick Add CTA */}
        <div className="flex items-center gap-2">
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
            onClick={() => navigate('/app/focus')}
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

      {/* C. TODAY'S TOP THREE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-serif text-lg font-bold text-espresso-900 dark:text-ivory-50">
              Today's Top Three
            </h3>
          </div>
          <span className="text-xs text-espresso-500 dark:text-ivory-400">
            {topThree.filter(t => t.status === 'completed').length}/3 finished
          </span>
        </div>

        {topThree.length === 0 ? (
          <Card className="text-center py-8 border-dashed">
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-2 opacity-70" />
            <h4 className="text-sm font-semibold text-espresso-800 dark:text-ivory-100">
              No top three priorities chosen yet
            </h4>
            <p className="text-xs text-espresso-500 dark:text-ivory-400 mt-1 max-w-sm mx-auto">
              Selecting up to 3 priority tasks shields your focus from an overwhelming never-ending to-do list.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingTask(null);
                setTaskModalOpen(true);
              }}
              className="mt-3"
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Pick or Create Top Priority
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

      {/* D & F. TWO-COLUMN LAYOUT: PROGRESS & REMINDERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Full or Filtered Task List */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-espresso-900 dark:text-ivory-50">
              {mode === 'low-energy' ? 'Essential & Low Effort Tasks' : "Today's Schedule & Tasks"}
            </h3>
            <button
              onClick={() => navigate('/app/tasks')}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              <span>View all ({tasks.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {todayTasks
              .filter(t => {
                if (mode === 'low-energy') {
                  // only show essential or very low/low energy tasks
                  return t.priority === 'essential' || t.energy_requirement === 'very_low' || t.energy_requirement === 'low';
                }
                return true;
              })
              .slice(0, 5)
              .map(task => (
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
              <p className="text-xs text-espresso-400 py-4 text-center">
                No scheduled tasks for today. Enjoy the calm!
              </p>
            )}
          </div>
        </div>

        {/* Right Col: Today's Gentle Progress & Gentle Reminders */}
        <div className="space-y-4">
          {/* Progress Card (Supportive, never punitive) */}
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
                  Today's Small Win:
                </span>
                <p className="italic mt-0.5">"{gratitudes[0].text}"</p>
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

      {/* Task Creation & Edit Modal */}
      <TaskFormModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        taskToEdit={editingTask}
      />

      {/* Tiny Step Rescue Modal */}
      <TinyStepRescueModal
        isOpen={!!rescuingTask}
        onClose={() => setRescuingTask(null)}
        task={rescuingTask}
      />
    </div>
  );
};
