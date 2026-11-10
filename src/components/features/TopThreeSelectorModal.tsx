import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useData } from '@/contexts/DataContext';
import { Sparkles, CheckCircle2, Circle, AlertCircle, Plus, Calendar } from 'lucide-react';

interface TopThreeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNewTask: () => void;
}

export const TopThreeSelectorModal: React.FC<TopThreeSelectorModalProps> = ({
  isOpen,
  onClose,
  onAddNewTask,
}) => {
  const { tasks, setTopThreeTaskIds } = useData();

  // Active uncompleted tasks
  const uncompletedTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'archived');
  const initialSelected = tasks.filter(t => t.is_top_three).map(t => t.id);

  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelected);
  const [warning, setWarning] = useState<string | null>(null);

  const handleToggle = (taskId: string) => {
    setWarning(null);
    if (selectedIds.includes(taskId)) {
      setSelectedIds(prev => prev.filter(id => id !== taskId));
    } else {
      if (selectedIds.length >= 3) {
        setWarning("You have reached 3 top priorities. Deselect one first to add this one!");
        return;
      }
      setSelectedIds(prev => [...prev, taskId]);
    }
  };

  const handleSave = async () => {
    await setTopThreeTaskIds(selectedIds);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Choose Today's Top Three"
      description="Pick up to 3 priority tasks. Keeping it to three protects you from decision freeze."
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Progress pill */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-ivory-100 dark:bg-espresso-900 border border-ivory-200 dark:border-espresso-700">
          <span className="text-xs font-semibold text-espresso-700 dark:text-ivory-200 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary" />
            Selected Priorities:
          </span>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
            selectedIds.length === 3
              ? 'bg-primary text-white'
              : 'bg-cardwhite dark:bg-espresso-800 text-espresso-800 dark:text-ivory-200 border border-ivory-300'
          }`}>
            {selectedIds.length} of 3 chosen
          </span>
        </div>

        {warning && (
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs border border-amber-200 flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{warning}</span>
          </div>
        )}

        {/* Task list */}
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {uncompletedTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-espresso-500">You don't have any uncompleted tasks right now.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onAddNewTask();
                }}
                className="mt-3"
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Create a Task
              </Button>
            </div>
          ) : (
            uncompletedTasks.map(task => {
              const isSelected = selectedIds.includes(task.id);

              return (
                <div
                  key={task.id}
                  onClick={() => handleToggle(task.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-softpeach-light/50 dark:bg-espresso-700/60 border-primary shadow-soft-sm'
                      : 'bg-cardwhite dark:bg-espresso-800 border-ivory-300 dark:border-espresso-700 hover:border-ivory-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="shrink-0 text-primary">
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 fill-primary text-white" />
                      ) : (
                        <Circle className="w-5 h-5 text-espresso-300" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${
                        isSelected ? 'text-espresso-900 dark:text-ivory-50' : 'text-espresso-700 dark:text-ivory-200'
                      }`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-espresso-400">
                        <span className="capitalize">{task.priority}</span>
                        {task.due_date && (
                          <span className="flex items-center gap-0.5">
                            <Calendar className="w-3 h-3" />
                            {task.due_date}
                          </span>
                        )}
                        <span>{task.estimated_duration}m</span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10 shrink-0">
                      Priority #{selectedIds.indexOf(task.id) + 1}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-ivory-200 dark:border-espresso-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onClose();
              onAddNewTask();
            }}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            New Task
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              Save Top Three
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
