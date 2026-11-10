import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Task, TaskPriority, TaskEnergyRequirement, TaskRecurrence } from '@/types';
import { useData } from '@/contexts/DataContext';
import { format } from 'date-fns';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  defaultDate?: string;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  defaultDate,
}) => {
  const { addTask, updateTask } = useData();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState<TaskPriority>('important');
  const [dueDate, setDueDate] = useState(defaultDate || format(new Date(), 'yyyy-MM-dd'));
  const [dueTime, setDueTime] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState(15);
  const [energyRequirement, setEnergyRequirement] = useState<TaskEnergyRequirement>('medium');
  const [isTopThree, setIsTopThree] = useState(false);
  const [recurrence, setRecurrence] = useState<TaskRecurrence>('none');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setCategory(taskToEdit.category || 'general');
      setPriority(taskToEdit.priority);
      setDueDate(taskToEdit.due_date || '');
      setDueTime(taskToEdit.due_time || '');
      setEstimatedDuration(taskToEdit.estimated_duration || 15);
      setEnergyRequirement(taskToEdit.energy_requirement || 'medium');
      setIsTopThree(taskToEdit.is_top_three || false);
      setRecurrence(taskToEdit.recurrence || 'none');
      setNotes(taskToEdit.notes || '');
    } else {
      setTitle('');
      setDescription('');
      setCategory('general');
      setPriority('important');
      setDueDate(defaultDate || format(new Date(), 'yyyy-MM-dd'));
      setDueTime('');
      setEstimatedDuration(15);
      setEnergyRequirement('medium');
      setIsTopThree(false);
      setRecurrence('none');
      setNotes('');
    }
  }, [taskToEdit, defaultDate, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (taskToEdit) {
      await updateTask(taskToEdit.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        due_date: dueDate || null,
        due_time: dueTime || null,
        estimated_duration: Number(estimatedDuration),
        energy_requirement: energyRequirement,
        is_top_three: isTopThree,
        recurrence,
        notes: notes.trim() || undefined,
      });
    } else {
      await addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        due_date: dueDate || null,
        due_time: dueTime || null,
        estimated_duration: Number(estimatedDuration),
        status: 'not_started',
        energy_requirement: energyRequirement,
        is_top_three: isTopThree,
        recurrence,
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Edit Task' : 'Add a New Task'}
      description="Keep it clear and realistic for your energy today."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Task Title *"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Schedule oil change"
          autoFocus
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-espresso-600 dark:text-ivory-300 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full rounded-xl border border-ivory-400 dark:border-espresso-700 bg-white dark:bg-espresso-900 px-3 py-2 text-sm text-espresso-900 dark:text-ivory-100"
            >
              <option value="general">General</option>
              <option value="health">Health & Medical</option>
              <option value="life-admin">Life Admin</option>
              <option value="household">Household</option>
              <option value="work">Work & Projects</option>
              <option value="errand">Errands</option>
              <option value="wellness">Wellness</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-espresso-600 dark:text-ivory-300 mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as TaskPriority)}
              className="w-full rounded-xl border border-ivory-400 dark:border-espresso-700 bg-white dark:bg-espresso-900 px-3 py-2 text-sm text-espresso-900 dark:text-ivory-100"
            >
              <option value="essential">Essential (Must Do)</option>
              <option value="important">Important</option>
              <option value="optional">Optional (Bonus)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            type="date"
            label="Due Date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />

          <Input
            type="time"
            label="Due Time (Optional)"
            value={dueTime}
            onChange={e => setDueTime(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-espresso-600 dark:text-ivory-300 mb-1.5">
              Estimated Duration
            </label>
            <div className="flex gap-1.5">
              {[5, 15, 30, 60].map(mins => (
                <button
                  type="button"
                  key={mins}
                  onClick={() => setEstimatedDuration(mins)}
                  className={`flex-1 py-1.5 text-xs rounded-lg border font-medium transition-all ${
                    estimatedDuration === mins
                      ? 'bg-espresso-800 text-ivory-50 border-espresso-900'
                      : 'border-ivory-300 dark:border-espresso-700 text-espresso-700 dark:text-ivory-200'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-espresso-600 dark:text-ivory-300 mb-1.5">
              Energy Needed
            </label>
            <select
              value={energyRequirement}
              onChange={e => setEnergyRequirement(e.target.value as TaskEnergyRequirement)}
              className="w-full rounded-xl border border-ivory-400 dark:border-espresso-700 bg-white dark:bg-espresso-900 px-3 py-2 text-sm text-espresso-900 dark:text-ivory-100"
            >
              <option value="very_low">Very Low (Frictionless)</option>
              <option value="low">Low Effort</option>
              <option value="medium">Medium</option>
              <option value="high">High Focus</option>
            </select>
          </div>
        </div>

        {/* Top 3 checkbox */}
        <div className="flex items-center gap-2 p-3 bg-ivory-100 dark:bg-espresso-900/60 rounded-xl border border-ivory-300 dark:border-espresso-700">
          <input
            type="checkbox"
            id="isTopThree"
            checked={isTopThree}
            onChange={e => setIsTopThree(e.target.checked)}
            className="w-4 h-4 rounded text-primary focus:ring-primary/40 border-ivory-400"
          />
          <label htmlFor="isTopThree" className="text-xs font-medium text-espresso-800 dark:text-ivory-200">
            Feature in Today's Top Three priorities on dashboard
          </label>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-espresso-600 dark:text-ivory-300 mb-1.5">
            Quick Notes / Context
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Links, phone numbers, or gentle reminders..."
            className="w-full rounded-xl border border-ivory-400 dark:border-espresso-700 bg-white dark:bg-espresso-900 px-3 py-2 text-sm text-espresso-900 dark:text-ivory-100 placeholder-espresso-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-ivory-200 dark:border-espresso-700">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm">
            {taskToEdit ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
