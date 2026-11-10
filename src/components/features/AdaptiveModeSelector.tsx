import React from 'react';
import { useCapacity } from '@/contexts/CapacityContext';
import { AdaptiveMode } from '@/types';
import { Sparkles, BatteryLow, AlertCircle, Target, Feather } from 'lucide-react';

export const AdaptiveModeSelector: React.FC = () => {
  const { mode, setMode, getModeExplanation } = useCapacity();

  const modes: { id: AdaptiveMode; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'normal', label: 'Normal Day', icon: <Sparkles className="w-4 h-4" />, color: 'hover:border-primary' },
    { id: 'low-energy', label: 'Low-Energy', icon: <BatteryLow className="w-4 h-4" />, color: 'hover:border-sage' },
    { id: 'overwhelmed', label: 'Overwhelmed', icon: <AlertCircle className="w-4 h-4" />, color: 'hover:border-softpeach' },
    { id: 'focus', label: 'Focus Mode', icon: <Target className="w-4 h-4" />, color: 'hover:border-softblue' },
    { id: 'brain-dump', label: 'Brain Dump', icon: <Feather className="w-4 h-4" />, color: 'hover:border-lavender' },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-espresso-600 dark:text-ivory-300">
          Adaptive Capacity Mode
        </span>
        <span className="text-xs text-espresso-400 dark:text-ivory-400 hidden sm:inline">
          Adapts the interface to your current bandwidth
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {modes.map(m => {
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                isActive
                  ? 'bg-espresso-800 text-ivory-50 border-espresso-900 shadow-soft-sm scale-[1.02]'
                  : 'bg-cardwhite dark:bg-espresso-800 text-espresso-700 dark:text-ivory-200 border-ivory-300 dark:border-espresso-700 hover:bg-ivory-100 dark:hover:bg-espresso-750'
              }`}
            >
              <span className={isActive ? 'text-primary' : 'text-espresso-400 dark:text-ivory-400'}>
                {m.icon}
              </span>
              <span className="truncate">{m.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-2.5 px-3 py-2 rounded-xl bg-ivory-100/70 dark:bg-espresso-900/40 border border-ivory-200 dark:border-espresso-800 text-xs text-espresso-600 dark:text-ivory-300 flex items-center justify-between">
        <p className="italic">{getModeExplanation(mode)}</p>
        {mode !== 'normal' && (
          <button
            onClick={() => setMode('normal')}
            className="text-[11px] font-semibold text-primary hover:underline ml-2 shrink-0"
          >
            Reset to Normal
          </button>
        )}
      </div>
    </div>
  );
};

