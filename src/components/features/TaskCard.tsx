import React, { useState } from 'react';
import { Task } from '@/types';
import { useData } from '@/contexts/DataContext';
import { Badge } from '@/components/common/Badge';
import {
  CheckCircle2,
  Circle,
  Clock,
  Zap,
  MoreVertical,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onRescue?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onRescue,
}) => {
  const { toggleTaskCompletion, deleteTask, postponeTask, toggleSubtask } = useData();
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isCompleted = task.status === 'completed';

  const handleToggle = async () => {
    if (!isCompleted) {
      try {
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.8 },
          colors: ['#A4B58A', '#E78B3D', '#F4C7A8'],
        });
      } catch {}
    }
    await toggleTaskCompletion(task.id);
  };

  const priorityBadges: Record<Task['priority'], { label: string; variant: 'orange' | 'peach' | 'neutral' }> = {
    essential: { label: 'Essential', variant: 'orange' },
    important: { label: 'Important', variant: 'peach' },
    optional: { label: 'Optional', variant: 'neutral' },
  };

  const energyColors: Record<Task['energy_requirement'], string> = {
    very_low: 'text-sage-dark dark:text-sage-light',
    low: 'text-softblue-dark dark:text-softblue-light',
    medium: 'text-primary',
    high: 'text-red-500',
  };

  const subtasks = task.subtasks || [];
  const completedSubs = subtasks.filter(s => s.is_completed).length;

  return (
    <div
      className={`group relative rounded-2xl border p-4 transition-all duration-150 ${
        isCompleted
          ? 'bg-ivory-100/50 dark:bg-espresso-900/30 border-ivory-300 dark:border-espresso-800 opacity-60'
          : 'bg-cardwhite dark:bg-espresso-800 border-[#EAE3D8] dark:border-espresso-700 shadow-soft-sm hover:shadow-soft-md hover:border-ivory-400'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Completion Checkbox */}
        <button
          onClick={handleToggle}
          className="mt-0.5 text-espresso-400 hover:text-primary dark:text-ivory-400 transition-colors shrink-0"
          aria-label={isCompleted ? 'Mark uncompleted' : 'Mark completed'}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-sage fill-sage-light" />
          ) : (
            <Circle className="w-5 h-5 stroke-[1.5]" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant={priorityBadges[task.priority].variant} size="sm">
              {priorityBadges[task.priority].label}
            </Badge>

            {task.category && (
              <span className="text-[11px] font-medium text-espresso-500 dark:text-ivory-400 capitalize">
                {task.category}
              </span>
            )}

            {task.is_top_three && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-softpeach-light text-softpeach-dark font-semibold">
                Top 3
              </span>
            )}

            {task.postponed_count > 0 && (
              <span className="text-[10px] text-espresso-400 dark:text-ivory-500">
                Rescheduled {task.postponed_count}x
              </span>
            )}
          </div>

          <h4
            className={`text-sm font-medium text-espresso-900 dark:text-ivory-100 leading-snug break-words ${
              isCompleted ? 'line-through text-espresso-400 dark:text-ivory-400' : ''
            }`}
          >
            {task.title}
          </h4>

          {task.description && (
            <p className="text-xs text-espresso-500 dark:text-ivory-400 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Metadata badges */}
          <div className="flex items-center gap-3 mt-2.5 text-xs text-espresso-500 dark:text-ivory-400 flex-wrap">
            {task.due_date && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {task.due_date}
                {task.due_time && ` at ${task.due_time}`}
              </span>
            )}

            {task.estimated_duration && (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {task.estimated_duration}m
              </span>
            )}

            <span className={`inline-flex items-center gap-1 capitalize font-medium ${energyColors[task.energy_requirement]}`}>
              <Zap className="w-3.5 h-3.5" />
              {task.energy_requirement.replace('_', ' ')} energy
            </span>

            {subtasks.length > 0 && (
              <button
                onClick={() => setShowSubtasks(!showSubtasks)}
                className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium"
              >
                <span>{completedSubs}/{subtasks.length} steps</span>
                {showSubtasks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {/* Subtasks Accordion */}
          {showSubtasks && subtasks.length > 0 && (
            <div className="mt-3 pl-3 border-l-2 border-ivory-300 dark:border-espresso-700 space-y-1.5 animate-fade-in">
              {subtasks.map(sub => (
                <div key={sub.id} className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => toggleSubtask(task.id, sub.id)}
                    className="text-espresso-400 hover:text-primary"
                  >
                    {sub.is_completed ? (
                      <CheckCircle2 className="w-4 h-4 text-sage" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>
                  <span
                    className={
                      sub.is_completed
                        ? 'line-through text-espresso-400 dark:text-ivory-400'
                        : 'text-espresso-800 dark:text-ivory-200'
                    }
                  >
                    {sub.title}
                  </span>
                  <span className="text-[10px] text-espresso-400 ml-auto">
                    {sub.estimated_minutes}m
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action button menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-lg text-espresso-400 hover:text-espresso-800 dark:hover:text-ivory-100 hover:bg-ivory-200 dark:hover:bg-espresso-700 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-7 z-20 w-44 bg-cardwhite dark:bg-espresso-800 rounded-xl border border-ivory-300 dark:border-espresso-700 shadow-soft-lg py-1.5 animate-fade-in text-xs">
              <button
                onClick={() => {
                  setShowMenu(false);
                  onRescue?.(task);
                }}
                className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-ivory-100 dark:hover:bg-espresso-700 text-primary font-medium"
              >
                <Sparkles className="w-3.5 h-3.5" />
                I'm Stuck / Rescue
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  postponeTask(task.id);
                }}
                className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-ivory-100 dark:hover:bg-espresso-700 text-espresso-700 dark:text-ivory-200"
              >
                <Calendar className="w-3.5 h-3.5" />
                Move to Tomorrow
              </button>
              {onEdit && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(task);
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-ivory-100 dark:hover:bg-espresso-700 text-espresso-700 dark:text-ivory-200"
                >
                  Edit Task
                </button>
              )}
              <div className="border-t border-ivory-200 dark:border-espresso-700 my-1" />
              {confirmDelete ? (
                <button
                  onClick={() => deleteTask(task.id)}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 bg-red-50 text-red-600 font-semibold"
                >
                  Confirm Delete?
                </button>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-red-50 hover:text-red-600 text-espresso-500"
                >
                  Delete Task
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

