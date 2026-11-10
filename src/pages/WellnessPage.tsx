import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import {
  Heart,
  Smile,
  Coffee,
  CheckCircle2,
  Circle,
  Plus,
  Star,
  Sparkles,
  Flame,
  Shield,
  Activity,
  Moon,
} from 'lucide-react';
import { format } from 'date-fns';

export const WellnessPage: React.FC = () => {
  const {
    habits,
    habitLogs,
    toggleHabitLog,
    addHabit,
    dopamineMenu,
    toggleDopamineFavorite,
    addDopamineActivity,
    gratitudes,
    addGratitude,
    moods,
    energies,
  } = useData();

  const [activeTab, setActiveTab] = useState<'habits' | 'dopamine' | 'mood' | 'gratitude' | 'toolkit'>('habits');

  // Gratitude form
  const [gratitudeText, setGratitudeText] = useState('');

  // New Habit modal
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [habitTitle, setHabitTitle] = useState('');
  const [habitRoutine, setHabitRoutine] = useState<'morning' | 'evening' | 'custom'>('morning');

  // Dopamine modal
  const [dopamineModalOpen, setDopamineModalOpen] = useState(false);
  const [dopamineTitle, setDopamineTitle] = useState('');
  const [dopamineCategory, setDopamineCategory] = useState<'appetizer' | 'entree' | 'side' | 'dessert'>('appetizer');
  const [dopamineDuration, setDopamineDuration] = useState(5);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitTitle.trim()) return;
    await addHabit({
      title: habitTitle.trim(),
      routine: habitRoutine,
      frequency: 'daily',
      energy_level: 'very_low',
      is_paused: false,
      target_count_weekly: 5,
    });
    setHabitTitle('');
    setHabitModalOpen(false);
  };

  const handleCreateDopamine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dopamineTitle.trim()) return;
    await addDopamineActivity({
      title: dopamineTitle.trim(),
      category: dopamineCategory,
      duration_minutes: dopamineDuration,
      energy_needed: 'very_low',
      is_favorite: false,
    });
    setDopamineTitle('');
    setDopamineModalOpen(false);
  };

  const handleAddGratitude = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gratitudeText.trim()) return;
    await addGratitude(gratitudeText.trim());
    setGratitudeText('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900 dark:text-ivory-50">
              Wellness & Routines
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-espresso-500 dark:text-ivory-400 mt-0.5">
            Gentle habits without streak pressure. Dopamine menu for effortless motivation.
          </p>
        </div>

        <div className="flex gap-2">
          {activeTab === 'habits' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setHabitModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Routine / Habit
            </Button>
          )}
          {activeTab === 'dopamine' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setDopamineModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Menu Item
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-ivory-300 dark:border-espresso-700 gap-3 text-xs font-semibold overflow-x-auto pb-1">
        {[
          { id: 'habits', label: 'Gentle Habits' },
          { id: 'dopamine', label: 'Dopamine Menu' },
          { id: 'gratitude', label: 'Gratitude & Wins' },
          { id: 'mood', label: 'Mood & Energy' },
          { id: 'toolkit', label: 'Coping Toolkit' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-espresso-800 text-ivory-50 font-semibold'
                : 'text-espresso-600 dark:text-ivory-300 hover:bg-ivory-200/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: HABITS & ROUTINES */}
      {activeTab === 'habits' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-sage-light/60 dark:bg-espresso-800 border border-sage/40 text-xs text-espresso-800 dark:text-ivory-100 flex items-center justify-between">
            <span>
              <strong>Zero-Guilt Rule:</strong> Missing a day does not reset your progress. You never start from scratch.
            </span>
            <span className="text-[11px] text-sage-dark dark:text-sage-light font-semibold">
              Flexible rhythm
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {habits.map(habit => {
              const isDoneToday = habitLogs.some(
                l => l.habit_id === habit.id && l.date === todayStr && l.completed
              );
              const weeklyLogs = habitLogs.filter(l => l.habit_id === habit.id).length;

              return (
                <Card
                  key={habit.id}
                  className="p-4 flex items-start justify-between gap-3 bg-cardwhite dark:bg-espresso-800"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => toggleHabitLog(habit.id, todayStr)}
                      className="mt-0.5 text-espresso-400 hover:text-primary transition-colors shrink-0"
                    >
                      {isDoneToday ? (
                        <CheckCircle2 className="w-5 h-5 text-sage fill-sage-light" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-ivory-200 dark:bg-espresso-700 text-espresso-600 dark:text-ivory-300">
                          {habit.routine}
                        </span>
                        <span className="text-[11px] text-espresso-400">
                          {weeklyLogs} times logged
                        </span>
                      </div>
                      <h4
                        className={`text-sm font-semibold text-espresso-900 dark:text-ivory-100 ${
                          isDoneToday ? 'line-through text-espresso-400 dark:text-ivory-400' : ''
                        }`}
                      >
                        {habit.title}
                      </h4>
                      {habit.description && (
                        <p className="text-xs text-espresso-500 dark:text-ivory-400 mt-0.5">
                          {habit.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: DOPAMINE MENU */}
      {activeTab === 'dopamine' && (
        <div className="space-y-6">
          <p className="text-xs text-espresso-600 dark:text-ivory-300">
            A Dopamine Menu organizes enjoyable, rejuvenating activities by time and energy, so you never get stuck scrolling during breaks.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                id: 'appetizer',
                title: 'Appetizers (2-5 mins)',
                desc: 'Quick sparks of energy between tasks',
                badge: 'bg-softpeach-light text-softpeach-dark',
              },
              {
                id: 'entree',
                title: 'Entrées (20-45 mins)',
                desc: 'Deep nourishing activities that truly recharge you',
                badge: 'bg-sage-light text-sage-dark',
              },
              {
                id: 'side',
                title: 'Sides (Passive Background)',
                desc: 'Can be done alongside chores or deep work',
                badge: 'bg-softblue-light text-softblue-dark',
              },
              {
                id: 'dessert',
                title: 'Desserts (Fun Rewards)',
                desc: 'Delightful treats to enjoy with clear boundaries',
                badge: 'bg-lavender-light text-lavender-dark',
              },
            ].map(cat => {
              const items = dopamineMenu.filter(d => d.category === cat.id);

              return (
                <Card key={cat.id} className="p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${cat.badge}`}>
                        {cat.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-espresso-400 mb-3">{cat.desc}</p>

                    <div className="space-y-2">
                      {items.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-ivory-100 dark:bg-espresso-900 border border-ivory-200 dark:border-espresso-700 text-xs"
                        >
                          <span className="font-medium text-espresso-800 dark:text-ivory-100 truncate">
                            {item.title}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-espresso-400">
                              {item.duration_minutes}m
                            </span>
                            <button
                              onClick={() => toggleDopamineFavorite(item.id)}
                              className="text-espresso-400 hover:text-primary"
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  item.is_favorite ? 'text-primary fill-primary' : ''
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      ))}
                      {items.length === 0 && (
                        <p className="text-[11px] text-espresso-400 italic">No items yet.</p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: GRATITUDE & WINS */}
      {activeTab === 'gratitude' && (
        <div className="space-y-6 max-w-2xl mx-auto">
          <Card className="p-4">
            <form onSubmit={handleAddGratitude}>
              <label className="block text-xs font-semibold uppercase tracking-wider text-espresso-600 dark:text-ivory-300 mb-1.5">
                Record a small moment of gratitude or win today:
              </label>
              <textarea
                value={gratitudeText}
                onChange={e => setGratitudeText(e.target.value)}
                placeholder="Even the smallest win: drinking water, finishing one email, seeing sunshine..."
                rows={2}
                className="w-full rounded-xl border border-ivory-300 dark:border-espresso-700 p-2.5 text-xs bg-white dark:bg-espresso-900 text-espresso-900 dark:text-ivory-100 focus:outline-none focus:border-primary resize-none"
              />
              <div className="flex justify-end mt-2">
                <Button type="submit" variant="primary" size="sm" disabled={!gratitudeText.trim()}>
                  Save Positive Moment
                </Button>
              </div>
            </form>
          </Card>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-espresso-600 dark:text-ivory-300">
              Positive Moments Log ({gratitudes.length})
            </h4>
            {gratitudes.map(g => (
              <Card key={g.id} className="p-3 text-xs flex items-center justify-between">
                <span className="text-espresso-800 dark:text-ivory-100">"{g.text}"</span>
                <span className="text-[10px] text-espresso-400 shrink-0 ml-2">{g.date}</span>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MOOD & ENERGY HISTORY */}
      {activeTab === 'mood' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h4 className="font-serif text-sm font-bold text-espresso-900 dark:text-ivory-50 mb-3">
              Recent Mood Check-Ins ({moods.length})
            </h4>
            <div className="space-y-2">
              {moods.map(m => (
                <div
                  key={m.id}
                  className="p-2.5 rounded-xl bg-ivory-100 dark:bg-espresso-900 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold capitalize text-primary">{m.mood}</span>
                    {m.notes && <p className="text-[11px] text-espresso-500 mt-0.5">{m.notes}</p>}
                  </div>
                  <span className="text-[10px] text-espresso-400">{m.date}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-serif text-sm font-bold text-espresso-900 dark:text-ivory-50 mb-3">
              Energy Recordings ({energies.length})
            </h4>
            <div className="space-y-2">
              {energies.map(e => (
                <div
                  key={e.id}
                  className="p-2.5 rounded-xl bg-ivory-100 dark:bg-espresso-900 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold capitalize text-sage-dark dark:text-sage-light">
                      {e.energy_level} energy
                    </span>
                    {e.notes && <p className="text-[11px] text-espresso-500 mt-0.5">{e.notes}</p>}
                  </div>
                  <span className="text-[10px] text-espresso-400">{e.date}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 5: COPING TOOLKIT */}
      {activeTab === 'toolkit' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border-l-4 border-l-sage">
            <h4 className="font-serif text-sm font-bold text-espresso-900 dark:text-ivory-50 mb-1 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-sage" />
              5-4-3-2-1 Sensory Grounding
            </h4>
            <p className="text-xs text-espresso-600 dark:text-ivory-300 mt-2 space-y-1">
              Notice: 5 things you see, 4 things you touch, 3 sounds around you, 2 scents in the air, 1 good thing about yourself right now.
            </p>
          </Card>

          <Card className="p-4 border-l-4 border-l-primary">
            <h4 className="font-serif text-sm font-bold text-espresso-900 dark:text-ivory-50 mb-1 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-primary" />
              Physiological Sigh
            </h4>
            <p className="text-xs text-espresso-600 dark:text-ivory-300 mt-2">
              Two quick deep breaths in through your nose, followed by a long, slow sigh out through your mouth. Repeat 3 times to immediately lower heart rate.
            </p>
          </Card>

          <Card className="p-4 border-l-4 border-l-lavender">
            <h4 className="font-serif text-sm font-bold text-espresso-900 dark:text-ivory-50 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-lavender-dark" />
              The "Half-Done" Mantra
            </h4>
            <p className="text-xs text-espresso-600 dark:text-ivory-300 mt-2">
              "Anything worth doing is worth doing poorly." Folding 3 shirts is better than leaving all in a heap. Brushing teeth for 30 seconds is better than 0.
            </p>
          </Card>
        </div>
      )}

      {/* Add Habit Modal */}
      <Modal
        isOpen={habitModalOpen}
        onClose={() => setHabitModalOpen(false)}
        title="Add Gentle Habit"
        description="Choose a small, effortless action you can repeat."
      >
        <form onSubmit={handleCreateHabit} className="space-y-4">
          <Input
            label="Habit Title *"
            value={habitTitle}
            onChange={e => setHabitTitle(e.target.value)}
            placeholder="e.g. 1 glass of water after waking"
            required
            autoFocus
          />

          <div>
            <label className="block text-xs font-semibold uppercase text-espresso-600 dark:text-ivory-300 mb-1">
              Routine Slot
            </label>
            <select
              value={habitRoutine}
              onChange={e => setHabitRoutine(e.target.value as any)}
              className="w-full text-xs rounded-xl border border-ivory-300 p-2.5 bg-white dark:bg-espresso-900"
            >
              <option value="morning">Morning Routine</option>
              <option value="evening">Evening Routine</option>
              <option value="custom">Anytime / Custom</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-ivory-200">
            <Button type="button" variant="ghost" size="sm" onClick={() => setHabitModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Habit
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Dopamine Modal */}
      <Modal
        isOpen={dopamineModalOpen}
        onClose={() => setDopamineModalOpen(false)}
        title="Add to Dopamine Menu"
        description="What gives you quick relief, joy, or gentle stimulation?"
      >
        <form onSubmit={handleCreateDopamine} className="space-y-4">
          <Input
            label="Activity Title *"
            value={dopamineTitle}
            onChange={e => setDopamineTitle(e.target.value)}
            placeholder="e.g. Put favorite song on repeat"
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-espresso-600 dark:text-ivory-300 mb-1">
                Category
              </label>
              <select
                value={dopamineCategory}
                onChange={e => setDopamineCategory(e.target.value as any)}
                className="w-full text-xs rounded-xl border border-ivory-300 p-2.5 bg-white dark:bg-espresso-900"
              >
                <option value="appetizer">Appetizer (2-5m)</option>
                <option value="entree">Entrée (20-45m)</option>
                <option value="side">Side (Background)</option>
                <option value="dessert">Dessert (Reward)</option>
              </select>
            </div>

            <Input
              type="number"
              label="Approx. Minutes"
              value={dopamineDuration}
              onChange={e => setDopamineDuration(Number(e.target.value))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-ivory-200">
            <Button type="button" variant="ghost" size="sm" onClick={() => setDopamineModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save to Menu
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
