import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Task, TaskPriority, TaskStatus } from '@/types';
import { TaskCard } from '@/components/features/TaskCard';
import { TaskFormModal } from '@/components/features/TaskFormModal';
import { TinyStepRescueModal } from '@/components/features/TinyStepRescueModal';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Plus, Search, Filter, Sparkles, CheckSquare, Inbox, Archive, Calendar } from 'lucide-react';
import { format, addDays } from 'date-fns';

export const TasksPage: React.FC = () => {
  const { tasks, addTask } = useData();

  const [activeTab, setActiveTab] = useState<'all' | 'inbox' | 'today' | 'upcoming' | 'completed' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [rescuingTask, setRescuingTask] = useState<Task | null>(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    // Search filter
    if (searchQuery.trim()) {
      const matchTitle = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDesc = task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchTitle && !matchDesc) return false;
    }

    // Priority filter
    if (selectedPriority !== 'all' && task.priority !== selectedPriority) {
      return false;
    }

    // Category filter
    if (selectedCategory !== 'all' && task.category !== selectedCategory) {
      return false;
    }

    // Status Tab filter
    if (activeTab === 'inbox') {
      return task.status === 'inbox' || (!task.due_date && task.status !== 'completed');
    }
    if (activeTab === 'today') {
      return (task.due_date === todayStr || task.is_top_three) && task.status !== 'completed';
    }
    if (activeTab === 'upcoming') {
      return task.due_date && task.due_date > todayStr && task.status !== 'completed';
    }
    if (activeTab === 'completed') {
      return task.status === 'completed';
    }
    if (activeTab === 'archived') {
      return task.status === 'archived';
    }

    // 'all' excludes archived
    return task.status !== 'archived';
  });

  const categories = Array.from(new Set(tasks.map(t => t.category).filter(Boolean)));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900 dark:text-ivory-50">
            Task Management
          </h2>
          <p className="text-xs sm:text-sm text-espresso-500 dark:text-ivory-400 mt-0.5">
            Organise obligations clearly. No guilt for unfinished tasks.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setEditingTask(null);
            setTaskModalOpen(true);
          }}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Task
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-ivory-300 dark:border-espresso-700 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'All Active' },
          { id: 'today', label: 'Today' },
          { id: 'inbox', label: 'Inbox / Unscheduled' },
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'completed', label: 'Completed' },
          { id: 'archived', label: 'Archived' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-espresso-800 text-ivory-50 shadow-soft-sm font-semibold'
                : 'text-espresso-600 dark:text-ivory-300 hover:bg-ivory-200/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-espresso-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by title or description..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900 text-xs text-espresso-900 dark:text-ivory-100 placeholder-espresso-300 focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Priority filter */}
          <select
            value={selectedPriority}
            onChange={e => setSelectedPriority(e.target.value)}
            className="w-full sm:w-auto text-xs rounded-xl border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900 px-3 py-2 text-espresso-800 dark:text-ivory-200"
          >
            <option value="all">All Priorities</option>
            <option value="essential">Essential</option>
            <option value="important">Important</option>
            <option value="optional">Optional</option>
          </select>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto text-xs rounded-xl border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900 px-3 py-2 text-espresso-800 dark:text-ivory-200"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c} className="capitalize">
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card className="text-center py-12 border-dashed">
            <CheckSquare className="w-10 h-10 text-primary mx-auto mb-2 opacity-50" />
            <h4 className="font-serif text-base font-semibold text-espresso-900 dark:text-ivory-100">
              No tasks match your current filter
            </h4>
            <p className="text-xs text-espresso-500 dark:text-ivory-400 mt-1 max-w-sm mx-auto">
              You can add a new task anytime or clear filters to see your other items.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingTask(null);
                setTaskModalOpen(true);
              }}
              className="mt-4"
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Create a Task
            </Button>
          </Card>
        ) : (
          filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={t => {
                setEditingTask(t);
                setTaskModalOpen(true);
              }}
              onRescue={t => setRescuingTask(t)}
            />
          ))
        )}
      </div>

      {/* Modals */}
      <TaskFormModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        taskToEdit={editingTask}
      />

      <TinyStepRescueModal
        isOpen={!!rescuingTask}
        onClose={() => setRescuingTask(null)}
        task={rescuingTask}
      />
    </div>
  );
};

