import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Goal, Project } from '@/types';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { GoalDetailModal } from '@/components/features/GoalDetailModal';
import { Sparkles, Target, FolderKanban, Plus, Check, ChevronRight } from 'lucide-react';

export const GoalsPage: React.FC = () => {
  const { goals, addGoal, toggleGoalMilestone, projects, addProject } = useData();

  const [activeTab, setActiveTab] = useState<'goals' | 'projects'>('goals');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const selectedGoal = goals.find(g => g.id === selectedGoalId) || null;

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
            <Card
              key={goal.id}
              onClick={() => setSelectedGoalId(goal.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedGoalId(goal.id);
                }
              }}
              className="p-5 flex flex-col justify-between cursor-pointer hover:border-primary/50 hover:shadow-soft-md transition-all group focus:outline-none focus:ring-2 focus:ring-primary/40 select-none"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-softpeach-light text-softpeach-dark">
                    {goal.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-primary">{goal.progress}%</span>
                    <ChevronRight className="w-3.5 h-3.5 text-espresso-400 group-hover:text-primary transition-colors" />
                  </div>
                </div>

                <h3 className="font-serif text-lg font-bold text-espresso-900 dark:text-ivory-50 group-hover:text-primary transition-colors">
                  {goal.title}
                </h3>
                {goal.description && (
                  <p className="text-xs text-espresso-600 dark:text-ivory-300 mt-1 line-clamp-2">
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
              {goal.milestones && goal.milestones.length > 0 ? (
                <div className="mt-4 pt-3 border-t border-ivory-200 dark:border-espresso-700 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-espresso-500 dark:text-ivory-400 mb-1">
                    <span>Milestones:</span>
                    <span>
                      {goal.milestones.filter(m => m.is_completed).length} of {goal.milestones.length} done
                    </span>
                  </div>
                  {goal.milestones.slice(0, 3).map(m => (
                    <div
                      key={m.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleGoalMilestone(goal.id, m.id);
                      }}
                      className="flex items-center gap-2 text-xs py-1 px-1.5 rounded-lg hover:bg-ivory-200/50 dark:hover:bg-espresso-700/50 transition-colors"
                    >
                      <button
                        type="button"
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                          m.is_completed
                            ? 'bg-sage border-sage text-white'
                            : 'border-espresso-300 dark:border-espresso-600 bg-white dark:bg-espresso-800'
                        }`}
                        aria-label={m.is_completed ? `Mark ${m.title} incomplete` : `Mark ${m.title} complete`}
                      >
                        {m.is_completed && <Check className="w-3 h-3 stroke-[2.5]" />}
                      </button>
                      <span
                        className={`truncate flex-1 ${
                          m.is_completed
                            ? 'line-through text-espresso-400 dark:text-ivory-400'
                            : 'text-espresso-800 dark:text-ivory-100'
                        }`}
                      >
                        {m.title}
                      </span>
                    </div>
                  ))}
                  {goal.milestones.length > 3 && (
                    <span className="text-[10px] text-espresso-400 dark:text-ivory-400 block pt-0.5">
                      +{goal.milestones.length - 3} more milestone{goal.milestones.length - 3 === 1 ? '' : 's'} · click to view all
                    </span>
                  )}
                </div>
              ) : (
                <div className="mt-4 pt-3 border-t border-ivory-200 dark:border-espresso-700 flex items-center justify-between text-[11px] text-espresso-400 dark:text-ivory-400">
                  <span>0 milestones (0%)</span>
                  <span className="text-primary font-medium group-hover:underline flex items-center gap-1">
                    Add milestones →
                  </span>
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

      {/* Goal Details & Milestones Modal */}
      <GoalDetailModal
        key={selectedGoalId || 'none'}
        goal={selectedGoal}
        isOpen={Boolean(selectedGoalId)}
        onClose={() => setSelectedGoalId(null)}
      />
    </div>
  );
};

