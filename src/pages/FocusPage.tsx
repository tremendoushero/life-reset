import React from 'react';
import { useData } from '@/contexts/DataContext';
import { FocusTimer } from '@/components/features/FocusTimer';
import { Card } from '@/components/common/Card';
import { Target, Clock, CheckCircle2, History } from 'lucide-react';
import { format } from 'date-fns';

export const FocusPage: React.FC = () => {
  const { focusSessions, tasks } = useData();

  const totalFocusMinutes = focusSessions.reduce((acc, curr) => acc + curr.actual_duration_minutes, 0);

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900 dark:text-ivory-50">
            Focus Timer
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-espresso-500 dark:text-ivory-400 mt-0.5">
          Work in short, gentle bursts. Breaks are built-in and encouraged.
        </p>
      </div>

      {/* Main Focus Timer Component */}
      <FocusTimer />

      {/* Focus History & Stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-espresso-600 dark:text-ivory-300" />
            <h3 className="font-serif text-base font-semibold text-espresso-900 dark:text-ivory-50">
              Completed Focus Sessions ({focusSessions.length})
            </h3>
          </div>
          <span className="text-xs text-primary font-medium">
            Total focused time: {totalFocusMinutes} minutes
          </span>
        </div>

        {focusSessions.length === 0 ? (
          <Card className="text-center py-8 border-dashed">
            <Clock className="w-8 h-8 text-espresso-300 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-medium text-espresso-800 dark:text-ivory-100">
              No recorded sessions yet today.
            </p>
            <p className="text-xs text-espresso-400 mt-0.5">
              Start with a 10 or 15-minute gentle block above!
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {focusSessions.map(session => (
              <Card key={session.id} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-sage-light text-sage-dark flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-espresso-900 dark:text-ivory-100">
                      {session.task_title || 'Focused Block'}
                    </h4>
                    <p className="text-[11px] text-espresso-400">
                      {format(new Date(session.created_at), 'MMM d, h:mm a')} • Duration:{' '}
                      {session.actual_duration_minutes} mins
                    </p>
                  </div>
                </div>

                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-ivory-200 dark:bg-espresso-700 text-espresso-700 dark:text-ivory-200">
                  +{session.actual_duration_minutes}m
                </span>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
