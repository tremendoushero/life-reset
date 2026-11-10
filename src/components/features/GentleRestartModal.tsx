import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useData } from '@/contexts/DataContext';
import { HeartHandshake, CheckCircle2, RefreshCw, Calendar, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface GentleRestartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GentleRestartModal: React.FC<GentleRestartModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { tasks, resetMyDay } = useData();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Filter tasks that were due previously and are not completed
  const unfinishedTasks = tasks.filter(
    t => t.status !== 'completed' && t.due_date && t.due_date <= todayStr
  );

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(() =>
    unfinishedTasks.slice(0, 2).map(t => t.id)
  );

  const toggleSelectTask = (id: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExecuteRestart = async () => {
    await resetMyDay(selectedTaskIds);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gentle Restart"
      description="Welcome back. No guilt. No broken streaks. Just a fresh clean breath."
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Supportive banner */}
        <div className="p-4 rounded-xl bg-sage-light/70 dark:bg-sage-dark/30 border border-sage/40 flex items-start gap-3">
          <HeartHandshake className="w-5 h-5 text-sage-dark dark:text-sage-light shrink-0 mt-0.5" />
          <div className="text-xs text-espresso-800 dark:text-ivory-100">
            <p className="font-semibold text-sm mb-0.5">You are right on time.</p>
            <p>
              Life happened, and that is completely natural. We will not remind you of missed days.
              Let's look at your list with compassionate eyes and pick only 1 or 2 things that actually matter today.
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-espresso-600 dark:text-ivory-300">
              Unfinished Tasks ({unfinishedTasks.length})
            </h4>
            <span className="text-[11px] text-espresso-500 dark:text-ivory-400">
              Select what matters today; the rest are safely parked in inbox
            </span>
          </div>

          {unfinishedTasks.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-ivory-300 dark:border-espresso-700 rounded-xl">
              <Sparkles className="w-6 h-6 text-primary mx-auto mb-1.5 opacity-80" />
              <p className="text-sm font-medium text-espresso-800 dark:text-ivory-100">
                Your slate is completely clear!
              </p>
              <p className="text-xs text-espresso-500 dark:text-ivory-400 mt-0.5">
                No past-due items are lingering.
              </p>
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {unfinishedTasks.map(t => {
                const isSelected = selectedTaskIds.includes(t.id);
                return (
                  <div
                    key={t.id}
                    onClick={() => toggleSelectTask(t.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-softpeach-light/50 dark:bg-espresso-700/60 border-primary/50 shadow-soft-sm'
                        : 'bg-cardwhite dark:bg-espresso-900 border-ivory-300 dark:border-espresso-700 hover:border-ivory-400 opacity-80'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'bg-primary border-primary text-white'
                          : 'border-espresso-300 dark:border-espresso-600'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-espresso-900 dark:text-ivory-100 truncate">
                        {t.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-espresso-400 dark:text-ivory-400">
                        <span>{t.category}</span>
                        {t.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {t.due_date}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-3 bg-ivory-100 dark:bg-espresso-900/40 rounded-xl text-xs text-espresso-600 dark:text-ivory-300 flex items-center justify-between">
          <span>
            Selected for today: <strong>{selectedTaskIds.length}</strong> tasks
          </span>
          <span className="text-[11px] text-espresso-400">
            Unselected items stay in your Inbox without red warning badges.
          </span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-ivory-200 dark:border-espresso-700">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Keep As Is
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExecuteRestart}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Reset My Day & Continue
          </Button>
        </div>
      </div>
    </Modal>
  );
};
