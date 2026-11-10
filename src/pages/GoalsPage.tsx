import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Goal, Project } from '@/types';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Sparkles, Target, FolderKanban, Plus, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';

export const GoalsPage: React.FC = () => {
  const { goals, addGoal, updateGoal, deleteGoal, projects, addProject, updateProject } = useData();

  const [activeTab, setActiveTab] = useState<'goals' | 'projects'>('goals');
  const [modalOpen, setModalOpen] = useState(false);

  // New Goal / Project form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('personal');
  const [targetDate, setTargetDate] = useState('');
  const [nextAction, setNextAction] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (activeTab === 'goals') {
      await addGoal({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        target_date: targetDate || undefined,
        progress: 0,
        next_action: nextAction.trim() || undefined,
        status: 'in_progress',
      });
    } else {
      await addProject({
        name: title.trim(),
        description: description.trim() || undefined,
        deadline: targetDate || undefined,
        next_action: nextAction.trim() || undefined,
        status: 'active',
        progress: 0,
      });
    }

    setTitle('');
    setDescription('');
    setNextAction('');
    setModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900 dark:text-ivory-50">
              Goals & Projects
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-espresso-500 dark:text-ivory-400 mt-0.5">
            Break big ambitions into clear, low-friction next actions.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          {activeTab === 'goals' ? 'Add Goal' : 'Add Project'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-ivory-300 dark:border-espresso-700 gap-4 text-xs font-semibold pb-1">
        <button
          onClick={() => setActiveTab('goals')}
          className={`pb-2 border-b-2 transition-colors ${
            activeTab === 'goals'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-espresso-500 hover:text-espresso-800'
          }`}
        >
          Long-Term Goals ({goals.length})
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-2 border-b-2 transition-colors ${
            activeTab === 'projects'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-espresso-500 hover:text-espresso-800'
          }`}
        >
          Active Projects ({projects.length})
        </button>
      </div>

      {/* Goals View */}
      {activeTab === 'goals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(goal => (
            <Card key={goal.id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-softpeach-light text-softpeach-dark">
                    {goal.category}
                  </span>
                  <span className="text-xs font-semibold text-primary">{goal.progress}%</span>
                </div>

                <h3 className="font-serif text-lg font-bold text-espresso-900 dark:text-ivory-50">
                  {goal.title}
                </h3>
                {goal.description && (
                  <p className="text-xs text-espresso-600 dark:text-ivory-300 mt-1">
                    {goal.description}
                  </p>
                )}

                {/* Progress bar */}
                <div className="w-full h-2 bg-ivory-200 dark:bg-espresso-700 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>

                {/* Next Step Box */}
                {goal.next_action && (
                  <div className="mt-4 p-3 rounded-xl bg-ivory-100 dark:bg-espresso-900/60 border border-ivory-300 dark:border-espresso-700">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary block mb-0.5">
                      What is my next step?
                    </span>
                    <p className="text-xs text-espresso-800 dark:text-ivory-200 font-medium">
                      {goal.next_action}
                    </p>
                  </div>
                )}
              </div>

              {/* Milestones list if present */}
              {goal.milestones && goal.milestones.length > 0 && (
                <div className="mt-4 pt-3 border-t border-ivory-200 dark:border-espresso-700 space-y-1">
                  <span className="text-[11px] font-semibold text-espresso-400 block mb-1">
                    Milestones:
                  </span>
                  {goal.milestones.map(m => (
                    <div key={m.id} className="flex items-center gap-2 text-xs">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 ${
                          m.is_completed ? 'text-sage' : 'text-espresso-300'
                        }`}
                      />
                      <span className={m.is_completed ? 'line-through text-espresso-400' : ''}>
                        {m.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Projects View */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(project => (
            <Card key={project.id} className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-softblue-light text-softblue-dark">
                  {project.status}
                </span>
                {project.deadline && (
                  <span className="text-xs text-espresso-400">Due: {project.deadline}</span>
                )}
              </div>

              <h3 className="font-serif text-lg font-bold text-espresso-900 dark:text-ivory-50">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-xs text-espresso-600 dark:text-ivory-300 mt-1">
                  {project.description}
                </p>
              )}

              {project.next_action && (
                <div className="mt-3 p-3 rounded-xl bg-sage-light/40 border border-sage/30 text-xs">
                  <span className="font-semibold text-sage-dark block">Immediate next action:</span>
                  <p className="font-medium text-espresso-800 dark:text-ivory-100 mt-0.5">
                    {project.next_action}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={activeTab === 'goals' ? 'Define a New Goal' : 'Create a Project'}
        description="Ground big ideas into a realistic target."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label={activeTab === 'goals' ? 'Goal Title *' : 'Project Name *'}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Establish a peaceful bedtime routine"
            required
            autoFocus
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-espresso-600 dark:text-ivory-300 mb-1.5">
              Why this matters (Description)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-ivory-300 dark:border-espresso-700 bg-white dark:bg-espresso-900 p-2.5 text-xs text-espresso-900 dark:text-ivory-100"
              placeholder="What will this bring to your life?"
            />
          </div>

          <Input
            label="What is ONE immediate next action?"
            value={nextAction}
            onChange={e => setNextAction(e.target.value)}
            placeholder="e.g. Put charger in living room tonight"
          />

          <Input
            type="date"
            label="Target Date (Optional)"
            value={targetDate}
            onChange={e => setTargetDate(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-ivory-200 dark:border-espresso-700">
            <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
