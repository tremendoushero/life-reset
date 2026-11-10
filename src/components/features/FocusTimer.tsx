import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useData } from '@/contexts/DataContext';
import { Task } from '@/types';
import { Play, Pause, RotateCcw, Coffee, CheckCircle, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FocusTimerProps {
  selectedTask?: Task | null;
  onClearTask?: () => void;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({
  selectedTask,
  onClearTask,
}) => {
  const { recordFocusSession, tasks } = useData();

  // Timer states
  const [targetDurationMinutes, setTargetDurationMinutes] = useState<number>(25);
  const [isBreak, setIsBreak] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [linkedTaskId, setLinkedTaskId] = useState<string>(selectedTask?.id || '');

  // Tab suspension resilience: store target end timestamp
  const targetEndTimeRef = useRef<number | null>(null);

  // Sync prop changes
  useEffect(() => {
    if (selectedTask?.id) {
      setLinkedTaskId(selectedTask.id);
    }
  }, [selectedTask]);

  // Main timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      if (!targetEndTimeRef.current) {
        targetEndTimeRef.current = Date.now() + secondsRemaining * 1000;
      }

      interval = setInterval(() => {
        const now = Date.now();
        const diffMs = (targetEndTimeRef.current || now) - now;
        const diffSecs = Math.max(0, Math.round(diffMs / 1000));

        setSecondsRemaining(diffSecs);

        if (diffSecs <= 0) {
          // Completed
          handleSessionComplete();
        }
      }, 500);
    } else {
      targetEndTimeRef.current = null;
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsRemaining]);

  const handleSessionComplete = () => {
    setIsRunning(false);
    targetEndTimeRef.current = null;

    // Gentle celebration
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#E78B3D', '#A4B58A', '#B6A4E8'],
      });
    } catch {
      // quiet fallback
    }

    if (!isBreak) {
      const activeTask = tasks.find(t => t.id === linkedTaskId);
      recordFocusSession({
        task_id: linkedTaskId || null,
        task_title: activeTask?.title || 'Focused Block',
        target_duration_minutes: targetDurationMinutes,
        actual_duration_minutes: targetDurationMinutes,
        completed: true,
        distraction_count: 0,
      });
      // Switch to break mode
      setIsBreak(true);
      setTargetDurationMinutes(5);
      setSecondsRemaining(5 * 60);
    } else {
      // Break finished
      setIsBreak(false);
      setTargetDurationMinutes(25);
      setSecondsRemaining(25 * 60);
    }
  };

  const setPreset = (mins: number, isBreakMode = false) => {
    setIsRunning(false);
    setIsBreak(isBreakMode);
    setTargetDurationMinutes(mins);
    setSecondsRemaining(mins * 60);
    targetEndTimeRef.current = null;
  };

  const toggleStartPause = () => {
    if (!isRunning) {
      targetEndTimeRef.current = Date.now() + secondsRemaining * 1000;
      setIsRunning(true);
    } else {
      setIsRunning(false);
      targetEndTimeRef.current = null;
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
    setSecondsRemaining(targetDurationMinutes * 60);
  };

  // Format MM:SS
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage =
    100 - (secondsRemaining / (targetDurationMinutes * 60)) * 100;

  return (
    <Card className="text-center p-6 border-2 border-ivory-300 dark:border-espresso-700">
      {/* Mode header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isBreak ? (
            <Coffee className="w-5 h-5 text-sage" />
          ) : (
            <Clock className="w-5 h-5 text-primary" />
          )}
          <span className="text-xs font-semibold uppercase tracking-wider text-espresso-600 dark:text-ivory-300">
            {isBreak ? 'Restorative Break' : 'Focus Session'}
          </span>
        </div>

        {/* Task linking */}
        <div className="max-w-[200px]">
          <select
            value={linkedTaskId}
            onChange={e => setLinkedTaskId(e.target.value)}
            disabled={isRunning}
            className="w-full text-xs rounded-lg border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900 px-2 py-1 truncate text-espresso-700 dark:text-ivory-200"
          >
            <option value="">No task linked</option>
            {tasks
              .filter(t => t.status !== 'completed')
              .map(t => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Big Calm Display */}
      <div className="py-6">
        <div className="font-serif text-6xl md:text-7xl font-bold tracking-tight text-espresso-900 dark:text-ivory-50 tabular-nums">
          {formatTime(secondsRemaining)}
        </div>

        {/* Subtle Progress Bar */}
        <div className="w-48 h-1.5 bg-ivory-200 dark:bg-espresso-700 rounded-full mx-auto mt-4 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isBreak ? 'bg-sage' : 'bg-primary'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        {[10, 15, 25, 45].map(mins => (
          <button
            key={mins}
            onClick={() => setPreset(mins, false)}
            disabled={isRunning}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
              targetDurationMinutes === mins && !isBreak
                ? 'bg-espresso-800 text-ivory-50 border-espresso-900'
                : 'bg-cardwhite dark:bg-espresso-800 text-espresso-600 dark:text-ivory-300 border-ivory-300 dark:border-espresso-700 hover:bg-ivory-100'
            }`}
          >
            {mins}m Focus
          </button>
        ))}
        <button
          onClick={() => setPreset(5, true)}
          disabled={isRunning}
          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
            isBreak
              ? 'bg-sage text-white border-sage'
              : 'bg-cardwhite dark:bg-espresso-800 text-espresso-600 dark:text-ivory-300 border-ivory-300 dark:border-espresso-700 hover:bg-ivory-100'
          }`}
        >
          5m Break
        </button>
      </div>

      {/* Timer Controls */}
      <div className="flex items-center justify-center gap-3">
        <Button
          variant={isRunning ? 'secondary' : 'primary'}
          size="lg"
          onClick={toggleStartPause}
          icon={isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          className="min-w-[140px]"
        >
          {isRunning ? 'Pause' : 'Start Focus'}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={handleReset}
          icon={<RotateCcw className="w-4 h-4" />}
          title="Reset timer"
        >
          Reset
        </Button>
      </div>
    </Card>
  );
};
