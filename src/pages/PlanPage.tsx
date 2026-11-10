import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { TaskCard } from '@/components/features/TaskCard';
import { TaskFormModal } from '@/components/features/TaskFormModal';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Plus,
  CheckCircle2,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

export const PlanPage: React.FC = () => {
  const { tasks, habits, habitLogs } = useData();

  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  const formattedDate = format(currentDate, 'yyyy-MM-dd');

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'day') setCurrentDate(prev => subDays(prev, 1));
    else if (viewMode === 'week') setCurrentDate(prev => subDays(prev, 7));
    else setCurrentDate(prev => subDays(prev, 30));
  };

  const handleNext = () => {
    if (viewMode === 'day') setCurrentDate(prev => addDays(prev, 1));
    else if (viewMode === 'week') setCurrentDate(prev => addDays(prev, 7));
    else setCurrentDate(prev => addDays(prev, 30));
  };

  const handleToday = () => setCurrentDate(new Date());

  // Day view items
  const dayTasks = tasks.filter(t => t.due_date === formattedDate);
  const dayTopThree = dayTasks.filter(t => t.is_top_three);

  // Week days
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Time blocks (9 AM - 6 PM)
  const timeBlocks = [
    { time: '09:00', label: '09:00 AM' },
    { time: '10:00', label: '10:00 AM' },
    { time: '11:00', label: '11:00 AM' },
    { time: '12:00', label: '12:00 PM (Lunch & Reset)' },
    { time: '14:00', label: '02:00 PM' },
    { time: '15:00', label: '03:00 PM' },
    { time: '16:00', label: '04:00 PM' },
    { time: '17:00', label: '05:00 PM (Wind Down)' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Date Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900 dark:text-ivory-50">
            Planning Studio
          </h2>
          <p className="text-xs sm:text-sm text-espresso-500 dark:text-ivory-400 mt-0.5">
            Structure your day and week without rigid time pressure.
          </p>
        </div>

        {/* View Switcher & Date Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-xl border border-ivory-300 dark:border-espresso-700 bg-cardwhite dark:bg-espresso-800 p-0.5 text-xs">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === 'day' ? 'bg-espresso-800 text-ivory-50' : 'text-espresso-600 dark:text-ivory-300'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === 'week' ? 'bg-espresso-800 text-ivory-50' : 'text-espresso-600 dark:text-ivory-300'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === 'month' ? 'bg-espresso-800 text-ivory-50' : 'text-espresso-600 dark:text-ivory-300'
              }`}
            >
              Monthly
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg border border-ivory-300 dark:border-espresso-700 hover:bg-ivory-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-ivory-300 dark:border-espresso-700 hover:bg-ivory-100"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg border border-ivory-300 dark:border-espresso-700 hover:bg-ivory-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ----------------- DAILY PLANNER ----------------- */}
      {viewMode === 'day' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-cardwhite dark:bg-espresso-800 border border-ivory-300 dark:border-espresso-700 flex items-center justify-between">
            <span className="font-serif text-lg font-bold text-espresso-900 dark:text-ivory-50">
              {format(currentDate, 'EEEE, MMMM d, yyyy')}
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setTaskModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Task for This Day
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Time Blocking Table */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <h3 className="font-serif text-base font-bold text-espresso-900 dark:text-ivory-50">
                      Gentle Time Blocks
                    </h3>
                  </div>
                  <span className="text-xs text-espresso-400">
                    Rough guide rather than strict prison
                  </span>
                </div>

                <div className="space-y-2.5">
                  {timeBlocks.map(block => {
                    const tasksInBlock = dayTasks.filter(
                      t => t.due_time && t.due_time.startsWith(block.time.slice(0, 2))
                    );

                    return (
                      <div
                        key={block.time}
                        className="flex items-start gap-4 p-2.5 rounded-xl border border-ivory-200 dark:border-espresso-800 hover:bg-ivory-50/50"
                      >
                        <span className="w-32 text-xs font-semibold text-espresso-500 shrink-0 mt-0.5">
                          {block.label}
                        </span>
                        <div className="flex-1 min-w-0">
                          {tasksInBlock.length > 0 ? (
                            <div className="space-y-1">
                              {tasksInBlock.map(t => (
                                <div
                                  key={t.id}
                                  className="text-xs font-medium px-2 py-1 rounded bg-softpeach-light/60 text-espresso-800 border border-softpeach/40"
                                >
                                  {t.title} ({t.estimated_duration}m)
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-espresso-300 italic">
                              Free / Unscheduled space
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Right Col: Day Priorities & Tasks */}
            <div className="space-y-4">
              <Card className="p-4">
                <h4 className="font-serif text-sm font-bold text-espresso-900 dark:text-ivory-50 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Day Priorities ({dayTopThree.length}/3)
                </h4>
                {dayTopThree.length === 0 ? (
                  <p className="text-xs text-espresso-400">
                    No top three priorities designated for this date.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dayTopThree.map(t => (
                      <TaskCard key={t.id} task={t} />
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-espresso-600 dark:text-ivory-300 mb-2">
                  All Scheduled Tasks ({dayTasks.length})
                </h4>
                <div className="space-y-2">
                  {dayTasks.map(t => (
                    <TaskCard key={t.id} task={t} />
                  ))}
                  {dayTasks.length === 0 && (
                    <p className="text-xs text-espresso-400 py-4 text-center">
                      No tasks scheduled for this day.
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- WEEKLY PLANNER ----------------- */}
      {viewMode === 'week' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-cardwhite dark:bg-espresso-800 border border-ivory-300 dark:border-espresso-700 flex items-center justify-between">
            <span className="font-serif text-base font-bold text-espresso-900 dark:text-ivory-50">
              Week of {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDays.map(day => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const tasksOnDay = tasks.filter(t => t.due_date === dayStr);
              const isToday = dayStr === format(new Date(), 'yyyy-MM-dd');

              return (
                <Card
                  key={dayStr}
                  className={`p-3 min-h-[220px] flex flex-col ${
                    isToday ? 'border-2 border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="border-b border-ivory-200 dark:border-espresso-700 pb-1.5 mb-2">
                    <p className="text-[11px] font-semibold text-espresso-500 uppercase">
                      {format(day, 'EEE')}
                    </p>
                    <p className="text-sm font-bold font-serif text-espresso-900 dark:text-ivory-50">
                      {format(day, 'd')}
                    </p>
                  </div>

                  <div className="flex-1 space-y-1.5 overflow-y-auto">
                    {tasksOnDay.map(t => (
                      <div
                        key={t.id}
                        className={`text-[11px] p-1.5 rounded-lg border leading-tight ${
                          t.status === 'completed'
                            ? 'line-through text-espresso-400 bg-ivory-100 border-ivory-200'
                            : 'bg-cardwhite dark:bg-espresso-900 border-ivory-300 text-espresso-800 font-medium'
                        }`}
                      >
                        {t.title}
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------- MONTHLY PLANNER ----------------- */}
      {viewMode === 'month' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-xl font-bold text-espresso-900 dark:text-ivory-50">
              {format(currentDate, 'MMMM yyyy')} Overview
            </h3>
            <span className="text-xs text-espresso-400">
              Big picture view of key dates and milestones
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-ivory-100 dark:bg-espresso-900 border border-ivory-200 dark:border-espresso-800">
              <h4 className="text-xs font-semibold uppercase text-espresso-600 dark:text-ivory-300 mb-2">
                Monthly Focus & Intention
              </h4>
              <p className="text-xs text-espresso-700 dark:text-ivory-200 leading-relaxed italic">
                "Keep consistency over intensity. Prioritise mental rest and gentle routines.
                Remember that every small step counts."
              </p>
            </div>

            <div className="p-4 rounded-xl bg-ivory-100 dark:bg-espresso-900 border border-ivory-200 dark:border-espresso-800">
              <h4 className="text-xs font-semibold uppercase text-espresso-600 dark:text-ivory-300 mb-2">
                Monthly Milestones
              </h4>
              <ul className="text-xs space-y-1 text-espresso-700 dark:text-ivory-200 list-disc list-inside">
                <li>Review car insurance renewal quote</li>
                <li>Complete home office cable declutter</li>
                <li>Attend dentist checkup appointment</li>
              </ul>
            </div>
          </div>
        </Card>
      )}

      <TaskFormModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        defaultDate={formattedDate}
      />
    </div>
  );
};

