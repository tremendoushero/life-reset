import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdaptiveMode, EnergyLevel, MoodLevel } from '@/types';
import { storage } from '@/lib/supabase';

interface CapacityContextType {
  mode: AdaptiveMode;
  setMode: (mode: AdaptiveMode) => void;
  energy: EnergyLevel;
  setEnergy: (energy: EnergyLevel) => void;
  mood: MoodLevel;
  setMood: (mood: MoodLevel) => void;
  capacityNote: string;
  setCapacityNote: (note: string) => void;
  // Explanatory helper for user
  getModeExplanation: (mode: AdaptiveMode) => string;
}

const CapacityContext = createContext<CapacityContextType | undefined>(undefined);

export const CapacityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<AdaptiveMode>(() =>
    storage.get('adaptive_mode', 'normal')
  );
  const [energy, setEnergyState] = useState<EnergyLevel>(() =>
    storage.get('current_energy', 'steady')
  );
  const [mood, setMoodState] = useState<MoodLevel>(() =>
    storage.get('current_mood', 'okay')
  );
  const [capacityNote, setCapacityNoteState] = useState<string>(() =>
    storage.get('capacity_note', '')
  );

  const setMode = (newMode: AdaptiveMode) => {
    setModeState(newMode);
    storage.set('adaptive_mode', newMode);
  };

  const setEnergy = (newEnergy: EnergyLevel) => {
    setEnergyState(newEnergy);
    storage.set('current_energy', newEnergy);

    // Friendly smart suggestion without overriding user control
    if (newEnergy === 'empty') {
      // Suggest or switch to low-energy or overwhelmed if user desires
    }
  };

  const setMood = (newMood: MoodLevel) => {
    setMoodState(newMood);
    storage.set('current_mood', newMood);
  };

  const setCapacityNote = (note: string) => {
    setCapacityNoteState(note);
    storage.set('capacity_note', note);
  };

  const getModeExplanation = (m: AdaptiveMode): string => {
    switch (m) {
      case 'low-energy':
        return 'Filtered to essential tasks and low-effort wins. No non-essential noise.';
      case 'overwhelmed':
        return 'Everything paused except one single next step. Breathe and take one breath at a time.';
      case 'focus':
        return 'Zero clutter. Only your active task and the focus timer.';
      case 'brain-dump':
        return 'Wide open space to get tangled thoughts out of your head without organizing.';
      case 'normal':
      default:
        return 'Your complete calm dashboard with top priorities and daily rhythm.';
    }
  };

  return (
    <CapacityContext.Provider
      value={{
        mode,
        setMode,
        energy,
        setEnergy,
        mood,
        setMood,
        capacityNote,
        setCapacityNote,
        getModeExplanation,
      }}
    >
      {children}
    </CapacityContext.Provider>
  );
};

export const useCapacity = () => {
  const context = useContext(CapacityContext);
  if (!context) {
    throw new Error('useCapacity must be used within a CapacityProvider');
  }
  return context;
};

