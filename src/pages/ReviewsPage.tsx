import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { BarChart3, Sparkles, Heart, CheckCircle2, Award, Calendar } from 'lucide-react';
import { format, startOfWeek, endOfWeek, subDays } from 'date-fns';

export const ReviewsPage: React.FC = () => {
  const { tasks, focusSessions, gratitudes, habitLogs, weeklyReviews, addWeeklyReview } = useData();

  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

  // Form for weekly reflection
  const [whatDifficult, setWhatDifficult] = useState('');
  const [whatHelped, setWhatHelped] = useState('');
  const [whatSimplify, setWhatSimplify] = useState('');
  const [nextPriority, setNextPriority] = useState('');
  const [reviewSaved, setReviewSaved] = useState(false);

  // Actual stats from real records
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  const totalFocusMins = focusSessions.reduce((acc, curr) => acc + curr.actual_duration_minutes, 0);
  const totalHabitsCompleted = habitLogs.filter(h => h.completed).length;

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    await addWeeklyReview({
      week_start: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      tasks_completed_count: completedTasksCount,
      focus_minutes_total: totalFocusMins,
      small_wins: gratitudes.slice(0, 3).map(g => g.text),
      what_was_difficult: whatDifficult,
      what_helped: whatHelped,
      what_can_be_simplified: whatSimplify,
      next_week_priority: nextPriority,
    });
    setReviewSaved(true);
    setTimeout(() => setReviewSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900 dark:text-ivory-50">
            Reviews & Reflections
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-espresso-500 dark:text-ivory-400 mt-0.5">
          Celebrate progress without judgment. Supportive insights from your actual records.
        </p>
      </div>

      {/* Actual Stats Summary Grid */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <span className="text-[11px] font-semibold text-espresso-400 uppercase tracking-wider">
            Total Tasks Finished
          </span>
          <p className="font-serif text-2xl font-bold text-sage-dark dark:text-sage-light mt-1">
            {completedTasksCount}
          </p>
        </Card>

        <Card className="p-4 text-center">
          <span className="text-[11px] font-semibold text-espresso-400 uppercase tracking-wider">
            Focused Minutes
          </span>
          <p className="font-serif text-2xl font-bold text-primary mt-1">
            {totalFocusMins}m
          </p>
        </Card>

        <Card className="p-4 text-center">
          <span className="text-[11px] font-semibold text-espresso-400 uppercase tracking-wider">
            Habit Check-Ins
          </span>
          <p className="font-serif text-2xl font-bold text-espresso-800 dark:text-ivory-100 mt-1">
            {totalHabitsCompleted}
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-ivory-300 dark:border-espresso-700 gap-4 text-xs font-semibold pb-1">
        {[
          { id: 'weekly', label: 'Weekly Gentle Review' },
          { id: 'monthly', label: 'Monthly Reflection' },
          { id: 'yearly', label: 'Yearly Highlights' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-espresso-500 hover:text-espresso-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* WEEKLY REVIEW */}
      {activeTab === 'weekly' && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-ivory-200 pb-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-espresso-900 dark:text-ivory-50">
                Weekly Reflection
              </h3>
              <p className="text-xs text-espresso-500">
                Look back with kindness. What can we make 10% simpler next week?
              </p>
            </div>
            {reviewSaved && (
              <span className="text-xs text-sage-dark font-semibold flex items-center gap-1 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" /> Reflection Saved!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveReview} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-espresso-600 dark:text-ivory-300 mb-1">
                What felt heavy or difficult this week?
              </label>
              <textarea
                value={whatDifficult}
                onChange={e => setWhatDifficult(e.target.value)}
                rows={2}
                placeholder="e.g. Initiating the car insurance comparison, afternoon energy crashes..."
                className="w-full text-xs p-3 rounded-xl border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-espresso-600 dark:text-ivory-300 mb-1">
                What helped or made things easier?
              </label>
              <textarea
                value={whatHelped}
                onChange={e => setWhatHelped(e.target.value)}
                rows={2}
                placeholder="e.g. 10-minute walk outside, listening to binaural beats, breaking tasks into 2-min steps..."
                className="w-full text-xs p-3 rounded-xl border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-espresso-600 dark:text-ivory-300 mb-1">
                What can be simplified or dropped without guilt?
              </label>
              <textarea
                value={whatSimplify}
                onChange={e => setWhatSimplify(e.target.value)}
                rows={2}
                placeholder="e.g. Stop forcing myself to fold every towel, buy pre-washed salad greens..."
                className="w-full text-xs p-3 rounded-xl border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-espresso-600 dark:text-ivory-300 mb-1">
                ONE single main priority for next week:
              </label>
              <input
                type="text"
                value={nextPriority}
                onChange={e => setNextPriority(e.target.value)}
                placeholder="e.g. Schedule dental appointment on Tuesday morning"
                className="w-full text-xs p-3 rounded-xl border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900 font-medium"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" size="md">
                Save Weekly Reflection
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* MONTHLY REFLECTION */}
      {activeTab === 'monthly' && (
        <Card className="p-6 space-y-4">
          <h3 className="font-serif text-lg font-bold text-espresso-900 dark:text-ivory-50">
            Monthly Pattern Check
          </h3>
          <p className="text-xs text-espresso-600 leading-relaxed">
            Notice broad patterns in energy, mood, and achievements. You have shown up consistently,
            and every single task you checked off moved your life forward.
          </p>
          <div className="p-4 bg-ivory-100 dark:bg-espresso-900 rounded-xl space-y-2 text-xs">
            <p><strong>Monthly Highlights:</strong></p>
            <p className="italic text-espresso-700">
              "Completed home office declutter milestone, maintained hydration routine on 18 days, paid all bills on time."
            </p>
          </div>
        </Card>
      )}

      {/* YEARLY HIGHLIGHTS */}
      {activeTab === 'yearly' && (
        <Card className="p-6 space-y-4">
          <h3 className="font-serif text-lg font-bold text-espresso-900 dark:text-ivory-50">
            Yearly Highlights & Growth
          </h3>
          <p className="text-xs text-espresso-600">
            ADHD brains often forget how much they accomplished because working memory overwrites past wins. This wall preserves your victories forever.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl border border-ivory-300 dark:border-espresso-700 text-xs">
              <span className="font-semibold text-primary block mb-1">Growth Milestone:</span>
              <p>Shifted from harsh self-criticism to capacity-based gentle planning.</p>
            </div>
            <div className="p-3.5 rounded-xl border border-ivory-300 dark:border-espresso-700 text-xs">
              <span className="font-semibold text-primary block mb-1">Practical Win:</span>
              <p>Maintained life admin follow-ups with zero missed tax or medical deadlines.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

