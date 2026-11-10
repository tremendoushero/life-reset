import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useData } from '@/contexts/DataContext';
import { HeartHandshake, CheckCircle2, RefreshCw, Calendar, Sparkles, Inbox, Archive, ArrowRight, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

interface GentleRestartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GentleRestartModal: React.FC<GentleRestartModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { tasks, resetMyDay, updateTask } = useData();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Overdue and past tasks
  const overdueTasks = tasks.filter(
    t => t.status !== 'completed' && t.status !== 'archived' && t.due_date && t.due_date < todayStr
  );

  const todayUncompleted = tasks.filter(
    t => t.status !== 'completed' && t.status !== 'archived' && t.due_date === todayStr
  );

  const allUnfinished = [...overdueTasks, ...todayUncompleted];

  const [step, setStep] = useState<'review' | 'confirm'>('review');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(() =>
    allUnfinished.slice(0, 2).map(t => t.id)
  );
  const [archiveUnselected, setArchiveUnselected] = useState(false);

  const toggleSelectTask = (id: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : prev.length < 3
        ? [...prev, id]
        : prev // limit to 3 priorities
    );
  };

  const handleExecuteRestart = async () => {
    await resetMyDay(selectedTaskIds);

    if (archiveUnselected) {
      // Archive overdue tasks that were not selected
      const toArchive = overdueTasks.filter(t => !selectedTaskIds.includes(t.id));
      await Promise.all(toArchive.map(t => updateTask(t.id, { status: 'archived' })));
    }

    setStep('review');
    onClose();
  };

  const parkedCount = overdueTasks.length - overdueTasks.filter(t => selectedTaskIds.includes(t.id)).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setStep('review');
        onClose();
      }}
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
            <p className="leading-relaxed">
              Life happened, and that is completely natural. We will not penalize you with red warning badges.
              Let's look at unfinished items with compassionate eyes and pick only 1 to 3 things that actually matter today.
            </p>
          </div>
        </div>

        {step === 'review' ? (
          <>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-espresso-600 dark:text-ivory-300">
                  Unfinished Items ({allUnfinished.length})
                </h4>
                <span className="text-[11px] text-espresso-500 dark:text-ivory-400">
                  Pick up to 3 to focus on today ({selectedTaskIds.length}/3 chosen)
                </span>
              </div>

              {allUnfinished.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-ivory-300 dark:border-espresso-700 rounded-xl">
                  <Sparkles className="w-6 h-6 text-primary mx-auto mb-1.5 opacity-80" />
                  <p className="text-sm font-medium text-espresso-800 dark:text-ivory-100">
                    Your slate is completely clear!
                  </p>
                  <p className="text-xs text-espresso-500 dark:text-ivory-400 mt-0.5">
                    No overdue or lingering tasks found.
                  </p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {allUnfinished.map(t => {
                    const isSelected = selectedTaskIds.includes(t.id);
                    const isPast = t.due_date && t.due_date < todayStr;

                    return (
                      <div
                        key={t.id}
                        onClick={() => toggleSelectTask(t.id)}
                        className={`flex items-start gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-softpeach-light/50 dark:bg-espresso-700/60 border-primary/60 shadow-soft-sm'
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
                          <p className="text-xs font-semibold text-espresso-900 dark:text-ivory-100 truncate">
                            {t.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-espresso-400 dark:text-ivory-400">
                            <span className="capitalize">{t.category}</span>
                            {isPast && (
                              <span className="text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded text-[10px]">
                                Past due ({t.due_date})
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

            {/* Unselected options */}
            {overdueTasks.length > 0 && (
              <div className="p-3 bg-ivory-100 dark:bg-espresso-900/60 rounded-xl space-y-2 text-xs">
                <span className="font-semibold text-espresso-700 dark:text-ivory-200 block">
                  What should happen to the other {parkedCount} overdue items?
                </span>
                <div className="space-y-1.5 text-espresso-600 dark:text-ivory-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="unselectedAction"
                      checked={!archiveUnselected}
                      onChange={() => setArchiveUnselected(false)}
                      className="text-primary"
                    />
                    <span>
                      <strong>Park in Inbox safely:</strong> Keeps tasks without due dates so you never feel guilty or rushed.
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="unselectedAction"
                      checked={archiveUnselected}
                      onChange={() => setArchiveUnselected(true)}
                      className="text-primary"
                    />
                    <span>
                      <strong>Archive unselected:</strong> Move them out of sight. Can be restored anytime from the Archived tab.
                    </span>
                  </label>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-ivory-200 dark:border-espresso-700">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStep('confirm')}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Review Reset Plan
              </Button>
            </div>
          </>
        ) : (
          /* Confirmation Step */
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-ivory-300 dark:border-espresso-700 bg-cardwhite dark:bg-espresso-900 space-y-2.5 text-xs">
              <h4 className="font-serif text-sm font-bold text-espresso-900 dark:text-ivory-50 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Reset Plan Summary
              </h4>

              <div className="space-y-1.5 text-espresso-700 dark:text-ivory-200">
                <div className="flex items-center justify-between py-1 border-b border-ivory-200 dark:border-espresso-800">
                  <span>Prioritized for Today's Top 3:</span>
                  <span className="font-bold text-primary">{selectedTaskIds.length} tasks</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-ivory-200 dark:border-espresso-800">
                  <span>{archiveUnselected ? 'Archived safely:' : 'Parked in Inbox (no due date pressure):'}</span>
                  <span className="font-bold text-espresso-800 dark:text-ivory-100">{parkedCount} tasks</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span>Tasks permanently deleted:</span>
                  <span className="font-bold text-sage-dark dark:text-sage-light">0 (Zero data loss)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-ivory-200 dark:border-espresso-700">
              <Button variant="ghost" size="sm" onClick={() => setStep('review')}>
                Back to Edit
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExecuteRestart}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Confirm Reset & Start Fresh
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
