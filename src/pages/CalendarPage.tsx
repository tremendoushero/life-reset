import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
} from 'date-fns';

export const CalendarPage: React.FC = () => {
  const { calendarEvents, addCalendarEvent, tasks } = useData();

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [modalOpen, setModalOpen] = useState(false);

  // New event form state
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [category, setCategory] = useState('event');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const dayStr = format(selectedDay, 'yyyy-MM-dd');
    await addCalendarEvent({
      title: title.trim(),
      start_time: `${dayStr}T${startTime}:00`,
      end_time: `${dayStr}T${endTime}:00`,
      all_day: false,
      category,
      color: '#E78B3D',
    });

    setTitle('');
    setModalOpen(false);
  };

  const selectedDayStr = format(selectedDay, 'yyyy-MM-dd');
  const eventsForSelectedDay = calendarEvents.filter(e =>
    e.start_time.startsWith(selectedDayStr)
  );
  const tasksForSelectedDay = tasks.filter(t => t.due_date === selectedDayStr);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900 dark:text-ivory-50">
              Calendar
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-espresso-500 dark:text-ivory-400 mt-0.5">
            Visual month overview with your events and deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl border border-ivory-300 dark:border-espresso-700 hover:bg-ivory-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-serif font-bold text-sm min-w-[130px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl border border-ivory-300 dark:border-espresso-700 hover:bg-ivory-100"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Calendar Grid */}
        <Card className="lg:col-span-2 p-4">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 mb-2 text-center text-xs font-semibold text-espresso-400 uppercase">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-1">
            {days.map(day => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const isSelected = isSameDay(day, selectedDay);
              const isCurrentMonthDay = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());

              const hasEvents = calendarEvents.some(e => e.start_time.startsWith(dayStr));
              const hasTasks = tasks.some(t => t.due_date === dayStr);

              return (
                <button
                  key={dayStr}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[70px] sm:min-h-[85px] p-1.5 rounded-xl text-left border flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-soft-sm font-semibold'
                      : isToday
                      ? 'border-primary/60 bg-cardwhite dark:bg-espresso-800'
                      : 'border-ivory-200 dark:border-espresso-800/80 bg-cardwhite/60 dark:bg-espresso-900/40 hover:bg-ivory-100'
                  } ${!isCurrentMonthDay ? 'opacity-35' : ''}`}
                >
                  <span className={`text-xs ${isToday ? 'text-primary font-bold' : 'text-espresso-800 dark:text-ivory-200'}`}>
                    {format(day, 'd')}
                  </span>

                  {/* Dot Indicators */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {hasEvents && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" title="Event" />
                    )}
                    {hasTasks && (
                      <span className="w-1.5 h-1.5 rounded-full bg-sage" title="Task" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Right Col: Selected Day Detail */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-serif text-base font-bold text-espresso-900 dark:text-ivory-50 mb-3 border-b border-ivory-200 pb-2">
              {format(selectedDay, 'EEEE, MMM d, yyyy')}
            </h3>

            {/* Events for this day */}
            <div className="space-y-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-espresso-600 dark:text-ivory-300 block mb-1.5">
                  Events ({eventsForSelectedDay.length})
                </span>
                {eventsForSelectedDay.length === 0 ? (
                  <p className="text-xs text-espresso-400">No events for this date.</p>
                ) : (
                  <div className="space-y-1.5">
                    {eventsForSelectedDay.map(ev => (
                      <div
                        key={ev.id}
                        className="p-2.5 rounded-xl bg-ivory-100 dark:bg-espresso-800 text-xs border border-ivory-200 dark:border-espresso-700"
                      >
                        <p className="font-semibold text-espresso-900 dark:text-ivory-100">{ev.title}</p>
                        <p className="text-[11px] text-espresso-400 mt-0.5">
                          {ev.start_time.split('T')[1]?.slice(0, 5)} - {ev.end_time.split('T')[1]?.slice(0, 5)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tasks for this day */}
              <div className="pt-2 border-t border-ivory-200 dark:border-espresso-700">
                <span className="text-xs font-semibold uppercase tracking-wider text-espresso-600 dark:text-ivory-300 block mb-1.5">
                  Tasks Due ({tasksForSelectedDay.length})
                </span>
                {tasksForSelectedDay.length === 0 ? (
                  <p className="text-xs text-espresso-400">No tasks due this date.</p>
                ) : (
                  <div className="space-y-1.5">
                    {tasksForSelectedDay.map(t => (
                      <div
                        key={t.id}
                        className="p-2 rounded-xl bg-cardwhite dark:bg-espresso-900 border border-ivory-200 text-xs flex items-center justify-between"
                      >
                        <span className="text-espresso-800 dark:text-ivory-200 truncate">{t.title}</span>
                        <span className="text-[10px] text-espresso-400 capitalize">{t.priority}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Add Event Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Calendar Event"
        description={`Schedule for ${format(selectedDay, 'MMM d, yyyy')}`}
      >
        <form onSubmit={handleAddEvent} className="space-y-4">
          <Input
            label="Event Title *"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Doctor window, Lunch with Sarah..."
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="time"
              label="Start Time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              required
            />
            <Input
              type="time"
              label="End Time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-ivory-200 dark:border-espresso-700">
            <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Event
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
