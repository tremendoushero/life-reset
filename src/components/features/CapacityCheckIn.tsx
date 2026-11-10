import React, { useState } from 'react';
import { Card } from '@/components/common/Card';
import { useCapacity } from '@/contexts/CapacityContext';
import { useData } from '@/contexts/DataContext';
import { EnergyLevel, MoodLevel } from '@/types';
import { BatteryCharging, Smile, Check } from 'lucide-react';

export const CapacityCheckIn: React.FC = () => {
  const { energy, setEnergy, mood, setMood, capacityNote, setCapacityNote } = useCapacity();
  const { addEnergy, addMood } = useData();
  const [justSaved, setJustSaved] = useState(false);

  const energyOptions: { level: EnergyLevel; label: string; desc: string }[] = [
    { level: 'empty', label: 'Empty', desc: 'Survival mode' },
    { level: 'low', label: 'Low', desc: 'Gentle tasks only' },
    { level: 'steady', label: 'Steady', desc: 'Good pace' },
    { level: 'high', label: 'High', desc: 'Feeling capable' },
    { level: 'full', label: 'Full', desc: 'Abundant drive' },
  ];

  const moodOptions: { level: MoodLevel; emoji: string; label: string }[] = [
    { level: 'low', emoji: '🌧️', label: 'Low' },
    { level: 'meh', emoji: '☁️', label: 'Meh' },
    { level: 'okay', emoji: '⛅', label: 'Okay' },
    { level: 'good', emoji: '🌤️', label: 'Good' },
    { level: 'bright', emoji: '☀️', label: 'Bright' },
  ];

  const handleSelectEnergy = (lvl: EnergyLevel) => {
    setEnergy(lvl);
    addEnergy(lvl, 'morning', capacityNote);
    triggerSavedFeedback();
  };

  const handleSelectMood = (m: MoodLevel) => {
    setMood(m);
    addMood(m, capacityNote);
    triggerSavedFeedback();
  };

  const triggerSavedFeedback = () => {
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  return (
    <Card className="p-4 border-l-4 border-l-primary">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BatteryCharging className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-espresso-700 dark:text-ivory-200">
            Today's Capacity Check-In
          </h4>
        </div>
        {justSaved && (
          <span className="text-[11px] font-medium text-sage-dark dark:text-sage-light flex items-center gap-1 animate-fade-in">
            <Check className="w-3.5 h-3.5" /> Saved
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Energy Selector */}
        <div>
          <span className="text-xs text-espresso-500 dark:text-ivory-400 block mb-1.5 font-medium">
            Energy Level:
          </span>
          <div className="grid grid-cols-5 gap-1.5">
            {energyOptions.map(opt => {
              const active = energy === opt.level;
              return (
                <button
                  key={opt.level}
                  type="button"
                  onClick={() => handleSelectEnergy(opt.level)}
                  className={`py-2 px-1 rounded-xl text-center border transition-all ${
                    active
                      ? 'bg-primary text-white border-primary shadow-soft-sm font-semibold'
                      : 'bg-ivory-100/70 dark:bg-espresso-900 border-ivory-300 dark:border-espresso-700 text-espresso-700 dark:text-ivory-200 hover:bg-ivory-200'
                  }`}
                >
                  <div className="text-xs">{opt.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mood Selector */}
        <div>
          <span className="text-xs text-espresso-500 dark:text-ivory-400 block mb-1.5 font-medium">
            Current Mood:
          </span>
          <div className="grid grid-cols-5 gap-1.5">
            {moodOptions.map(opt => {
              const active = mood === opt.level;
              return (
                <button
                  key={opt.level}
                  type="button"
                  onClick={() => handleSelectMood(opt.level)}
                  className={`py-1.5 px-1 rounded-xl text-center border transition-all ${
                    active
                      ? 'bg-espresso-800 text-ivory-50 border-espresso-900 shadow-soft-sm font-semibold'
                      : 'bg-ivory-100/70 dark:bg-espresso-900 border-ivory-300 dark:border-espresso-700 text-espresso-700 dark:text-ivory-200 hover:bg-ivory-200'
                  }`}
                >
                  <div className="text-sm mb-0.5">{opt.emoji}</div>
                  <div className="text-[10px]">{opt.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Optional short note */}
      <div className="mt-3">
        <input
          type="text"
          value={capacityNote}
          onChange={e => setCapacityNote(e.target.value)}
          onBlur={() => {
            if (capacityNote) {
              addMood(mood, capacityNote);
              triggerSavedFeedback();
            }
          }}
          placeholder="Optional: How does today feel? (e.g. slight headache, well-rested, eager to write...)"
          className="w-full text-xs px-3 py-1.5 rounded-xl border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900 text-espresso-800 dark:text-ivory-200 placeholder-espresso-300 focus:outline-none focus:border-primary"
        />
      </div>
    </Card>
  );
};
